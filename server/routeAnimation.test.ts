import { describe, expect, it } from "vitest";
import {
  buildDriverPhasePath,
  densifyPath,
  pathTotalMeters,
  pointAtPathMeters,
  pointAtPathProgress,
  projectPointOnPath,
  progressAtNearestPoint,
  remainingMetersAlongPath,
} from "@shared/routeAnimation";

const ORIGIN = { lat: -10.685, lng: -37.425 };
const MID = { lat: -10.6865, lng: -37.4235 };
const DEST = { lat: -10.688, lng: -37.422 };

describe("routeAnimation", () => {
  it("densifica segmentos longos", () => {
    const dense = densifyPath([ORIGIN, DEST], 50);
    expect(dense.length).toBeGreaterThan(2);
  });

  it("interpola ao longo do path por distância acumulada", () => {
    const path = densifyPath([ORIGIN, MID, DEST], 30);
    const total = pathTotalMeters(path);
    const mid = pointAtPathMeters(path, total / 2);
    const remaining = remainingMetersAlongPath(path, mid);
    expect(Math.abs(remaining - total / 2)).toBeLessThan(total * 0.12);
  });

  it("projeta ponto sobre segmento mais próximo (não vértice distante)", () => {
    const path = densifyPath([ORIGIN, MID, DEST], 20);
    const between = pointAtPathProgress(path, 0.5);
    const proj = projectPointOnPath(path, between);
    expect(proj.meters).toBeGreaterThan(0);
    expect(Math.abs(proj.progress - 0.5)).toBeLessThan(0.08);
  });

  it("monta path de pickup pela geometria da rota (sem extensão em linha reta)", () => {
    const trip = densifyPath([ORIGIN, MID, DEST]);
    const pickup = buildDriverPhasePath(trip, "to_pickup");
    expect(pickup.length).toBeGreaterThan(2);
    expect(progressAtNearestPoint(pickup, ORIGIN)).toBeGreaterThan(0.92);
    expect(haversineLike(pickup[pickup.length - 1]!, ORIGIN)).toBeLessThan(20);
    const firstLeg = haversineLike(pickup[0]!, pickup[1]!);
    expect(firstLeg).toBeLessThan(80);
  });

  it("progresso cresce monotonicamente ao longo do path", () => {
    const path = densifyPath([ORIGIN, MID, DEST], 25);
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const p = projectPointOnPath(path, pointAtPathProgress(path, i / 10)).progress;
      expect(p).toBeGreaterThanOrEqual(prev - 0.05);
      prev = p;
    }
  });
});

function haversineLike(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}
