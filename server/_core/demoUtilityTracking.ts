import type { UtilityOrder, UtilityOrderStatus } from "@shared/utilities";
import { parseUtilityMapPoint } from "@shared/utilityTracking";
import { getDemoDriverLocationCoords } from "./demoDriver";
import { updateDemoUtilityOrder } from "./demoUtilities";

const ITABAIANA_CENTER = { lat: -10.6833, lng: -37.425 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function lerpPoint(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } {
  return { lat: lerp(from.lat, to.lat, t), lng: lerp(from.lng, to.lng, t) };
}

function defaultDriverStart(driverId: number): { lat: number; lng: number } {
  const offset = (driverId % 5) * 0.003;
  return { lat: ITABAIANA_CENTER.lat + offset, lng: ITABAIANA_CENTER.lng - offset * 0.5 };
}

function positionForStatus(
  order: UtilityOrder,
  status: UtilityOrderStatus
): { lat: number; lng: number } | null {
  const origin = parseUtilityMapPoint(order.originLat, order.originLng);
  const destination = parseUtilityMapPoint(order.destinationLat, order.destinationLng);
  if (!origin || !destination) return null;

  const driverId = order.driverId ?? 0;
  const start =
    getDemoDriverLocationCoords(driverId) ?? defaultDriverStart(driverId);

  switch (status) {
    case "accepted":
      return lerpPoint(start, origin, 0.65);
    case "picking_up":
      return origin;
    case "in_transit":
      return lerpPoint(origin, destination, 0.45);
    case "arriving":
      return lerpPoint(origin, destination, 0.88);
    case "completed":
      return destination;
    default:
      return null;
  }
}

function formatCoord(value: number): string {
  return value.toFixed(6);
}

/** Define posição inicial do prestador ao aceitar o pedido. */
export function seedDemoUtilityDriverPosition(order: UtilityOrder): UtilityOrder | undefined {
  if (!order.driverId) return order;
  const pos = positionForStatus(order, "accepted");
  if (!pos) return order;
  return updateDemoUtilityOrder(order.id, {
    driverCurrentLat: formatCoord(pos.lat),
    driverCurrentLng: formatCoord(pos.lng),
  });
}

/** Atualiza posição do prestador conforme avanço de status. */
export function syncDemoUtilityDriverPositionForStatus(
  orderId: number,
  status: UtilityOrderStatus,
  order: UtilityOrder
): UtilityOrder | undefined {
  if (!order.driverId) return order;
  const pos = positionForStatus(order, status);
  if (!pos) return order;
  return updateDemoUtilityOrder(orderId, {
    driverCurrentLat: formatCoord(pos.lat),
    driverCurrentLng: formatCoord(pos.lng),
  });
}

/** Anima deslocamento em trânsito (demo) com base no tempo desde última atualização. */
export function tickDemoUtilityDriverPosition(order: UtilityOrder): UtilityOrder {
  if (!order.driverId || !["in_transit", "arriving", "accepted"].includes(order.status)) {
    return order;
  }

  const origin = parseUtilityMapPoint(order.originLat, order.originLng);
  const destination = parseUtilityMapPoint(order.destinationLat, order.destinationLng);
  if (!origin || !destination) return order;

  const elapsedMs = Date.now() - new Date(order.updatedAt).getTime();
  const cycleMs = order.status === "accepted" ? 90_000 : 120_000;
  const baseT =
    order.status === "accepted"
      ? 0.45
      : order.status === "in_transit"
        ? 0.35
        : 0.78;
  const drift = Math.min(0.35, elapsedMs / cycleMs);
  const t = Math.min(0.95, baseT + drift);

  const from = order.status === "accepted" ? defaultDriverStart(order.driverId) : origin;
  const to = order.status === "accepted" ? origin : destination;
  const pos = lerpPoint(from, to, t);

  const lat = formatCoord(pos.lat);
  const lng = formatCoord(pos.lng);
  if (order.driverCurrentLat === lat && order.driverCurrentLng === lng) {
    return order;
  }

  return (
    updateDemoUtilityOrder(order.id, {
      driverCurrentLat: lat,
      driverCurrentLng: lng,
    }) ?? order
  );
}

export function withLiveUtilityTracking(order: UtilityOrder): UtilityOrder {
  return tickDemoUtilityDriverPosition(order);
}
