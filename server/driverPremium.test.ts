import { describe, expect, it } from "vitest";
import { createDemoDriverProfile } from "./_core/demoDriver";
import { createDemoRide, updateDemoRide } from "./_core/demoRide";
import { createDemoDeliveryOrder } from "./_core/demoDelivery";
import {
  shouldDriverReceiveOffer,
  updateDemoDriverPremiumPrefs,
} from "./_core/demoDriverPremium";
import { buildDriverEarningsSummary, buildDriverStatement } from "./_core/driverEarnings";
import {
  dispatchDemoRideOffers,
  findEligibleDemoDrivers,
  getDemoAvailableRidesForDriver,
} from "./_core/rideDispatcher";

describe("driverPremium (demo)", () => {
  it("bloqueia ofertas com pausa inteligente ativa", () => {
    const profile = createDemoDriverProfile({ userId: 901, cpf: "901", cnh: "901" });
    updateDemoDriverPremiumPrefs(profile.id, { smartPause: true });

    expect(shouldDriverReceiveOffer(profile.id, "carro", "ride")).toBe(false);
    const eligible = findEligibleDemoDrivers("carro", "-10.685", "-37.425");
    expect(eligible.some((d) => d.driverId === profile.id)).toBe(false);
  });

  it("respeita filtro de tipo de veículo", () => {
    const profile = createDemoDriverProfile({ userId: 902, cpf: "902", cnh: "902" });
    updateDemoDriverPremiumPrefs(profile.id, {
      serviceFilters: {
        ride: true,
        delivery: true,
        moto: false,
        carro: true,
        van: true,
        utilitario: true,
      },
    });

    expect(shouldDriverReceiveOffer(profile.id, "moto", "ride")).toBe(false);
    expect(shouldDriverReceiveOffer(profile.id, "carro", "ride")).toBe(true);
  });

  it("respeita filtro de corrida vs entrega", () => {
    const profile = createDemoDriverProfile({ userId: 903, cpf: "903", cnh: "903" });
    updateDemoDriverPremiumPrefs(profile.id, {
      serviceFilters: {
        ride: false,
        delivery: true,
        moto: true,
        carro: true,
        van: true,
        utilitario: true,
      },
    });

    expect(shouldDriverReceiveOffer(profile.id, "carro", "ride")).toBe(false);
    expect(shouldDriverReceiveOffer(profile.id, "carro", "delivery")).toBe(true);
  });

  it("oculta corridas disponíveis quando filtro desabilita o veículo", () => {
    const profile = createDemoDriverProfile({ userId: 904, cpf: "904", cnh: "904" });
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

    dispatchDemoRideOffers(ride.id, "carro", ride.originLat, ride.originLng);
    expect(getDemoAvailableRidesForDriver(profile.id).some((r) => r.id === ride.id)).toBe(true);

    updateDemoDriverPremiumPrefs(profile.id, {
      serviceFilters: {
        ride: true,
        delivery: true,
        moto: true,
        carro: false,
        van: true,
        utilitario: true,
      },
    });
    expect(getDemoAvailableRidesForDriver(profile.id).some((r) => r.id === ride.id)).toBe(false);
  });

  it("agrega ganhos e extrato com corridas e entregas", () => {
    const profile = createDemoDriverProfile({ userId: 905, cpf: "905", cnh: "905" });
    const now = new Date();
    const ride = updateDemoRide(
      createDemoRide({
        passengerId: 0,
        vehicleType: "carro",
        originAddress: "A",
        originLat: "-10.685",
        originLng: "-37.425",
        destinationAddress: "B",
        destinationLat: "-10.682",
        destinationLng: "-37.428",
        distance: 500,
        duration: 120,
        estimatedPrice: 2000,
        finalPrice: 2000,
        paymentMethod: "cash",
        paymentStatus: "paid",
        discountAmount: 0,
        driverId: profile.id,
        status: "completed",
      }).id,
      { completedAt: now, finalPrice: 2000 }
    )!;

    const delivery = createDemoDeliveryOrder({
      senderId: 1,
      driverId: profile.id,
      status: "delivered",
      pickupAddress: "Loja",
      pickupLat: "-10.685",
      pickupLng: "-37.425",
      deliveryAddress: "Cliente",
      deliveryLat: "-10.682",
      deliveryLng: "-37.428",
      recipientName: "João",
      recipientPhone: "79999999999",
      packageType: "document",
      estimatedPrice: 1500,
      finalPrice: 1500,
      paymentMethod: "cash",
      deliveredAt: now,
    });

    const summary = buildDriverEarningsSummary([ride], [delivery]);
    expect(summary.todayTotalCents).toBe(3500);
    expect(summary.todayRideCount).toBe(1);
    expect(summary.todayDeliveryCount).toBe(1);

    const statement = buildDriverStatement([ride], [delivery]);
    expect(statement).toHaveLength(2);
    expect(statement.some((s) => s.type === "delivery")).toBe(true);
  });
});
