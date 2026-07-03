import {
  addAddressHistory,
  FUI_HISTORY_ORIGIN_KEY,
  type AddressHistoryItem,
} from "@/lib/addressHistory";
import { DEFAULT_PASSENGER_HOME } from "@shared/defaultHomeAddress";

export type DefaultOriginSelection = {
  address: string;
  placeId: string;
  coords: { lat: number; lng: number };
};

/** Coloca a residência padrão no topo do histórico de origem. */
export function seedDefaultOriginHistory(): AddressHistoryItem[] {
  return addAddressHistory(FUI_HISTORY_ORIGIN_KEY, {
    address: DEFAULT_PASSENGER_HOME.address,
    placeId: DEFAULT_PASSENGER_HOME.placeId,
  });
}

export function getDefaultOriginSelection(): DefaultOriginSelection {
  return {
    address: DEFAULT_PASSENGER_HOME.address,
    placeId: DEFAULT_PASSENGER_HOME.placeId,
    coords: {
      lat: DEFAULT_PASSENGER_HOME.lat,
      lng: DEFAULT_PASSENGER_HOME.lng,
    },
  };
}
