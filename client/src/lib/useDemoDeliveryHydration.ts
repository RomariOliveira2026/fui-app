import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoDeliveryOrders, upsertDemoDeliveryOrder } from "@/lib/demoDeliveryStorage";
import type { DeliveryOrder } from "../../../drizzle/schema";

/** Sincroniza entregas demo entre localStorage e memória do servidor. */
export function useDemoDeliveryHydration() {
  const utils = trpc.useUtils();
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.delivery.hydrateDemoState.useMutation({
    onSuccess: async () => {
      await utils.delivery.myOrders.invalidate();
      await utils.delivery.getById.invalidate();
    },
  });

  useEffect(() => {
    if (!isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoDeliveryOrders();
    if (stored.length === 0) return;
    hydratedRef.current = true;
    hydrateMutation.mutate({ orders: stored as never });
  }, [hydrateMutation]);
}

export function persistDemoDeliveryFromServer(order: DeliveryOrder): void {
  if (!isLocalDemoDev() || order.id < 800_001) return;
  upsertDemoDeliveryOrder(order);
}
