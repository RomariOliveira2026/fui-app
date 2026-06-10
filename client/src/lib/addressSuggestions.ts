import type { AddressHistoryItem } from "@/lib/addressHistory";

export type SavedAddressLike = {
  id: number | string;
  label?: string;
  customLabel?: string | null;
  address: string;
};

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function savedAddressTitle(addr: SavedAddressLike): string {
  if (addr.label === "home") return "Casa";
  if (addr.label === "work") return "Trabalho";
  return addr.customLabel || "Outro";
}

export function filterSavedAddresses<T extends SavedAddressLike>(
  items: T[],
  query: string
): T[] {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  return items.filter((item) => {
    const title = savedAddressTitle(item).toLowerCase();
    return item.address.toLowerCase().includes(q) || title.includes(q);
  });
}

export function filterHistoryByQuery(
  items: AddressHistoryItem[],
  query: string
): AddressHistoryItem[] {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  return items.filter((item) => item.address.toLowerCase().includes(q));
}
