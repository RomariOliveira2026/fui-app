import type { UtilityOrder, UtilityOrderStatus } from "@shared/utilities";
import {
  appendUtilityStatusEvent,
  createInitialUtilityMeta,
} from "@shared/utilities";
import { cancelDemoUtilityOffersForOrder, resolveDemoUtilityOffersOnAccept } from "./demoUtilityOffers";
import {
  seedDemoUtilityDriverPosition,
  syncDemoUtilityDriverPositionForStatus,
} from "./demoUtilityTracking";

export const DEMO_UTILITY_ID_START = 850_001;

const demoOrders = new Map<number, UtilityOrder>();
let nextDemoUtilityId = DEMO_UTILITY_ID_START;

export function isDemoUtilityId(id: number): boolean {
  return id >= DEMO_UTILITY_ID_START;
}

export function hydrateDemoUtilityOrders(orders: UtilityOrder[]): void {
  for (const order of orders) {
    demoOrders.set(order.id, { ...order });
    if (order.id >= nextDemoUtilityId) nextDemoUtilityId = order.id + 1;
  }
}

/** Apenas testes — limpa store demo de pedidos utilitários. */
export function resetDemoUtilityOrdersForTests(): void {
  demoOrders.clear();
  declinedByDriver.clear();
  nextDemoUtilityId = DEMO_UTILITY_ID_START;
}

export function exportDemoUtilityOrders(): UtilityOrder[] {
  return Array.from(demoOrders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createDemoUtilityOrder(
  values: Omit<UtilityOrder, "id" | "createdAt" | "updatedAt" | "utilityMeta"> & {
    utilityMeta?: UtilityOrder["utilityMeta"];
  }
): UtilityOrder {
  const now = new Date().toISOString();
  const id = nextDemoUtilityId++;
  const order: UtilityOrder = {
    ...values,
    id,
    driverId: values.driverId ?? null,
    utilityMeta: values.utilityMeta ?? createInitialUtilityMeta(values.status),
    createdAt: now,
    updatedAt: now,
    completedAt: values.completedAt ?? null,
    cancelledAt: values.cancelledAt ?? null,
  };
  demoOrders.set(id, order);
  return order;
}

export function getDemoUtilityOrder(id: number): UtilityOrder | undefined {
  return demoOrders.get(id);
}

export function getDemoUtilityOrdersBySender(senderId: number): UtilityOrder[] {
  return Array.from(demoOrders.values())
    .filter((o) => o.senderId === senderId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDemoUtilityOrdersByDriver(driverId: number): UtilityOrder[] {
  return Array.from(demoOrders.values())
    .filter((o) => o.driverId === driverId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDemoAvailableUtilityOrders(): UtilityOrder[] {
  return Array.from(demoOrders.values())
    .filter((o) => !o.driverId && (o.status === "waiting_driver" || o.status === "requested"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const declinedByDriver = new Map<number, Set<number>>();

/** @deprecated use declineDemoUtilityOffer from demoUtilityOffers */
export function declineDemoUtilityOrder(orderId: number, driverId: number): void {
  const set = declinedByDriver.get(driverId) ?? new Set();
  set.add(orderId);
  declinedByDriver.set(driverId, set);
}

/** @deprecated use isDemoUtilityOfferDeclined */
export function isDemoUtilityDeclined(orderId: number, driverId: number): boolean {
  return declinedByDriver.get(driverId)?.has(orderId) ?? false;
}

export function acceptDemoUtilityOrder(orderId: number, driverId: number): UtilityOrder | undefined {
  const order = demoOrders.get(orderId);
  if (!order || order.driverId || !["waiting_driver", "requested"].includes(order.status)) {
    return undefined;
  }
  const utilityMeta = appendUtilityStatusEvent(order.utilityMeta, "accepted");
  const updated = updateDemoUtilityOrder(orderId, {
    driverId,
    status: "accepted",
    utilityMeta,
  });
  if (updated) {
    resolveDemoUtilityOffersOnAccept(orderId, driverId);
    return seedDemoUtilityDriverPosition(updated);
  }
  return updated;
}

export function advanceDemoUtilityStatusForDriver(
  id: number,
  driverId: number
): UtilityOrder | undefined {
  const order = demoOrders.get(id);
  if (!order || order.driverId !== driverId) return undefined;
  return advanceDemoUtilityStatus(id);
}

export function updateDemoUtilityOrder(
  id: number,
  patch: Partial<UtilityOrder>
): UtilityOrder | undefined {
  const existing = demoOrders.get(id);
  if (!existing) return undefined;
  const updated: UtilityOrder = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  demoOrders.set(id, updated);
  return updated;
}

const DEMO_STATUS_FLOW: UtilityOrderStatus[] = [
  "requested",
  "waiting_driver",
  "accepted",
  "picking_up",
  "in_transit",
  "arriving",
  "completed",
];

export function getNextDemoUtilityStatus(current: UtilityOrderStatus): UtilityOrderStatus | null {
  if (current === "cancelled" || current === "completed") return null;
  const idx = DEMO_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= DEMO_STATUS_FLOW.length - 1) return null;
  return DEMO_STATUS_FLOW[idx + 1];
}

export function advanceDemoUtilityStatus(id: number): UtilityOrder | undefined {
  const order = demoOrders.get(id);
  if (!order) return undefined;
  const next = getNextDemoUtilityStatus(order.status);
  if (!next) return order;

  const utilityMeta = appendUtilityStatusEvent(order.utilityMeta, next);
  const patch: Partial<UtilityOrder> = {
    status: next,
    utilityMeta,
    completedAt: next === "completed" ? new Date().toISOString() : order.completedAt,
    finalPrice: next === "completed" ? order.estimatedPrice : order.finalPrice,
    paymentStatus: next === "completed" && order.paymentMethod === "cash" ? "paid" : order.paymentStatus,
  };
  const updated = updateDemoUtilityOrder(id, patch);
  if (updated && order.driverId) {
    return syncDemoUtilityDriverPositionForStatus(id, next, updated) ?? updated;
  }
  return updated;
}

export function cancelDemoUtilityOrder(id: number): UtilityOrder | undefined {
  const order = demoOrders.get(id);
  if (!order || order.status === "completed" || order.status === "cancelled") return undefined;
  const utilityMeta = appendUtilityStatusEvent(order.utilityMeta, "cancelled");
  const updated = updateDemoUtilityOrder(id, {
    status: "cancelled",
    utilityMeta,
    cancelledAt: new Date().toISOString(),
  });
  if (updated) cancelDemoUtilityOffersForOrder(id);
  return updated;
}
