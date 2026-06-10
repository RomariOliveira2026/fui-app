import type { Ride } from "../../drizzle/schema";
import { parseMapPoint } from "@shared/driverTracking";
import {
  buildFallbackTripPath,
  densifyPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import { calculateDrivingRouteWithOsrm } from "./osrmRoute";

const routeCache = new Map<number, RoutePoint[]>();

export function clearDemoRoutePath(rideId: number): void {
  routeCache.delete(rideId);
}

export function cacheDemoRoutePath(rideId: number, path: RoutePoint[]): void {
  if (path.length >= 2) {
    routeCache.set(rideId, densifyPath(path));
  }
}

/** Busca OSRM em background e atualiza cache da corrida demo. */
export function prefetchDemoRoutePath(ride: Ride): void {
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return;

  void calculateDrivingRouteWithOsrm(origin, destination).then((route) => {
    cacheDemoRoutePath(ride.id, route.routePath);
  });
}

/** Rota densificada para animação do motorista (cache → OSRM futuro → linha A→B). */
export function getDemoTripPath(ride: Ride): RoutePoint[] {
  const cached = routeCache.get(ride.id);
  if (cached && cached.length >= 2) return cached;

  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return [];

  const fallback = buildFallbackTripPath(origin, destination);
  routeCache.set(ride.id, fallback);
  prefetchDemoRoutePath(ride);
  return fallback;
}
