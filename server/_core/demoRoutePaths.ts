import type { Ride } from "../../drizzle/schema";
import { parseMapPoint } from "@shared/driverTracking";
import {
  buildFallbackTripPath,
  densifyPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import { calculateDrivingRouteWithOsrm } from "./osrmRoute";

const DENSIFY_STEP_M = 12;

type RouteCacheEntry = {
  path: RoutePoint[];
  source: "osrm" | "fallback";
};

const routeCache = new Map<number, RouteCacheEntry>();
const inflight = new Map<number, Promise<RouteCacheEntry>>();
const upgradeHandlers = new Set<(rideId: number) => void>();

export function registerDemoRoutePathUpgradeHandler(handler: (rideId: number) => void): () => void {
  upgradeHandlers.add(handler);
  return () => upgradeHandlers.delete(handler);
}

function notifyRouteUpgrade(rideId: number): void {
  upgradeHandlers.forEach((handler) => {
    try {
      handler(rideId);
    } catch (error) {
      console.warn("[demoRoutePaths] upgrade handler failed:", rideId, error);
    }
  });
}

export function clearDemoRoutePath(rideId: number): void {
  routeCache.delete(rideId);
  inflight.delete(rideId);
}

export function cacheDemoRoutePath(rideId: number, path: RoutePoint[], source: "osrm" | "fallback" = "osrm"): void {
  if (path.length < 2) return;

  const prev = routeCache.get(rideId);
  const entry: RouteCacheEntry = {
    path: densifyPath(path, DENSIFY_STEP_M),
    source,
  };
  routeCache.set(rideId, entry);

  if (prev?.source === "fallback" && entry.source === "osrm") {
    notifyRouteUpgrade(rideId);
  }
}

async function fetchAndCacheRoute(ride: Ride): Promise<RouteCacheEntry> {
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) {
    const empty: RouteCacheEntry = { path: [], source: "fallback" };
    return empty;
  }

  const route = await calculateDrivingRouteWithOsrm(origin, destination);
  const source: RouteCacheEntry["source"] = route.usedHaversineFallback ? "fallback" : "osrm";
  const path = densifyPath(route.routePath, DENSIFY_STEP_M);
  const entry: RouteCacheEntry = { path, source };

  const prev = routeCache.get(ride.id);
  routeCache.set(ride.id, entry);

  if (prev?.source === "fallback" && entry.source === "osrm") {
    notifyRouteUpgrade(ride.id);
  }

  return entry;
}

/** Garante rota OSRM antes de iniciar simulação do motorista. */
export async function ensureDemoRoutePath(ride: Ride): Promise<RoutePoint[]> {
  const cached = routeCache.get(ride.id);
  if (cached?.source === "osrm" && cached.path.length >= 2) {
    return cached.path;
  }

  let promise = inflight.get(ride.id);
  if (!promise) {
    promise = fetchAndCacheRoute(ride).finally(() => {
      inflight.delete(ride.id);
    });
    inflight.set(ride.id, promise);
  }

  const entry = await promise;
  if (entry.path.length >= 2) return entry.path;

  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return [];

  const fallback = buildFallbackTripPath(origin, destination);
  cacheDemoRoutePath(ride.id, fallback, "fallback");
  return fallback;
}

/** Busca OSRM em background (legado — prefira ensureDemoRoutePath no request). */
export function prefetchDemoRoutePath(ride: Ride): void {
  void ensureDemoRoutePath(ride);
}

/** Rota densificada para animação do motorista (cache OSRM → fallback temporário). */
export function getDemoTripPath(ride: Ride): RoutePoint[] {
  const cached = routeCache.get(ride.id);
  if (cached && cached.path.length >= 2) return cached.path;

  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return [];

  if (!inflight.has(ride.id)) {
    void ensureDemoRoutePath(ride);
  }

  return buildFallbackTripPath(origin, destination);
}

export function getDemoTripPathSource(rideId: number): RouteCacheEntry["source"] | null {
  return routeCache.get(rideId)?.source ?? null;
}
