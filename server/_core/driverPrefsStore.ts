import {
  DEFAULT_DRIVER_PREMIUM_PREFERENCES,
  DEFAULT_DRIVER_SERVICE_FILTERS,
  mergeDriverPreferences,
  type DriverPremiumPreferences,
  type DriverServiceFilters,
} from "@shared/driverPremium";
import {
  getDemoDriverPremiumPrefs,
  hydrateDemoDriverPremiumPrefs,
  updateDemoDriverPremiumPrefs,
} from "./demoDriverPremium";
import { isDemoDriverProfileId } from "./demoDriver";
import { isDemoPassenger } from "./demoUser";
import * as db from "../db";

const prodCache = new Map<number, DriverPremiumPreferences>();

function rowToPrefs(row: {
  dailyGoalCents: number;
  smartPause: boolean;
  serviceFilters: Record<string, boolean> | null;
}): DriverPremiumPreferences {
  return mergeDriverPreferences({
    dailyGoalCents: row.dailyGoalCents,
    smartPause: row.smartPause,
    serviceFilters: row.serviceFilters
      ? { ...DEFAULT_DRIVER_SERVICE_FILTERS, ...row.serviceFilters }
      : undefined,
  });
}

export async function loadDriverPremiumPreferences(
  driverId: number,
  user?: { openId: string }
): Promise<DriverPremiumPreferences> {
  if (isDemoDriverProfileId(driverId) || (user && isDemoPassenger(user))) {
    return getDemoDriverPremiumPrefs(driverId);
  }

  const cached = prodCache.get(driverId);
  if (cached) return cached;

  const dbInstance = await db.getDb();
  if (dbInstance) {
    const row = await db.getDriverPremiumPreferences(driverId);
    if (row) {
      const prefs = rowToPrefs(row);
      prodCache.set(driverId, prefs);
      return prefs;
    }
  }

  return { ...DEFAULT_DRIVER_PREMIUM_PREFERENCES };
}

export function getDriverPremiumPreferencesSync(driverId: number): DriverPremiumPreferences {
  if (isDemoDriverProfileId(driverId)) {
    return getDemoDriverPremiumPrefs(driverId);
  }
  return prodCache.get(driverId) ?? { ...DEFAULT_DRIVER_PREMIUM_PREFERENCES };
}

export async function saveDriverPremiumPreferences(
  driverId: number,
  patch: Partial<DriverPremiumPreferences>,
  user?: { openId: string }
): Promise<DriverPremiumPreferences> {
  if (isDemoDriverProfileId(driverId) || (user && isDemoPassenger(user))) {
    return updateDemoDriverPremiumPrefs(driverId, patch);
  }

  const current = await loadDriverPremiumPreferences(driverId, user);
  const next = mergeDriverPreferences({ ...current, ...patch, serviceFilters: {
    ...current.serviceFilters,
    ...patch.serviceFilters,
  }});

  const dbInstance = await db.getDb();
  if (dbInstance) {
    await db.upsertDriverPremiumPreferences(driverId, next);
  }

  prodCache.set(driverId, next);
  return next;
}

export function hydrateDriverPremiumPreferencesFromDemo(
  entries: Array<{ driverId: number; preferences: DriverPremiumPreferences }>
): void {
  hydrateDemoDriverPremiumPrefs(entries);
}

export function shouldDriverReceiveOffer(
  driverId: number,
  vehicleType: string,
  serviceType: "ride" | "delivery" = "ride"
): boolean {
  const prefs = getDriverPremiumPreferencesSync(driverId);
  if (prefs.smartPause) return false;
  if (serviceType === "ride" && !prefs.serviceFilters.ride) return false;
  if (serviceType === "delivery" && !prefs.serviceFilters.delivery) return false;

  const vt = vehicleType as keyof DriverServiceFilters;
  if (["moto", "carro", "van", "utilitario"].includes(vt)) {
    return prefs.serviceFilters[vt];
  }
  return true;
}
