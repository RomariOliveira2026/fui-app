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

/** Estima segundos de viagem a partir da distância (m) e velocidade média. */
export function estimateTravelSeconds(
  distanceMeters: number,
  speedKmh = DEFAULT_DRIVER_SPEED_KMH
): number {
  if (distanceMeters <= 0 || distanceMeters <= DRIVER_ARRIVING_THRESHOLD_M) return 0;
  const speedMps = (speedKmh * 1000) / 3600;
  return Math.max(1, Math.ceil(distanceMeters / speedMps));
}

/** Estima minutos de viagem (arredondado para cima). */
export function estimateTravelMinutes(
  distanceMeters: number,
  speedKmh = DEFAULT_DRIVER_SPEED_KMH
): number {
  const seconds = estimateTravelSeconds(distanceMeters, speedKmh);
  if (seconds <= 0) return 0;
  return Math.ceil(seconds / 60);
}

export type EtaDisplay = {
  headline: string;
  unit: string;
  label: string;
  seconds: number;
  minutes: number;
};

function formatEtaDistanceLabel(distanceM: number): string {
  if (distanceM >= 1000) {
    const km = distanceM / 1000;
    const text = km >= 10 ? km.toFixed(0) : km.toFixed(1);
    return `~${text.replace(".", ",")} km`;
  }
  return `~${Math.round(distanceM)} m`;
}

/** Formata ETA para UI — abaixo de 10 min usa M:SS para contagem perceptível. */
export function formatEtaFromSeconds(seconds: number, distanceM?: number): EtaDisplay {
  const safeSeconds = Math.max(0, Math.round(seconds));

  if (distanceM != null && distanceM <= DRIVER_ARRIVING_THRESHOLD_M) {
    return {
      headline: "0",
      unit: "min",
      label: "Chegando agora",
      seconds: 0,
      minutes: 0,
    };
  }
  if (safeSeconds <= 0) {
    return {
      headline: "<1",
      unit: "min",
      label: "Menos de 1 minuto",
      seconds: 0,
      minutes: 0,
    };
  }

  if (safeSeconds < 600) {
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    const timeStr = `${m}:${s.toString().padStart(2, "0")}`;
    const distanceBit =
      distanceM != null ? `${formatEtaDistanceLabel(distanceM)} · ` : "";
    return {
      headline: timeStr,
      unit: "",
      label: `${distanceBit}tempo restante ${timeStr}`,
      seconds: safeSeconds,
      minutes: Math.ceil(safeSeconds / 60),
    };
  }

  const minutes = Math.ceil(safeSeconds / 60);
  const distanceBit =
    distanceM != null ? `${formatEtaDistanceLabel(distanceM)} · ` : "";
  return {
    headline: String(minutes),
    unit: "min",
    label:
      minutes === 1
        ? `${distanceBit}~1 minuto restante`
        : `${distanceBit}~${minutes} minutos restantes`,
    seconds: safeSeconds,
    minutes,
  };
}

/** @deprecated Prefira formatEtaFromSeconds — mantido para chamadas legadas. */
export function formatEtaDisplay(
  minutes: number,
  distanceM?: number
): { headline: string; label: string } {
  const display = formatEtaFromSeconds(Math.max(0, minutes * 60), distanceM);
  return { headline: display.headline, label: display.label };
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
  tripPath?: RoutePoint[] | null,
  serverEtaSeconds?: number | null
): {
  minutes: number;
  seconds: number;
  headline: string;
  unit: string;
  isArriving: boolean;
  distanceM: number;
  label: string;
  statusTitle: string;
} | null {
  if (simulationPhase === "arrived_pickup" && shouldShowDriverOnMap(ride)) {
    return {
      minutes: 0,
      seconds: 0,
      headline: "0",
      unit: "min",
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
  const secondsFromDistance = estimateTravelSeconds(distanceM, speedKmh);
  const seconds =
    serverEtaSeconds != null && Number.isFinite(serverEtaSeconds)
      ? Math.max(0, Math.round(serverEtaSeconds))
      : secondsFromDistance;
  const etaText = formatEtaFromSeconds(seconds, distanceM);
  const arriving = ride.status === "accepted" && isDriverArriving(distanceM);

  if (ride.status === "in_progress") {
    return {
      minutes: etaText.minutes,
      seconds: etaText.seconds,
      headline: etaText.headline,
      unit: etaText.unit,
      isArriving: false,
      distanceM,
      label: etaText.label,
      statusTitle: "Corrida em andamento",
    };
  }

  if (arriving) {
    return {
      minutes: etaText.minutes,
      seconds: etaText.seconds,
      headline: etaText.headline,
      unit: etaText.unit,
      isArriving: true,
      distanceM,
      label: etaText.label,
      statusTitle: "Motorista chegando",
    };
  }

  return {
    minutes: etaText.minutes,
    seconds: etaText.seconds,
    headline: etaText.headline,
    unit: etaText.unit,
    isArriving: false,
    distanceM,
    label: `Motorista a ${etaText.label}`,
    statusTitle: "Motorista a caminho",
  };
}
