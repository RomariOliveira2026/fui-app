import type { DeliveryOrder } from "../../../drizzle/schema";

export const FUI_DEMO_DELIVERY_ORDERS_KEY = "fui_demo_delivery_orders";

function reviveOrder(raw: DeliveryOrder): DeliveryOrder {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    pickedUpAt: raw.pickedUpAt ? new Date(raw.pickedUpAt) : null,
    deliveredAt: raw.deliveredAt ? new Date(raw.deliveredAt) : null,
    cancelledAt: raw.cancelledAt ? new Date(raw.cancelledAt) : null,
  };
}

export function loadDemoDeliveryOrders(): DeliveryOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_DELIVERY_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeliveryOrder[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(reviveOrder);
  } catch {
    return [];
  }
}

export function saveDemoDeliveryOrders(orders: DeliveryOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_DELIVERY_ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.warn("[demoDeliveryStorage] save failed:", error);
  }
}

export function upsertDemoDeliveryOrder(order: DeliveryOrder): void {
  const orders = loadDemoDeliveryOrders().filter((o) => o.id !== order.id);
  orders.unshift(reviveOrder(order));
  saveDemoDeliveryOrders(orders);
}

export function isDemoDeliveryIdClient(id: number): boolean {
  return id >= 800_001;
}
