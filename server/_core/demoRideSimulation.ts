import type { Ride } from "../../drizzle/schema";
import { haversineMeters } from "@shared/demoMaps";
import type { DemoSimulationPhase } from "@shared/demoSimulation";
import { isDemoDriverSimulationEnabledServer } from "@shared/demoSimulation";
import { isDemoOperationalRidesEnabledServer } from "@shared/demoOperationalRides";
import {
  advanceOperationalDemoRide,
  ensureOperationalTripStarted,
  getOperationalPhase,
  isOperationalDriverNearPickup,
} from "./demoOperationalRide";
import {
  parseMapPoint,
  type MapCoord,
} from "@shared/driverTracking";
import {
  buildDriverPhasePath,
  pathTotalMeters,
  remainingMetersAlongPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import {
  buildSegmentTimingFromPath,
  computeSegmentDurationMs,
  getSegmentEtaSeconds,
  positionAlongSegmentPath,
  shouldCompleteRideSegment,
  type RideSegmentTiming,
} from "@shared/demoRideProgression";
import { clearDemoDriverTrack, syncDemoDriverTracking } from "./demoDriverTracking";
import { getDemoTripPath, registerDemoRoutePathUpgradeHandler } from "./demoRoutePaths";
import { getDemoRide, isDemoRideId, updateDemoRide } from "./demoRide";
import {
  ensureDemoSimulationDriver,
  getDemoSimulationVehicle,
  isDemoSimulationDriverId,
} from "./demoSimulationDriver";

type Segment = RideSegmentTiming;

type SimulationState = {
  phase: DemoSimulationPhase;
  segment: Segment | null;
};

const states = new Map<number, SimulationState>();

const SEGMENT_DURATION_MS = 25_000;
const START_OFFSET_M = 850;

function buildSegment(
  ride: Ride,
  phase: "to_pickup" | "to_destination",
  target: MapCoord,
  currentPosition?: MapCoord | null
): Segment {
  const tripPath = getDemoTripPath(ride);
  const path = buildDriverPhasePath(tripPath, phase, {
    pickupOffsetMeters: START_OFFSET_M,
    currentPosition: phase === "to_destination" ? (currentPosition ?? null) : null,
  });
  const timing = buildSegmentTimingFromPath(path, currentPosition ?? null, {
    minMs: SEGMENT_DURATION_MS,
    distanceMetersOverride: phase === "to_destination" ? Number(ride.distance ?? 0) : undefined,
  });
  return { path, target, ...timing };
}

export function getSimulationPhase(rideId: number): DemoSimulationPhase | null {
  return states.get(rideId)?.phase ?? null;
}

export function getSimulationEtaSeconds(rideId: number): number | null {
  const state = states.get(rideId);
  return getSegmentEtaSeconds(state?.segment);
}

export function clearSimulationState(rideId: number): void {
  states.delete(rideId);
  clearDemoDriverTrack(rideId);
}

function initSearching(rideId: number): void {
  states.set(rideId, { phase: "searching", segment: null });
}

export function registerDemoRideForSimulation(rideId: number): void {
  if (!isDemoDriverSimulationEnabledServer() || !isDemoRideId(rideId)) return;
  initSearching(rideId);
}

/** Reconstrói estado em memória após hydrate/refresh (corrida já em andamento). */
export function restoreSimulationStateFromRide(ride: Ride): void {
  if (!isDemoDriverSimulationEnabledServer() || !isDemoRideId(ride.id)) return;
  if (states.has(ride.id)) return;

  if (ride.status === "cancelled") {
    clearSimulationState(ride.id);
    return;
  }
  if (ride.status === "completed") {
    states.set(ride.id, { phase: "completed", segment: null });
    return;
  }
  if (ride.status === "requested") {
    initSearching(ride.id);
    return;
  }
  if (!ride.driverId) return;

  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  const driver = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng);
  if (!origin || !destination) return;

  if (ride.status === "in_progress") {
    const path = buildDriverPhasePath(getDemoTripPath(ride), "to_destination", {
      currentPosition: driver,
    });
    const timing = buildSegmentTimingFromPath(path, driver, {
      minMs: SEGMENT_DURATION_MS,
      distanceMetersOverride: Number(ride.distance ?? 0),
    });
    states.set(ride.id, {
      phase: "in_trip",
      segment: { path, target: destination, ...timing },
    });
    return;
  }

  if (ride.status === "accepted") {
    const path = buildDriverPhasePath(getDemoTripPath(ride), "to_pickup", {
      currentPosition: driver,
    });
    const timing = buildSegmentTimingFromPath(path, driver, { minMs: SEGMENT_DURATION_MS });
    const nearPickup =
      driver &&
      (haversineMeters(driver, origin) <= 180 ||
        remainingMetersAlongPath(path, driver) <= 180);
    states.set(ride.id, {
      phase: nearPickup ? "arrived_pickup" : "to_pickup",
      segment: nearPickup ? null : { path, target: origin, ...timing },
    });
  }
}

function positionAlongSegment(segment: Segment): MapCoord {
  return positionAlongSegmentPath(segment);
}

function segmentComplete(segment: Segment): boolean {
  return shouldCompleteRideSegment(segment, positionAlongSegment(segment));
}

/** Aceita corrida com Motorista Demo e inicia deslocamento ao embarque. */
export function simulationAcceptRide(rideId: number): Ride | undefined {
  if (!isDemoDriverSimulationEnabledServer()) return undefined;

  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "requested") return undefined;

  const { profile } = ensureDemoSimulationDriver();
  const vehicle = getDemoSimulationVehicle();
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return undefined;

  const segment = buildSegment(ride, "to_pickup", origin);
  const start = segment.path[0] ?? origin;

  states.set(rideId, {
    phase: "driver_accepted",
    segment,
  });

  let updated = updateDemoRide(rideId, {
    driverId: profile.id,
    vehicleId: vehicle.id,
    status: "accepted",
    paymentStatus: ride.paymentMethod === "cash" ? "paid" : "paid",
    driverCurrentLat: start.lat.toFixed(6),
    driverCurrentLng: start.lng.toFixed(6),
  });

  if (!updated) return undefined;

  states.set(rideId, { phase: "to_pickup", segment });
  return updated;
}

/** Inicia corrida após motorista chegar ao embarque. */
export function simulationStartRide(rideId: number): Ride | undefined {
  if (!isDemoDriverSimulationEnabledServer()) return undefined;

  const ride = getDemoRide(rideId);
  if (!ride) return undefined;

  if (isDemoOperationalRidesEnabledServer()) {
    if (getOperationalPhase(rideId) !== "arrived_pickup") return undefined;
    return ensureOperationalTripStarted(rideId);
  }

  if (
    (ride.status !== "accepted" && ride.status !== "in_progress") ||
    !isDemoSimulationDriverId(ride.driverId)
  ) {
    return undefined;
  }

  const state = states.get(rideId);
  if (state?.phase !== "arrived_pickup" && state?.phase !== "in_trip") return undefined;

  const origin = parseMapPoint(ride.originLat, ride.originLng)!;
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng)!;
  const current =
    parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng) ?? origin;
  const segment = buildSegment(ride, "to_destination", destination, current);

  states.set(rideId, { phase: "in_trip", segment });

  return updateDemoRide(rideId, {
    status: "in_progress",
    driverCurrentLat: current.lat.toFixed(6),
    driverCurrentLng: current.lng.toFixed(6),
  });
}

/** Avança simulação (posição + transições automáticas). */
export function advanceDemoRideSimulation(ride: Ride): Ride {
  if (!isDemoDriverSimulationEnabledServer() || !isDemoRideId(ride.id)) {
    return ride;
  }

  if (ride.status === "cancelled") {
    clearSimulationState(ride.id);
    return ride;
  }

  if (ride.status === "completed") {
    states.set(ride.id, { phase: "completed", segment: null });
    return ride;
  }

  let state = states.get(ride.id);
  if (!state) {
    restoreSimulationStateFromRide(ride);
    state = states.get(ride.id);
  }

  if (!state && ride.status === "requested") {
    initSearching(ride.id);
    state = states.get(ride.id)!;
  }

  if (!state) return ride;

  if (state.phase === "searching" || state.phase === "driver_accepted") {
    return ride;
  }

  if (state.phase === "to_pickup" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated =
      updateDemoRide(ride.id, {
        driverCurrentLat: pos.lat.toFixed(6),
        driverCurrentLng: pos.lng.toFixed(6),
      }) ?? ride;

    if (segmentComplete(state.segment)) {
      const pathEnd = state.segment.path[state.segment.path.length - 1] ?? state.segment.target;
      states.set(ride.id, { phase: "arrived_pickup", segment: null });
      updated =
        updateDemoRide(ride.id, {
          driverCurrentLat: pathEnd.lat.toFixed(6),
          driverCurrentLng: pathEnd.lng.toFixed(6),
        }) ?? updated;
    }
    return updated;
  }

  if (state.phase === "arrived_pickup") {
    return ride;
  }

  if (ride.status === "in_progress" && state.phase !== "in_trip" && state.phase !== "completed") {
    const started = simulationStartRide(ride.id);
    if (started && started !== ride) return started;
  }

  if (state.phase === "in_trip" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated =
      updateDemoRide(ride.id, {
        driverCurrentLat: pos.lat.toFixed(6),
        driverCurrentLng: pos.lng.toFixed(6),
      }) ?? ride;

    if (segmentComplete(state.segment)) {
      const pathEnd = state.segment.path[state.segment.path.length - 1] ?? state.segment.target;
      states.set(ride.id, { phase: "completed", segment: null });
      updated =
        updateDemoRide(ride.id, {
          status: "completed",
          completedAt: new Date(),
          finalPrice: ride.finalPrice ?? ride.estimatedPrice,
          driverCurrentLat: pathEnd.lat.toFixed(6),
          driverCurrentLng: pathEnd.lng.toFixed(6),
        }) ?? updated;
      clearSimulationState(ride.id);
    }
    return updated;
  }

  return ride;
}

export function attachSimulationMeta(ride: Ride): Ride & { simulationPhase: DemoSimulationPhase } {
  const phase =
    getOperationalPhase(ride.id) ??
    getSimulationPhase(ride.id) ??
    (ride.status === "completed"
      ? "completed"
      : ride.status === "in_progress"
        ? "in_trip"
        : ride.status === "accepted" && ride.driverId
          ? "to_pickup"
          : "searching");

  return { ...ride, simulationPhase: phase };
}

export function isSimulationAwaitingStart(rideId: number): boolean {
  const op = getOperationalPhase(rideId);
  if (op === "arrived_pickup") return true;
  return states.get(rideId)?.phase === "arrived_pickup";
}

export function isSimulationDriverNearPickup(ride: Ride): boolean {
  if (isDemoOperationalRidesEnabledServer()) {
    return isOperationalDriverNearPickup(ride);
  }
  const state = states.get(ride.id);
  if (state?.phase === "arrived_pickup") return true;
  if (state?.phase !== "to_pickup" || !state.segment) return false;

  const pos = positionAlongSegment(state.segment);
  return (
    haversineMeters(pos, state.segment.target) <= 180 ||
    remainingMetersAlongPath(state.segment.path, pos) <= 180
  );
}

/** Sincroniza posição demo: operacional, simulação ou rastreamento legado. */
export function syncDemoRideState(ride: Ride): Ride {
  if (isDemoOperationalRidesEnabledServer()) {
    return advanceOperationalDemoRide(ride);
  }
  if (isDemoDriverSimulationEnabledServer()) {
    return advanceDemoRideSimulation(ride);
  }
  return syncDemoDriverTracking(ride);
}

function refreshSimulationSegmentPath(rideId: number): void {
  const state = states.get(rideId);
  const ride = getDemoRide(rideId);
  if (!state?.segment || !ride) return;
  if (state.phase !== "to_pickup" && state.phase !== "in_trip") return;

  const phase = state.phase === "in_trip" ? "to_destination" : "to_pickup";
  const progress = Math.min(
    1,
    (Date.now() - state.segment.startedAtMs) / Math.max(state.segment.durationMs, 1)
  );

  const current =
    phase === "to_destination"
      ? (parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng) ??
        positionAlongSegmentPath(state.segment))
      : null;
  const path = buildDriverPhasePath(getDemoTripPath(ride), phase, {
    pickupOffsetMeters: START_OFFSET_M,
    currentPosition: current,
  });
  const durationMs = computeSegmentDurationMs(
    Math.max(pathTotalMeters(path), phase === "to_destination" ? Number(ride.distance ?? 0) : 0),
    {
      minMs: SEGMENT_DURATION_MS,
    }
  );
  const newSegment: Segment = {
    path,
    target: state.segment.target,
    startedAtMs: Date.now() - Math.round(progress * durationMs),
    durationMs,
  };
  states.set(rideId, { ...state, segment: newSegment });
}

registerDemoRoutePathUpgradeHandler(refreshSimulationSegmentPath);
