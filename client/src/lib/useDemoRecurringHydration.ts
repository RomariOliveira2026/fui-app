import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoRecurringSchedules } from "@/lib/demoRecurringStorage";

/** Sincroniza séries recorrentes demo entre localStorage e memória do servidor. */
export function useDemoRecurringHydration() {
  const utils = trpc.useUtils();
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.scheduling.hydrateDemoRecurring.useMutation({
    onSuccess: async () => {
      await utils.scheduling.getRecurringSchedules.invalidate();
    },
  });

  useEffect(() => {
    if (!isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoRecurringSchedules();
    if (stored.length === 0) return;
    hydratedRef.current = true;
    hydrateMutation.mutate({ schedules: stored as never });
  }, [hydrateMutation]);
}
