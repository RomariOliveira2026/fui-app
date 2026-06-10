import type { DriverPremiumPreferences } from "@shared/driverPremium";

export const FUI_DEMO_DRIVER_PREMIUM_KEY = "fui_demo_driver_premium";

export function loadDemoDriverPremiumPrefs(): DriverPremiumPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUI_DEMO_DRIVER_PREMIUM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DriverPremiumPreferences;
  } catch {
    return null;
  }
}

export function saveDemoDriverPremiumPrefs(prefs: DriverPremiumPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_DRIVER_PREMIUM_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
