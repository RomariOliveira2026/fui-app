/** Endereços salvos demo — persistência local (sem tabela saved_addresses). */

import { getDefaultPassengerHome } from "@shared/defaultHomeAddress";
import { WL } from "@/whitelabel";

export const FUI_DEMO_SAVED_ADDRESSES_KEY = "fui_demo_saved_addresses";
const FUI_DEMO_SAVED_ADDRESS_ID_KEY = "fui_demo_saved_address_next_id";

/** Casa padrão — residência conforme VITE_APP_CITY. */
export function getDefaultDemoHomeAddress() {
  const h = getDefaultPassengerHome(WL.city);
  return {
    label: "home" as const,
    address: h.address,
    lat: String(h.lat),
    lng: String(h.lng),
  };
}

export const DEFAULT_DEMO_HOME_ADDRESS = getDefaultDemoHomeAddress();

export type DemoSavedAddress = {
  id: number;
  userId: number;
  label: "home" | "work" | "other";
  customLabel?: string | null;
  address: string;
  lat: string;
  lng: string;
  createdAt: string;
  updatedAt: string;
};

function nextLocalAddressId(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = localStorage.getItem(FUI_DEMO_SAVED_ADDRESS_ID_KEY);
    const current = raw ? Number.parseInt(raw, 10) : 700_001;
    const next = Number.isFinite(current) ? current + 1 : 700_001;
    localStorage.setItem(FUI_DEMO_SAVED_ADDRESS_ID_KEY, String(next));
    return next;
  } catch {
    return Date.now();
  }
}

export function loadDemoSavedAddresses(): DemoSavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_SAVED_ADDRESSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoSavedAddress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistDemoSavedAddresses(addresses: DemoSavedAddress[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch {
    // ignore
  }
}

export function saveDemoSavedAddress(input: {
  label: "home" | "work" | "other";
  customLabel?: string;
  address: string;
  lat: string;
  lng: string;
  userId?: number;
}): DemoSavedAddress[] {
  const now = new Date().toISOString();
  const list = loadDemoSavedAddresses();
  const existingIndex = list.findIndex((a) => a.label === input.label);

  const record: DemoSavedAddress = {
    id: existingIndex >= 0 ? list[existingIndex].id : nextLocalAddressId(),
    userId: input.userId ?? 0,
    label: input.label,
    customLabel: input.customLabel ?? null,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : now,
    updatedAt: now,
  };

  const next =
    existingIndex >= 0
      ? list.map((a, i) => (i === existingIndex ? record : a))
      : [record, ...list];

  persistDemoSavedAddresses(next);
  return next;
}

export function deleteDemoSavedAddress(id: number): DemoSavedAddress[] {
  const next = loadDemoSavedAddresses().filter((a) => a.id !== id);
  persistDemoSavedAddresses(next);
  return next;
}

/** Garante endereço Casa no demo — sempre sincronizado com a residência padrão. */
export function ensureDemoHomeAddressSeed(): DemoSavedAddress[] {
  const seed = getDefaultDemoHomeAddress();
  return saveDemoSavedAddress({
    label: seed.label,
    address: seed.address,
    lat: seed.lat,
    lng: seed.lng,
    userId: 0,
  });
}
