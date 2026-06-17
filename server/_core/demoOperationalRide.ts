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
import {
  ensureDemoFleetSeed,
  findNearestAvailableFleetDriver,
  releaseFleetDriver,
  setFleetDriverOnRide,
} from "./demoFleet";
import { getDemoTripPath, registerDemoRoutePathUpgradeHandler } from "./demoRoutePaths";
import { getDemoRide, isDemoRideId, updateDemoRide } from "./demoRide";
import { updateDemoDriverLocation } from "./demoDriver";

type Segment = {
  path: RoutePoint[];
  target: MapCoord;
  startedAtMs: number;
  durationMs: number;
};

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
  const distanceM = Math.max(pathTotalMeters(path), 100);
  const durationMs = Math.max(
    DEMO_OPERATIONAL_SEGMENT_MS,
    Math.round((distanceM / 1000 / 36) * 3600 * 1000)
  );
  return { path, target, startedAtMs: Date.now(), durationMs };
}

function segmentComplete(segment: Segment): boolean {
  const progress = Math.min(1, (Date.now() - segment.startedAtMs) / segment.durationMs);
  if (progress < 1) return false;

  const pos = pointAtPathProgress(segment.path, 1);
  const pathEnd = segment.path[segment.path.length - 1]!;
  const remaining = remainingMetersAlongPath(segment.path, pos);
  return (
    remaining <= DRIVER_ARRIVING_THRESHOLD_M ||
    haversineMeters(pos, segment.target) <= DRIVER_ARRIVING_THRESHOLD_M ||
    haversineMeters(pathEnd, segment.target) <= DRIVER_ARRIVING_THRESHOLD_M
  );
}

function positionAlongSegment(segment: Segment): MapCoord {
  const progress = Math.min(1, (Date.now() - segment.startedAtMs) / segment.durationMs);
  return progress >= 1 ? segment.target : pointAtPathProgress(segment.path, progress);
}

export function getOperationalPhase(rideId: number): DemoSimulationPhase | null {
  return states.get(rideId)?.phase ?? null;
}

/** Segundos restantes no segmento ativo (demo operacional) — ETA autoritativo do servidor. */
export function getOperationalEtaSeconds(rideId: number): number | null {
  const state = states.get(rideId);
  if (!state?.segment) return null;
  const remainingMs = state.segment.durationMs - (Date.now() - state.segment.startedAtMs);
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
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
      states.set(ride.id, {
        ...state,
        phase: "arrived_pickup",
        segment: null,
        arrivedPickupAtMs: Date.now(),
      });
      updated =
        updateDemoRide(ride.id, {
          driverCurrentLat: state.segment.target.lat.toFixed(6),
          driverCurrentLng: state.segment.target.lng.toFixed(6),
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
      states.set(ride.id, { ...state, phase: "completed", segment: null });
      updated =
        updateDemoRide(ride.id, {
          status: "completed",
          completedAt: new Date(),
          finalPrice: ride.finalPrice ?? ride.estimatedPrice,
          driverCurrentLat: state.segment.target.lat.toFixed(6),
          driverCurrentLng: state.segment.target.lng.toFixed(6),
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
    haversineMeters(pos, state.segment.target) <= DRIVER_ARRIVING_THRESHOLD_M ||
    remainingMetersAlongPath(state.segment.path, pos) <= DRIVER_ARRIVING_THRESHOLD_M
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
  const newSegment = buildSegment(
    ride,
    phase,
    state.segment.target,
    phase === "to_destination" ? current : null
  );
  newSegment.startedAtMs = Date.now() - Math.round(progress * newSegment.durationMs);

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
