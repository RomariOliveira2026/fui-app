import { useEffect, useMemo, useRef, useState } from "react";
import { decodePolyline } from "@/lib/polyline";
import { trpc } from "@/lib/trpc";
import { persistDemoRoutePolyline } from "@/lib/demoRideStorage";
import { isUsableRoutePath } from "@shared/routeAnimation";

export type RouteGeometryPoint = { lat: number; lng: number };

type UseRideRouteGeometryOptions = {
  rideId?: number;
  serverPath?: RouteGeometryPoint[] | null;
  serverSource?: "osrm" | "fallback" | null;
  demoRoutePolyline?: string | null;
  enabled?: boolean;
};

type RouteGeometryState = {
  routePath: RouteGeometryPoint[] | null;
  encodedPolyline: string | null;
  isLoading: boolean;
  hasRealRoute: boolean;
};

function decodePolylinePath(
  polyline: string | null | undefined
): RouteGeometryPoint[] | null {
  if (!polyline?.trim()) return null;
  try {
    const decoded = decodePolyline(polyline);
    return decoded.length >= 2 ? decoded : null;
  } catch {
    return null;
  }
}

function pickRouteFromServer(
  origin: RouteGeometryPoint | null,
  destination: RouteGeometryPoint | null,
  serverPath?: RouteGeometryPoint[] | null,
  serverSource?: "osrm" | "fallback" | null,
  demoRoutePolyline?: string | null
): RouteGeometryState | null {
  if (
    serverSource === "osrm" &&
    serverPath &&
    isUsableRoutePath(serverPath, origin, destination)
  ) {
    return {
      routePath: serverPath,
      encodedPolyline: demoRoutePolyline ?? null,
      isLoading: false,
      hasRealRoute: true,
    };
  }

  const fromPolyline = decodePolylinePath(demoRoutePolyline);
  if (fromPolyline && isUsableRoutePath(fromPolyline, origin, destination)) {
    return {
      routePath: fromPolyline,
      encodedPolyline: demoRoutePolyline ?? null,
      isLoading: false,
      hasRealRoute: true,
    };
  }

  if (serverPath && isUsableRoutePath(serverPath, origin, destination)) {
    return {
      routePath: serverPath,
      encodedPolyline: demoRoutePolyline ?? null,
      isLoading: false,
      hasRealRoute: true,
    };
  }

  return null;
}

function extractRouteFromDirections(
  route: {
    overviewPolyline?: string | null;
    routePath?: RouteGeometryPoint[];
  },
  origin: RouteGeometryPoint,
  destination: RouteGeometryPoint
): RouteGeometryState | null {
  const pathFromApi =
    route.routePath && route.routePath.length >= 2 ? route.routePath : null;
  if (pathFromApi && isUsableRoutePath(pathFromApi, origin, destination)) {
    return {
      routePath: pathFromApi,
      encodedPolyline: route.overviewPolyline ?? null,
      isLoading: false,
      hasRealRoute: true,
    };
  }

  const fromPolyline = decodePolylinePath(route.overviewPolyline);
  if (fromPolyline && isUsableRoutePath(fromPolyline, origin, destination)) {
    return {
      routePath: fromPolyline,
      encodedPolyline: route.overviewPolyline ?? null,
      isLoading: false,
      hasRealRoute: true,
    };
  }

  return null;
}

const FETCH_RETRY_MS = [0, 800, 2_000, 4_500, 8_000];

/** Resolve geometria OSRM — rejeita apenas fallback A→B e cordas simplificadas demais. */
export function useRideRouteGeometry(
  origin: RouteGeometryPoint | null,
  destination: RouteGeometryPoint | null,
  options: UseRideRouteGeometryOptions = {}
): RouteGeometryState {
  const { rideId, serverPath, serverSource, demoRoutePolyline, enabled = true } = options;
  const utils = trpc.useUtils();

  const serverRoute = useMemo(
    () =>
      pickRouteFromServer(origin, destination, serverPath, serverSource, demoRoutePolyline),
    [origin, destination, serverPath, serverSource, demoRoutePolyline]
  );

  const [fetched, setFetched] = useState<RouteGeometryState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchGenRef = useRef(0);

  useEffect(() => {
    if (!enabled || !origin || !destination) {
      setFetched(null);
      setIsLoading(false);
      return;
    }

    if (serverRoute?.hasRealRoute) {
      setFetched(null);
      setIsLoading(false);
      return;
    }

    const generation = ++fetchGenRef.current;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setFetched(null);

      for (let attempt = 0; attempt < FETCH_RETRY_MS.length; attempt++) {
        if (cancelled || generation !== fetchGenRef.current) return;
        if (FETCH_RETRY_MS[attempt]! > 0) {
          await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_MS[attempt]));
        }
        if (cancelled || generation !== fetchGenRef.current) return;

        try {
          const route = await utils.maps.directions.fetch({
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
          });
          if (cancelled || generation !== fetchGenRef.current || !route) continue;

          const resolved = extractRouteFromDirections(route, origin, destination);
          if (!resolved) continue;

          if (rideId && resolved.encodedPolyline) {
            persistDemoRoutePolyline(rideId, resolved.encodedPolyline, "osrm");
          }

          setFetched(resolved);
          setIsLoading(false);
          return;
        } catch {
          // próxima tentativa
        }
      }

      if (!cancelled && generation === fetchGenRef.current) {
        setFetched(null);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    origin,
    destination,
    rideId,
    serverRoute?.hasRealRoute,
    utils,
  ]);

  if (serverRoute?.hasRealRoute) return serverRoute;

  if (fetched?.hasRealRoute) return { ...fetched, isLoading: false };

  return {
    routePath: null,
    encodedPolyline: null,
    isLoading,
    hasRealRoute: false,
  };
}
