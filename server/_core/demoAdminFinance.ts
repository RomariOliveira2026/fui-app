import {
  buildDefaultFinanceConfig,
  mergeFinanceConfig,
  type CancellationAuditEntry,
  type CancellationOrigin,
  type DemoAdminCoupon,
  type DemoPendingDriverReview,
  type PlatformFinanceConfig,
} from "@shared/adminFinance";
import { ENV } from "./env";
import {
  createDemoPendingDriverProfile,
  getDemoPendingDriverProfiles,
  updateDemoDriverProfileStatus,
} from "./demoDriver";

let financeConfig: PlatformFinanceConfig = buildDefaultFinanceConfig(
  ENV.platformFeePercent
);

const cancellationAudit: CancellationAuditEntry[] = [];
const demoCoupons = new Map<number, DemoAdminCoupon>();
let nextDemoCouponId = 700_001;

const demoPendingReviews = new Map<number, DemoPendingDriverReview>();
let seededPending = false;
let seededCoupons = false;

export function getDemoFinanceConfig(): PlatformFinanceConfig {
  return financeConfig;
}

export function updateDemoFinanceConfig(
  patch: Partial<PlatformFinanceConfig>
): PlatformFinanceConfig {
  financeConfig = mergeFinanceConfig(financeConfig, patch);
  return financeConfig;
}

export function hydrateDemoFinanceState(payload: {
  config?: PlatformFinanceConfig;
  cancellationAudit?: CancellationAuditEntry[];
  coupons?: DemoAdminCoupon[];
  pendingDrivers?: DemoPendingDriverReview[];
}): void {
  if (payload.config) {
    financeConfig = mergeFinanceConfig(buildDefaultFinanceConfig(), payload.config);
  }
  if (payload.cancellationAudit?.length) {
    for (const entry of payload.cancellationAudit) {
      if (!cancellationAudit.some((e) => e.id === entry.id)) {
        cancellationAudit.unshift(entry);
      }
    }
    cancellationAudit.sort(
      (a, b) => new Date(b.cancelledAt).getTime() - new Date(a.cancelledAt).getTime()
    );
  }
  if (payload.coupons?.length) {
    for (const coupon of payload.coupons) {
      demoCoupons.set(coupon.id, coupon);
      if (coupon.id >= nextDemoCouponId) nextDemoCouponId = coupon.id + 1;
    }
  }
  if (payload.pendingDrivers?.length) {
    for (const driver of payload.pendingDrivers) {
      demoPendingReviews.set(driver.driverId, driver);
    }
  }
}

export function ensureDemoPendingDriverSeeds(): void {
  if (seededPending || ENV.isProduction) return;
  seededPending = true;
  if (getDemoPendingDriverProfiles().length > 0) return;

  const samples = [
    { userId: 910_001, name: "Carlos Silva", cpf: "123.456.789-00", cnh: "12345678900" },
    { userId: 910_002, name: "Ana Souza", cpf: "987.654.321-00", cnh: "98765432100" },
  ];

  for (const sample of samples) {
    const profile = createDemoPendingDriverProfile({
      userId: sample.userId,
      cpf: sample.cpf,
      cnh: sample.cnh,
      cnhImageUrl: "/demo-cnh-placeholder.png",
    });
    demoPendingReviews.set(profile.id, {
      driverId: profile.id,
      userId: sample.userId,
      name: sample.name,
      email: `${sample.name.split(" ")[0].toLowerCase()}@demo.fui`,
      cpf: sample.cpf,
      cnh: sample.cnh,
      cnhImageUrl: profile.cnhImageUrl ?? undefined,
      submittedAt: new Date().toISOString(),
    });
  }
}

export function getDemoPendingDriverReviews(): DemoPendingDriverReview[] {
  ensureDemoPendingDriverSeeds();
  const fromProfiles = getDemoPendingDriverProfiles().map((profile) => {
    const cached = demoPendingReviews.get(profile.id);
    return (
      cached ?? {
        driverId: profile.id,
        userId: profile.userId,
        name: `Motorista #${profile.id}`,
        cpf: profile.cpf ?? undefined,
        cnh: profile.cnh ?? undefined,
        cnhImageUrl: profile.cnhImageUrl ?? undefined,
        submittedAt: profile.createdAt.toISOString(),
      }
    );
  });
  return fromProfiles.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function approveDemoDriverReview(driverId: number): boolean {
  const ok = updateDemoDriverProfileStatus(driverId, "approved");
  if (ok) demoPendingReviews.delete(driverId);
  return ok;
}

export function rejectDemoDriverReview(driverId: number): boolean {
  const ok = updateDemoDriverProfileStatus(driverId, "rejected");
  if (ok) demoPendingReviews.delete(driverId);
  return ok;
}

export function recordCancellationAudit(input: {
  entityType: "ride" | "delivery";
  entityId: number;
  origin: CancellationOrigin;
  reason: string;
  cancelledByUserId?: number;
  cancelledByLabel?: string;
}): CancellationAuditEntry {
  const entry: CancellationAuditEntry = {
    id: `cancel-${input.entityType}-${input.entityId}-${Date.now()}`,
    entityType: input.entityType,
    entityId: input.entityId,
    origin: input.origin,
    reason: input.reason,
    cancelledAt: new Date().toISOString(),
    cancelledByUserId: input.cancelledByUserId,
    cancelledByLabel: input.cancelledByLabel,
  };
  cancellationAudit.unshift(entry);
  if (cancellationAudit.length > 200) cancellationAudit.pop();
  return entry;
}

export function getCancellationAuditLog(limit = 50): CancellationAuditEntry[] {
  return cancellationAudit.slice(0, limit);
}

function ensureDemoCouponSeeds(): void {
  if (seededCoupons || ENV.isProduction) return;
  seededCoupons = true;
  if (demoCoupons.size > 0) return;

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  createDemoAdminCoupon({
    code: "FUI10",
    description: "10% na primeira corrida",
    discountType: "percentage",
    discountValue: 10,
    maxUses: 500,
    validFrom: now.toISOString(),
    validUntil: nextMonth.toISOString(),
  });
  createDemoAdminCoupon({
    code: "ENTREGA5",
    description: "R$ 5 em entregas",
    discountType: "fixed",
    discountValue: 500,
    validFrom: now.toISOString(),
    validUntil: nextMonth.toISOString(),
  });
}

export function getDemoAdminCoupons(): DemoAdminCoupon[] {
  ensureDemoCouponSeeds();
  return Array.from(demoCoupons.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function getDemoCouponByCode(code: string): DemoAdminCoupon | undefined {
  ensureDemoCouponSeeds();
  const normalized = code.trim().toUpperCase();
  return Array.from(demoCoupons.values()).find((c) => c.code === normalized);
}

export type DemoCouponApplication = {
  coupon: DemoAdminCoupon;
  discountAmount: number;
  finalPrice: number;
};

/**
 * Valida e aplica um cupom demo sobre um valor (em centavos).
 * Retorna null se o cupom não existir/for inválido para o contexto.
 */
export function applyDemoCoupon(
  code: string | null | undefined,
  rideValueCents: number
): DemoCouponApplication | null {
  if (!code) return null;
  const coupon = getDemoCouponByCode(code);
  if (!coupon || !coupon.isActive) return null;

  const now = new Date();
  if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) return null;
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null;

  let discountAmount =
    coupon.discountType === "percentage"
      ? Math.round((rideValueCents * coupon.discountValue) / 100)
      : coupon.discountValue;
  discountAmount = Math.min(Math.max(discountAmount, 0), rideValueCents);

  return {
    coupon,
    discountAmount,
    finalPrice: rideValueCents - discountAmount,
  };
}

/** Incrementa o contador de uso de um cupom demo (após corrida criada). */
export function markDemoCouponUsed(couponId: number): void {
  const coupon = demoCoupons.get(couponId);
  if (!coupon) return;
  demoCoupons.set(couponId, { ...coupon, usedCount: coupon.usedCount + 1 });
}

export function createDemoAdminCoupon(
  input: Omit<DemoAdminCoupon, "id" | "usedCount" | "isActive"> & { isActive?: boolean }
): DemoAdminCoupon {
  const coupon: DemoAdminCoupon = {
    id: nextDemoCouponId++,
    usedCount: 0,
    isActive: input.isActive ?? true,
    ...input,
    code: input.code.toUpperCase(),
  };
  demoCoupons.set(coupon.id, coupon);
  return coupon;
}

export function toggleDemoAdminCoupon(id: number, isActive: boolean): DemoAdminCoupon | undefined {
  const coupon = demoCoupons.get(id);
  if (!coupon) return undefined;
  const updated = { ...coupon, isActive };
  demoCoupons.set(id, updated);
  return updated;
}

export function serializeDemoFinanceState() {
  return {
    config: financeConfig,
    cancellationAudit: cancellationAudit.slice(0, 100),
    coupons: getDemoAdminCoupons(),
    pendingDrivers: getDemoPendingDriverReviews(),
  };
}
