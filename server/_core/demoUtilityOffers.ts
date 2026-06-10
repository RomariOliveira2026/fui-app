import type { UtilityOffer, UtilityOfferStatus } from "@shared/utilityDispatcher";

const DEMO_UTILITY_OFFER_ID_START = 960_001;

const offersById = new Map<number, UtilityOffer>();
let nextOfferId = DEMO_UTILITY_OFFER_ID_START;

export function isDemoUtilityOfferId(id: number): boolean {
  return id >= DEMO_UTILITY_OFFER_ID_START;
}

export function createDemoUtilityOffer(input: {
  orderId: number;
  driverId: number;
  distanceToOriginMeters: number;
  offerRound?: number;
}): UtilityOffer {
  const now = new Date().toISOString();
  const offer: UtilityOffer = {
    id: nextOfferId++,
    orderId: input.orderId,
    driverId: input.driverId,
    status: "pending",
    distanceToOriginMeters: input.distanceToOriginMeters,
    offerRound: input.offerRound ?? 1,
    createdAt: now,
    updatedAt: now,
  };
  offersById.set(offer.id, offer);
  return offer;
}

export function getDemoUtilityOffersForOrder(orderId: number): UtilityOffer[] {
  return Array.from(offersById.values()).filter((o) => o.orderId === orderId);
}

export function getDemoUtilityPendingOfferForDriver(
  orderId: number,
  driverId: number
): UtilityOffer | undefined {
  return getDemoUtilityOffersForOrder(orderId).find(
    (o) => o.driverId === driverId && o.status === "pending"
  );
}

export function driverHasDemoUtilityPendingOffer(orderId: number, driverId: number): boolean {
  return !!getDemoUtilityPendingOfferForDriver(orderId, driverId);
}

export function isDemoUtilityOfferDeclined(orderId: number, driverId: number): boolean {
  return getDemoUtilityOffersForOrder(orderId).some(
    (o) => o.driverId === driverId && o.status === "declined"
  );
}

export function updateDemoUtilityOfferStatus(
  offerId: number,
  status: UtilityOfferStatus
): UtilityOffer | undefined {
  const offer = offersById.get(offerId);
  if (!offer) return undefined;
  const updated: UtilityOffer = {
    ...offer,
    status,
    updatedAt: new Date().toISOString(),
  };
  offersById.set(offerId, updated);
  return updated;
}

export function resolveDemoUtilityOffersOnAccept(orderId: number, driverId: number): void {
  for (const offer of getDemoUtilityOffersForOrder(orderId)) {
    const status: UtilityOfferStatus =
      offer.driverId === driverId && offer.status === "pending"
        ? "accepted"
        : offer.status === "pending"
          ? "superseded"
          : offer.status;
    updateDemoUtilityOfferStatus(offer.id, status);
  }
}

export function declineDemoUtilityOffer(
  orderId: number,
  driverId: number
): UtilityOffer | undefined {
  const pending = getDemoUtilityPendingOfferForDriver(orderId, driverId);
  if (pending) {
    return updateDemoUtilityOfferStatus(pending.id, "declined");
  }
  const now = new Date().toISOString();
  const offer: UtilityOffer = {
    id: nextOfferId++,
    orderId,
    driverId,
    status: "declined",
    distanceToOriginMeters: 0,
    offerRound: 1,
    createdAt: now,
    updatedAt: now,
  };
  offersById.set(offer.id, offer);
  return offer;
}

export function cancelDemoUtilityOffersForOrder(orderId: number): void {
  for (const offer of getDemoUtilityOffersForOrder(orderId)) {
    if (offer.status === "pending") {
      updateDemoUtilityOfferStatus(offer.id, "cancelled");
    }
  }
}

export function exportDemoUtilityOffers(): UtilityOffer[] {
  return Array.from(offersById.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function hydrateDemoUtilityOffers(offers: UtilityOffer[]): void {
  for (const offer of offers) {
    offersById.set(offer.id, { ...offer });
    if (offer.id >= nextOfferId) nextOfferId = offer.id + 1;
  }
}

/** Apenas testes — limpa store demo de ofertas utilitárias. */
export function resetDemoUtilityOffersForTests(): void {
  offersById.clear();
  nextOfferId = DEMO_UTILITY_OFFER_ID_START;
}

export function getDemoUtilityPendingOffersForDriver(driverId: number): UtilityOffer[] {
  return Array.from(offersById.values()).filter(
    (o) => o.driverId === driverId && o.status === "pending"
  );
}
