import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  loadDemoUtilityProviderSnapshot,
  persistDemoUtilitySnapshot,
} from "@/lib/demoUtilityProviderStorage";

export function useDemoUtilityProviderHydration(enabled = true) {
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.utilityProvider.hydrateDemoState.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!enabled || !isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoUtilityProviderSnapshot();
    if (!stored?.orders?.length && !stored?.profiles?.length && !stored?.offers?.length) return;
    hydratedRef.current = true;
    hydrateMutation.mutate(
      { orders: stored.orders, profiles: stored.profiles, offers: stored.offers },
      {
        onSuccess: () => {
          void utils.utilityProvider.getAvailableOrders.invalidate();
          void utils.utilityProvider.getActiveOrders.invalidate();
        },
      }
    );
  }, [enabled, hydrateMutation, utils]);
}

export function persistUtilityProviderDemoSnapshot(snapshot: {
  orders?: unknown[];
  profiles?: unknown[];
  offers?: unknown[];
}): void {
  if (!isLocalDemoDev()) return;
  persistDemoUtilitySnapshot(snapshot as never);
}
