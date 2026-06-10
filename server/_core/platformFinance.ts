import type { DeliveryOrder, Ride } from "../../drizzle/schema";
import {
  buildDefaultFinanceConfig,
  type FinanceServiceKey,
  type PlatformFinanceConfig,
} from "@shared/adminFinance";
import { ENV } from "./env";
import { getFinanceConfigSync } from "./financeConfigStore";

export function getPlatformFinanceConfig(): PlatformFinanceConfig {
  return getFinanceConfigSync();
}

export { getFinanceConfigSync };

export function resolveCommissionPercent(
  config: PlatformFinanceConfig,
  serviceKey: FinanceServiceKey
): number {
  return config.commission.byService[serviceKey] ?? config.commission.defaultPercent;
}

export function splitGrossRevenue(
  grossCents: number,
  serviceKey: FinanceServiceKey,
  config?: PlatformFinanceConfig
): { grossCents: number; commissionCents: number; driverPayoutCents: number } {
  const cfg = config ?? getPlatformFinanceConfig();
  const percent = resolveCommissionPercent(cfg, serviceKey);
  const commissionCents = Math.round((grossCents * percent) / 100);
  return {
    grossCents,
    commissionCents,
    driverPayoutCents: grossCents - commissionCents,
  };
}

export function resolveServiceKeyForRide(vehicleType: string): FinanceServiceKey {
  if (["moto", "carro", "van", "utilitario"].includes(vehicleType)) {
    return vehicleType as FinanceServiceKey;
  }
  return "ride";
}

export function resolveMinimumPriceCents(
  serviceKey: FinanceServiceKey,
  vehicleType?: string,
  config?: PlatformFinanceConfig
): number | undefined {
  const cfg = config ?? getPlatformFinanceConfig();
  const byService = cfg.minimumPrices.byService;
  if (vehicleType && byService[vehicleType as FinanceServiceKey] != null) {
    return byService[vehicleType as FinanceServiceKey];
  }
  return byService[serviceKey];
}

export function applyFinanceMinimumPrice(
  estimatedCents: number,
  serviceKey: FinanceServiceKey,
  vehicleType?: string,
  config?: PlatformFinanceConfig
): number {
  const min = resolveMinimumPriceCents(serviceKey, vehicleType, config);
  if (min == null) return estimatedCents;
  return Math.max(estimatedCents, min);
}

export function rideGrossAmount(ride: Ride): number {
  return ride.finalPrice ?? ride.estimatedPrice ?? 0;
}

export function deliveryGrossAmount(order: DeliveryOrder): number {
  return order.finalPrice ?? order.estimatedPrice ?? 0;
}
