import { describe, expect, it, beforeEach } from "vitest";
import { evaluateUtilityProviderMatch } from "@shared/utilityDispatcher";
import { buildDefaultUtilityProviderProfile } from "@shared/utilityProvider";
import { createInitialUtilityMeta } from "@shared/utilities";
import type { UtilityOrder } from "@shared/utilities";
import {
  acceptDemoUtilityOrder,
  advanceDemoUtilityStatusForDriver,
  createDemoUtilityOrder,
  resetDemoUtilityOrdersForTests,
} from "./_core/demoUtilities";
import {
  declineDemoUtilityOffer,
  getDemoUtilityOffersForOrder,
  resetDemoUtilityOffersForTests,
} from "./_core/demoUtilityOffers";
import {
  hydrateDemoUtilityProviderProfiles,
  getDemoUtilityProviderProfile,
  resetDemoUtilityProviderProfilesForTests,
  updateDemoUtilityProviderProfile,
} from "./_core/demoUtilityProvider";
import {
  createUtilityOffers,
  getAvailableUtilityOrdersForProvider,
  isOrderCompatibleWithProvider,
} from "./_core/utilityDispatcher";
import { buildUtilityProviderEarnings } from "./_core/utilityProviderOps";

const DRIVER_ID = 800_001;

function baseOrder(overrides: Partial<UtilityOrder> = {}): UtilityOrder {
  const now = new Date().toISOString();
  return {
    id: 850_100,
    senderId: 1,
    driverId: null,
    serviceType: "freight_fast",
    status: "waiting_driver",
    originAddress: "Centro, Itabaiana - SE",
    originLat: "-10.685",
    originLng: "-37.425",
    destinationAddress: "Rodoviária, Itabaiana - SE",
    destinationLat: "-10.682",
    destinationLng: "-37.428",
    cargo: { estimatedWeightKg: 50, estimatedVolumeM3: 1 },
    extras: { needsHelper: false },
    vehicleType: "pickup",
    vehicleAutoSuggested: true,
    paymentMethod: "pix",
    distance: 1200,
    duration: 300,
    quote: null,
    estimatedPrice: 8_000,
    finalPrice: null,
    paymentStatus: "pending",
    utilityMeta: createInitialUtilityMeta("waiting_driver"),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

describe("utilityDispatcher (demo)", () => {
  beforeEach(() => {
    resetDemoUtilityOrdersForTests();
    resetDemoUtilityOffersForTests();
    resetDemoUtilityProviderProfilesForTests();
  });

  it("frete rápido compatível com van e perfil ativo", () => {
    const profile = buildDefaultUtilityProviderProfile(DRIVER_ID);
    profile.vehicleType = "van";
    profile.acceptsFreight = true;
    profile.isActive = true;

    const order = baseOrder();
    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters: 500,
    });
    expect(match.compatible).toBe(true);
  });

  it("mudança pequena não aparece para utilitário leve", () => {
    const profile = buildDefaultUtilityProviderProfile(DRIVER_ID);
    profile.vehicleType = "light_utility";
    profile.acceptsSmallMove = true;

    const order = baseOrder({
      serviceType: "small_move",
      vehicleType: "van",
    });
    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters: 500,
    });
    expect(match.compatible).toBe(false);
    expect(match.reasons).toContain("vehicle_not_allowed");
  });

  it("pedido fora do raio não é ofertado", () => {
    const profile = buildDefaultUtilityProviderProfile(DRIVER_ID);
    profile.serviceRadiusKm = 5;

    const order = baseOrder();
    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters: 12_000,
    });
    expect(match.compatible).toBe(false);
    expect(match.reasons).toContain("out_of_radius");
  });

  it("createUtilityOffers gera oferta para prestador compatível", () => {
    hydrateDemoUtilityProviderProfiles([
      {
        ...buildDefaultUtilityProviderProfile(DRIVER_ID),
        vehicleType: "van",
        acceptsFreight: true,
        isActive: true,
      },
    ]);

    const order = createDemoUtilityOrder({
      ...baseOrder(),
      utilityMeta: createInitialUtilityMeta("waiting_driver"),
    });

    createUtilityOffers(order);
    const offers = getDemoUtilityOffersForOrder(order.id);
    expect(offers.some((o) => o.driverId === DRIVER_ID && o.status === "pending")).toBe(true);
  });

  it("prestador incompatível não recebe oferta", () => {
    hydrateDemoUtilityProviderProfiles([
      {
        ...buildDefaultUtilityProviderProfile(DRIVER_ID),
        vehicleType: "light_utility",
        acceptsFreight: true,
        acceptsBulkyCargo: false,
        isActive: true,
      },
    ]);

    const order = createDemoUtilityOrder({
      ...baseOrder({
        serviceType: "bulky_cargo",
        vehicleType: "small_truck",
        cargo: { estimatedWeightKg: 600, estimatedVolumeM3: 8 },
      }),
      utilityMeta: createInitialUtilityMeta("waiting_driver"),
    });

    createUtilityOffers(order);
    const offers = getDemoUtilityOffersForOrder(order.id);
    expect(offers.filter((o) => o.driverId === DRIVER_ID)).toHaveLength(0);
  });

  it("aceitar pedido sincroniza ofertas", () => {
    hydrateDemoUtilityProviderProfiles([
      {
        ...buildDefaultUtilityProviderProfile(DRIVER_ID),
        isActive: true,
      },
    ]);

    const order = createDemoUtilityOrder({
      ...baseOrder(),
      utilityMeta: createInitialUtilityMeta("waiting_driver"),
    });
    createUtilityOffers(order);

    const accepted = acceptDemoUtilityOrder(order.id, DRIVER_ID);
    expect(accepted?.status).toBe("accepted");
    expect(getAvailableUtilityOrdersForProvider(DRIVER_ID)).toHaveLength(0);
  });

  it("recusar pedido remove da lista do prestador", () => {
    hydrateDemoUtilityProviderProfiles([
      {
        ...buildDefaultUtilityProviderProfile(DRIVER_ID),
        isActive: true,
      },
    ]);

    const order = createDemoUtilityOrder({
      ...baseOrder(),
      utilityMeta: createInitialUtilityMeta("waiting_driver"),
    });
    createUtilityOffers(order);

    declineDemoUtilityOffer(order.id, DRIVER_ID);
    expect(getAvailableUtilityOrdersForProvider(DRIVER_ID)).toHaveLength(0);
  });

  it("concluir pedido atualiza ganhos do prestador", () => {
    const order = createDemoUtilityOrder({
      ...baseOrder({ estimatedPrice: 10_000 }),
      driverId: DRIVER_ID,
      status: "arriving",
      utilityMeta: createInitialUtilityMeta("arriving"),
    });

    advanceDemoUtilityStatusForDriver(order.id, DRIVER_ID);

    const earnings = buildUtilityProviderEarnings(DRIVER_ID);
    expect(earnings.todayCount).toBe(1);
    expect(earnings.todayNetCents).toBe(8_500);
  });

  it("alteração de perfil afeta matching", () => {
    hydrateDemoUtilityProviderProfiles([
      {
        ...buildDefaultUtilityProviderProfile(DRIVER_ID),
        acceptsFreight: false,
        isActive: true,
      },
    ]);

    const order = createDemoUtilityOrder({
      ...baseOrder(),
      utilityMeta: createInitialUtilityMeta("waiting_driver"),
    });

    updateDemoUtilityProviderProfile(DRIVER_ID, { acceptsFreight: true });
    createUtilityOffers(order);

    const profile = getDemoUtilityProviderProfile(DRIVER_ID);
    expect(isOrderCompatibleWithProvider(order, profile, DRIVER_ID)).toBe(true);
    expect(getAvailableUtilityOrdersForProvider(DRIVER_ID).length).toBeGreaterThan(0);
  });
});
