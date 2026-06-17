import { describe, expect, it } from "vitest";
import {
  computeSegmentDurationMs,
  getSegmentEtaSeconds,
  positionAlongSegmentPath,
  shouldCompleteRideSegment,
} from "@shared/demoRideProgression";
import { buildDriverPhasePath, densifyPath, pathTotalMeters } from "@shared/routeAnimation";

/** Itabaiana (centro) → Aracaju (aprox.) — ~57 km em linha reta; OSRM real é maior. */
const ITABAIANA = { lat: -10.685, lng: -37.425 };
const ARACAJU = { lat: -10.947, lng: -37.073 };

function buildSyntheticLongRoute(): ReturnType<typeof densifyPath> {
  const points = Array.from({ length: 200 }, (_, i) => {
    const t = i / 199;
    return {
      lat: ITABAIANA.lat + (ARACAJU.lat - ITABAIANA.lat) * t,
      lng: ITABAIANA.lng + (ARACAJU.lng - ITABAIANA.lng) * t,
    };
  });
  return densifyPath(points, 12);
}

describe("corrida longa Itabaiana → Aracaju", () => {
  it("percorre rota completa com ETA decrescente e conclusão no destino", () => {
    const tripPath = buildSyntheticLongRoute();
    const distanceM = pathTotalMeters(tripPath);
    expect(distanceM).toBeGreaterThan(45_000);

    const path = buildDriverPhasePath(tripPath, "to_destination", {
      currentPosition: ITABAIANA,
    });
    const durationMs = computeSegmentDurationMs(pathTotalMeters(path), {
      speedMultiplier: 10,
      minMs: 5_000,
    });

    const segment = {
      path,
      target: ARACAJU,
      startedAtMs: Date.now(),
      durationMs,
    };

    const etaStart = getSegmentEtaSeconds(segment)!;
    expect(etaStart).toBeGreaterThan(60);
    expect(etaStart).toBeLessThan(1200);

    const midTime = Date.now() + Math.round(durationMs * 0.4);
    const midSegment = { ...segment, startedAtMs: midTime - Math.round(durationMs * 0.4) };
    const midPos = positionAlongSegmentPath({
      ...midSegment,
      startedAtMs: Date.now() - Math.round(durationMs * 0.4),
    });
    expect(midPos.lat).toBeLessThan(ITABAIANA.lat);
    expect(midPos.lat).toBeGreaterThan(ARACAJU.lat);

    const etaMid = getSegmentEtaSeconds({
      ...segment,
      startedAtMs: Date.now() - Math.round(durationMs * 0.4),
    })!;
    expect(etaMid).toBeLessThan(etaStart);

    const endSegment = {
      ...segment,
      startedAtMs: Date.now() - durationMs - 1_000,
    };
    const endPos = positionAlongSegmentPath(endSegment);
    expect(shouldCompleteRideSegment(endSegment, endPos)).toBe(true);
    expect(endPos.lat).toBeCloseTo(path[path.length - 1]!.lat, 2);
  });
});
