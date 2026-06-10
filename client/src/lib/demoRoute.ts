import { demoDirections } from "@shared/demoMaps";

export type ResolvedRoute = {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  overviewPolyline: string;
};

export type RouteCoords = { lat: number; lng: number };

export function normalizeRouteCoords(
  location: { lat?: unknown; lng?: unknown } | null | undefined
): RouteCoords | null {
  if (!location) return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Busca rota via API; usa fallback demo só quando Maps real não está configurado. */
export async function fetchRouteWithDemoFallback(
  fetchDirections: () => Promise<ResolvedRoute | null | undefined>,
  origin: string,
  destination: string,
  allowDemoFallback = false
): Promise<ResolvedRoute | null> {
  try {
    const route = await fetchDirections();
    const start = normalizeRouteCoords(route?.startLocation);
    const end = normalizeRouteCoords(route?.endLocation);
    if (start && end && route) {
      return {
        ...route,
        startLocation: start,
        endLocation: end,
      };
    }
  } catch (error) {
    console.warn("[fetchRouteWithDemoFallback] API directions failed:", error);
  }

  if (!allowDemoFallback) {
    return null;
  }

  try {
    const demo = demoDirections(origin, destination);
    const start = normalizeRouteCoords(demo?.startLocation);
    const end = normalizeRouteCoords(demo?.endLocation);
    if (start && end && demo) {
      console.warn("[fetchRouteWithDemoFallback] Using demo route fallback");
      return {
        ...demo,
        startLocation: start,
        endLocation: end,
      };
    }
  } catch (demoError) {
    console.warn("[fetchRouteWithDemoFallback] Demo route fallback failed:", demoError);
  }

  return null;
}
