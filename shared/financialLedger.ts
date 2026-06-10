import type { DriverServiceType } from "./driverPremium";

export type FinancialLedgerEntry = {
  id: number;
  driverId: number;
  entityType: DriverServiceType;
  entityId: number;
  serviceKey: string;
  grossCents: number;
  commissionCents: number;
  driverNetCents: number;
  couponCode?: string | null;
  couponDiscountCents: number;
  completedAt: string;
};

export type LedgerAggregateSummary = {
  grossRevenueCents: number;
  platformCommissionCents: number;
  driverNetCents: number;
  completedRides: number;
  completedDeliveries: number;
  couponDiscountCents: number;
};
