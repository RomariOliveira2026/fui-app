import { haversineMeters } from "./demoMaps";

export type RoutePoint = { lat: number; lng: number };

const DEFAULT_STEP_METERS = 12;
const APPROACH_STEP_METERS = 12;

/** Distância acumulada (m) até cada vértice; cumDist[0] = 0. */
export function cumulativePathDistances(path: RoutePoint[]): number[] {
  if (path.length === 0) return [];
  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    cum.push(cum[i - 1]! + haversineMeters(path[i - 1]!, path[i]!));
  }
  return cum;
}

export function pathTotalMeters(path: RoutePoint[]): number {
  const cum = cumulativePathDistances(path);
  return cum[cum.length - 1] ?? 0;
}

/** Insere pontos intermediários para animação suave ao longo da rota. */
export function densifyPath(path: RoutePoint[], maxStepMeters = DEFAULT_STEP_METERS): RoutePoint[] {
  if (path.length < 2) return path.slice();

  const out: RoutePoint[] = [path[0]!];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const segM = haversineMeters(a, b);
    if (segM <= maxStepMeters) {
      out.push(b);
      continue;
    }
    const steps = Math.ceil(segM / maxStepMeters);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
  }
  return out;
}

function projectPointOnSegment(a: RoutePoint, b: RoutePoint, p: RoutePoint): RoutePoint {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0) return a;
  let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return { lat: a.lat + t * dy, lng: a.lng + t * dx };
}

export type PathProjection = {
  point: RoutePoint;
  /** Distância percorrida desde o início do path (m). */
  meters: number;
  /** Progresso normalizado 0–1. */
  progress: number;
};

/** Projeta um ponto sobre o segmento mais próximo da polyline (trilho obrigatório). */
export function projectPointOnPath(path: RoutePoint[], point: RoutePoint): PathProjection {
  if (path.length === 0) {
    return { point, meters: 0, progress: 0 };
  }
  if (path.length === 1) {
    return { point: path[0]!, meters: 0, progress: 0 };
  }

  const cum = cumulativePathDistances(path);
  const total = cum[cum.length - 1] ?? 0;

  let bestDist = Infinity;
  let bestPoint = path[0]!;
  let bestMeters = 0;

  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const proj = projectPointOnSegment(a, b, point);
    const d = haversineMeters(point, proj);
    if (d < bestDist) {
      bestDist = d;
      bestPoint = proj;
      const segStart = cum[i - 1]!;
      const segLen = Math.max(cum[i]! - segStart, 0.001);
      const alongSeg = haversineMeters(a, proj);
      bestMeters = segStart + Math.min(alongSeg, segLen);
    }
  }

  return {
    point: bestPoint,
    meters: bestMeters,
    progress: total > 0 ? bestMeters / total : 0,
  };
}

/** Posição exata a uma distância (m) do início da rota. */
export function pointAtPathMeters(path: RoutePoint[], meters: number): RoutePoint {
  const total = pathTotalMeters(path);
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (total <= 0) return path[0]!;
  return pointAtPathProgress(path, Math.max(0, Math.min(1, meters / total)));
}

/** Progresso 0–1 ao longo do comprimento da rota. */
export function pointAtPathProgress(path: RoutePoint[], progress: number): RoutePoint {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (path.length === 1 || progress <= 0) return path[0]!;
  if (progress >= 1) return path[path.length - 1]!;

  const total = pathTotalMeters(path);
  if (total <= 0) return path[0]!;

  const targetM = progress * total;
  const cum = cumulativePathDistances(path);

  for (let i = 1; i < path.length; i++) {
    const endM = cum[i]!;
    if (targetM <= endM) {
      const startM = cum[i - 1]!;
      const segM = endM - startM;
      const t = segM > 0 ? (targetM - startM) / segM : 0;
      const a = path[i - 1]!;
      const b = path[i]!;
      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      };
    }
  }
  return path[path.length - 1]!;
}

/** @deprecated Preferir projectPointOnPath para snap preciso na polyline. */
export function progressAtNearestPoint(path: RoutePoint[], point: RoutePoint): number {
  return projectPointOnPath(path, point).progress;
}

/** Distância restante (m) do ponto ao fim do path, medida ao longo da rota. */
export function remainingMetersAlongPath(path: RoutePoint[], point: RoutePoint): number {
  const total = pathTotalMeters(path);
  if (total <= 0) return 0;
  const { meters } = projectPointOnPath(path, point);
  return Math.max(0, total - meters);
}

/**
 * Prefixo da rota percorrido de trás para frente — motorista se aproxima
 * pela mesma geometria da via, sem linha reta atravessando quarteirões.
 */
function buildApproachAlongRoutePrefix(tripPath: RoutePoint[], offsetMeters: number): RoutePoint[] {
  const densified = densifyPath(tripPath, APPROACH_STEP_METERS);
  if (densified.length < 2) return densified;

  const cum = cumulativePathDistances(densified);
  const total = cum[cum.length - 1] ?? 0;
  const reach = Math.min(offsetMeters, total * 0.45);

  let endIdx = 0;
  for (let i = 0; i < cum.length; i++) {
    if (cum[i]! <= reach) endIdx = i;
    else break;
  }

  const prefix = densified.slice(0, endIdx + 1);
  if (prefix.length < 2) return densified;

  const reversed = [...prefix].reverse();
  return densifyPath(reversed, APPROACH_STEP_METERS);
}

export type DriverPhase = "to_pickup" | "to_destination";

export function buildDriverPhasePath(
  tripPath: RoutePoint[],
  phase: DriverPhase,
  options?: { pickupOffsetMeters?: number; currentPosition?: RoutePoint | null }
): RoutePoint[] {
  const densified = densifyPath(tripPath, APPROACH_STEP_METERS);

  if (phase === "to_destination") {
    return densified;
  }

  const approach = buildApproachAlongRoutePrefix(
    densified,
    options?.pickupOffsetMeters ?? 900
  );

  if (options?.currentPosition && approach.length >= 2) {
    const { meters } = projectPointOnPath(approach, options.currentPosition);
    const startM = Math.max(0, meters - 30);
    const start = pointAtPathMeters(approach, startM);
    const { meters: startSnap } = projectPointOnPath(approach, start);
    return trimPathFromMeters(approach, startSnap);
  }

  return approach;
}

/** Recorta o path a partir de uma distância acumulada (m), mantendo geometria da rota. */
export function trimPathFromMeters(path: RoutePoint[], fromMeters: number): RoutePoint[] {
  if (path.length < 2 || fromMeters <= 0) return path;

  const cum = cumulativePathDistances(path);
  const start = pointAtPathMeters(path, fromMeters);

  for (let i = 1; i < path.length; i++) {
    if (cum[i]! >= fromMeters) {
      const tail = path.slice(i);
      if (haversineMeters(start, tail[0]!) > 2) {
        return densifyPath([start, ...tail], APPROACH_STEP_METERS);
      }
      return densifyPath([start, ...tail.slice(1)], APPROACH_STEP_METERS);
    }
  }
  return densifyPath([start], APPROACH_STEP_METERS);
}

/** Rota base síncrona (fallback) quando não há OSRM em cache. */
export function buildFallbackTripPath(origin: RoutePoint, destination: RoutePoint): RoutePoint[] {
  return densifyPath([origin, destination], APPROACH_STEP_METERS);
}

/** Velocidade visual linear recomendada (~40 km/h). */
export const DRIVER_VISUAL_SPEED_MPS = 11;

/** Desaceleração suave nos últimos metros do trecho. */
export function linearSpeedAtMeters(remainingMeters: number, baseMps = DRIVER_VISUAL_SPEED_MPS): number {
  if (remainingMeters <= 25) {
    return baseMps * Math.max(0.35, remainingMeters / 25);
  }
  return baseMps;
}
