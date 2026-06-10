import type {
  UtilityFragility,
  UtilityOperationalExtras,
  UtilityQuoteBreakdown,
  UtilityServiceType,
  UtilityVehicleType,
} from "@shared/utilities";

const SERVICE_BASE_CENTS: Record<UtilityServiceType, number> = {
  freight_fast: 3_500,
  small_move: 8_000,
  store_pickup: 3_000,
  bulky_cargo: 5_000,
  commercial_transport: 6_000,
};

const VEHICLE_SURCHARGE_CENTS: Record<UtilityVehicleType, number> = {
  light_utility: 0,
  pickup: 1_500,
  van: 2_500,
  small_truck: 4_500,
  medium_truck: 7_500,
};

const DISTANCE_RATE_CENTS_PER_KM = 120;

export function suggestVehicleForUtility(input: {
  serviceType: UtilityServiceType;
  weightKg?: number;
  volumeM3?: number;
  packageCount?: number;
  needsHelper?: boolean;
}): UtilityVehicleType {
  const weight = input.weightKg ?? 0;
  const volume = input.volumeM3 ?? 0;
  const packages = input.packageCount ?? 1;

  if (input.serviceType === "commercial_transport" || weight > 800 || volume > 12) {
    return "medium_truck";
  }
  if (
    input.serviceType === "bulky_cargo" ||
    input.serviceType === "small_move" ||
    weight > 400 ||
    volume > 6 ||
    packages > 8
  ) {
    return "small_truck";
  }
  if (weight > 150 || volume > 3 || packages > 4 || input.needsHelper) {
    return "van";
  }
  if (weight > 80 || volume > 1.5 || input.serviceType === "freight_fast") {
    return "pickup";
  }
  return "light_utility";
}

export function calculateUtilityQuote(input: {
  serviceType: UtilityServiceType;
  vehicleType: UtilityVehicleType;
  distanceMeters: number;
  durationSeconds: number;
  cargo?: {
    estimatedWeightKg?: number;
    fragility?: UtilityFragility;
  };
  extras?: UtilityOperationalExtras;
}): UtilityQuoteBreakdown {
  const distanceKm = Math.max(0.5, input.distanceMeters / 1000);
  const baseFeeCents = SERVICE_BASE_CENTS[input.serviceType];
  const distanceCents = Math.round(distanceKm * DISTANCE_RATE_CENTS_PER_KM);
  const vehicleCents = VEHICLE_SURCHARGE_CENTS[input.vehicleType];

  const extras = input.extras ?? {};
  const weight = input.cargo?.estimatedWeightKg ?? 0;
  const weightCents = weight > 50 ? Math.round((weight - 50) * 40) : 0;

  const helperCount = extras.needsHelper ? Math.max(1, extras.helperCount ?? 1) : 0;
  const helpersCents = helperCount * 2_500;

  const urgencyCents = extras.isUrgent ? Math.round((baseFeeCents + distanceCents) * 0.2) : 0;

  const fragility = input.cargo?.fragility ?? "normal";
  const fragilityCents =
    fragility === "very_fragile"
      ? 2_000
      : fragility === "fragile"
        ? 1_000
        : 0;

  const stairsCents = extras.hasStairs && !extras.hasElevator ? 1_500 : 0;
  const disassemblyCents = extras.needsDisassembly ? 2_500 : 0;
  const assemblyCents = extras.needsAssembly ? 2_500 : 0;
  const schedulingCents = extras.isScheduled ? 500 : 0;

  const totalCents =
    baseFeeCents +
    distanceCents +
    vehicleCents +
    helpersCents +
    urgencyCents +
    fragilityCents +
    stairsCents +
    disassemblyCents +
    assemblyCents +
    schedulingCents +
    weightCents;

  const suggestedVehicle = suggestVehicleForUtility({
    serviceType: input.serviceType,
    weightKg: weight,
    volumeM3: undefined,
    needsHelper: extras.needsHelper,
  });

  return {
    baseFeeCents,
    distanceCents,
    vehicleCents,
    helpersCents,
    urgencyCents,
    fragilityCents,
    stairsCents,
    disassemblyCents,
    assemblyCents,
    schedulingCents,
    weightCents,
    totalCents,
    distanceMeters: input.distanceMeters,
    durationSeconds: input.durationSeconds,
    suggestedVehicle,
  };
}
