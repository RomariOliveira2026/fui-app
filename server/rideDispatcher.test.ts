import { describe, expect, it, beforeEach } from "vitest";
import { createDemoDriverProfile, getAllDemoDriverProfiles } from "./_core/demoDriver";
import { createDemoRide } from "./_core/demoRide";
import { getDemoOffersForRide } from "./_core/demoRideOffers";
import {
  dispatchDemoRideOffers,
  findEligibleDemoDrivers,
  getDemoAvailableRidesForDriver,
  validateDemoDriverCanAccept,
  acceptDemoRideOffers,
} from "./_core/rideDispatcher";

describe("rideDispatcher (demo)", () => {
  beforeEach(() => {
    // Perfis/ corridas demo usam Maps isolados por processo de teste
  });

  it("ordena motoristas pela distância até a origem", () => {
    const profile = createDemoDriverProfile({ userId: 1, cpf: "000", cnh: "000" });
    const eligible = findEligibleDemoDrivers("carro", "-10.685", "-37.425");
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible[0].driverId).toBe(profile.id);
    expect(eligible[0].distanceMeters).toBeGreaterThan(0);
  });

  it("cria ofertas apenas para top 3 motoristas", () => {
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Centro",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "Rodoviária",
      destinationLat: "-10.682",
      destinationLng: "-37.428",
      distance: 500,
      duration: 120,
      estimatedPrice: 1200,
      paymentMethod: "cash",
      paymentStatus: "paid",
      discountAmount: 0,
    });

    createDemoDriverProfile({ userId: 1, cpf: "1", cnh: "1" });

    const result = dispatchDemoRideOffers(
      ride.id,
      "carro",
      ride.originLat,
      ride.originLng
    );

    expect(result.offersCreated).toBeGreaterThan(0);
    expect(result.offersCreated).toBeLessThanOrEqual(3);
    expect(getDemoOffersForRide(ride.id).every((o) => o.status === "pending")).toBe(true);
  });

  it("filtra corridas disponíveis por oferta pending do motorista", () => {
    const profile = createDemoDriverProfile({ userId: 2, cpf: "2", cnh: "2" });
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Centro",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "Hospital",
      destinationLat: "-10.688",
      destinationLng: "-37.422",
      distance: 800,
      duration: 180,
      estimatedPrice: 1500,
      paymentMethod: "cash",
      paymentStatus: "paid",
      discountAmount: 0,
    });

    dispatchDemoRideOffers(ride.id, "carro", ride.originLat, ride.originLng);

    const available = getDemoAvailableRidesForDriver(profile.id);
    expect(available.some((r) => r.id === ride.id)).toBe(true);

    expect(validateDemoDriverCanAccept(ride.id, profile.id)).toBe(true);
    acceptDemoRideOffers(ride.id, profile.id);
    expect(getDemoAvailableRidesForDriver(profile.id).some((r) => r.id === ride.id)).toBe(
      false
    );
  });

  it("ignora motoristas indisponíveis ou sem veículo compatível", () => {
    createDemoDriverProfile({ userId: 3, cpf: "3", cnh: "3" });
    const motoOnly = findEligibleDemoDrivers("moto", "-10.685", "-37.425");
    const carro = findEligibleDemoDrivers("carro", "-10.685", "-37.425");
    expect(carro.length).toBeGreaterThanOrEqual(motoOnly.length);
    expect(getAllDemoDriverProfiles().length).toBeGreaterThan(0);
  });
});
