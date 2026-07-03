/** Tarifas padrão para demo local (centavos). Espelha seed-pricing + utilitário. */

export type DemoVehicleType = "moto" | "carro" | "van" | "utilitario";

export type DemoPricingRow = {
  vehicleType: DemoVehicleType;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumPrice: number;
  longDistanceMinimumPerKm: number;
  minimumAverageSpeedKmh: number;
};

export const DEMO_PRICING: DemoPricingRow[] = [
  {
    vehicleType: "moto",
    basePrice: 600,
    pricePerKm: 190,
    pricePerMinute: 35,
    minimumPrice: 900,
    longDistanceMinimumPerKm: 180,
    minimumAverageSpeedKmh: 55,
  },
  {
    vehicleType: "carro",
    basePrice: 800,
    pricePerKm: 300,
    pricePerMinute: 70,
    minimumPrice: 1400,
    longDistanceMinimumPerKm: 280,
    minimumAverageSpeedKmh: 65,
  },
  {
    vehicleType: "van",
    basePrice: 1200,
    pricePerKm: 420,
    pricePerMinute: 100,
    minimumPrice: 2200,
    longDistanceMinimumPerKm: 390,
    minimumAverageSpeedKmh: 60,
  },
  {
    vehicleType: "utilitario",
    basePrice: 1800,
    pricePerKm: 500,
    pricePerMinute: 120,
    minimumPrice: 3000,
    longDistanceMinimumPerKm: 460,
    minimumAverageSpeedKmh: 55,
  },
];

export function getDemoPricingByVehicleType(
  vehicleType: DemoVehicleType
): DemoPricingRow | undefined {
  return DEMO_PRICING.find((p) => p.vehicleType === vehicleType);
}

export type DemoRidePriceEstimate = {
  estimatedPrice: number;
  distanceM: number;
  durationS: number;
  breakdown: {
    basePrice: number;
    distancePrice: number;
    durationPrice: number;
    tariffMinimum: number;
    longDistanceMinimum: number;
  };
};

export function normalizeDemoRideMetrics(
  vehicleType: DemoVehicleType,
  distanceM: number,
  durationS: number
): { distanceM: number; durationS: number } {
  const pricing = getDemoPricingByVehicleType(vehicleType);
  if (!pricing) return { distanceM: 0, durationS: 0 };

  const safeDistanceM = Math.max(0, Number.isFinite(distanceM) ? distanceM : 0);
  const safeDurationS = Math.max(0, Number.isFinite(durationS) ? durationS : 0);
  const minimumDurationS =
    safeDistanceM > 0
      ? (safeDistanceM / 1000 / pricing.minimumAverageSpeedKmh) * 3600
      : 0;

  return {
    distanceM: safeDistanceM,
    durationS: Math.max(safeDurationS, minimumDurationS),
  };
}

export function estimateDemoRidePriceCents(
  vehicleType: DemoVehicleType,
  distanceM: number,
  durationS: number
): DemoRidePriceEstimate {
  const pricing = getDemoPricingByVehicleType(vehicleType);
  if (!pricing) {
    return {
      estimatedPrice: 0,
      distanceM: 0,
      durationS: 0,
      breakdown: {
        basePrice: 0,
        distancePrice: 0,
        durationPrice: 0,
        tariffMinimum: 0,
        longDistanceMinimum: 0,
      },
    };
  }

  const normalized = normalizeDemoRideMetrics(vehicleType, distanceM, durationS);
  const distanceKm = normalized.distanceM / 1000;
  const durationMin = normalized.durationS / 60;
  const distancePrice = distanceKm * pricing.pricePerKm;
  const durationPrice = durationMin * pricing.pricePerMinute;
  const raw = pricing.basePrice + distancePrice + durationPrice;
  const longDistanceMinimum =
    distanceKm >= 20 ? distanceKm * pricing.longDistanceMinimumPerKm : 0;

  return {
    estimatedPrice: Math.round(Math.max(raw, pricing.minimumPrice, longDistanceMinimum)),
    distanceM: normalized.distanceM,
    durationS: normalized.durationS,
    breakdown: {
      basePrice: pricing.basePrice,
      distancePrice: Math.round(distancePrice),
      durationPrice: Math.round(durationPrice),
      tariffMinimum: pricing.minimumPrice,
      longDistanceMinimum: Math.round(longDistanceMinimum),
    },
  };
}
