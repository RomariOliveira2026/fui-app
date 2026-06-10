import { describe, expect, it } from "vitest";
import { getDemoOperationalOverview, ensureDemoOperationalSeed } from "./_core/adminOperational";
import { createDemoRide } from "./_core/demoRide";

describe("adminOperational (demo)", () => {
  it("retorna motoristas seed e métricas", () => {
    ensureDemoOperationalSeed();
    const overview = getDemoOperationalOverview();
    expect(overview.drivers.length).toBeGreaterThanOrEqual(3);
    expect(overview.metrics.driversAvailable).toBeGreaterThanOrEqual(0);
  });

  it("inclui corridas demo no overview", () => {
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Centro, Itabaiana - SE",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "Rodoviária, Itabaiana - SE",
      destinationLat: "-10.682",
      destinationLng: "-37.428",
      paymentMethod: "cash",
      status: "requested",
    });

    const overview = getDemoOperationalOverview();
    expect(overview.rides.some((r) => r.id === ride.id)).toBe(true);
    expect(overview.metrics.pendingRides).toBeGreaterThanOrEqual(1);
  });
});
