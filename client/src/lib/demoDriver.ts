/** Persistência local do perfil de motorista demo (complementa memória do servidor). */

export const FUI_DEMO_DRIVER_PROFILE_KEY = "fui_demo_driver_profile";

export type DemoDriverProfileSnapshot = {
  id: number;
  userId: number;
  cpf?: string | null;
  cnh?: string | null;
  cnhImageUrl?: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  rating?: number | null;
  totalRides?: number | null;
  isAvailable?: boolean | null;
};

export function loadDemoDriverProfile(): DemoDriverProfileSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUI_DEMO_DRIVER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDriverProfileSnapshot;
    if (!parsed || typeof parsed.id !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDemoDriverProfile(profile: DemoDriverProfileSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_DRIVER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn("[demoDriver] localStorage save failed:", error);
  }
}

export function patchDemoDriverProfile(
  patch: Partial<DemoDriverProfileSnapshot>
): DemoDriverProfileSnapshot | null {
  const current = loadDemoDriverProfile();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveDemoDriverProfile(next);
  return next;
}

export function clearDemoDriverProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FUI_DEMO_DRIVER_PROFILE_KEY);
  } catch {
    // ignore
  }
}

export const FUI_DEMO_DRIVER_LOCATION_KEY = "fui_demo_driver_location";

export type DemoDriverLocationSnapshot = {
  lat: string;
  lng: string;
};

export function loadDemoDriverLocation(): DemoDriverLocationSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUI_DEMO_DRIVER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDriverLocationSnapshot;
    if (!parsed?.lat || !parsed?.lng) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDemoDriverLocation(location: DemoDriverLocationSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_DRIVER_LOCATION_KEY, JSON.stringify(location));
  } catch {
    // ignore
  }
}
