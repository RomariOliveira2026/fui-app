import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  loadDemoAdminFinanceSnapshot,
  saveDemoAdminFinanceSnapshot,
  type DemoAdminFinanceSnapshot,
} from "@/lib/demoAdminFinanceStorage";

export function useDemoAdminFinanceHydration(enabled = true) {
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.adminFinance.hydrateDemoState.useMutation();

  useEffect(() => {
    if (!enabled || !isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoAdminFinanceSnapshot();
    if (!stored) return;
    hydratedRef.current = true;
    hydrateMutation.mutate(stored as never);
  }, [enabled, hydrateMutation]);
}

export function persistDemoAdminFinanceSnapshot(snapshot: DemoAdminFinanceSnapshot): void {
  if (!isLocalDemoDev()) return;
  const existing = loadDemoAdminFinanceSnapshot() ?? {};
  saveDemoAdminFinanceSnapshot({ ...existing, ...snapshot });
}
