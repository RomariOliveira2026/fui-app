import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoDriverPremiumPrefs, saveDemoDriverPremiumPrefs } from "@/lib/demoDriverPremiumStorage";
import type { DriverPremiumPreferences } from "@shared/driverPremium";

export function useDemoDriverPremiumHydration(driverProfileId?: number) {
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.driverPremium.hydrateDemoPreferences.useMutation();

  useEffect(() => {
    if (!isLocalDemoDev() || !driverProfileId || hydratedRef.current) return;
    const stored = loadDemoDriverPremiumPrefs();
    if (!stored) return;
    hydratedRef.current = true;
    hydrateMutation.mutate({ preferences: stored });
  }, [driverProfileId, hydrateMutation]);
}

export function persistDemoDriverPremiumPrefs(prefs: DriverPremiumPreferences): void {
  if (!isLocalDemoDev()) return;
  saveDemoDriverPremiumPrefs(prefs);
}
