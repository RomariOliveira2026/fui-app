/**
 * Backend Leaflet + OpenStreetMap para /request-ride.
 * Animação do motorista: trilho = polyline densificada, velocidade linear em metros.
 */

import { memo, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { LeafletMap, createCircleMarker, drawRoute } from "@/components/Map";
import { createDriverLiveMarker } from "@/components/map/DriverLiveMarker";
import { decodePolyline } from "@/lib/polyline";
import {
  buildDriverPhasePath,
  densifyPath,
  linearSpeedAtMeters,
  pathTotalMeters,
  pointAtPathMeters,
  projectPointOnPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import {
  REQUEST_RIDE_MAP_DEFAULT_CENTER,
  REQUEST_RIDE_MAP_DEFAULT_ZOOM,
  type RequestRideMapPoint,
  type RequestRideMapViewProps,
} from "./types";

function toLatLngPair(point: RequestRideMapPoint): [number, number] {
  return [point.lat, point.lng];
}

function isValidPoint(point: RequestRideMapPoint | null | undefined): point is RequestRideMapPoint {
  return !!point && Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

function buildRouteGeometry(
  origin: RequestRideMapPoint,
  destination: RequestRideMapPoint,
  routePath?: Array<{ lat: number; lng: number }> | null,
  encodedPolyline?: string | null
): RoutePoint[] {
  if (routePath && routePath.length >= 2) {
    return densifyPath(routePath, 15);
  }

  if (encodedPolyline) {
    try {
      const decoded = decodePolyline(encodedPolyline);
      if (decoded.length >= 2) {
        return densifyPath(decoded, 15);
      }
    } catch {
      // Linha direta abaixo
    }
  }
  return densifyPath([origin, destination], 12);
}

function resolveDriverPath(
  tripPath: RoutePoint[],
  trackingPhase: RequestRideMapViewProps["trackingPhase"]
): RoutePoint[] {
  if (tripPath.length < 2) return tripPath;

  if (trackingPhase === "in_trip" || trackingPhase === "completed") {
    return buildDriverPhasePath(tripPath, "to_destination");
  }

  if (
    trackingPhase === "en_route" ||
    trackingPhase === "arriving" ||
    trackingPhase === "waiting_pickup"
  ) {
    return buildDriverPhasePath(tripPath, "to_pickup");
  }

  return tripPath;
}

const defaultCenter: [number, number] = [
  REQUEST_RIDE_MAP_DEFAULT_CENTER.lat,
  REQUEST_RIDE_MAP_DEFAULT_CENTER.lng,
];

/** Tolerância (m) para parar o loop de animação. */
const STOP_EPSILON_M = 0.4;

export const RequestRideMapLeaflet = memo(function RequestRideMapLeaflet({
  className,
  origin,
  destination,
  driver,
  routePath,
  encodedPolyline,
  trackingPhase,
}: RequestRideMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    origin?: L.Marker;
    destination?: L.Marker;
    driver?: L.Marker;
    route?: L.Polyline;
  }>({});
  const tripPathRef = useRef<RoutePoint[]>([]);
  const driverPathRef = useRef<RoutePoint[]>([]);
  const pathTotalRef = useRef(0);
  const displayMetersRef = useRef(0);
  const targetMetersRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef<number | null>(null);
  const driverDisplayRef = useRef<RequestRideMapPoint | null>(null);

  const getBoundsPoints = useCallback((): [number, number][] => {
    const points: [number, number][] = [];
    const displayDriver = driverDisplayRef.current ?? driver;
    const phase = trackingPhase ?? "searching";

    if (isValidPoint(displayDriver)) points.push(toLatLngPair(displayDriver));
    if (isValidPoint(origin)) points.push(toLatLngPair(origin));

    if (
      phase === "in_trip" ||
      phase === "completed" ||
      phase === "searching" ||
      phase === "driver_found" ||
      !isValidPoint(displayDriver)
    ) {
      if (isValidPoint(destination)) points.push(toLatLngPair(destination));
    }

    return points;
  }, [origin, destination, driver, trackingPhase]);

  const fitVisibleBounds = useCallback(
    (animate = false) => {
      const map = mapRef.current;
      if (!map) return;

      const boundsPoints = getBoundsPoints();
      if (boundsPoints.length >= 2) {
        map.fitBounds(L.latLngBounds(boundsPoints), {
          padding: [52, 52],
          maxZoom: trackingPhase === "en_route" || trackingPhase === "arriving" ? 16 : 15,
          animate,
        });
      } else if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 15, { animate });
      }
    },
    [getBoundsPoints, trackingPhase]
  );

  const refreshDriverPath = useCallback(() => {
    if (tripPathRef.current.length >= 2) {
      driverPathRef.current = resolveDriverPath(tripPathRef.current, trackingPhase);
      pathTotalRef.current = pathTotalMeters(driverPathRef.current);
    }
  }, [trackingPhase]);

  const syncStaticLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers = layersRef.current;
    if (layers.origin) map.removeLayer(layers.origin);
    if (layers.destination) map.removeLayer(layers.destination);
    if (layers.route) map.removeLayer(layers.route);
    layers.origin = undefined;
    layers.destination = undefined;
    layers.route = undefined;

    const hasOrigin = isValidPoint(origin);
    const hasDest = isValidPoint(destination);

    if (hasOrigin) {
      layersRef.current.origin = createCircleMarker(map, toLatLngPair(origin), {
        color: "#22c55e",
        label: "A",
        title: "Origem",
      });
    }

    if (hasDest) {
      layersRef.current.destination = createCircleMarker(map, toLatLngPair(destination), {
        color: "#ef4444",
        label: "B",
        title: "Destino",
      });
    }

    if (hasOrigin && hasDest) {
      const geometry = buildRouteGeometry(origin, destination, routePath, encodedPolyline);
      tripPathRef.current = geometry;
      refreshDriverPath();

      const drawGeometry = geometry.map((p) => [p.lat, p.lng] as [number, number]);
      layersRef.current.route = drawRoute(map, drawGeometry, {
        color: "#D97706",
        weight: 5,
        opacity: 0.85,
        fitBounds: false,
      });
    }

    fitVisibleBounds(false);
  }, [origin, destination, routePath, encodedPolyline, refreshDriverPath, fitVisibleBounds]);

  const stopDriverAnimation = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastFrameMsRef.current = null;
  }, []);

  const applyDisplayPosition = useCallback((meters: number) => {
    const marker = layersRef.current.driver;
    const path = driverPathRef.current;
    if (!marker || path.length < 2) return;

    const clamped = Math.max(0, Math.min(pathTotalRef.current, meters));
    const pos = pointAtPathMeters(path, clamped);
    driverDisplayRef.current = pos;
    marker.setLatLng(toLatLngPair(pos));
  }, []);

  const tickDriverAnimation = useCallback(() => {
    const path = driverPathRef.current;
    const marker = layersRef.current.driver;

    if (!marker || path.length < 2 || pathTotalRef.current <= 0) {
      stopDriverAnimation();
      return;
    }

    const now = performance.now();
    const last = lastFrameMsRef.current ?? now;
    const deltaSec = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    lastFrameMsRef.current = now;

    let display = displayMetersRef.current;
    const target = targetMetersRef.current;
    const diff = target - display;

    if (Math.abs(diff) > STOP_EPSILON_M) {
      const remaining = pathTotalRef.current - display;
      const speed = linearSpeedAtMeters(remaining);
      const step = speed * deltaSec;

      if (diff > 0) {
        display = Math.min(target, display + step);
      } else {
        display = Math.max(target, display - step * 0.85);
      }
      displayMetersRef.current = display;
      applyDisplayPosition(display);
    }

    if (Math.abs(target - displayMetersRef.current) > STOP_EPSILON_M) {
      animFrameRef.current = requestAnimationFrame(tickDriverAnimation);
    } else {
      displayMetersRef.current = target;
      applyDisplayPosition(target);
      animFrameRef.current = null;
    }
  }, [applyDisplayPosition, stopDriverAnimation]);

  const startDriverAnimation = useCallback(() => {
    if (animFrameRef.current != null) return;
    lastFrameMsRef.current = null;
    animFrameRef.current = requestAnimationFrame(tickDriverAnimation);
  }, [tickDriverAnimation]);

  const syncDriverLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isValidPoint(driver)) {
      stopDriverAnimation();
      if (layersRef.current.driver) {
        map.removeLayer(layersRef.current.driver);
        layersRef.current.driver = undefined;
      }
      driverDisplayRef.current = null;
      return;
    }

    refreshDriverPath();
    const path = driverPathRef.current;
    if (path.length < 2) return;

    pathTotalRef.current = pathTotalMeters(path);
    const projected = projectPointOnPath(path, driver);
    const snappedTarget = projected.meters;

    if (!layersRef.current.driver) {
      displayMetersRef.current = snappedTarget;
      targetMetersRef.current = snappedTarget;
      driverDisplayRef.current = projected.point;

      layersRef.current.driver = createDriverLiveMarker(map, toLatLngPair(projected.point), {
        title: "Motorista ao vivo",
      });
      fitVisibleBounds(true);
      return;
    }

    const prevTarget = targetMetersRef.current;
    if (Math.abs(snappedTarget - prevTarget) > 0.5) {
      targetMetersRef.current = snappedTarget;
    }

    if (Math.abs(displayMetersRef.current - targetMetersRef.current) > STOP_EPSILON_M) {
      startDriverAnimation();
    }
  }, [driver, refreshDriverPath, fitVisibleBounds, startDriverAnimation, stopDriverAnimation]);

  useEffect(() => {
    syncStaticLayers();
  }, [syncStaticLayers]);

  useEffect(() => {
    syncDriverLayer();
  }, [syncDriverLayer]);

  useEffect(() => {
    return () => {
      stopDriverAnimation();
    };
  }, [stopDriverAnimation]);

  return (
    <LeafletMap
      className={cn("rounded-lg border border-border", className)}
      initialCenter={defaultCenter}
      initialZoom={REQUEST_RIDE_MAP_DEFAULT_ZOOM}
      onMapReady={(map) => {
        mapRef.current = map;
        syncStaticLayers();
        syncDriverLayer();
      }}
    />
  );
});
