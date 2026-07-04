import type { DeliveryOrder, Ride } from "../../drizzle/schema";
import type { FinancialLedgerEntry, LedgerAggregateSummary } from "@shared/financialLedger";
import { isDemoDeliveryId } from "./demoDelivery";
import { isDemoRideId } from "./demoRide";
import {
  getAllDemoLedgerEntries,
  getDemoLedgerEntriesForDriver,
  recordDemoLedgerEntry,
} from "./demoFinancialLedger";
import {
  getFinanceConfigSync,
  loadFinanceConfig,
} from "./financeConfigStore";
import {
  resolveServiceKeyForRide,
  splitGrossRevenue,
} from "./platformFinance";
import { isDatabaseQueryable } from "./databaseAvailability";
import * as db from "../db";

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isWithinLastDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

export async function recordRideLedgerEntry(ride: Ride): Promise<FinancialLedgerEntry> {
  if (!ride.driverId) {
    throw new Error("Ride without driver cannot be ledgered");
  }

  const grossCents = ride.finalPrice ?? ride.estimatedPrice ?? 0;
  const config = await loadFinanceConfig();
  const serviceKey = resolveServiceKeyForRide(ride.vehicleType);
  const split = splitGrossRevenue(grossCents, serviceKey, config);

  const payload = {
    driverId: ride.driverId,
    entityType: "ride" as const,
    entityId: ride.id,
    serviceKey,
    grossCents: split.grossCents,
    commissionCents: split.commissionCents,
    driverNetCents: split.driverPayoutCents,
    couponCode: ride.couponCode ?? null,
    couponDiscountCents: ride.discountAmount ?? 0,
    completedAt: (ride.completedAt ?? new Date()).toISOString(),
  };

  if (isDemoRideId(ride.id)) {
    return recordDemoLedgerEntry(payload);
  }

  const dbInstance = await db.getDb();
  if (dbInstance) {
    const row = await db.insertFinancialLedgerEntry(payload);
    return row;
  }

  return recordDemoLedgerEntry(payload);
}

export async function recordDeliveryLedgerEntry(
  order: DeliveryOrder
): Promise<FinancialLedgerEntry | null> {
  if (!order.driverId) return null;

  const grossCents = order.finalPrice ?? order.estimatedPrice ?? 0;
  const config = await loadFinanceConfig();
  const split = splitGrossRevenue(grossCents, "delivery", config);

  const payload = {
    driverId: order.driverId,
    entityType: "delivery" as const,
    entityId: order.id,
    serviceKey: "delivery",
    grossCents: split.grossCents,
    commissionCents: split.commissionCents,
    driverNetCents: split.driverPayoutCents,
    couponCode: null,
    couponDiscountCents: 0,
    completedAt: (order.deliveredAt ?? new Date()).toISOString(),
  };

  if (isDemoDeliveryId(order.id)) {
    return recordDemoLedgerEntry(payload);
  }

  const dbInstance = await db.getDb();
  if (dbInstance) {
    return db.insertFinancialLedgerEntry(payload);
  }

  return recordDemoLedgerEntry(payload);
}

export async function getLedgerEntriesForDriver(
  driverId: number
): Promise<FinancialLedgerEntry[]> {
  const demoEntries = getDemoLedgerEntriesForDriver(driverId);
  const dbQueryable = await isDatabaseQueryable();

  if (!dbQueryable) {
    return demoEntries;
  }

  try {
    const prodEntries = await db.getFinancialLedgerByDriver(driverId);
    const merged = new Map<string, FinancialLedgerEntry>();
    for (const e of [...prodEntries, ...demoEntries]) {
      merged.set(`${e.entityType}:${e.entityId}`, e);
    }
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  } catch (error) {
    console.warn("[financialLedger] DB read failed for driver, demo only:", error);
    return demoEntries;
  }
}

export async function getAllLedgerEntries(): Promise<FinancialLedgerEntry[]> {
  const demoEntries = getAllDemoLedgerEntries();
  const dbQueryable = await isDatabaseQueryable();

  if (!dbQueryable) {
    return demoEntries;
  }

  try {
    const prodEntries = await db.getAllFinancialLedgerEntries();
    const merged = new Map<string, FinancialLedgerEntry>();
    for (const e of [...prodEntries, ...demoEntries]) {
      merged.set(`${e.entityType}:${e.entityId}`, e);
    }
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  } catch (error) {
    console.warn("[financialLedger] DB read failed, demo only:", error);
    return demoEntries;
  }
}

export function aggregateLedgerSummary(
  entries: FinancialLedgerEntry[],
  periodLabel: string
): LedgerAggregateSummary & { periodLabel: string } {
  let grossRevenueCents = 0;
  let platformCommissionCents = 0;
  let couponDiscountCents = 0;
  let completedRides = 0;
  let completedDeliveries = 0;

  for (const e of entries) {
    grossRevenueCents += e.grossCents;
    platformCommissionCents += e.commissionCents;
    couponDiscountCents += e.couponDiscountCents;
    if (e.entityType === "ride") completedRides++;
    else completedDeliveries++;
  }

  return {
    grossRevenueCents,
    platformCommissionCents,
    driverNetCents: grossRevenueCents - platformCommissionCents,
    completedRides,
    completedDeliveries,
    couponDiscountCents,
    periodLabel,
  };
}

export function buildDriverEarningsFromLedger(entries: FinancialLedgerEntry[]) {
  const now = new Date();
  const today = entries.filter((e) => isSameDay(new Date(e.completedAt), now));
  const week = entries.filter((e) => isWithinLastDays(new Date(e.completedAt), 7));

  const sumNet = (list: FinancialLedgerEntry[]) =>
    list.reduce((s, e) => s + e.driverNetCents, 0);
  const sumGross = (list: FinancialLedgerEntry[]) =>
    list.reduce((s, e) => s + e.grossCents, 0);
  const sumCommission = (list: FinancialLedgerEntry[]) =>
    list.reduce((s, e) => s + e.commissionCents, 0);

  const todayRides = today.filter((e) => e.entityType === "ride").length;
  const weekRides = week.filter((e) => e.entityType === "ride").length;
  const todayDeliveries = today.filter((e) => e.entityType === "delivery").length;
  const weekDeliveries = week.filter((e) => e.entityType === "delivery").length;
  const todayCount = today.length;
  const weekCount = week.length;
  const todayNet = sumNet(today);

  return {
    todayTotalCents: todayNet,
    todayGrossCents: sumGross(today),
    todayCommissionCents: sumCommission(today),
    weekTotalCents: sumNet(week),
    weekGrossCents: sumGross(week),
    weekCommissionCents: sumCommission(week),
    todayRideCount: todayRides,
    weekRideCount: weekRides,
    todayDeliveryCount: todayDeliveries,
    weekDeliveryCount: weekDeliveries,
    todayAvgTicketCents: todayCount > 0 ? Math.round(todayNet / todayCount) : 0,
    weekAvgTicketCents: weekCount > 0 ? Math.round(sumNet(week) / weekCount) : 0,
  };
}

export function buildDriverStatementFromLedger(
  entries: FinancialLedgerEntry[],
  rides: Ride[],
  deliveries: DeliveryOrder[]
) {
  const rideById = new Map(rides.map((r) => [r.id, r]));
  const deliveryById = new Map(deliveries.map((d) => [d.id, d]));

  const VEHICLE_LABELS: Record<string, string> = {
    moto: "Moto",
    carro: "Carro",
    van: "Van",
    utilitario: "Utilitário",
  };

  return entries.map((e) => {
    if (e.entityType === "ride") {
      const ride = rideById.get(e.entityId);
      return {
        id: e.entityId,
        type: "ride" as const,
        date: e.completedAt,
        originLabel: ride?.originAddress ?? "—",
        destinationLabel: ride?.destinationAddress ?? "—",
        amountCents: e.driverNetCents,
        grossCents: e.grossCents,
        commissionCents: e.commissionCents,
        couponCode: e.couponCode ?? undefined,
        serviceLabel: ride
          ? (VEHICLE_LABELS[ride.vehicleType] ?? ride.vehicleType)
          : e.serviceKey,
      };
    }
    const order = deliveryById.get(e.entityId);
    return {
      id: e.entityId,
      type: "delivery" as const,
      date: e.completedAt,
      originLabel: order?.pickupAddress ?? "—",
      destinationLabel: order?.deliveryAddress ?? "—",
      amountCents: e.driverNetCents,
      grossCents: e.grossCents,
      commissionCents: e.commissionCents,
      serviceLabel: "Entrega",
    };
  });
}

/** Fallback: calcula líquido on-the-fly quando ledger ainda não tem o registro. */
export function applyNetToLegacyEarnings(
  summary: ReturnType<typeof buildDriverEarningsFromLedger>,
  rides: Ride[],
  deliveries: DeliveryOrder[]
) {
  const config = getFinanceConfigSync();
  let todayNet = 0;
  let weekNet = 0;
  let todayGross = 0;
  let weekGross = 0;

  const now = new Date();
  const process = (gross: number, serviceKey: string, at: Date) => {
    const split = splitGrossRevenue(gross, serviceKey as never, config);
    if (isSameDay(at, now)) {
      todayNet += split.driverPayoutCents;
      todayGross += split.grossCents;
    }
    if (isWithinLastDays(at, 7)) {
      weekNet += split.driverPayoutCents;
      weekGross += split.grossCents;
    }
  };

  for (const r of rides.filter((x) => x.status === "completed")) {
    const at = r.completedAt ? new Date(r.completedAt) : new Date();
    process(r.finalPrice ?? r.estimatedPrice ?? 0, r.vehicleType, at);
  }
  for (const d of deliveries.filter((x) => x.status === "delivered")) {
    const at = d.deliveredAt ? new Date(d.deliveredAt) : new Date();
    process(d.finalPrice ?? d.estimatedPrice ?? 0, "delivery", at);
  }

  if (summary.todayTotalCents === 0 && todayNet > 0) {
    return { ...summary, todayTotalCents: todayNet, todayGrossCents: todayGross, weekTotalCents: weekNet, weekGrossCents: weekGross };
  }
  return summary;
}
