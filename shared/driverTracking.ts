import { haversineMeters } from "./demoMaps";
import type { DemoSimulationPhase } from "./demoSimulation";
import {
  buildDriverPhasePath,
  densifyPath,
  pathTotalMeters,
  projectPointOnPath,
  type RoutePoint,
} from "./routeAnimation";

export type MapCoord = { lat: number; lng: number };

export const DRIVER_ARRIVING_THRESHOLD_M = 180;

export function parseCoord(value: string | number | null | undefined): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

export function parseMapPoint(
  latValue: string | number | null | undefined,
  lngValue: string | number | null | undefined
): MapCoord | null {
  const lat = parseCoord(latValue);
  const lng = parseCoord(lngValue);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function lerpCoord(from: MapCoord, to: MapCoord, t: number): MapCoord {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  };
}

/** Velocidade média para ETA (km/h). Demo operacional usa ~36 km/h no servidor. */
export const DEFAULT_DRIVER_SPEED_KMH = 32;
export const DEMO_DRIVER_SPEED_KMH = 36;

/** Estima minutos de viagem a partir da distância (m) e velocidade média. */
export function estimateTravelMinutes(
  distanceMeters: number,
  speedKmh = DEFAULT_DRIVER_SPEED_KMH
): number {
  if (distanceMeters <= DRIVER_ARRIVING_THRESHOLD_M) return 0;
  if (distanceMeters <= 0) return 0;
  const minutesRaw = (distanceMeters / 1000 / speedKmh) * 60;
  return Math.max(1, Math.ceil(minutesRaw));
}

/** Texto de ETA para UI — evita ficar preso em “2 min” sem contexto. */
export function formatEtaDisplay(
  minutes: number,
  distanceM?: number
): { headline: string; label: string } {
  if (distanceM != null && distanceM <= DRIVER_ARRIVING_THRESHOLD_M) {
    return { headline: "0", label: "Chegando agora" };
  }
  if (minutes <= 0) {
    return { headline: "<1", label: "Menos de 1 minuto" };
  }
  if (distanceM != null && distanceM < 600) {
    return {
      headline: String(minutes),
      label: `~${Math.round(distanceM)} m · ${minutes} min`,
    };
  }
  return {
    headline: String(minutes),
    label: minutes === 1 ? "~1 minuto" : `~${minutes} minutos`,
  };
}

export function isDriverArriving(distanceMeters: number): boolean {
  return distanceMeters <= DRIVER_ARRIVING_THRESHOLD_M;
}

type RideLike = {
  driverId?: number | null;
  status: string;
  originLat: string;
  originLng: string;
  destinationLat: string;
  destinationLng: string;
  driverCurrentLat?: string | null;
  driverCurrentLng?: string | null;
};

export function shouldShowDriverOnMap(ride: RideLike): boolean {
  return (
    !!ride.driverId &&
    (ride.status === "accepted" || ride.status === "in_progress") &&
    !!parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng)
  );
}

export function getDriverTargetPoint(ride: RideLike): MapCoord | null {
  if (ride.status === "in_progress") {
    return parseMapPoint(ride.destinationLat, ride.destinationLng);
  }
  if (ride.status === "accepted") {
    return parseMapPoint(ride.originLat, ride.originLng);
  }
  return null;
}

function estimateDistanceAlongRoute(
  ride: RideLike,
  driver: MapCoord,
  simulationPhase?: DemoSimulationPhase | null,
  tripPath?: RoutePoint[] | null
): number {
  if (!tripPath || tripPath.length < 2) {
    const target = getDriverTargetPoint(ride);
    return target ? haversineMeters(driver, target) : 0;
  }

  const phase =
    ride.status === "in_progress" || simulationPhase === "in_trip"
      ? "to_destination"
      : "to_pickup";
  const path = buildDriverPhasePath(tripPath, phase);
  const { meters } = projectPointOnPath(path, driver);
  return Math.max(0, pathTotalMeters(path) - meters);
}

export function getPassengerDriverEta(
  ride: RideLike,
  simulationPhase?: DemoSimulationPhase | null,
  tripPath?: RoutePoint[] | null
): {
  minutes: number;
  isArriving: boolean;
  distanceM: number;
  label: string;
  statusTitle: string;
} | null {
  if (simulationPhase === "arrived_pickup" && shouldShowDriverOnMap(ride)) {
    return {
      minutes: 0,
      isArriving: true,
      distanceM: 0,
      label: "Aguardando início da corrida",
      statusTitle: "Motorista chegou",
    };
  }

  if (!shouldShowDriverOnMap(ride)) return null;

  const driver = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng);
  const target = getDriverTargetPoint(ride);
  if (!driver || !target) return null;

  const resolvedPath =
    tripPath && tripPath.length >= 2 ? densifyPath(tripPath) : null;
  const distanceM = estimateDistanceAlongRoute(
    ride,
    driver,
    simulationPhase,
    resolvedPath
  );
  const speedKmh =
    simulationPhase && simulationPhase !== "completed"
      ? DEMO_DRIVER_SPEED_KMH
      : DEFAULT_DRIVER_SPEED_KMH;
  const minutes = estimateTravelMinutes(distanceM, speedKmh);
  const etaText = formatEtaDisplay(minutes, distanceM);
  const arriving = ride.status === "accepted" && isDriverArriving(distanceM);

  if (ride.status === "in_progress") {
    return {
      minutes,
      isArriving: false,
      distanceM,
      label: `${etaText.label} até o destino`,
      statusTitle: "Corrida em andamento",
    };
  }

  if (arriving) {
    return {
      minutes,
      isArriving: true,
      distanceM,
      label: etaText.label,
      statusTitle: "Motorista chegando",
    };
  }

  return {
    minutes,
    isArriving: false,
    distanceM,
    label: `Motorista a ${etaText.label}`,
    statusTitle: "Motorista a caminho",
  };
}
