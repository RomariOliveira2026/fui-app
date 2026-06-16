import type { Ride } from "../../drizzle/schema";
import { haversineMeters } from "@shared/demoMaps";
import type { DemoSimulationPhase } from "@shared/demoSimulation";
import { isDemoDriverSimulationEnabledServer } from "@shared/demoSimulation";
import { isDemoOperationalRidesEnabledServer } from "@shared/demoOperationalRides";
import {
  advanceOperationalDemoRide,
  getOperationalPhase,
  isOperationalDriverNearPickup,
} from "./demoOperationalRide";
import {
  DRIVER_ARRIVING_THRESHOLD_M,
  parseMapPoint,
  type MapCoord,
} from "@shared/driverTracking";
import {
  buildDriverPhasePath,
  pathTotalMeters,
  pointAtPathProgress,
  remainingMetersAlongPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import { clearDemoDriverTrack, syncDemoDriverTracking } from "./demoDriverTracking";
import { getDemoTripPath } from "./demoRoutePaths";
import { getDemoRide, isDemoRideId, updateDemoRide } from "./demoRide";
import {
  ensureDemoSimulationDriver,
  getDemoSimulationVehicle,
  isDemoSimulationDriverId,
} from "./demoSimulationDriver";

type Segment = {
  path: RoutePoint[];
  target: MapCoord;
  startedAtMs: number;
  durationMs: number;
};

type SimulationState = {
  phase: DemoSimulationPhase;
  segment: Segment | null;
};

const states = new Map<number, SimulationState>();

/** ~25s por trecho; polling a cada 1–2s produz animação visível. */
const SEGMENT_DURATION_MS = 25_000;
const START_OFFSET_M = 850;

function buildSegment(
  ride: Ride,
  phase: "to_pickup" | "to_destination",
  target: MapCoord
): Segment {
  const tripPath = getDemoTripPath(ride);
  const path = buildDriverPhasePath(tripPath, phase, {
    pickupOffsetMeters: START_OFFSET_M,
  });
  const distanceM = Math.max(pathTotalMeters(path), 100);
  const durationMs = Math.max(
    SEGMENT_DURATION_MS,
    Math.round((distanceM / 1000 / 36) * 3600 * 1000)
  );
  return { path, target, startedAtMs: Date.now(), durationMs };
}

export function getSimulationPhase(rideId: number): DemoSimulationPhase | null {
  return states.get(rideId)?.phase ?? null;
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

function positionAlongSegment(segment: Segment): MapCoord {
  const progress = Math.min(1, (Date.now() - segment.startedAtMs) / segment.durationMs);
  return progress >= 1 ? segment.target : pointAtPathProgress(segment.path, progress);
}

function segmentComplete(segment: Segment): boolean {
  return Date.now() - segment.startedAtMs >= segment.durationMs;
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
  if (!ride || ride.status !== "accepted" || !isDemoSimulationDriverId(ride.driverId)) {
    return undefined;
  }

  const state = states.get(rideId);
  if (state?.phase !== "arrived_pickup") return undefined;

  const origin = parseMapPoint(ride.originLat, ride.originLng)!;
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng)!;
  const segment = buildSegment(ride, "to_destination", destination);

  states.set(rideId, { phase: "in_trip", segment });

  return updateDemoRide(rideId, {
    status: "in_progress",
    driverCurrentLat: origin.lat.toFixed(6),
    driverCurrentLng: origin.lng.toFixed(6),
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
      states.set(ride.id, { phase: "arrived_pickup", segment: null });
      updated =
        updateDemoRide(ride.id, {
          driverCurrentLat: state.segment.target.lat.toFixed(6),
          driverCurrentLng: state.segment.target.lng.toFixed(6),
        }) ?? updated;
    }
    return updated;
  }

  if (state.phase === "arrived_pickup") {
    return ride;
  }

  if (state.phase === "in_trip" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated =
      updateDemoRide(ride.id, {
        driverCurrentLat: pos.lat.toFixed(6),
        driverCurrentLng: pos.lng.toFixed(6),
      }) ?? ride;

    if (segmentComplete(state.segment)) {
      states.set(ride.id, { phase: "completed", segment: null });
      updated =
        updateDemoRide(ride.id, {
          status: "completed",
          completedAt: new Date(),
          finalPrice: ride.finalPrice ?? ride.estimatedPrice,
          driverCurrentLat: state.segment.target.lat.toFixed(6),
          driverCurrentLng: state.segment.target.lng.toFixed(6),
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
    haversineMeters(pos, state.segment.target) <= DRIVER_ARRIVING_THRESHOLD_M ||
    remainingMetersAlongPath(state.segment.path, pos) <= DRIVER_ARRIVING_THRESHOLD_M
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
