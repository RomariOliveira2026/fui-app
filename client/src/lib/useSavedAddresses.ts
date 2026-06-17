import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  ensureDemoHomeAddressSeed,
  loadDemoSavedAddresses,
  type DemoSavedAddress,
} from "@/lib/demoSavedAddresses";

/** Endereços salvos — demo via localStorage; produção via API. */
export function useSavedAddresses() {
  const { canUsePrivateUserApi, isDemoUser } = useAuth();
  const utils = trpc.useUtils();
  const isDemo = isLocalDemoDev() || isDemoUser;

  const apiQuery = trpc.user.getSavedAddresses.useQuery(undefined, {
    enabled: !isDemo && canUsePrivateUserApi,
    retry: false,
  });

  const [localAddresses, setLocalAddresses] = useState<DemoSavedAddress[]>(() =>
    isDemo ? ensureDemoHomeAddressSeed() : []
  );

  const syncLocalCache = useCallback(
    (addresses: DemoSavedAddress[]) => {
      setLocalAddresses(addresses);
      utils.user.getSavedAddresses.setData(undefined, addresses as never);
    },
    [utils]
  );

  useEffect(() => {
    if (!isDemo) return;
    syncLocalCache(ensureDemoHomeAddressSeed());
  }, [isDemo, syncLocalCache]);

  return {
    isDemo,
    savedAddresses: isDemo ? localAddresses : (apiQuery.data ?? []),
    isLoading: isDemo ? false : apiQuery.isLoading,
    refreshLocal: () => syncLocalCache(loadDemoSavedAddresses()),
    setLocalAddresses: syncLocalCache,
  };
}
