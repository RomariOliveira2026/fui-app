/**
 * Backend Google Maps para /request-ride.
 * Requer VITE_GOOGLE_MAPS_API_KEY (ou proxy Forge) — ver GoogleMap.tsx.
 */

import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  GoogleMapView,
  createGoogleMarker,
  drawGoogleRoute,
} from "@/components/GoogleMap";
import { isDemoMap, type DemoMapHandle } from "@/lib/demoMapFallback";
import {
  REQUEST_RIDE_MAP_DEFAULT_CENTER,
  REQUEST_RIDE_MAP_DEFAULT_ZOOM,
  type RequestRideMapPoint,
  type RequestRideMapViewProps,
} from "./types";

type GoogleMapInstance = google.maps.Map | DemoMapHandle;

function isValidPoint(point: RequestRideMapPoint | null | undefined): point is RequestRideMapPoint {
  return !!point && Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

function centerMap(map: GoogleMapInstance, point: RequestRideMapPoint, zoom = 15) {
  if (isDemoMap(map)) {
    map.setCenter(point);
    map.setZoom(zoom);
    return;
  }
  map.setCenter(point);
  map.setZoom(zoom);
}

function fitMapToPoints(map: GoogleMapInstance, points: RequestRideMapPoint[]) {
  if (points.length === 0) return;

  if (isDemoMap(map)) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds({
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    });
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  points.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
}

export const RequestRideMapGoogle = memo(function RequestRideMapGoogle({
  className,
  origin,
  destination,
  encodedPolyline,
}: RequestRideMapViewProps) {
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const layersRef = useRef<{
    origin?: { setMap: (map: unknown) => void } | google.maps.Marker;
    destination?: { setMap: (map: unknown) => void } | google.maps.Marker;
    route?: { setMap: (map: unknown) => void } | google.maps.Polyline;
  }>({});

  const clearLayers = useCallback(() => {
    const layers = layersRef.current;
    if (layers.origin) layers.origin.setMap(null);
    if (layers.destination) layers.destination.setMap(null);
    if (layers.route) layers.route.setMap(null);
    layersRef.current = {};
  }, []);

  const syncLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    clearLayers();

    const hasOrigin = isValidPoint(origin);
    const hasDest = isValidPoint(destination);

    if (hasOrigin) {
      layersRef.current.origin = createGoogleMarker(map, origin, {
        color: "#22c55e",
        label: "A",
        title: "Origem",
      }) as google.maps.Marker;
    }

    if (hasDest) {
      layersRef.current.destination = createGoogleMarker(map, destination, {
        color: "#ef4444",
        label: "B",
        title: "Destino",
      }) as google.maps.Marker;
    }

    if (hasOrigin && hasDest && encodedPolyline) {
      layersRef.current.route = drawGoogleRoute(map, encodedPolyline, {
        color: "#F39200",
        weight: 5,
        fitBounds: true,
      }) as google.maps.Polyline;
      return;
    }

    if (hasOrigin && hasDest) {
      fitMapToPoints(map, [origin, destination]);
      return;
    }

    if (hasOrigin) {
      centerMap(map, origin);
      return;
    }

    if (hasDest) {
      centerMap(map, destination);
      return;
    }

    centerMap(map, REQUEST_RIDE_MAP_DEFAULT_CENTER, REQUEST_RIDE_MAP_DEFAULT_ZOOM);
  }, [origin, destination, encodedPolyline, clearLayers]);

  useEffect(() => {
    syncLayers();
  }, [syncLayers]);

  return (
    <GoogleMapView
      className={cn("rounded-lg border border-border", className)}
      initialCenter={REQUEST_RIDE_MAP_DEFAULT_CENTER}
      initialZoom={REQUEST_RIDE_MAP_DEFAULT_ZOOM}
      darkMode={true}
      onMapReady={(map) => {
        mapRef.current = map;
        syncLayers();
      }}
    />
  );
});
