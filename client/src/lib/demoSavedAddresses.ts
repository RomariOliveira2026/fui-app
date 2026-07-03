/** Endereços salvos demo — persistência local (sem tabela saved_addresses). */

import { DEFAULT_PASSENGER_HOME } from "@shared/defaultHomeAddress";

export const FUI_DEMO_SAVED_ADDRESSES_KEY = "fui_demo_saved_addresses";
const FUI_DEMO_SAVED_ADDRESS_ID_KEY = "fui_demo_saved_address_next_id";

/** Casa padrão — residência do passageiro em Itabaiana. */
export const DEFAULT_DEMO_HOME_ADDRESS = {
  label: "home" as const,
  address: DEFAULT_PASSENGER_HOME.address,
  lat: String(DEFAULT_PASSENGER_HOME.lat),
  lng: String(DEFAULT_PASSENGER_HOME.lng),
};

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
  return saveDemoSavedAddress({
    label: DEFAULT_DEMO_HOME_ADDRESS.label,
    address: DEFAULT_DEMO_HOME_ADDRESS.address,
    lat: DEFAULT_DEMO_HOME_ADDRESS.lat,
    lng: DEFAULT_DEMO_HOME_ADDRESS.lng,
    userId: 0,
  });
}
