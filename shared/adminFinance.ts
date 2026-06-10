export type FinanceServiceKey =
  | "ride"
  | "delivery"
  | "moto"
  | "carro"
  | "van"
  | "utilitario";

export const FINANCE_SERVICE_KEYS: FinanceServiceKey[] = [
  "ride",
  "delivery",
  "moto",
  "carro",
  "van",
  "utilitario",
];

export type PlatformCommissionRates = {
  defaultPercent: number;
  byService: Record<FinanceServiceKey, number>;
};

export type MinimumPriceRules = {
  regionLabel: string;
  byService: Partial<Record<FinanceServiceKey, number>>;
};

export type PlatformFinanceConfig = {
  commission: PlatformCommissionRates;
  minimumPrices: MinimumPriceRules;
};

export type AdminFinancialSummary = {
  grossRevenueCents: number;
  platformCommissionCents: number;
  estimatedDriverPayoutCents: number;
  completedRides: number;
  completedDeliveries: number;
  couponDiscountCents: number;
  periodLabel: string;
};

export type CancellationOrigin = "passenger" | "driver" | "admin" | "system";

export type CancellationAuditEntry = {
  id: string;
  entityType: "ride" | "delivery";
  entityId: number;
  origin: CancellationOrigin;
  reason: string;
  cancelledAt: string;
  cancelledByUserId?: number;
  cancelledByLabel?: string;
};

export type DemoAdminCoupon = {
  id: number;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

export type DemoPendingDriverReview = {
  driverId: number;
  userId: number;
  name: string;
  email?: string;
  cpf?: string;
  cnh?: string;
  cnhImageUrl?: string;
  submittedAt: string;
};

export const DEFAULT_COMMISSION_PERCENT = 15;

export function buildDefaultFinanceConfig(
  defaultPercent = DEFAULT_COMMISSION_PERCENT
): PlatformFinanceConfig {
  const rate = defaultPercent;
  return {
    commission: {
      defaultPercent: rate,
      byService: {
        ride: rate,
        delivery: rate,
        moto: rate,
        carro: rate,
        van: rate,
        utilitario: rate,
      },
    },
    minimumPrices: {
      regionLabel: "Centro",
      byService: {
        moto: 800,
        carro: 1200,
        van: 1800,
        utilitario: 2000,
        ride: 1200,
        delivery: 1000,
      },
    },
  };
}

export function mergeFinanceConfig(
  current: PlatformFinanceConfig,
  patch: Partial<PlatformFinanceConfig>
): PlatformFinanceConfig {
  return {
    commission: {
      defaultPercent: patch.commission?.defaultPercent ?? current.commission.defaultPercent,
      byService: {
        ...current.commission.byService,
        ...patch.commission?.byService,
      },
    },
    minimumPrices: {
      regionLabel: patch.minimumPrices?.regionLabel ?? current.minimumPrices.regionLabel,
      byService: {
        ...current.minimumPrices.byService,
        ...patch.minimumPrices?.byService,
      },
    },
  };
}
