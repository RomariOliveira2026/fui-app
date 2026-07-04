import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  loadDemoAdminCampaignsSnapshot,
  saveDemoAdminCampaignsSnapshot,
  type DemoAdminCampaignsSnapshot,
} from "@/lib/demoAdminCampaignsStorage";

export function useDemoAdminCampaignsHydration(enabled = true) {
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.adminCampaigns.hydrateDemoState.useMutation();

  useEffect(() => {
    if (!enabled || !isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoAdminCampaignsSnapshot();
    if (!stored) return;
    hydratedRef.current = true;
    hydrateMutation.mutate(stored as never);
  }, [enabled, hydrateMutation]);
}

export function persistDemoAdminCampaignsSnapshot(snapshot: DemoAdminCampaignsSnapshot): void {
  if (!isLocalDemoDev()) return;
  const existing = loadDemoAdminCampaignsSnapshot() ?? {};
  saveDemoAdminCampaignsSnapshot({ ...existing, ...snapshot });
}
