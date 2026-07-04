export const RIDE_OFFER_EVENT = "fui:ride_offer";

export type RideOfferEventDetail = {
  rideId?: number;
  expiresAt?: string;
  offerRound?: number;
};

export function emitRideOfferEvent(detail: RideOfferEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<RideOfferEventDetail>(RIDE_OFFER_EVENT, { detail }));
}

export function parseRideOfferPayload(
  data: Record<string, string | undefined> | undefined
): RideOfferEventDetail | null {
  if (!data || data.event !== "ride_offer") return null;
  const rideId = data.rideId ? Number.parseInt(data.rideId, 10) : undefined;
  return {
    rideId: Number.isFinite(rideId) ? rideId : undefined,
    expiresAt: data.expiresAt,
    offerRound: data.offerRound ? Number.parseInt(data.offerRound, 10) : undefined,
  };
}

export function parseOfferRideFromUrl(): number | null {
  if (typeof window === "undefined") return null;
  const rideId = new URLSearchParams(window.location.search).get("offerRide");
  if (!rideId) return null;
  const parsed = Number.parseInt(rideId, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearOfferRideFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("offerRide")) return;
  url.searchParams.delete("offerRide");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}
