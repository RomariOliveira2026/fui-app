import { describe, expect, it } from "vitest";
import { createDemoDriverProfile } from "./_core/demoDriver";
import {
  computeDriverDispatchScore,
  sortDriversByDispatchScore,
} from "./_core/driverDispatcherScore";
import type { DispatcherEligibleDriver } from "@shared/rideDispatcher";

describe("driverDispatcherScore", () => {
  it("prioriza motorista disponível e mais próximo", () => {
    const near = createDemoDriverProfile({ userId: 801, cpf: "801", cnh: "801" });
    const far = createDemoDriverProfile({ userId: 802, cpf: "802", cnh: "802" });

    const drivers: DispatcherEligibleDriver[] = [
      { driverId: far.id, lat: -10.7, lng: -37.45, distanceMeters: 5000 },
      { driverId: near.id, lat: -10.685, lng: -37.425, distanceMeters: 200 },
    ];

    const sorted = sortDriversByDispatchScore(drivers, "carro");
    expect(sorted[0]?.driverId).toBe(near.id);
  });

  it("penaliza motorista com serviço desabilitado", () => {
    const profile = createDemoDriverProfile({ userId: 803, cpf: "803", cnh: "803" });
    const withService = computeDriverDispatchScore({
      driverId: profile.id,
      distanceMeters: 500,
      vehicleType: "carro",
      isAvailable: true,
    });
    expect(withService).toBeGreaterThan(40);
  });
});
