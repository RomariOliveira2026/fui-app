/**
 * Utilitários do fluxo local do passageiro em /request-ride.
 * Cálculo de rota/preço real: server/_core/passengerRoute.ts via maps.calculatePassengerRoute.
 */

import {
  addAddressHistory,
  FUI_HISTORY_DESTINATION_KEY,
  FUI_HISTORY_ORIGIN_KEY,
  type AddressHistoryItem,
} from "@/lib/addressHistory";
import {
  filterDemoPlaces,
  findDemoPlaceByPlaceId,
  findDemoPlaceByText,
} from "@shared/demoMaps";
import { type DemoVehicleType } from "@shared/demoPricing";

export type { DemoVehicleType };

export function resolveLocalPlaceId(
  address: string,
  currentPlaceId?: string
): string | undefined {
  if (currentPlaceId && findDemoPlaceByPlaceId(currentPlaceId)) {
    return currentPlaceId;
  }
  const trimmed = address.trim();
  if (trimmed.length < 2) return currentPlaceId;

  const exact = findDemoPlaceByText(trimmed);
  if (exact) return exact.placeId;

  const partial = filterDemoPlaces(trimmed);
  return partial[0]?.placeId ?? currentPlaceId;
}

export function persistRideAddressHistory(
  originAddress: string,
  destinationAddress: string,
  originPlaceId?: string,
  destinationPlaceId?: string
): { originHistory: AddressHistoryItem[]; destinationHistory: AddressHistoryItem[] } {
  const originHistory = addAddressHistory(FUI_HISTORY_ORIGIN_KEY, {
    address: originAddress,
    placeId: originPlaceId,
  });
  const destinationHistory = addAddressHistory(FUI_HISTORY_DESTINATION_KEY, {
    address: destinationAddress,
    placeId: destinationPlaceId,
  });
  return { originHistory, destinationHistory };
}

export const FUI_LOCAL_DEMO_RIDE_KEY = "fui_local_demo_ride";

let localDemoRideCounter = 900_001;

/** Fallback quando ride.request falha em dev — guarda corrida para consulta opcional. */
export function simulateLocalRideRequest(payload: {
  vehicleType: DemoVehicleType;
  originAddress: string;
  originLat: string;
  originLng: string;
  destinationAddress: string;
  destinationLat: string;
  destinationLng: string;
  distance: number;
  duration: number;
  estimatedPrice: number;
  paymentMethod: string;
}): number {
  const rideId = localDemoRideCounter++;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        FUI_LOCAL_DEMO_RIDE_KEY,
        JSON.stringify({ rideId, ...payload, status: "requested", createdAt: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
  }
  return rideId;
}
