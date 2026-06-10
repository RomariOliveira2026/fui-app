import type { RideOfferRecord, RideOfferStatus } from "@shared/rideDispatcher";
import { getDispatcherOfferTimeoutMs } from "@shared/rideDispatcher";

const DEMO_OFFER_ID_START = 950_001;

const demoOffersById = new Map<number, RideOfferRecord>();
let nextDemoOfferId = DEMO_OFFER_ID_START;

function parseOfferDates(offer: RideOfferRecord): RideOfferRecord {
  return {
    ...offer,
    createdAt: new Date(offer.createdAt),
    updatedAt: new Date(offer.updatedAt),
    expiresAt: new Date(offer.expiresAt ?? offer.createdAt),
  };
}

export function isDemoOfferStillValid(offer: RideOfferRecord, now = new Date()): boolean {
  return offer.status === "pending" && offer.expiresAt.getTime() > now.getTime();
}

export function createDemoRideOffer(input: {
  rideId: number;
  driverId: number;
  distanceMeters: number;
  offerRound?: number;
}): RideOfferRecord {
  const now = new Date();
  const offer: RideOfferRecord = {
    id: nextDemoOfferId++,
    rideId: input.rideId,
    driverId: input.driverId,
    status: "pending",
    distanceMeters: input.distanceMeters,
    offerRound: input.offerRound ?? 1,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + getDispatcherOfferTimeoutMs()),
  };
  demoOffersById.set(offer.id, offer);
  return offer;
}

export function getDemoOffersForRide(rideId: number): RideOfferRecord[] {
  return Array.from(demoOffersById.values()).filter((o) => o.rideId === rideId);
}

export function getDemoValidPendingOffersForRide(rideId: number): RideOfferRecord[] {
  expireDemoStalePendingOffers(rideId);
  return getDemoOffersForRide(rideId).filter((o) => isDemoOfferStillValid(o));
}

export function getDemoPendingOffersForDriver(driverId: number): RideOfferRecord[] {
  expireDemoStalePendingOffers();
  return Array.from(demoOffersById.values()).filter(
    (o) => o.driverId === driverId && isDemoOfferStillValid(o)
  );
}

export function driverHasDemoPendingOffer(rideId: number, driverId: number): boolean {
  return getDemoPendingOffersForDriver(driverId).some((o) => o.rideId === rideId);
}

export function updateDemoOfferStatus(
  offerId: number,
  status: RideOfferStatus
): RideOfferRecord | undefined {
  const offer = demoOffersById.get(offerId);
  if (!offer) return undefined;
  const updated: RideOfferRecord = { ...offer, status, updatedAt: new Date() };
  demoOffersById.set(offerId, updated);
  return updated;
}

/** Aceite: marca oferta do motorista como accepted e demais como superseded. */
export function resolveDemoOffersOnAccept(rideId: number, driverId: number): void {
  for (const offer of getDemoOffersForRide(rideId)) {
    const status: RideOfferStatus =
      offer.driverId === driverId && offer.status === "pending"
        ? "accepted"
        : offer.status === "pending"
          ? "superseded"
          : offer.status;
    updateDemoOfferStatus(offer.id, status);
  }
}

export function getDemoOfferForDriver(
  rideId: number,
  driverId: number
): RideOfferRecord | undefined {
  return getDemoValidPendingOffersForRide(rideId).find((o) => o.driverId === driverId);
}

export function getDemoOfferDistanceForDriver(
  rideId: number,
  driverId: number
): number | undefined {
  return getDemoOfferForDriver(rideId, driverId)?.distanceMeters;
}

export function getDemoPreviouslyOfferedDriverIds(rideId: number): Set<number> {
  return new Set(getDemoOffersForRide(rideId).map((o) => o.driverId));
}

/** Motoristas que não devem receber nova oferta (recusa, aceite ou pending válida). */
export function getDemoDriversBlockedFromReOffer(rideId: number): Set<number> {
  const blocked = new Set<number>();
  for (const offer of getDemoOffersForRide(rideId)) {
    if (
      offer.status === "declined" ||
      offer.status === "accepted" ||
      isDemoOfferStillValid(offer)
    ) {
      blocked.add(offer.driverId);
    }
  }
  return blocked;
}

export function declineDemoRideOffer(
  rideId: number,
  driverId: number
): RideOfferRecord | undefined {
  const offer = getDemoOffersForRide(rideId).find(
    (o) => o.driverId === driverId && isDemoOfferStillValid(o)
  );
  if (!offer) return undefined;
  return updateDemoOfferStatus(offer.id, "declined");
}

export function countDemoDeclinedOffers(rideId: number): number {
  return getDemoOffersForRide(rideId).filter((o) => o.status === "declined").length;
}

export function getDemoMaxOfferRound(rideId: number): number {
  const offers = getDemoOffersForRide(rideId);
  if (offers.length === 0) return 0;
  return Math.max(...offers.map((o) => o.offerRound));
}

export function hydrateDemoRideOffers(offers: RideOfferRecord[]): void {
  for (const raw of offers) {
    const offer = parseOfferDates(raw);
    demoOffersById.set(offer.id, offer);
    if (offer.id >= nextDemoOfferId) {
      nextDemoOfferId = offer.id + 1;
    }
  }
  expireDemoStalePendingOffers();
}

export function serializeDemoRideOffers(): RideOfferRecord[] {
  return getAllDemoRideOffers();
}

export function getAllDemoRideOffers(): RideOfferRecord[] {
  return Array.from(demoOffersById.values());
}

/** Expira ofertas pendentes vencidas (por tempo). */
export function expireDemoStalePendingOffers(rideId?: number): number {
  const now = new Date();
  let count = 0;

  for (const offer of Array.from(demoOffersById.values())) {
    if (rideId != null && offer.rideId !== rideId) continue;
    if (offer.status !== "pending") continue;
    if (offer.expiresAt.getTime() > now.getTime()) continue;
    updateDemoOfferStatus(offer.id, "expired");
    count++;
  }

  return count;
}

/** Expira ofertas pendentes antes de re-dispatch manual/admin. */
export function expireDemoPendingOffersForRide(rideId: number): number {
  let count = 0;
  for (const offer of getDemoOffersForRide(rideId)) {
    if (offer.status === "pending") {
      updateDemoOfferStatus(offer.id, "expired");
      count++;
    }
  }
  return count;
}

export function getDemoNextOfferRound(rideId: number): number {
  const max = getDemoMaxOfferRound(rideId);
  return max === 0 ? 1 : max + 1;
}
