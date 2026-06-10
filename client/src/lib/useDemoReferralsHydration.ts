import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  loadDemoReferralsSnapshot,
  saveDemoReferralsSnapshot,
} from "@/lib/demoReferralsStorage";
import type { DemoReferralsSnapshot } from "@shared/demoReferrals";

export function useDemoReferralsHydration(enabled = true) {
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.referrals.hydrateDemoState.useMutation();

  useEffect(() => {
    if (!enabled || !isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoReferralsSnapshot();
    if (!stored) return;
    hydratedRef.current = true;
    hydrateMutation.mutate(stored);
  }, [enabled, hydrateMutation]);
}

export function persistDemoReferralsSnapshot(snapshot: DemoReferralsSnapshot): void {
  if (!isLocalDemoDev()) return;
  saveDemoReferralsSnapshot(snapshot);
}
