import { describe, expect, it, vi } from "vitest";
import {
  buildSegmentTimingFromPath,
  computeSegmentDurationMs,
  getDemoRideSpeedMultiplier,
  positionAlongSegmentPath,
  shouldCompleteRideSegment,
} from "@shared/demoRideProgression";

describe("demoRideProgression", () => {
  it("acelera simulação com multiplicador configurável", () => {
    const distanceM = 50_000;
    const realTime = computeSegmentDurationMs(distanceM, { speedMultiplier: 1 });
    const fast = computeSegmentDurationMs(distanceM, { speedMultiplier: 10 });
    expect(fast).toBeLessThan(realTime / 8);
  });

  it("usa multiplicador 10 por padrão em BETA_DEMO", () => {
    expect(getDemoRideSpeedMultiplier({ betaDemo: "true" })).toBe(10);
    expect(getDemoRideSpeedMultiplier({ multiplier: "6" })).toBe(6);
  });

  it("mantém rota longa crível no modo médio", () => {
    const durationMs = computeSegmentDurationMs(65_000, {
      speedMultiplier: 60,
      mode: "medium",
    });
    expect(durationMs).toBeGreaterThanOrEqual(480_000);
  });

  it("permite modo curto sem cair para duração instantânea", () => {
    const durationMs = computeSegmentDurationMs(65_000, {
      speedMultiplier: 60,
      mode: "short",
    });
    expect(durationMs).toBeGreaterThanOrEqual(180_000);
  });

  it("avança posição ao longo de toda a polyline", () => {
    vi.useFakeTimers();
    const path = [
      { lat: -10.68, lng: -37.44 },
      { lat: -10.7, lng: -37.5 },
      { lat: -10.9, lng: -37.7 },
    ];
    const segment = {
      path,
      target: path[2]!,
      startedAtMs: Date.now(),
      durationMs: 10_000,
    };

    vi.advanceTimersByTime(5_000);
    const mid = positionAlongSegmentPath(segment);
    expect(mid.lat).toBeLessThan(path[0]!.lat);
    expect(mid.lat).toBeGreaterThan(path[2]!.lat);

    vi.advanceTimersByTime(6_000);
    const end = positionAlongSegmentPath(segment);
    expect(end.lat).toBeCloseTo(path[2]!.lat, 2);
    expect(shouldCompleteRideSegment(segment, end)).toBe(true);

    vi.useRealTimers();
  });

  it("restaura progresso a partir da posição atual", () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.1 },
      { lat: 0, lng: 0.2 },
    ];
    const timing = buildSegmentTimingFromPath(path, path[1]!, {
      minMs: 10_000,
      speedMultiplier: 1,
    });
    expect(timing.durationMs).toBeGreaterThan(0);
    expect(timing.startedAtMs).toBeLessThan(Date.now());
  });
});
