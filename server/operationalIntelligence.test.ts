import { describe, expect, it } from "vitest";
import { createDemoRide } from "./_core/demoRide";
import {
  buildOperationalIntelligenceReport,
  resolvePeriodRange,
} from "./_core/operationalIntelligence";

describe("operationalIntelligence 7.2", () => {
  it("agrupa zonas, comparações e alertas", () => {
    const rides = [
      createDemoRide({
        passengerId: 1,
        vehicleType: "carro",
        originAddress: "Centro, Itabaiana - SE",
        originLat: "-10.685",
        originLng: "-37.425",
        destinationAddress: "Rodoviária, Itabaiana - SE",
        destinationLat: "-10.682",
        destinationLng: "-37.428",
        paymentMethod: "cash",
        status: "completed",
        driverId: 1,
      }),
      createDemoRide({
        passengerId: 1,
        vehicleType: "moto",
        originAddress: "Centro, Itabaiana - SE",
        originLat: "-10.685",
        originLng: "-37.425",
        destinationAddress: "Hospital, Itabaiana - SE",
        destinationLat: "-10.688",
        destinationLng: "-37.422",
        paymentMethod: "cash",
        status: "requested",
      }),
      createDemoRide({
        passengerId: 1,
        vehicleType: "carro",
        originAddress: "Rodoviária, Itabaiana - SE",
        originLat: "-10.682",
        originLng: "-37.428",
        destinationAddress: "UFS Campus, Itabaiana - SE",
        destinationLat: "-10.691",
        destinationLng: "-37.418",
        paymentMethod: "cash",
        status: "completed",
        driverId: 2,
      }),
    ];

    const report = buildOperationalIntelligenceReport(rides, { preset: "7d" });
    expect(report.totalRidesAnalyzed).toBe(3);
    expect(report.demandZones[0]?.areaLabel).toBe("Centro");
    expect(report.demandPoints[0]?.tier).toBeDefined();
    expect(report.insights.length).toBeGreaterThanOrEqual(5);
    expect(report.positioning.length).toBeGreaterThan(0);
    expect(report.comparisons).toHaveLength(2);
    expect(report.trend).toBeDefined();
    expect(Array.isArray(report.alerts)).toBe(true);
  });

  it("filtra por período ontem vs 7 dias", () => {
    const old = createDemoRide({
      passengerId: 1,
      vehicleType: "carro",
      originAddress: "Centro, Itabaiana - SE",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "Destino",
      destinationLat: "-10.682",
      destinationLng: "-37.428",
      paymentMethod: "cash",
    });
    const patched = { ...old, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) };

    const recent = buildOperationalIntelligenceReport([old], { preset: "7d" });
    const oldOnly = buildOperationalIntelligenceReport([patched], { preset: "7d" });

    expect(recent.totalRidesAnalyzed).toBe(1);
    expect(oldOnly.totalRidesAnalyzed).toBe(0);
  });

  it("resolve períodos customizados", () => {
    const range = resolvePeriodRange({
      preset: "custom",
      from: "2025-01-01",
      to: "2025-01-31",
    });
    expect(range.label).toBe("Período personalizado");
    expect(range.start.getTime()).toBeLessThan(range.end.getTime());
  });
});
