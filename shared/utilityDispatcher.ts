import type { UtilityOrder, UtilityServiceType, UtilityVehicleType } from "./utilities";
import type { UtilityProviderProfile } from "./utilityProvider";
import { UTILITY_SERVICE_ACCEPT_KEYS } from "./utilityProvider";

export type UtilityOfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "superseded"
  | "cancelled";

export type UtilityOffer = {
  id: number;
  orderId: number;
  driverId: number;
  status: UtilityOfferStatus;
  distanceToOriginMeters: number;
  offerRound: number;
  createdAt: string;
  updatedAt: string;
};

export const UTILITY_VEHICLE_RANK: Record<UtilityVehicleType, number> = {
  light_utility: 1,
  pickup: 2,
  van: 3,
  small_truck: 4,
  medium_truck: 5,
};

/** Veículos permitidos por tipo de serviço (Utilitários Dispatcher 1.0). */
export const UTILITY_SERVICE_ALLOWED_VEHICLES: Record<
  UtilityServiceType,
  UtilityVehicleType[]
> = {
  freight_fast: ["light_utility", "pickup", "van"],
  small_move: ["van", "small_truck"],
  store_pickup: ["light_utility", "pickup", "van"],
  bulky_cargo: ["van", "small_truck", "medium_truck"],
  commercial_transport: ["van", "small_truck", "medium_truck"],
};

export type UtilityMatchReason =
  | "inactive"
  | "service_not_accepted"
  | "vehicle_not_allowed"
  | "vehicle_too_small"
  | "weight_exceeded"
  | "volume_exceeded"
  | "helpers_unavailable"
  | "minimum_price"
  | "out_of_radius"
  | "declined"
  | "compatible";

export type UtilityMatchResult = {
  compatible: boolean;
  reasons: UtilityMatchReason[];
};

export function evaluateUtilityProviderMatch(
  order: UtilityOrder,
  profile: UtilityProviderProfile,
  options?: {
    distanceToOriginMeters?: number;
    declined?: boolean;
  }
): UtilityMatchResult {
  const reasons: UtilityMatchReason[] = [];

  if (options?.declined) {
    return { compatible: false, reasons: ["declined"] };
  }
  if (!profile.isActive) {
    reasons.push("inactive");
  }

  const acceptKey = UTILITY_SERVICE_ACCEPT_KEYS[order.serviceType];
  if (!profile[acceptKey]) {
    reasons.push("service_not_accepted");
  }

  const allowed = UTILITY_SERVICE_ALLOWED_VEHICLES[order.serviceType];
  if (!allowed.includes(profile.vehicleType)) {
    reasons.push("vehicle_not_allowed");
  }

  const providerRank = UTILITY_VEHICLE_RANK[profile.vehicleType];
  const requiredRank = UTILITY_VEHICLE_RANK[order.vehicleType];
  if (providerRank < requiredRank) {
    reasons.push("vehicle_too_small");
  }

  if (order.serviceType === "commercial_transport") {
    const weight = order.cargo.estimatedWeightKg ?? 0;
    const volume = order.cargo.estimatedVolumeM3 ?? 0;
    if ((weight > 800 || volume > 12) && profile.vehicleType === "van") {
      reasons.push("vehicle_too_small");
    }
    if ((weight > 1500 || volume > 20) && profile.vehicleType === "small_truck") {
      reasons.push("vehicle_too_small");
    }
  }

  const weight = order.cargo.estimatedWeightKg ?? 0;
  if (weight > profile.maxWeightKg) {
    reasons.push("weight_exceeded");
  }

  const volume = order.cargo.estimatedVolumeM3 ?? 0;
  if (volume > 0 && volume > profile.maxVolumeM3) {
    reasons.push("volume_exceeded");
  }

  if (order.extras.needsHelper && !profile.worksWithHelper) {
    reasons.push("helpers_unavailable");
  }
  if (
    order.extras.needsHelper &&
    (order.extras.helperCount ?? 1) > profile.availableHelpers
  ) {
    reasons.push("helpers_unavailable");
  }

  const price = order.estimatedPrice ?? 0;
  if (price < profile.minimumOrderCents) {
    reasons.push("minimum_price");
  }

  if (options?.distanceToOriginMeters != null) {
    const radiusMeters = profile.serviceRadiusKm * 1000;
    if (options.distanceToOriginMeters > radiusMeters) {
      reasons.push("out_of_radius");
    }
  }

  if (reasons.length === 0) {
    return { compatible: true, reasons: ["compatible"] };
  }
  return { compatible: false, reasons };
}
