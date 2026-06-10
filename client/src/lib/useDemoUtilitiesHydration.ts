import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoUtilityOrders, upsertDemoUtilityOrder } from "@/lib/demoUtilitiesStorage";
import { loadDemoUtilityChatMessages } from "@/lib/demoUtilityChatStorage";
import { persistDemoUtilitySnapshot } from "@/lib/demoUtilityProviderStorage";
import type { UtilityOrder } from "@shared/utilities";

export function useDemoUtilitiesHydration() {
  const utils = trpc.useUtils();
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.utilities.hydrateDemoState.useMutation({
    onSuccess: async () => {
      await utils.utilities.myOrders.invalidate();
      await utils.utilities.getById.invalidate();
    },
  });
  const chatHydrateMutation = trpc.utilityChat.hydrateDemoState.useMutation();

  useEffect(() => {
    if (!isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoUtilityOrders();
    const chat = loadDemoUtilityChatMessages();
    if (stored.length === 0 && chat.length === 0) return;
    hydratedRef.current = true;
    if (stored.length > 0) {
      hydrateMutation.mutate({ orders: stored as never });
    }
    if (chat.length > 0) {
      chatHydrateMutation.mutate({ messages: chat });
    }
  }, [hydrateMutation, chatHydrateMutation]);
}

export function persistDemoUtilityFromServer(order: UtilityOrder): void {
  if (!isLocalDemoDev() || order.id < 850_001) return;
  upsertDemoUtilityOrder(order);
}

export function persistDemoUtilityDispatcherSnapshot(snapshot: {
  orders?: UtilityOrder[];
  offers?: unknown[];
  profiles?: unknown[];
}): void {
  if (!isLocalDemoDev()) return;
  if (snapshot.orders?.length) {
    saveDemoUtilityOrdersFromSnapshot(snapshot.orders);
  }
  persistDemoUtilitySnapshot(snapshot as never);
}

function saveDemoUtilityOrdersFromSnapshot(orders: UtilityOrder[]): void {
  const existing = loadDemoUtilityOrders();
  const byId = new Map(existing.map((o) => [o.id, o]));
  for (const order of orders) {
    byId.set(order.id, order);
  }
  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  try {
    localStorage.setItem("fui_demo_utility_orders", JSON.stringify(merged));
  } catch {
    // ignore
  }
}
