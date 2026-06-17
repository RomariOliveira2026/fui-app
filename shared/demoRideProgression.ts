import { haversineMeters } from "./demoMaps";
import { DEMO_DRIVER_SPEED_KMH, DRIVER_ARRIVING_THRESHOLD_M, type MapCoord } from "./driverTracking";
import {
  pathTotalMeters,
  pointAtPathProgress,
  projectPointOnPath,
  type RoutePoint,
} from "./routeAnimation";

/** Duração mínima de um trecho animado (ms). */
export const DEMO_SEGMENT_MIN_MS = 22_000;

export type RideSegmentTiming = {
  path: RoutePoint[];
  target: MapCoord;
  startedAtMs: number;
  durationMs: number;
};

/**
 * Multiplicador de velocidade da simulação demo.
 * 1 = tempo real (~36 km/h). 10 = demo ~10× mais rápido.
 *
 * Env: DEMO_RIDE_SPEED_MULTIPLIER ou VITE_DEMO_RIDE_SPEED_MULTIPLIER
 * Padrão: 10 em BETA_DEMO, senão 1.
 */
export function getDemoRideSpeedMultiplier(env: {
  multiplier?: string;
  betaDemo?: string;
} = {}): number {
  const raw =
    env.multiplier ??
    (typeof process !== "undefined"
      ? process.env.DEMO_RIDE_SPEED_MULTIPLIER ?? process.env.VITE_DEMO_RIDE_SPEED_MULTIPLIER
      : undefined);
  const parsed = raw ? Number.parseFloat(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, 60);
  }
  const beta = env.betaDemo ?? (typeof process !== "undefined" ? process.env.BETA_DEMO : undefined);
  if (beta === "true" || beta === "1") return 10;
  return 1;
}

/** Duração do trecho (ms) a partir da distância e velocidade simulada. */
export function computeSegmentDurationMs(
  distanceMeters: number,
  options?: {
    minMs?: number;
    speedKmh?: number;
    speedMultiplier?: number;
  }
): number {
  const minMs = options?.minMs ?? DEMO_SEGMENT_MIN_MS;
  const speedKmh = options?.speedKmh ?? DEMO_DRIVER_SPEED_KMH;
  const multiplier = options?.speedMultiplier ?? getDemoRideSpeedMultiplier();
  const distanceM = Math.max(distanceMeters, 100);
  const realMs = (distanceM / 1000 / speedKmh) * 3600 * 1000;
  return Math.max(minMs, Math.round(realMs / multiplier));
}

export function getSegmentTimeProgress(segment: {
  startedAtMs: number;
  durationMs: number;
}): number {
  return Math.min(
    1,
    Math.max(0, (Date.now() - segment.startedAtMs) / Math.max(segment.durationMs, 1))
  );
}

export function getSegmentEtaSeconds(
  segment: { startedAtMs: number; durationMs: number } | null | undefined
): number | null {
  if (!segment) return null;
  const remainingMs = segment.durationMs - (Date.now() - segment.startedAtMs);
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}

/** Posição ao longo do path conforme progresso temporal (não salta para geocode). */
export function positionAlongSegmentPath(segment: RideSegmentTiming): MapCoord {
  const progress = getSegmentTimeProgress(segment);
  if (progress >= 1) {
    return segment.path[segment.path.length - 1] ?? segment.target;
  }
  if (segment.path.length < 2) return segment.target;
  return pointAtPathProgress(segment.path, progress);
}

/**
 * Trecho concluído quando o tempo esgotou ou o motorista chegou ao fim da polyline.
 * Não exige que o fim OSRM coincida com o geocode do destino (rotas longas).
 */
export function shouldCompleteRideSegment(
  segment: RideSegmentTiming,
  currentPosition: MapCoord
): boolean {
  const progress = getSegmentTimeProgress(segment);
  const pathEnd = segment.path[segment.path.length - 1];
  if (!pathEnd) return progress >= 1;

  if (progress < 1) {
    if (haversineMeters(currentPosition, pathEnd) <= 80) return true;
    if (haversineMeters(currentPosition, segment.target) <= DRIVER_ARRIVING_THRESHOLD_M) {
      return true;
    }
    return false;
  }

  return true;
}

/** Restaura timing do segmento a partir da posição atual do motorista na polyline. */
export function buildSegmentTimingFromPath(
  path: RoutePoint[],
  currentPosition: MapCoord | null,
  options?: {
    minMs?: number;
    speedKmh?: number;
    speedMultiplier?: number;
  }
): { startedAtMs: number; durationMs: number } {
  const durationMs = computeSegmentDurationMs(pathTotalMeters(path), options);

  if (!currentPosition || path.length < 2) {
    return { startedAtMs: Date.now(), durationMs };
  }

  const { progress } = projectPointOnPath(path, currentPosition);
  const elapsedMs = Math.round(progress * durationMs);
  return {
    startedAtMs: Date.now() - elapsedMs,
    durationMs,
  };
}

/** Velocidade visual (m/s) para alcançar o alvo do servidor em rotas longas/aceleradas. */
export function adaptiveDriverCatchUpSpeedMps(
  distanceToTargetM: number,
  baseMps = 11,
  catchUpWindowSec = 1.1
): number {
  const abs = Math.abs(distanceToTargetM);
  if (abs <= 25) {
    return baseMps * Math.max(0.35, abs / 25);
  }
  if (abs > 30) {
    return Math.max(baseMps, abs / catchUpWindowSec);
  }
  return baseMps;
}
