import type { UtilityProviderProfile } from "@shared/utilityProvider";
import type { UtilityOrder } from "@shared/utilities";
import type { UtilityOffer } from "@shared/utilityDispatcher";

export const FUI_DEMO_UTILITY_PROVIDER_KEY = "fui_demo_utility_provider";
export const FUI_DEMO_UTILITY_PROVIDER_ORDERS_KEY = "fui_demo_utility_orders";
export const FUI_DEMO_UTILITY_OFFERS_KEY = "fui_demo_utility_offers";

export type DemoUtilityProviderSnapshot = {
  profiles?: UtilityProviderProfile[];
  orders?: UtilityOrder[];
  offers?: UtilityOffer[];
};

export function loadDemoUtilityProviderSnapshot(): DemoUtilityProviderSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const profilesRaw = localStorage.getItem(FUI_DEMO_UTILITY_PROVIDER_KEY);
    const ordersRaw = localStorage.getItem(FUI_DEMO_UTILITY_PROVIDER_ORDERS_KEY);
    const offersRaw = localStorage.getItem(FUI_DEMO_UTILITY_OFFERS_KEY);
    const profiles = profilesRaw ? (JSON.parse(profilesRaw) as UtilityProviderProfile[]) : undefined;
    const orders = ordersRaw ? (JSON.parse(ordersRaw) as UtilityOrder[]) : undefined;
    const offers = offersRaw ? (JSON.parse(offersRaw) as UtilityOffer[]) : undefined;
    if (!profiles?.length && !orders?.length && !offers?.length) return null;
    return { profiles, orders, offers };
  } catch {
    return null;
  }
}

export function saveDemoUtilityProviderProfiles(profiles: UtilityProviderProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_UTILITY_PROVIDER_KEY, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

export function persistDemoUtilitySnapshot(snapshot: {
  orders?: UtilityOrder[];
  profiles?: UtilityProviderProfile[];
  offers?: UtilityOffer[];
}): void {
  if (typeof window === "undefined") return;
  if (snapshot.orders) {
    try {
      localStorage.setItem(FUI_DEMO_UTILITY_PROVIDER_ORDERS_KEY, JSON.stringify(snapshot.orders));
    } catch {
      // ignore
    }
  }
  if (snapshot.profiles) {
    saveDemoUtilityProviderProfiles(snapshot.profiles);
  }
  if (snapshot.offers) {
    try {
      localStorage.setItem(FUI_DEMO_UTILITY_OFFERS_KEY, JSON.stringify(snapshot.offers));
    } catch {
      // ignore
    }
  }
}
