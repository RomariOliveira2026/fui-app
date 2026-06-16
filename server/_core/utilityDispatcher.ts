import type { UtilityOrder } from "@shared/utilities";
import type { UtilityProviderProfile } from "@shared/utilityProvider";
import { evaluateUtilityProviderMatch } from "@shared/utilityDispatcher";
import { haversineMeters } from "@shared/demoMaps";
import {
  createDemoUtilityOffer,
  driverHasDemoUtilityPendingOffer,
  exportDemoUtilityOffers,
  getDemoUtilityOffersForOrder,
  getDemoUtilityPendingOffersForDriver,
  hydrateDemoUtilityOffers,
  isDemoUtilityOfferDeclined,
} from "./demoUtilityOffers";
import {
  exportDemoUtilityOrders,
  getDemoAvailableUtilityOrders,
  getDemoUtilityOrder,
} from "./demoUtilities";
import {
  exportDemoUtilityProviderProfiles,
  getDemoUtilityProviderProfile,
} from "./demoUtilityProvider";
import { BRAZIL_MAP_CENTER } from "@shared/mapDefaults";
import { getDemoDriverLocationCoords } from "./demoDriver";

const DEMO_DISPATCH_FALLBACK_CENTER = BRAZIL_MAP_CENTER;

export function parseUtilityCoord(value: string | number | null | undefined): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

function defaultProviderCoords(
  driverId: number,
  near?: { lat: number; lng: number }
): { lat: number; lng: number } {
  const base = near ?? DEMO_DISPATCH_FALLBACK_CENTER;
  const offset = (driverId % 5) * 0.002;
  return {
    lat: base.lat + offset,
    lng: base.lng - offset * 0.5,
  };
}

export function getProviderDistanceToOrderOriginMeters(
  driverId: number,
  order: UtilityOrder
): number | null {
  const originLat = parseUtilityCoord(order.originLat);
  const originLng = parseUtilityCoord(order.originLng);
  if (originLat == null || originLng == null) return null;

  const origin = { lat: originLat, lng: originLng };
  const coords =
    getDemoDriverLocationCoords(driverId) ?? defaultProviderCoords(driverId, origin);

  return Math.round(
    haversineMeters({ lat: originLat, lng: originLng }, coords)
  );
}

export function isOrderCompatibleWithProvider(
  order: UtilityOrder,
  profile: UtilityProviderProfile,
  driverId: number
): boolean {
  const distanceMeters = getProviderDistanceToOrderOriginMeters(driverId, order);
  const match = evaluateUtilityProviderMatch(order, profile, {
    distanceToOriginMeters: distanceMeters ?? undefined,
    declined: isDemoUtilityOfferDeclined(order.id, driverId),
  });
  return match.compatible;
}

function findCompatibleProvidersForOrder(order: UtilityOrder): Array<{
  driverId: number;
  profile: UtilityProviderProfile;
  distanceToOriginMeters: number;
}> {
  const eligible: Array<{
    driverId: number;
    profile: UtilityProviderProfile;
    distanceToOriginMeters: number;
  }> = [];

  for (const profile of exportDemoUtilityProviderProfiles()) {
    if (!profile.isActive) continue;
    const driverId = profile.driverId;
    if (isDemoUtilityOfferDeclined(order.id, driverId)) continue;

    const distanceToOriginMeters = getProviderDistanceToOrderOriginMeters(driverId, order);
    if (distanceToOriginMeters == null) continue;

    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters,
      declined: false,
    });
    if (!match.compatible) continue;

    eligible.push({ driverId, profile, distanceToOriginMeters });
  }

  return eligible.sort((a, b) => a.distanceToOriginMeters - b.distanceToOriginMeters);
}

/** Gera ofertas para prestadores compatíveis com o pedido. */
export function createUtilityOffers(order: UtilityOrder): void {
  if (order.driverId || !["waiting_driver", "requested"].includes(order.status)) {
    return;
  }

  const compatible = findCompatibleProvidersForOrder(order);
  for (const { driverId, distanceToOriginMeters } of compatible) {
    if (driverHasDemoUtilityPendingOffer(order.id, driverId)) continue;
    const existing = getDemoUtilityOffersForOrder(order.id).find(
      (o) => o.driverId === driverId && o.status !== "pending"
    );
    if (existing?.status === "declined" || existing?.status === "superseded") continue;

    createDemoUtilityOffer({
      orderId: order.id,
      driverId,
      distanceToOriginMeters,
      offerRound: 1,
    });
  }
}

/** Recria ofertas pendentes para pedidos aguardando (ex.: perfil recém-configurado). */
export function ensureUtilityOffersForWaitingOrders(): void {
  for (const order of getDemoAvailableUtilityOrders()) {
    createUtilityOffers(order);
  }
}

/** Garante ofertas para um prestador específico (perfil recém-ativado ou pedido anterior). */
export function ensureUtilityOffersForProvider(driverId: number): void {
  const profile = getDemoUtilityProviderProfile(driverId);
  if (!profile.isActive) return;

  for (const order of getDemoAvailableUtilityOrders()) {
    if (isDemoUtilityOfferDeclined(order.id, driverId)) continue;
    if (driverHasDemoUtilityPendingOffer(order.id, driverId)) continue;

    const existing = getDemoUtilityOffersForOrder(order.id).find(
      (o) => o.driverId === driverId
    );
    if (
      existing &&
      ["declined", "superseded", "accepted"].includes(existing.status)
    ) {
      continue;
    }

    const distanceToOriginMeters = getProviderDistanceToOrderOriginMeters(driverId, order);
    if (distanceToOriginMeters == null) continue;

    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters,
    });
    if (!match.compatible) continue;

    createDemoUtilityOffer({
      orderId: order.id,
      driverId,
      distanceToOriginMeters,
      offerRound: 1,
    });
  }
}

/** Pedidos disponíveis para um prestador (com oferta pendente + compatibilidade). */
export function getAvailableUtilityOrdersForProvider(
  driverId: number,
  profile?: UtilityProviderProfile
): UtilityOrder[] {
  const providerProfile = profile ?? getDemoUtilityProviderProfile(driverId);
  if (!providerProfile.isActive) return [];

  ensureUtilityOffersForWaitingOrders();
  ensureUtilityOffersForProvider(driverId);

  const pendingOrderIds = new Set(
    getDemoUtilityPendingOffersForDriver(driverId).map((o) => o.orderId)
  );

  return getDemoAvailableUtilityOrders()
    .filter((order) => {
      if (!pendingOrderIds.has(order.id)) return false;
      return isOrderCompatibleWithProvider(order, providerProfile, driverId);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function hydrateDemoUtilityDispatcherState(input: {
  offers?: Parameters<typeof hydrateDemoUtilityOffers>[0];
}): void {
  if (input.offers?.length) {
    hydrateDemoUtilityOffers(input.offers);
  }
}

export function exportUtilityDispatcherSnapshot() {
  return {
    orders: exportDemoUtilityOrders(),
    offers: exportDemoUtilityOffers(),
    profiles: exportDemoUtilityProviderProfiles(),
  };
}
