import { encodeDemoPolyline, haversineMeters } from "@shared/demoMaps";

const OSRM_BASE = "https://router.project-osrm.org";
const TIMEOUT_MS = 12_000;
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
  const url =
    `${OSRM_BASE}/route/v1/driving/${coordStr}` +
    "?overview=full&geometries=geojson&steps=false";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn("[osrm] multi-waypoint HTTP error:", response.status);
      return haversineMultiRoute(waypoints);
    }

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };

    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !route || !coords?.length) {
      console.warn("[osrm] multi-waypoint no route returned");
      return haversineMultiRoute(waypoints);
    }

    const routePath: RoutePoint[] = coords.map(([lng, lat]) => ({ lat, lng }));
    const distanceM = Math.max(Math.round(route.distance), 1);
    const durationS = Math.max(Math.round(route.duration), 1);

    return {
      distance: { text: formatDistance(distanceM), value: distanceM },
      duration: { text: formatDuration(durationS), value: durationS },
      startLocation: routePath[0] ?? waypoints[0]!,
      endLocation: routePath[routePath.length - 1] ?? waypoints[waypoints.length - 1]!,
      overviewPolyline: encodeDemoPolyline(routePath),
      routePath,
      usedHaversineFallback: false,
    };
  } catch (error) {
    console.warn("[osrm] multi-waypoint route failed:", error);
    return haversineMultiRoute(waypoints);
  } finally {
    clearTimeout(timer);
  }
}

/** Calcula rota driving via OSRM; fallback haversine apenas se OSRM falhar. */
export async function calculateDrivingRouteWithOsrm(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<OsrmRouteResult> {
  const url =
    `${OSRM_BASE}/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    "?overview=full&geometries=geojson&steps=false";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn("[osrm] HTTP error:", response.status);
      return haversineRoute(origin, destination);
    }

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };

    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !route || !coords?.length) {
      console.warn("[osrm] no route returned");
      return haversineRoute(origin, destination);
    }

    const routePath: RoutePoint[] = coords.map(([lng, lat]) => ({ lat, lng }));
    const distanceM = Math.max(Math.round(route.distance), 1);
    const durationS = Math.max(Math.round(route.duration), 1);

    return {
      distance: { text: formatDistance(distanceM), value: distanceM },
      duration: { text: formatDuration(durationS), value: durationS },
      startLocation: routePath[0] ?? origin,
      endLocation: routePath[routePath.length - 1] ?? destination,
      overviewPolyline: encodeDemoPolyline(routePath),
      routePath,
      usedHaversineFallback: false,
    };
  } catch (error) {
    console.warn("[osrm] route failed:", error);
    return haversineRoute(origin, destination);
  } finally {
    clearTimeout(timer);
  }
}
