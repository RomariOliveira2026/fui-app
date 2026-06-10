import type { DeliveryOrder, InsertDeliveryOrder } from "../../drizzle/schema";
import {
  appendDeliveryStatusEvent,
  createInitialDeliveryPremiumMeta,
  type DeliveryPremiumMeta,
  type DeliveryStatus,
} from "@shared/deliveryPremium";

/** IDs de entregas demo em memória (não colidem com auto-increment do MySQL). */
const DEMO_DELIVERY_ID_START = 800_001;

const demoOrders = new Map<number, DeliveryOrder>();
let nextDemoDeliveryId = DEMO_DELIVERY_ID_START;

export function isDemoDeliveryId(id: number): boolean {
  return id >= DEMO_DELIVERY_ID_START;
}

function generateTrackingCode(): string {
  return (
    "FUI" +
    Date.now().toString(36).toUpperCase().slice(-6) +
    Math.random().toString(36).substring(2, 4).toUpperCase()
  );
}

function buildDemoDeliveryOrder(
  values: InsertDeliveryOrder & { id: number; trackingCode: string }
): DeliveryOrder {
  const now = new Date();
  const status = (values.status ?? "requested") as DeliveryStatus;
  return {
    id: values.id,
    senderId: values.senderId,
    driverId: values.driverId ?? null,
    status: values.status ?? "requested",
    pickupAddress: values.pickupAddress,
    pickupLat: values.pickupLat,
    pickupLng: values.pickupLng,
    pickupContactName: values.pickupContactName ?? null,
    pickupContactPhone: values.pickupContactPhone ?? null,
    deliveryAddress: values.deliveryAddress,
    deliveryLat: values.deliveryLat,
    deliveryLng: values.deliveryLng,
    recipientName: values.recipientName,
    recipientPhone: values.recipientPhone,
    packageType: values.packageType,
    packageDescription: values.packageDescription ?? null,
    estimatedWeight: values.estimatedWeight ?? null,
    isFragile: values.isFragile ?? false,
    requiresSignature: values.requiresSignature ?? false,
    distance: values.distance ?? null,
    duration: values.duration ?? null,
    estimatedPrice: values.estimatedPrice ?? null,
    finalPrice: values.finalPrice ?? null,
    paymentMethod: values.paymentMethod,
    paymentStatus: values.paymentStatus ?? "pending",
    trackingCode: values.trackingCode,
    proofOfDeliveryUrl: values.proofOfDeliveryUrl ?? null,
    deliveryPremiumMeta:
      values.deliveryPremiumMeta ?? createInitialDeliveryPremiumMeta(status),
    createdAt: now,
    updatedAt: now,
    pickedUpAt: values.pickedUpAt ?? null,
    deliveredAt: values.deliveredAt ?? null,
    cancelledAt: values.cancelledAt ?? null,
  };
}

export function createDemoDeliveryOrder(values: InsertDeliveryOrder): DeliveryOrder {
  const id = nextDemoDeliveryId++;
  const trackingCode = generateTrackingCode();
  const order = buildDemoDeliveryOrder({ ...values, id, trackingCode });
  demoOrders.set(id, order);
  return order;
}

export function getDemoDeliveryOrder(id: number): DeliveryOrder | undefined {
  return demoOrders.get(id);
}

export function getDemoDeliveryOrdersBySender(senderId: number): DeliveryOrder[] {
  return Array.from(demoOrders.values())
    .filter((order) => order.senderId === senderId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getDemoDeliveryOrdersByDriver(driverId: number): DeliveryOrder[] {
  return Array.from(demoOrders.values())
    .filter((order) => order.driverId === driverId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getAllDemoDeliveryOrders(): DeliveryOrder[] {
  return Array.from(demoOrders.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function getDemoDeliveryOrderByTrackingCode(
  trackingCode: string
): DeliveryOrder | undefined {
  const normalized = trackingCode.trim().toUpperCase();
  return Array.from(demoOrders.values()).find(
    (order) => order.trackingCode?.toUpperCase() === normalized
  );
}

export function updateDemoDeliveryOrder(
  id: number,
  updates: Partial<DeliveryOrder>
): DeliveryOrder | undefined {
  const order = demoOrders.get(id);
  if (!order) return undefined;
  const updated: DeliveryOrder = { ...order, ...updates, updatedAt: new Date() };
  demoOrders.set(id, updated);
  return updated;
}

export function updateDemoDeliveryStatus(
  id: number,
  status: DeliveryStatus,
  extra?: Partial<DeliveryOrder>
): DeliveryOrder | undefined {
  const order = demoOrders.get(id);
  if (!order) return undefined;

  let deliveryPremiumMeta = appendDeliveryStatusEvent(
    order.deliveryPremiumMeta as DeliveryPremiumMeta | null,
    status
  );

  const updates: Partial<DeliveryOrder> = {
    status,
    deliveryPremiumMeta,
    ...extra,
  };

  if (status === "picked_up" && !order.pickedUpAt) {
    updates.pickedUpAt = new Date();
  }
  if (status === "delivered" && !order.deliveredAt) {
    updates.deliveredAt = new Date();
    updates.finalPrice = order.finalPrice ?? order.estimatedPrice;
  }
  if (status === "cancelled" && !order.cancelledAt) {
    updates.cancelledAt = new Date();
  }

  return updateDemoDeliveryOrder(id, updates);
}

function parseOrderDates(order: DeliveryOrder): DeliveryOrder {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    pickedUpAt: order.pickedUpAt ? new Date(order.pickedUpAt) : null,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
  };
}

/** Restaura entregas demo enviadas pelo cliente (localStorage). */
export function hydrateDemoDeliveryOrders(orders: DeliveryOrder[]): void {
  for (const raw of orders) {
    if (!isDemoDeliveryId(raw.id)) continue;
    const order = parseOrderDates(raw);
    const existing = demoOrders.get(order.id);
    if (existing && existing.updatedAt.getTime() > order.updatedAt.getTime()) {
      continue;
    }
    demoOrders.set(order.id, order);
    if (order.id >= nextDemoDeliveryId) {
      nextDemoDeliveryId = order.id + 1;
    }
  }
}

export function toPublicDeliveryTrackInfo(order: DeliveryOrder) {
  const meta = order.deliveryPremiumMeta;
  return {
    id: order.id,
    status: order.status,
    packageType: order.packageType,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    trackingCode: order.trackingCode,
    createdAt: order.createdAt,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    statusHistory: meta?.statusHistory ?? [],
    hasProof: !!order.proofOfDeliveryUrl,
    signatureConfirmed: meta?.signatureConfirmed ?? false,
  };
}

export function toDeliveryTrackingDetails(order: DeliveryOrder) {
  const meta = order.deliveryPremiumMeta;
  return {
    ...order,
    confirmationCode: meta?.confirmationCode ?? null,
    statusHistory: meta?.statusHistory ?? [],
    signatureConfirmed: meta?.signatureConfirmed ?? false,
    signatureName: meta?.signatureName ?? null,
  };
}
