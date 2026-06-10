import type { UtilityServiceType, UtilityVehicleType } from "./utilities";

export type UtilityProviderProfile = {
  driverId: number;
  vehicleType: UtilityVehicleType;
  maxWeightKg: number;
  maxVolumeM3: number;
  acceptsFreight: boolean;
  acceptsSmallMove: boolean;
  acceptsStorePickup: boolean;
  acceptsBulkyCargo: boolean;
  acceptsCommercial: boolean;
  worksWithHelper: boolean;
  availableHelpers: number;
  serviceRadiusKm: number;
  minimumOrderCents: number;
  isActive: boolean;
};

export type UtilityProviderCapabilities = {
  acceptsFreight: boolean;
  acceptsSmallMove: boolean;
  acceptsStorePickup: boolean;
  acceptsBulkyCargo: boolean;
  acceptsCommercial: boolean;
  maxWeightKg: number;
  maxVolumeM3: number;
  availableHelpers: number;
  serviceRadiusKm: number;
  minimumOrderCents: number;
  vehicleTypes: string[];
};

export const UTILITY_SERVICE_ACCEPT_KEYS: Record<
  UtilityServiceType,
  keyof Pick<
    UtilityProviderProfile,
    | "acceptsFreight"
    | "acceptsSmallMove"
    | "acceptsStorePickup"
    | "acceptsBulkyCargo"
    | "acceptsCommercial"
  >
> = {
  freight_fast: "acceptsFreight",
  small_move: "acceptsSmallMove",
  store_pickup: "acceptsStorePickup",
  bulky_cargo: "acceptsBulkyCargo",
  commercial_transport: "acceptsCommercial",
};

export function buildDefaultUtilityProviderProfile(driverId: number): UtilityProviderProfile {
  return {
    driverId,
    vehicleType: "van",
    maxWeightKg: 500,
    maxVolumeM3: 8,
    acceptsFreight: true,
    acceptsSmallMove: true,
    acceptsStorePickup: true,
    acceptsBulkyCargo: false,
    acceptsCommercial: false,
    worksWithHelper: true,
    availableHelpers: 1,
    serviceRadiusKm: 25,
    minimumOrderCents: 5_000,
    isActive: true,
  };
}

export type UtilityProviderEarningsSummary = {
  todayNetCents: number;
  weekNetCents: number;
  todayCount: number;
  weekCount: number;
  todayAvgTicketCents: number;
  weekAvgTicketCents: number;
};

export type UtilityProviderStatementItem = {
  id: number;
  serviceType: UtilityServiceType;
  date: string;
  originLabel: string;
  destinationLabel: string;
  grossCents: number;
  netCents: number;
};

/** @deprecated use UtilityProviderProfile */
export const DEFAULT_UTILITY_PROVIDER_CAPABILITIES: UtilityProviderCapabilities = {
  acceptsFreight: true,
  acceptsSmallMove: true,
  acceptsStorePickup: true,
  acceptsBulkyCargo: false,
  acceptsCommercial: false,
  maxWeightKg: 500,
  maxVolumeM3: 8,
  availableHelpers: 1,
  serviceRadiusKm: 25,
  minimumOrderCents: 5000,
  vehicleTypes: ["light_utility", "pickup", "van"],
};
