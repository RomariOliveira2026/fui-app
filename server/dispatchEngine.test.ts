import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoRide } from "./_core/demoRide";
import { createDemoDriverProfile } from "./_core/demoDriver";
import {
  getDemoOffersForRide,
  getDemoMaxOfferRound,
} from "./_core/demoRideOffers";
import { dispatchDemoRideOffers } from "./_core/rideDispatcher";
import {
  buildDemoDispatchMeta,
  processDispatchForDemoRide,
} from "./_core/dispatchEngine";

describe("dispatchEngine (demo)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env.DISPATCHER_OFFER_TIMEOUT_MS = "5000";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.DISPATCHER_OFFER_TIMEOUT_MS;
  });

  it("expira ofertas pendentes após timeout", () => {
    createDemoDriverProfile({ userId: 10, cpf: "10", cnh: "10" });
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
    expect(getDemoOffersForRide(ride.id).every((o) => o.status === "pending")).toBe(true);

    vi.advanceTimersByTime(6_000);
    processDispatchForDemoRide(ride.id);

    const offers = getDemoOffersForRide(ride.id);
    expect(offers.some((o) => o.status === "expired")).toBe(true);
  });

  it("avança para rodada 2 quando rodada 1 expira sem aceite", () => {
    createDemoDriverProfile({ userId: 11, cpf: "11", cnh: "11" });
    createDemoDriverProfile({ userId: 12, cpf: "12", cnh: "12" });
    createDemoDriverProfile({ userId: 13, cpf: "13", cnh: "13" });
    createDemoDriverProfile({ userId: 14, cpf: "14", cnh: "14" });

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

    dispatchDemoRideOffers(ride.id, "carro", ride.originLat, ride.originLng, { offerRound: 1 });
    const round1 = getDemoMaxOfferRound(ride.id);
    expect(round1).toBe(1);

    vi.advanceTimersByTime(6_000);
    const advanced = processDispatchForDemoRide(ride.id);
    expect(advanced).toBe(true);

    const offers = getDemoOffersForRide(ride.id);
    expect(offers.some((o) => o.offerRound === 2 && o.status === "pending")).toBe(true);
  });

  it("expõe metadados de rodada ao passageiro", () => {
    createDemoDriverProfile({ userId: 15, cpf: "15", cnh: "15" });
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "Centro",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "UFS",
      destinationLat: "-10.681",
      destinationLng: "-37.430",
      paymentMethod: "cash",
      status: "requested",
    });

    dispatchDemoRideOffers(ride.id, "carro", ride.originLat, ride.originLng);
    const meta = buildDemoDispatchMeta(ride.id);
    expect(meta.currentRound).toBe(1);
    expect(meta.pendingOffers).toBeGreaterThan(0);
    expect(meta.dispatchAttempts).toBeGreaterThanOrEqual(1);
  });
});
