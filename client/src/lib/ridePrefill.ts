import type { Ride } from "../../../drizzle/schema";
import type { RidePrefill } from "@shared/passengerPremium";

export const FUI_RIDE_PREFILL_KEY = "fui_ride_prefill";

export function rideToPrefill(ride: Ride): RidePrefill {
  return {
    originAddress: ride.originAddress,
    destinationAddress: ride.destinationAddress,
    originLat: ride.originLat,
    originLng: ride.originLng,
    destinationLat: ride.destinationLat,
    destinationLng: ride.destinationLng,
    vehicleType: ride.vehicleType,
  };
}

export function saveRidePrefill(prefill: RidePrefill): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FUI_RIDE_PREFILL_KEY, JSON.stringify(prefill));
  } catch {
    // ignore
  }
}

export function loadRidePrefill(): RidePrefill | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FUI_RIDE_PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RidePrefill;
  } catch {
    return null;
  }
}

export function clearRidePrefill(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FUI_RIDE_PREFILL_KEY);
  } catch {
    // ignore
  }
}

/** Repetir corrida: salva prefill e abre fluxo de solicitação. */
export function repeatRide(ride: Ride, navigate: (path: string) => void): void {
  saveRidePrefill(rideToPrefill(ride));
  navigate("/request-ride");
}
