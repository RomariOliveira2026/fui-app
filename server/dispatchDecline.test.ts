import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { createDemoDriverProfile } from "./_core/demoDriver";
import { createDemoRide } from "./_core/demoRide";
import {
  driverHasDemoPendingOffer,
  getDemoOffersForRide,
} from "./_core/demoRideOffers";
import {
  declineDemoRideOfferForDriver,
  dispatchDemoRideOffers,
  getDemoAvailableRidesForDriver,
} from "./_core/rideDispatcher";
import { processDispatchForDemoRide } from "./_core/dispatchEngine";

describe("dispatcher decline (demo)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env.DISPATCHER_OFFER_TIMEOUT_MS = "60000";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.DISPATCHER_OFFER_TIMEOUT_MS;
  });

  it("marca oferta como declined e remove do dashboard", () => {
    const profile = createDemoDriverProfile({ userId: 30, cpf: "30", cnh: "30" });
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Centro",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "Rodoviária",
      destinationLat: "-10.682",
      destinationLng: "-37.428",
      paymentMethod: "cash",
      status: "requested",
    });

    dispatchDemoRideOffers(ride.id, "carro", ride.originLat, ride.originLng);
    expect(driverHasDemoPendingOffer(ride.id, profile.id)).toBe(true);

    const declined = declineDemoRideOfferForDriver(ride.id, profile.id);
    expect(declined).toBe(true);
    expect(driverHasDemoPendingOffer(ride.id, profile.id)).toBe(false);
    expect(
      getDemoOffersForRide(ride.id).find((o) => o.driverId === profile.id)?.status
    ).toBe("declined");
    expect(getDemoAvailableRidesForDriver(profile.id).some((r) => r.id === ride.id)).toBe(
      false
    );
  });

  it("não reoferta motorista que recusou na mesma rodada ampliada", () => {
    const profile = createDemoDriverProfile({ userId: 31, cpf: "31", cnh: "31" });
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Centro",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "Hospital",
      destinationLat: "-10.688",
      destinationLng: "-37.422",
      paymentMethod: "cash",
      status: "requested",
    });

    dispatchDemoRideOffers(ride.id, "carro", ride.originLat, ride.originLng, {
      offerRound: 3,
      expandPool: true,
    });
    declineDemoRideOfferForDriver(ride.id, profile.id);
    processDispatchForDemoRide(ride.id);

    const offers = getDemoOffersForRide(ride.id).filter((o) => o.driverId === profile.id);
    expect(offers.every((o) => o.status !== "pending")).toBe(true);
  });
});
