export const FUI_HISTORY_ORIGIN_KEY = "fui_history_origin";
export const FUI_HISTORY_DESTINATION_KEY = "fui_history_destination";

const MAX_ITEMS = 5;

export type AddressHistoryItem = {
  address: string;
  placeId?: string;
};

export function loadAddressHistory(storageKey: string): AddressHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is AddressHistoryItem =>
          !!item &&
          typeof item === "object" &&
          typeof (item as AddressHistoryItem).address === "string"
      )
      .map((item) => ({
        address: item.address.trim(),
        placeId: item.placeId,
      }))
      .filter((item) => item.address.length >= 3);
  } catch {
    return [];
  }
}

export function addAddressHistory(
  storageKey: string,
  item: AddressHistoryItem
): AddressHistoryItem[] {
  const address = item.address.trim();
  if (address.length < 3) return loadAddressHistory(storageKey);

  const current = loadAddressHistory(storageKey);
  const key = address.toLowerCase();
  const next: AddressHistoryItem[] = [
    { address, placeId: item.placeId || undefined },
    ...current.filter((entry) => entry.address.trim().toLowerCase() !== key),
  ].slice(0, MAX_ITEMS);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.warn("[addressHistory] localStorage save failed:", error);
    }
  }
  return next;
}
