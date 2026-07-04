/**
 * Backend Leaflet + OpenStreetMap para /request-ride.
 * Animação do motorista: trilho = polyline densificada, velocidade linear em metros.
 */

import { memo, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { LeafletMap, createCircleMarker, drawRoute } from "@/components/Map";
import { createDriverLiveMarker, createVehicleLiveIcon } from "@/components/map/DriverLiveMarker";
import { decodePolyline } from "@/lib/polyline";
import {
  densifyPath,
  linearSpeedAtMeters,
  pathTotalMeters,
  pointAtPathMeters,
  projectPointOnPath,
  type RoutePoint,
} from "@shared/routeAnimation";
import { adaptiveDriverCatchUpSpeedMps } from "@shared/demoRideProgression";
import { haversineMeters } from "@shared/demoMaps";
import { getClientDemoRideSpeedMultiplier } from "@/lib/demoRideEta";
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

function bearingDegrees(from: RequestRideMapPoint, to: RequestRideMapPoint): number {
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Bearing estável: mede a direção sobre uma janela ampla (60 m antes/depois),
 * ignorando os micro-zigue-zagues da polyline densificada. Em retas o valor
 * praticamente não muda, então o ícone não balança.
 */
function stableBearingAtPathMeters(path: RoutePoint[], meters: number): number | null {
  const total = pathTotalMeters(path);
  if (path.length < 2 || total <= 0) return null;

  const window = 60;
  const back = pointAtPathMeters(path, Math.max(0, meters - window));
  const fwd = pointAtPathMeters(path, Math.min(total, meters + window));
  if (haversineMeters(back, fwd) >= 3) {
    return bearingDegrees(back, fwd);
  }

  const from = pointAtPathMeters(path, meters);
  const to = pointAtPathMeters(path, Math.min(total, meters + window));
  if (haversineMeters(from, to) >= 1) {
    return bearingDegrees(from, to);
  }
  return null;
}

/** Só troca a rotação quando a direção muda de forma perceptível (histerese). */
function nextBearingWithHysteresis(prev: number | null, next: number): number {
  if (prev == null) return next;
  const delta = ((next - prev + 540) % 360) - 180;
  if (Math.abs(delta) < 12) return prev;
  return next;
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

const defaultCenter: [number, number] = [
  REQUEST_RIDE_MAP_DEFAULT_CENTER.lat,
  REQUEST_RIDE_MAP_DEFAULT_CENTER.lng,
];

/** Tolerância (m) para parar o loop de animação. */
const STOP_EPSILON_M = 0.4;

/** Deslocamento mínimo para recalcular a rotação do ícone. */
const MIN_BEARING_MOVE_M = 2;

/** Velocidade máxima de ajuste suave entre polls do servidor. */
const MAX_DRIVER_SPEED_MPS = 38;

/** Velocidade base quando não há ETA (~50 km/h visual). */
const DEFAULT_CRUISE_MPS = 14;

/** Zoom mínimo ao seguir o motorista em corrida longa. */
const DRIVER_FOLLOW_MIN_ZOOM = 15;

/** Metros à frente do motorista para enquadrar o mapa (sem mostrar rota inteira). */
const DRIVER_LOOKAHEAD_M = 12_000;

/** Tempo para alcançar o alvo do servidor quando há defasagem. */
const PURSUIT_LAG_S = 0.65;

export const RequestRideMapLeaflet = memo(function RequestRideMapLeaflet({
  className,
  origin,
  destination,
  driver,
  vehicleType,
  nearbyDrivers,
  routePath,
  encodedPolyline,
  trackingPhase,
  driverEtaSeconds,
  mapFitPaddingBottom = 52,
}: RequestRideMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    origin?: L.Marker;
    destination?: L.Marker;
    driver?: L.Marker;
    route?: L.Polyline;
    fleet?: L.LayerGroup;
  }>({});
  const tripPathRef = useRef<RoutePoint[]>([]);
  const pathTotalRef = useRef(0);
  const displayMetersRef = useRef(0);
  const targetMetersRef = useRef(0);
  const lastServerTargetMsRef = useRef(0);
  const prevTrackingPhaseRef = useRef<RequestRideMapViewProps["trackingPhase"]>(trackingPhase);
  const prevVehicleTypeRef = useRef<RequestRideMapViewProps["vehicleType"]>(vehicleType);
  const animFrameRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef<number | null>(null);
  const driverDisplayRef = useRef<RequestRideMapPoint | null>(null);
  const driverBearingRef = useRef<number | null>(null);
  const bearingAnchorRef = useRef<RequestRideMapPoint | null>(null);
  const driverEtaRef = useRef<number | null>(null);
  const etaAnchorRef = useRef({ at: Date.now(), seconds: 0 });
  const trackingPhaseRef = useRef(trackingPhase);
  const mapFitPaddingBottomRef = useRef(mapFitPaddingBottom);

  useEffect(() => {
    trackingPhaseRef.current = trackingPhase;
  }, [trackingPhase]);

  useEffect(() => {
    mapFitPaddingBottomRef.current = mapFitPaddingBottom;
  }, [mapFitPaddingBottom]);

  useEffect(() => {
    if (driverEtaSeconds != null && Number.isFinite(driverEtaSeconds) && driverEtaSeconds > 0) {
      driverEtaRef.current = driverEtaSeconds;
      etaAnchorRef.current = { at: Date.now(), seconds: driverEtaSeconds };
    } else {
      driverEtaRef.current = null;
    }
  }, [driverEtaSeconds]);

  function getLiveDriverEtaSeconds(): number | null {
    const anchor = etaAnchorRef.current;
    if (anchor.seconds <= 0) return driverEtaRef.current;
    const elapsed = (Date.now() - anchor.at) / 1000;
    return Math.max(1, anchor.seconds - elapsed);
  }

  function isContinuousTrackingPhase(
    phase: RequestRideMapViewProps["trackingPhase"]
  ): boolean {
    return (
      phase === "en_route" ||
      phase === "arriving" ||
      phase === "waiting_pickup" ||
      phase === "in_trip"
    );
  }

  function resolveDriverSpeedMps(displayM: number, targetM: number): number {
    const pathTotal = pathTotalRef.current;
    const remaining = Math.max(0, pathTotal - displayM);
    if (remaining <= STOP_EPSILON_M) return 0;

    const gap = Math.max(0, targetM - displayM);
    let cruise = DEFAULT_CRUISE_MPS;

    const eta = getLiveDriverEtaSeconds();
    if (eta != null && eta > 0) {
      cruise = Math.max(10, Math.min(MAX_DRIVER_SPEED_MPS, remaining / eta));
    } else if (remaining > 50_000) {
      // Rotas intermunicipais: velocidade mínima visível sem depender do poll do servidor.
      const demoMultiplier = Math.max(1, getClientDemoRideSpeedMultiplier());
      cruise = Math.max(
        cruise,
        Math.min(MAX_DRIVER_SPEED_MPS, remaining / Math.max(180 / demoMultiplier, 45))
      );
    } else {
      cruise = linearSpeedAtMeters(remaining, DEFAULT_CRUISE_MPS);
    }

    if (gap > STOP_EPSILON_M) {
      return Math.min(
        MAX_DRIVER_SPEED_MPS,
        Math.max(cruise, adaptiveDriverCatchUpSpeedMps(gap, DEFAULT_CRUISE_MPS, PURSUIT_LAG_S))
      );
    }

    return cruise;
  }

  function syncPathMetrics() {
    pathTotalRef.current = pathTotalMeters(tripPathRef.current);
  }

  const followDriverCamera = useCallback((pos: RequestRideMapPoint) => {
    const map = mapRef.current;
    if (!map || !isValidPoint(pos)) return;
    if (!isContinuousTrackingPhase(trackingPhaseRef.current)) return;

    const zoom = Math.max(map.getZoom(), DRIVER_FOLLOW_MIN_ZOOM);
    map.setView(toLatLngPair(pos), zoom, { animate: false });
  }, []);

  const getBoundsPoints = useCallback((): [number, number][] => {
    const points: [number, number][] = [];
    const displayDriver = driverDisplayRef.current ?? driver;
    const phase = trackingPhaseRef.current ?? "searching";

    if (
      isContinuousTrackingPhase(phase) &&
      isValidPoint(displayDriver) &&
      tripPathRef.current.length >= 2
    ) {
      points.push(toLatLngPair(displayDriver));
      const displayM = displayMetersRef.current;
      const lookAhead = Math.min(
        pathTotalRef.current,
        displayM + (phase === "in_trip" ? DRIVER_LOOKAHEAD_M : 4_500)
      );
      points.push(toLatLngPair(pointAtPathMeters(tripPathRef.current, lookAhead)));
      return points;
    }

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
  }, [origin, destination, driver]);

  const fitVisibleBounds = useCallback(
    (animate = false) => {
      const map = mapRef.current;
      if (!map) return;

      const boundsPoints = getBoundsPoints();
      if (boundsPoints.length >= 2) {
        const bottomPad = mapFitPaddingBottomRef.current;
        map.fitBounds(L.latLngBounds(boundsPoints), {
          paddingTopLeft: L.point(52, 52),
          paddingBottomRight: L.point(52, bottomPad),
          maxZoom: isContinuousTrackingPhase(trackingPhaseRef.current)
            ? DRIVER_FOLLOW_MIN_ZOOM + 1
            : trackingPhase === "en_route" || trackingPhase === "arriving"
              ? 16
              : 15,
          animate,
        });
      } else if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 15, { animate });
      }
    },
    [getBoundsPoints, trackingPhase]
  );

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
      syncPathMetrics();

      const drawGeometry = geometry.map((p) => [p.lat, p.lng] as [number, number]);
      layersRef.current.route = drawRoute(map, drawGeometry, {
        color: "#D97706",
        weight: 5,
        opacity: 0.85,
        fitBounds: false,
      });
    }

    fitVisibleBounds(false);
  }, [origin, destination, routePath, encodedPolyline, fitVisibleBounds]);

  const syncFleetLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layersRef.current.fleet) {
      map.removeLayer(layersRef.current.fleet);
      layersRef.current.fleet = undefined;
    }

    if (!nearbyDrivers?.length) return;

    const group = L.layerGroup();
    for (const d of nearbyDrivers) {
      if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) continue;
      const marker = createCircleMarker(map, [d.lat, d.lng], {
        color: d.status === "online" ? "#F39200" : "#94a3b8",
        label: "•",
        title: `${d.name} (${d.vehicleType})`,
      });
      group.addLayer(marker);
    }
    group.addTo(map);
    layersRef.current.fleet = group;
  }, [nearbyDrivers]);

  const stopDriverAnimation = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastFrameMsRef.current = null;
  }, []);

  const applyDisplayPosition = useCallback((meters: number) => {
    const marker = layersRef.current.driver;
    const path = tripPathRef.current;
    if (!marker || path.length < 2) return;

    const clamped = Math.max(0, Math.min(pathTotalRef.current, meters));
    const pos = pointAtPathMeters(path, clamped);
    driverDisplayRef.current = pos;
    marker.setLatLng(toLatLngPair(pos));
    followDriverCamera(pos);

    const movedEnough =
      !bearingAnchorRef.current ||
      haversineMeters(bearingAnchorRef.current, pos) >= MIN_BEARING_MOVE_M;

    if (!movedEnough) return;

    const rawBearing = stableBearingAtPathMeters(path, clamped);
    if (rawBearing == null) return;

    bearingAnchorRef.current = pos;
    const bearing = nextBearingWithHysteresis(driverBearingRef.current, rawBearing);
    if (bearing !== driverBearingRef.current) {
      driverBearingRef.current = bearing;
      marker.getElement()?.style.setProperty("--fui-driver-bearing", `${bearing}deg`);
    }
  }, [followDriverCamera]);

  const tickDriverAnimation = useCallback(() => {
    const path = tripPathRef.current;
    const marker = layersRef.current.driver;

    if (!marker || path.length < 2 || pathTotalRef.current <= 0) {
      stopDriverAnimation();
      return;
    }

    const now = performance.now();
    const last = lastFrameMsRef.current ?? now;
    const deltaSec = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    lastFrameMsRef.current = now;

    const target = targetMetersRef.current;
    const display = displayMetersRef.current;
    const speed = resolveDriverSpeedMps(display, target);
    if (speed <= 0) {
      stopDriverAnimation();
      return;
    }

    const nextDisplay = Math.min(pathTotalRef.current, display + speed * deltaSec);

    if (Math.abs(nextDisplay - display) > 0.005) {
      displayMetersRef.current = nextDisplay;
      applyDisplayPosition(nextDisplay);
    }

    if (
      pathTotalRef.current - nextDisplay > STOP_EPSILON_M &&
      isContinuousTrackingPhase(trackingPhaseRef.current)
    ) {
      animFrameRef.current = requestAnimationFrame(tickDriverAnimation);
    } else {
      animFrameRef.current = null;
    }
  }, [applyDisplayPosition, stopDriverAnimation]);

  const startDriverAnimation = useCallback(() => {
    if (animFrameRef.current != null) return;
    lastFrameMsRef.current = null;
    animFrameRef.current = requestAnimationFrame(tickDriverAnimation);
  }, [tickDriverAnimation]);

  const ensureDriverAnimation = useCallback(() => {
    if (
      !isContinuousTrackingPhase(trackingPhaseRef.current) ||
      tripPathRef.current.length < 2 ||
      pathTotalRef.current - displayMetersRef.current <= STOP_EPSILON_M
    ) {
      return;
    }
    startDriverAnimation();
  }, [startDriverAnimation]);

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
      driverBearingRef.current = null;
      bearingAnchorRef.current = null;
      return;
    }

    if (tripPathRef.current.length < 2) {
      return;
    }
    const path = tripPathRef.current;
    syncPathMetrics();

    if (layersRef.current.driver && prevVehicleTypeRef.current !== vehicleType) {
      layersRef.current.driver.setIcon(createVehicleLiveIcon(vehicleType));
      prevVehicleTypeRef.current = vehicleType;
      applyDisplayPosition(displayMetersRef.current);
    }

    pathTotalRef.current = pathTotalMeters(path);
    const projected = projectPointOnPath(path, driver);
    const snappedTarget = projected.meters;
    const phaseChanged = prevTrackingPhaseRef.current !== trackingPhase;
    prevTrackingPhaseRef.current = trackingPhase;

    if (!layersRef.current.driver) {
      displayMetersRef.current = snappedTarget;
      targetMetersRef.current = snappedTarget;
      lastServerTargetMsRef.current = Date.now();
      driverDisplayRef.current = projected.point;
      driverBearingRef.current = null;
      bearingAnchorRef.current = null;

      layersRef.current.driver = createDriverLiveMarker(map, toLatLngPair(projected.point), {
        title: "Motorista ao vivo",
        vehicleType,
      });
      applyDisplayPosition(snappedTarget);
      fitVisibleBounds(true);
      if (isContinuousTrackingPhase(trackingPhase)) {
        startDriverAnimation();
      }
      return;
    }

    if (phaseChanged) {
      stopDriverAnimation();
      driverBearingRef.current = null;
      bearingAnchorRef.current = null;
      const projectedAfterPhase = projectPointOnPath(path, driver);
      displayMetersRef.current = projectedAfterPhase.meters;
      targetMetersRef.current = projectedAfterPhase.meters;
      lastServerTargetMsRef.current = Date.now();
      applyDisplayPosition(projectedAfterPhase.meters);
      driverDisplayRef.current = projectedAfterPhase.point;
      if (isContinuousTrackingPhase(trackingPhase)) {
        startDriverAnimation();
      }
      return;
    }

    // Alvo avança ao longo da mesma polyline laranja — nunca recua.
    if (snappedTarget > targetMetersRef.current + 0.5) {
      targetMetersRef.current = snappedTarget;
      lastServerTargetMsRef.current = Date.now();
    }

    // Se o servidor saltar muito à frente, teleporta uma vez (sem animar de ré).
    if (snappedTarget - displayMetersRef.current > 220) {
      stopDriverAnimation();
      displayMetersRef.current = snappedTarget;
      targetMetersRef.current = snappedTarget;
      applyDisplayPosition(snappedTarget);
      ensureDriverAnimation();
      return;
    }

    ensureDriverAnimation();
  }, [driver, fitVisibleBounds, startDriverAnimation, stopDriverAnimation, applyDisplayPosition, trackingPhase, vehicleType, ensureDriverAnimation]);

  useEffect(() => {
    syncStaticLayers();
  }, [syncStaticLayers]);

  useEffect(() => {
    syncFleetLayers();
  }, [syncFleetLayers]);

  useEffect(() => {
    syncDriverLayer();
    ensureDriverAnimation();
  }, [syncDriverLayer, ensureDriverAnimation]);

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
        syncFleetLayers();
        syncDriverLayer();
      }}
    />
  );
});
