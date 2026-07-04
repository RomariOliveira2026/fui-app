import { encodeDemoPolyline, haversineMeters } from "@shared/demoMaps";
import { isUsableRoutePath, maxPathSegmentMeters } from "@shared/routeAnimation";

const OSRM_BASE = "https://router.project-osrm.org";
const DEFAULT_TIMEOUT_MS = 15_000;
const LONG_ROUTE_TIMEOUT_MS = 45_000;
const HAVERSINE_ROAD_FACTOR = 1.25;
const AVG_SPEED_KMH = 45;

export type RoutePoint = { lat: number; lng: number };

export type OsrmRouteResult = {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation: RoutePoint;
  endLocation: RoutePoint;
  overviewPolyline: string;
  routePath: RoutePoint[];
  usedHaversineFallback: boolean;
};

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }
  return `${totalMinutes} min`;
}

function resolveOsrmTimeoutMs(origin: RoutePoint, destination: RoutePoint): number {
  const straightM = haversineMeters(origin, destination);
  if (straightM >= 25_000) return LONG_ROUTE_TIMEOUT_MS;
  return DEFAULT_TIMEOUT_MS;
}

function haversineRoute(origin: RoutePoint, destination: RoutePoint): OsrmRouteResult {
  const straightM = haversineMeters(origin, destination);
  const distanceM = Math.max(Math.round(straightM * HAVERSINE_ROAD_FACTOR), 100);
  const durationS = Math.max(
    Math.round((distanceM / 1000 / AVG_SPEED_KMH) * 3600),
    60
  );
  const routePath = [origin, destination];

  return {
    distance: { text: formatDistance(distanceM), value: distanceM },
    duration: { text: formatDuration(durationS), value: durationS },
    startLocation: origin,
    endLocation: destination,
    overviewPolyline: encodeDemoPolyline(routePath),
    routePath,
    usedHaversineFallback: true,
  };
}

function haversineMultiRoute(points: RoutePoint[]): OsrmRouteResult {
  let distanceM = 0;
  let durationS = 0;
  const routePath: RoutePoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i]!;
    if (routePath.length === 0 || routePath[routePath.length - 1] !== point) {
      routePath.push(point);
    }
    if (i === 0) continue;
    const segment = haversineRoute(points[i - 1]!, point);
    distanceM += segment.distance.value;
    durationS += segment.duration.value;
  }

  return {
    distance: { text: formatDistance(distanceM), value: distanceM },
    duration: { text: formatDuration(durationS), value: durationS },
    startLocation: points[0]!,
    endLocation: points[points.length - 1]!,
    overviewPolyline: encodeDemoPolyline(routePath),
    routePath,
    usedHaversineFallback: true,
  };
}

async function fetchOsrmRoute(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type OsrmRoutePayload = {
  distance: number;
  duration: number;
  geometry?: { coordinates?: Array<[number, number]> };
  legs?: Array<{
    steps?: Array<{
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  }>;
};

function coordsToPath(coords: Array<[number, number]>): RoutePoint[] {
  return coords.map(([lng, lat]) => ({ lat, lng }));
}

function mergeStepGeometries(route: OsrmRoutePayload): RoutePoint[] {
  const merged: RoutePoint[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const coords = step.geometry?.coordinates;
      if (!coords?.length) continue;
      for (const [lng, lat] of coords) {
        const point = { lat, lng };
        const prev = merged[merged.length - 1];
        if (!prev || prev.lat !== point.lat || prev.lng !== point.lng) {
          merged.push(point);
        }
      }
    }
  }
  return merged;
}

function extractBestRoutePath(route: OsrmRoutePayload): RoutePoint[] {
  const fromSteps = mergeStepGeometries(route);
  if (fromSteps.length >= 2) return fromSteps;

  const coords = route.geometry?.coordinates;
  if (coords?.length) return coordsToPath(coords);
  return [];
}

function buildOsrmResult(
  routePath: RoutePoint[],
  distanceM: number,
  durationS: number,
  origin: RoutePoint,
  destination: RoutePoint
): OsrmRouteResult {
  return {
    distance: { text: formatDistance(distanceM), value: distanceM },
    duration: { text: formatDuration(durationS), value: durationS },
    startLocation: routePath[0] ?? origin,
    endLocation: routePath[routePath.length - 1] ?? destination,
    overviewPolyline: encodeDemoPolyline(routePath),
    routePath,
    usedHaversineFallback: false,
  };
}

function routeQualityScore(
  path: RoutePoint[],
  origin: RoutePoint,
  destination: RoutePoint
): number {
  if (!isUsableRoutePath(path, origin, destination)) return -1;
  return path.length * 10 - maxPathSegmentMeters(path);
}

function pickBetterOsrmResult(
  current: OsrmRouteResult | null,
  candidate: OsrmRouteResult | null
): OsrmRouteResult | null {
  if (!candidate) return current;
  if (!current) return candidate;

  const origin = candidate.routePath[0] ?? current.routePath[0]!;
  const destination =
    candidate.routePath[candidate.routePath.length - 1] ??
    current.routePath[current.routePath.length - 1]!;

  const currentScore = routeQualityScore(current.routePath, origin, destination);
  const candidateScore = routeQualityScore(candidate.routePath, origin, destination);
  if (candidateScore > currentScore) return candidate;
  return current;
}

async function requestOsrmRoute(
  coordStr: string,
  timeoutMs: number,
  withSteps: boolean
): Promise<OsrmRouteResult | null> {
  const url =
    `${OSRM_BASE}/route/v1/driving/${coordStr}` +
    `?overview=full&geometries=geojson&steps=${withSteps ? "true" : "false"}`;

  const response = await fetchOsrmRoute(url, timeoutMs);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    code?: string;
    routes?: OsrmRoutePayload[];
  };

  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) return null;

  const routePath = extractBestRoutePath(route);
  if (routePath.length < 2) return null;

  const distanceM = Math.max(Math.round(route.distance), 1);
  const durationS = Math.max(Math.round(route.duration), 1);
  const origin = routePath[0]!;
  const destination = routePath[routePath.length - 1]!;

  return buildOsrmResult(routePath, distanceM, durationS, origin, destination);
}

/** Calcula rota driving via OSRM com geometria completa (full + steps se necessário). */
export async function calculateDrivingRouteWithOsrm(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<OsrmRouteResult> {
  const coordStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const timeoutMs = resolveOsrmTimeoutMs(origin, destination);

  try {
    let best: OsrmRouteResult | null = null;
    best = pickBetterOsrmResult(best, await requestOsrmRoute(coordStr, timeoutMs, false));
    best = pickBetterOsrmResult(best, await requestOsrmRoute(coordStr, timeoutMs, true));
    if (best) return best;
  } catch (error) {
    console.warn("[osrm] route failed:", error);
  }

  return haversineRoute(origin, destination);
}

/** Rota com múltiplos waypoints (origem → paradas → destino). */
export async function calculateDrivingRouteWithWaypoints(
  waypoints: RoutePoint[]
): Promise<OsrmRouteResult> {
  if (waypoints.length < 2) {
    throw new Error("Pelo menos dois pontos são necessários para calcular a rota.");
  }
  if (waypoints.length === 2) {
    return calculateDrivingRouteWithOsrm(waypoints[0]!, waypoints[1]!);
  }

  const coordStr = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const timeoutMs = resolveOsrmTimeoutMs(waypoints[0]!, waypoints[waypoints.length - 1]!);

  try {
    let best: OsrmRouteResult | null = null;
    best = pickBetterOsrmResult(best, await requestOsrmRoute(coordStr, timeoutMs, false));
    best = pickBetterOsrmResult(best, await requestOsrmRoute(coordStr, timeoutMs, true));
    if (best) return best;
  } catch (error) {
    console.warn("[osrm] multi-waypoint route failed:", error);
  }

  return haversineMultiRoute(waypoints);
}
