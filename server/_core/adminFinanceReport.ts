import type { AdminFinancialSummary } from "@shared/adminFinance";
import type { DeliveryOrder, Ride } from "../../drizzle/schema";
import { aggregateLedgerSummary, getAllLedgerEntries } from "./financialLedger";
import { isDemoPassenger } from "./demoUser";
import { getAllDemoRides } from "./demoRide";
import { getAllDemoDeliveryOrders } from "./demoDelivery";
import { loadFinanceConfig } from "./financeConfigStore";
import {
  resolveServiceKeyForRide,
  splitGrossRevenue,
} from "./platformFinance";
import * as db from "../db";

async function summarizeCompletedServices(
  rides: Ride[],
  deliveries: DeliveryOrder[],
  periodLabel: string
): Promise<AdminFinancialSummary> {
  const config = await loadFinanceConfig();
  let grossRevenueCents = 0;
  let platformCommissionCents = 0;
  let couponDiscountCents = 0;

  for (const ride of rides) {
    const gross = ride.finalPrice ?? ride.estimatedPrice ?? 0;
    const serviceKey = resolveServiceKeyForRide(ride.vehicleType);
    const split = splitGrossRevenue(gross, serviceKey, config);
    grossRevenueCents += split.grossCents;
    platformCommissionCents += split.commissionCents;
    couponDiscountCents += ride.discountAmount ?? 0;
  }

  for (const order of deliveries) {
    const gross = order.finalPrice ?? order.estimatedPrice ?? 0;
    const split = splitGrossRevenue(gross, "delivery", config);
    grossRevenueCents += split.grossCents;
    platformCommissionCents += split.commissionCents;
  }

  return {
    grossRevenueCents,
    platformCommissionCents,
    estimatedDriverPayoutCents: grossRevenueCents - platformCommissionCents,
    completedRides: rides.length,
    completedDeliveries: deliveries.length,
    couponDiscountCents,
    periodLabel,
  };
}

async function buildLegacyFinancialSummary(user: {
  openId: string;
}): Promise<AdminFinancialSummary> {
  const isDemo = isDemoPassenger(user);
  const periodLabel = isDemo
    ? "Demo local · estimado (sem ledger)"
    : "Produção · estimado (sem ledger)";

  if (isDemo) {
    const rides = getAllDemoRides().filter((r) => r.status === "completed");
    const deliveries = getAllDemoDeliveryOrders().filter((d) => d.status === "delivered");
    return await summarizeCompletedServices(rides, deliveries, periodLabel);
  }

  const dbInstance = await db.getDb();
  if (!dbInstance) {
    return await summarizeCompletedServices([], [], periodLabel);
  }

  const allRides = await db.getAllRides();
  const rides = allRides.filter((r) => r.status === "completed");
  const deliveries = await db.getAllDeliveryOrders();
  const completedDeliveries = deliveries.filter((d) => d.status === "delivered");

  return await summarizeCompletedServices(rides, completedDeliveries, periodLabel);
}

export async function getAdminFinancialSummary(user: {
  openId: string;
}): Promise<AdminFinancialSummary> {
  const entries = await getAllLedgerEntries();
  const periodLabel = isDemoPassenger(user) ? "Demo local · ledger" : "Produção · ledger";

  if (entries.length > 0) {
    const agg = aggregateLedgerSummary(entries, periodLabel);
    return {
      grossRevenueCents: agg.grossRevenueCents,
      platformCommissionCents: agg.platformCommissionCents,
      estimatedDriverPayoutCents: agg.driverNetCents,
      completedRides: agg.completedRides,
      completedDeliveries: agg.completedDeliveries,
      couponDiscountCents: agg.couponDiscountCents,
      periodLabel,
    };
  }

  return buildLegacyFinancialSummary(user);
}
