import {
  DEMO_PRICING,
  getDemoPricingByVehicleType,
  type DemoVehicleType,
} from "@shared/demoPricing";
import type { PricingConfig } from "../../drizzle/schema";
import { ENV } from "./env";

function demoRowToConfig(
  demo: (typeof DEMO_PRICING)[number],
  id: number
): PricingConfig {
  const now = new Date();
  return {
    id,
    vehicleType: demo.vehicleType,
    basePrice: demo.basePrice,
    pricePerKm: demo.pricePerKm,
    pricePerMinute: demo.pricePerMinute,
    minimumPrice: demo.minimumPrice,
    createdAt: now,
    updatedAt: now,
  };
}

/** Mescla tarifas do banco com fallback demo para tipos ausentes (apenas dev). */
export function withDemoPricingFallback(rows: PricingConfig[]): PricingConfig[] {
  if (ENV.isProduction) return rows;

  const byType = new Map(rows.map((r) => [r.vehicleType, r]));
  let demoId = -1;
  for (const demo of DEMO_PRICING) {
    if (!byType.has(demo.vehicleType)) {
      byType.set(demo.vehicleType, demoRowToConfig(demo, demoId--));
    }
  }
  return Array.from(byType.values());
}

export function getPricingForVehicle(
  vehicleType: DemoVehicleType,
  fromDb?: PricingConfig
): PricingConfig | undefined {
  if (fromDb) return fromDb;
  if (ENV.isProduction) return undefined;
  const demo = getDemoPricingByVehicleType(vehicleType);
  return demo ? demoRowToConfig(demo, 0) : undefined;
}
