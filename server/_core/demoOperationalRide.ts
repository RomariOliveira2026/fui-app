import type { Ride } from "../../drizzle/schema";
import type { DemoSimulationPhase } from "@shared/demoSimulation";
import {
  DEMO_OPERATIONAL_ACCEPT_DELAY_MS,
  DEMO_OPERATIONAL_PICKUP_WAIT_MS,
  DEMO_OPERATIONAL_SEGMENT_MS,
  isDemoOperationalRidesEnabledServer,
} from "@shared/demoOperationalRides";
import type { DemoFleetVehicleType } from "@shared/demoFleet";
import { haversineMeters } from "@shared/demoMaps";
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
import {
  ensureDemoFleetSeed,
  findNearestAvailableFleetDriver,
  releaseFleetDriver,
  setFleetDriverOnRide,
} from "./demoFleet";
import { getDemoTripPath, registerDemoRoutePathUpgradeHandler } from "./demoRoutePaths";
import { getDemoRide, isDemoRideId, updateDemoRide } from "./demoRide";
import { updateDemoDriverLocation } from "./demoDriver";

type Segment = RideSegmentTiming;

type OperationalState = {
  phase: DemoSimulationPhase;
  segment: Segment | null;
  registeredAtMs: number;
  arrivedPickupAtMs: number | null;
  vehicleType: DemoFleetVehicleType;
};

const states = new Map<number, OperationalState>();
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
    minMs: DEMO_OPERATIONAL_SEGMENT_MS,
  });
  return { path, target, ...timing };
}

function segmentComplete(segment: Segment): boolean {
  return shouldCompleteRideSegment(segment, positionAlongSegmentPath(segment));
}

function positionAlongSegment(segment: Segment): MapCoord {
  return positionAlongSegmentPath(segment);
}

export function getOperationalPhase(rideId: number): DemoSimulationPhase | null {
  return states.get(rideId)?.phase ?? null;
}

/** Segundos restantes no segmento ativo (demo operacional) — ETA autoritativo do servidor. */
export function getOperationalEtaSeconds(rideId: number): number | null {
  const state = states.get(rideId);
  return getSegmentEtaSeconds(state?.segment);
}

export function clearOperationalState(rideId: number): void {
  const ride = getDemoRide(rideId);
  if (ride?.driverId) releaseFleetDriver(ride.driverId);
  states.delete(rideId);
}

export function registerOperationalDemoRide(
  rideId: number,
  vehicleType: DemoFleetVehicleType,
  originLat: string,
  originLng: string
): void {
  if (!isDemoOperationalRidesEnabledServer() || !isDemoRideId(rideId)) return;

  const lat = Number.parseFloat(originLat);
  const lng = Number.parseFloat(originLng);
  ensureDemoFleetSeed(
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  );

  states.set(rideId, {
    phase: "searching",
    segment: null,
    registeredAtMs: Date.now(),
    arrivedPickupAtMs: null,
    vehicleType,
  });
}

/** Reconstrói estado em memória após hydrate/refresh (corrida já em andamento). */
export function restoreOperationalStateFromRide(ride: Ride): void {
  if (!isDemoOperationalRidesEnabledServer() || !isDemoRideId(ride.id)) return;
  if (states.has(ride.id)) return;

  const vehicleType = (ride.vehicleType as DemoFleetVehicleType) ?? "carro";

  if (ride.status === "cancelled") {
    clearOperationalState(ride.id);
    return;
  }
  if (ride.status === "completed") {
    states.set(ride.id, {
      phase: "completed",
      segment: null,
      registeredAtMs: Date.now(),
      arrivedPickupAtMs: null,
      vehicleType,
    });
    return;
  }
  if (ride.status === "requested") {
    registerOperationalDemoRide(ride.id, vehicleType, ride.originLat, ride.originLng);
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
      minMs: DEMO_OPERATIONAL_SEGMENT_MS,
    });
    states.set(ride.id, {
      phase: "in_trip",
      segment: { path, target: destination, ...timing },
      registeredAtMs: Date.now(),
      arrivedPickupAtMs: null,
      vehicleType,
    });
    return;
  }

  if (ride.status === "accepted") {
    const path = buildDriverPhasePath(getDemoTripPath(ride), "to_pickup", {
      currentPosition: driver,
    });
    const timing = buildSegmentTimingFromPath(path, driver, {
      minMs: DEMO_OPERATIONAL_SEGMENT_MS,
    });
    const nearPickup =
      driver &&
      (haversineMeters(driver, origin) <= 180 ||
        remainingMetersAlongPath(path, driver) <= 180);
    states.set(ride.id, {
      phase: nearPickup ? "arrived_pickup" : "to_pickup",
      segment: nearPickup ? null : { path, target: origin, ...timing },
      registeredAtMs: Date.now(),
      arrivedPickupAtMs: nearPickup ? Date.now() : null,
      vehicleType,
    });
  }
}

function operationalAcceptRide(rideId: number): Ride | undefined {
  const ride = getDemoRide(rideId);
  const state = states.get(rideId);
  if (!ride || !state || ride.status !== "requested") return undefined;

  const match = findNearestAvailableFleetDriver(state.vehicleType, ride.originLat, ride.originLng);
  if (!match) {
    console.warn(`[DemoOperational] Nenhum motorista ${state.vehicleType} disponível para #${rideId}`);
    return undefined;
  }

  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return undefined;

  const segment = buildSegment(ride, "to_pickup", origin);
  const start = segment.path[0] ?? origin;

  setFleetDriverOnRide(match.profile.id, rideId, "a_caminho");

  let updated = updateDemoRide(rideId, {
    driverId: match.profile.id,
    vehicleId: match.vehicle.id,
    status: "accepted",
    paymentStatus: ride.paymentMethod === "cash" ? "paid" : "paid",
    driverCurrentLat: start.lat.toFixed(6),
    driverCurrentLng: start.lng.toFixed(6),
  });

  if (!updated) return undefined;

  updateDemoDriverLocation(match.profile.id, start.lat.toFixed(6), start.lng.toFixed(6));

  states.set(rideId, {
    ...state,
    phase: "to_pickup",
    segment,
    arrivedPickupAtMs: null,
  });

  return updated;
}

function startOperationalTrip(rideId: number): Ride | undefined {
  const ride = getDemoRide(rideId);
  const state = states.get(rideId);
  if (!ride || !state) return undefined;
  if (state.phase === "in_trip" && state.segment) return ride;
  if (ride.status !== "accepted" && ride.status !== "in_progress") return undefined;
  if (state.phase !== "arrived_pickup" && state.phase !== "to_pickup") return undefined;

  const origin = parseMapPoint(ride.originLat, ride.originLng)!;
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng)!;
  const current = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng) ?? origin;
  const segment = buildSegment(ride, "to_destination", destination, current);
  const start = segment.path[0] ?? current;

  if (ride.driverId) setFleetDriverOnRide(ride.driverId, rideId, "em_corrida");

  states.set(rideId, { ...state, phase: "in_trip", segment, arrivedPickupAtMs: null });

  return updateDemoRide(rideId, {
    status: "in_progress",
    driverCurrentLat: start.lat.toFixed(6),
    driverCurrentLng: start.lng.toFixed(6),
  });
}

/** Inicia viagem operacional se ainda não estiver em in_trip (ex.: ride.start do motorista). */
export function ensureOperationalTripStarted(rideId: number): Ride | undefined {
  const ride = getDemoRide(rideId);
  const state = states.get(rideId);
  if (!ride || !state) return undefined;
  if (state.phase === "in_trip" && state.segment) return ride;
  if (ride.status !== "in_progress" && ride.status !== "accepted") return undefined;
  if (state.phase === "arrived_pickup" || state.phase === "to_pickup") {
    return startOperationalTrip(rideId);
  }
  return ride;
}

/** Avança corrida demo operacional (aceite, movimento, conclusão). */
export function advanceOperationalDemoRide(ride: Ride): Ride {
  if (!isDemoOperationalRidesEnabledServer() || !isDemoRideId(ride.id)) {
    return ride;
  }

  if (ride.status === "cancelled") {
    clearOperationalState(ride.id);
    return ride;
  }

  if (ride.status === "completed") {
    states.set(ride.id, {
      phase: "completed",
      segment: null,
      registeredAtMs: Date.now(),
      arrivedPickupAtMs: null,
      vehicleType: (ride.vehicleType as DemoFleetVehicleType) ?? "carro",
    });
    return ride;
  }

  let state = states.get(ride.id);
  if (!state) {
    restoreOperationalStateFromRide(ride);
    state = states.get(ride.id);
  }

  if (!state && ride.status === "requested") {
    registerOperationalDemoRide(
      ride.id,
      (ride.vehicleType as DemoFleetVehicleType) ?? "carro",
      ride.originLat,
      ride.originLng
    );
    state = states.get(ride.id)!;
  }

  if (!state) return ride;

  if (state.phase === "searching") {
    if (Date.now() - state.registeredAtMs >= DEMO_OPERATIONAL_ACCEPT_DELAY_MS) {
      const accepted = operationalAcceptRide(ride.id);
      if (accepted) return accepted;
    }
    return ride;
  }

  if (state.phase === "driver_accepted") {
    return ride;
  }

  if (state.phase === "to_pickup" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated =
      updateDemoRide(ride.id, {
        driverCurrentLat: pos.lat.toFixed(6),
        driverCurrentLng: pos.lng.toFixed(6),
      }) ?? ride;

    if (ride.driverId) {
      updateDemoDriverLocation(ride.driverId, pos.lat.toFixed(6), pos.lng.toFixed(6));
    }

    if (segmentComplete(state.segment)) {
      const pathEnd = state.segment.path[state.segment.path.length - 1] ?? state.segment.target;
      states.set(ride.id, {
        ...state,
        phase: "arrived_pickup",
        segment: null,
        arrivedPickupAtMs: Date.now(),
      });
      updated =
        updateDemoRide(ride.id, {
          driverCurrentLat: pathEnd.lat.toFixed(6),
          driverCurrentLng: pathEnd.lng.toFixed(6),
        }) ?? updated;
    }
    return updated;
  }

  if (state.phase === "arrived_pickup") {
    const arrivedAt = state.arrivedPickupAtMs ?? Date.now();
    if (Date.now() - arrivedAt >= DEMO_OPERATIONAL_PICKUP_WAIT_MS) {
      const started = startOperationalTrip(ride.id);
      if (started) return started;
    }
    return ride;
  }

  if (ride.status === "in_progress" && state.phase !== "in_trip" && state.phase !== "completed") {
    const started = ensureOperationalTripStarted(ride.id);
    if (started && started !== ride) return started;
  }

  if (state.phase === "in_trip" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated =
      updateDemoRide(ride.id, {
        driverCurrentLat: pos.lat.toFixed(6),
        driverCurrentLng: pos.lng.toFixed(6),
      }) ?? ride;

    if (ride.driverId) {
      updateDemoDriverLocation(ride.driverId, pos.lat.toFixed(6), pos.lng.toFixed(6));
    }

    if (segmentComplete(state.segment)) {
      const pathEnd = state.segment.path[state.segment.path.length - 1] ?? state.segment.target;
      states.set(ride.id, { ...state, phase: "completed", segment: null });
      updated =
        updateDemoRide(ride.id, {
          status: "completed",
          completedAt: new Date(),
          finalPrice: ride.finalPrice ?? ride.estimatedPrice,
          driverCurrentLat: pathEnd.lat.toFixed(6),
          driverCurrentLng: pathEnd.lng.toFixed(6),
        }) ?? updated;
      if (ride.driverId) releaseFleetDriver(ride.driverId);
      states.delete(ride.id);
    }
    return updated;
  }

  return ride;
}

export function isOperationalDriverNearPickup(ride: Ride): boolean {
  const state = states.get(ride.id);
  if (state?.phase === "arrived_pickup") return true;
  if (state?.phase !== "to_pickup" || !state.segment) return false;

  const pos = positionAlongSegment(state.segment);
  return (
    haversineMeters(pos, state.segment.target) <= 180 ||
    remainingMetersAlongPath(state.segment.path, pos) <= 180
  );
}

/** Recalcula segmento ativo quando a rota OSRM substitui fallback em linha reta. */
export function refreshOperationalSegmentPath(rideId: number): void {
  const state = states.get(rideId);
  const ride = getDemoRide(rideId);
  if (!state?.segment || !ride) return;
  if (state.phase !== "to_pickup" && state.phase !== "in_trip") return;

  const phase = state.phase === "in_trip" ? "to_destination" : "to_pickup";
  const progress = Math.min(
    1,
    (Date.now() - state.segment.startedAtMs) / Math.max(state.segment.durationMs, 1)
  );

  const current = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng);
  const path = buildDriverPhasePath(getDemoTripPath(ride), phase, {
    pickupOffsetMeters: START_OFFSET_M,
    currentPosition: phase === "to_destination" ? current : null,
  });
  const durationMs = computeSegmentDurationMs(pathTotalMeters(path), {
    minMs: DEMO_OPERATIONAL_SEGMENT_MS,
  });
  const newSegment: Segment = {
    path,
    target: state.segment.target,
    startedAtMs: Date.now() - Math.round(progress * durationMs),
    durationMs,
  };

  states.set(rideId, { ...state, segment: newSegment });

  const pos = positionAlongSegment(newSegment);
  const updated = updateDemoRide(rideId, {
    driverCurrentLat: pos.lat.toFixed(6),
    driverCurrentLng: pos.lng.toFixed(6),
  });

  if (updated?.driverId) {
    updateDemoDriverLocation(updated.driverId, pos.lat.toFixed(6), pos.lng.toFixed(6));
  }
}

registerDemoRoutePathUpgradeHandler(refreshOperationalSegmentPath);
