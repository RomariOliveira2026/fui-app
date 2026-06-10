import type { RideOfferRecord } from "@shared/rideDispatcher";

export const FUI_DEMO_OFFERS_KEY = "fui_demo_offers";

function reviveOffer(raw: RideOfferRecord): RideOfferRecord {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    expiresAt: new Date(raw.expiresAt),
  };
}

export function loadDemoOffers(): RideOfferRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_OFFERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RideOfferRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(reviveOffer);
  } catch {
    return [];
  }
}

export function saveDemoOffers(offers: RideOfferRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_OFFERS_KEY, JSON.stringify(offers));
  } catch (error) {
    console.warn("[demoOfferStorage] save failed:", error);
  }
}

export function persistDemoOffersFromServer(offers: RideOfferRecord[]): void {
  saveDemoOffers(offers.map(reviveOffer));
}
