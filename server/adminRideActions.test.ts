import { describe, expect, it } from "vitest";
import { createDemoRide, getDemoRide } from "./_core/demoRide";
import {
  adminCancelRide,
  adminRedispatchRide,
  canAdminCancelRide,
  canAdminRedispatchRide,
} from "./_core/adminRideActions";
import { getDemoOffersForRide } from "./_core/demoRideOffers";
import { ensureDemoOperationalSeed } from "./_core/adminOperational";
import { createDemoDriverProfile } from "./_core/demoDriver";

describe("adminRideActions (demo)", () => {
  it("valida regras de cancelamento e re-dispatch", () => {
    expect(canAdminCancelRide("requested")).toBe(true);
    expect(canAdminCancelRide("completed")).toBe(false);
    expect(canAdminRedispatchRide("requested", null)).toBe(true);
    expect(canAdminRedispatchRide("accepted", null)).toBe(false);
  });

  it("cancela corrida demo e expira ofertas", async () => {
    ensureDemoOperationalSeed();
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

    await adminRedispatchRide(ride.id, true);
    expect(getDemoOffersForRide(ride.id).some((o) => o.status === "pending")).toBe(true);

    await adminCancelRide(ride.id, 1, "Teste admin");
    const updated = getDemoRide(ride.id);
    expect(updated?.status).toBe("cancelled");
    expect(getDemoOffersForRide(ride.id).every((o) => o.status !== "pending")).toBe(true);
  });

  it("reenfileira corrida requested com nova rodada", async () => {
    ensureDemoOperationalSeed();
    createDemoDriverProfile({ userId: 20, cpf: "20", cnh: "20" });
    createDemoDriverProfile({ userId: 21, cpf: "21", cnh: "21" });
    createDemoDriverProfile({ userId: 22, cpf: "22", cnh: "22" });
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Hospital, Itabaiana - SE",
      originLat: "-10.684",
      originLng: "-37.426",
      destinationAddress: "UFS Campus, Itabaiana - SE",
      destinationLat: "-10.681",
      destinationLng: "-37.430",
      paymentMethod: "cash",
      status: "requested",
    });

    const first = await adminRedispatchRide(ride.id, true);
    expect(first.offersCreated).toBeGreaterThan(0);
    expect(first.offerRound).toBe(1);

    const second = await adminRedispatchRide(ride.id, true);
    expect(second.offerRound).toBe(2);
    expect(second.offersCreated).toBeGreaterThan(0);
  });
});
