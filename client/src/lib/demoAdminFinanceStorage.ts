import type {
  CancellationAuditEntry,
  DemoAdminCoupon,
  DemoPendingDriverReview,
  PlatformFinanceConfig,
} from "@shared/adminFinance";

export const FUI_DEMO_ADMIN_FINANCE_KEY = "fui_demo_admin_finance";

export type DemoAdminFinanceSnapshot = {
  config?: PlatformFinanceConfig;
  cancellationAudit?: CancellationAuditEntry[];
  coupons?: DemoAdminCoupon[];
  pendingDrivers?: DemoPendingDriverReview[];
};

export function loadDemoAdminFinanceSnapshot(): DemoAdminFinanceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUI_DEMO_ADMIN_FINANCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoAdminFinanceSnapshot;
  } catch {
    return null;
  }
}

export function saveDemoAdminFinanceSnapshot(snapshot: DemoAdminFinanceSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_ADMIN_FINANCE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}
