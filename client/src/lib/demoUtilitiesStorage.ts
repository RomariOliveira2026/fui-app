import type { UtilityOrder as UtilityOrderType } from "@shared/utilities";

export const FUI_DEMO_UTILITY_ORDERS_KEY = "fui_demo_utility_orders";

export function loadDemoUtilityOrders(): UtilityOrderType[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_UTILITY_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UtilityOrderType[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDemoUtilityOrders(orders: UtilityOrderType[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_UTILITY_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function upsertDemoUtilityOrder(order: UtilityOrderType): void {
  const orders = loadDemoUtilityOrders().filter((o) => o.id !== order.id);
  orders.unshift(order);
  saveDemoUtilityOrders(orders);
}

export function isDemoUtilityIdClient(id: number): boolean {
  return id >= 850_001;
}
