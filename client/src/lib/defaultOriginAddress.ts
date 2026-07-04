import {
  addAddressHistory,
  FUI_HISTORY_ORIGIN_KEY,
  type AddressHistoryItem,
} from "@/lib/addressHistory";
import {
  getDefaultPassengerHome,
} from "@shared/defaultHomeAddress";
import type { SergipeCityHome } from "@shared/sergipeOperatingCities";
import { WL } from "@/whitelabel";

export type DefaultOriginSelection = {
  address: string;
  placeId: string;
  coords: { lat: number; lng: number };
};

function homeToSelection(home: SergipeCityHome): DefaultOriginSelection {
  return {
    address: home.address,
    placeId: home.placeId,
    coords: { lat: home.lat, lng: home.lng },
  };
}

/** Coloca a residência padrão no topo do histórico de origem. */
export function seedDefaultOriginHistory(appCity?: string): AddressHistoryItem[] {
  const home = getDefaultPassengerHome(appCity ?? WL.city);
  return addAddressHistory(FUI_HISTORY_ORIGIN_KEY, {
    address: home.address,
    placeId: home.placeId,
  });
}

export function getDefaultOriginSelection(appCity?: string): DefaultOriginSelection {
  return homeToSelection(getDefaultPassengerHome(appCity ?? WL.city));
}
