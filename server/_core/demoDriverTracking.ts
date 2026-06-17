import type { Ride } from "../../drizzle/schema";
import { haversineMeters } from "@shared/demoMaps";
import {
  DRIVER_ARRIVING_THRESHOLD_M,
  estimateTravelMinutes,
  parseMapPoint,
  type MapCoord,
} from "@shared/driverTracking";
import {
  buildDriverPhasePath,
  pathTotalMeters,
  pointAtPathProgress,
  projectPointOnPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import { getDemoRide, updateDemoRide } from "./demoRide";
import { getDemoTripPath, registerDemoRoutePathUpgradeHandler } from "./demoRoutePaths";

type TrackPhase = "to_pickup" | "to_destination";

type DemoTrack = {
  phase: TrackPhase;
  path: RoutePoint[];
  target: MapCoord;
  startedAtMs: number;
  durationMs: number;
};

const tracks = new Map<number, DemoTrack>();

const DEMO_SPEED_KMH = 32;
const MIN_SEGMENT_MS = 45_000;
const START_OFFSET_M = 900;

export function clearDemoDriverTrack(rideId: number): void {
  tracks.delete(rideId);
}

function rebuildTrackFromRouteUpgrade(rideId: number): void {
  const track = tracks.get(rideId);
  const ride = getDemoRide(rideId);
  if (!track || !ride) return;

  const progress = Math.min(1, (Date.now() - track.startedAtMs) / Math.max(track.durationMs, 1));
  const rebuilt = buildTrack(ride, track.phase);
  rebuilt.startedAtMs = Date.now() - Math.round(progress * rebuilt.durationMs);
  tracks.set(rideId, rebuilt);
}

function buildTrack(ride: Ride, phase: TrackPhase): DemoTrack {
  const origin = parseMapPoint(ride.originLat, ride.originLng)!;
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng)!;
  const tripPath = getDemoTripPath(ride);
  const current = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng);

  const path = buildDriverPhasePath(tripPath, phase, {
    pickupOffsetMeters: START_OFFSET_M,
    currentPosition: phase === "to_pickup" ? current : null,
  });

  const target = phase === "to_pickup" ? origin : destination;
  const distanceM = Math.max(pathTotalMeters(path), 120);
  const durationMs = Math.max(
    MIN_SEGMENT_MS,
    (distanceM / 1000 / DEMO_SPEED_KMH) * 3600 * 1000
  );

  return {
    phase,
    path,
    target,
    startedAtMs: Date.now(),
    durationMs,
  };
}

export function initDemoDriverTrack(
  rideId: number,
  ride: Ride,
  phase: TrackPhase = "to_pickup"
): { driverCurrentLat: string; driverCurrentLng: string } {
  const track = buildTrack(ride, phase);
  tracks.set(rideId, track);
  const start = track.path[0] ?? track.target;
  return {
    driverCurrentLat: start.lat.toFixed(6),
    driverCurrentLng: start.lng.toFixed(6),
  };
}

export function resetDemoDriverTrackPhase(
  rideId: number,
  ride: Ride,
  phase: TrackPhase
): { driverCurrentLat: string; driverCurrentLng: string } {
  return initDemoDriverTrack(rideId, ride, phase);
}

export function tickDemoDriverLocation(ride: Ride): {
  driverCurrentLat: string;
  driverCurrentLng: string;
  etaMinutes: number;
  isArriving: boolean;
} | null {
  if (!ride.driverId) return null;
  if (ride.status !== "accepted" && ride.status !== "in_progress") {
    clearDemoDriverTrack(ride.id);
    return null;
  }

  const phase: TrackPhase = ride.status === "in_progress" ? "to_destination" : "to_pickup";
  let track = tracks.get(ride.id);
  if (!track || track.phase !== phase) {
    track = buildTrack(ride, phase);
    tracks.set(ride.id, track);
  }

  const progress = Math.min(1, (Date.now() - track.startedAtMs) / track.durationMs);
  const pos = progress >= 1 ? track.target : pointAtPathProgress(track.path, progress);
  const { meters } = projectPointOnPath(track.path, pos);
  const remainingM = progress >= 1 ? 0 : Math.max(0, pathTotalMeters(track.path) - meters);
  const etaMinutes = estimateTravelMinutes(remainingM, DEMO_SPEED_KMH);
  const distanceToTargetM = haversineMeters(pos, track.target);
  const isArriving =
    ride.status === "accepted" &&
    (distanceToTargetM <= DRIVER_ARRIVING_THRESHOLD_M || progress >= 1);

  return {
    driverCurrentLat: pos.lat.toFixed(6),
    driverCurrentLng: pos.lng.toFixed(6),
    etaMinutes: progress >= 1 ? 0 : Math.max(1, etaMinutes),
    isArriving,
  };
}

/** Avança simulação demo e persiste coordenadas na corrida em memória. */
export function syncDemoDriverTracking(ride: Ride): Ride {
  const tick = tickDemoDriverLocation(ride);
  if (!tick) return ride;

  const updated = updateDemoRide(ride.id, {
    driverCurrentLat: tick.driverCurrentLat,
    driverCurrentLng: tick.driverCurrentLng,
  });

  return updated ?? ride;
}

registerDemoRoutePathUpgradeHandler(rebuildTrackFromRouteUpgrade);
