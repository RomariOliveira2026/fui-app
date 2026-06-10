import {
  DEFAULT_DRIVER_PREMIUM_PREFERENCES,
  mergeDriverPreferences,
  type DriverPremiumPreferences,
  type DriverServiceType,
} from "@shared/driverPremium";

const prefsByDriverId = new Map<number, DriverPremiumPreferences>();

export function getDemoDriverPremiumPrefs(driverId: number): DriverPremiumPreferences {
  return prefsByDriverId.get(driverId) ?? { ...DEFAULT_DRIVER_PREMIUM_PREFERENCES };
}

export function updateDemoDriverPremiumPrefs(
  driverId: number,
  patch: Partial<DriverPremiumPreferences>
): DriverPremiumPreferences {
  const current = getDemoDriverPremiumPrefs(driverId);
  const next = mergeDriverPreferences({
    ...current,
    ...patch,
    serviceFilters: {
      ...current.serviceFilters,
      ...patch.serviceFilters,
    },
  });
  prefsByDriverId.set(driverId, next);
  return next;
}

export function hydrateDemoDriverPremiumPrefs(
  entries: Array<{ driverId: number; preferences: DriverPremiumPreferences }>
): void {
  for (const entry of entries) {
    prefsByDriverId.set(entry.driverId, mergeDriverPreferences(entry.preferences));
  }
}

/** @deprecated Use shouldDriverReceiveOffer from driverPrefsStore */
export { shouldDriverReceiveOffer } from "./driverPrefsStore";
