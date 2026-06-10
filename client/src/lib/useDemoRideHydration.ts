import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoRides, upsertDemoRide } from "@/lib/demoRideStorage";
import { loadDemoOffers, persistDemoOffersFromServer } from "@/lib/demoOfferStorage";
import type { Ride } from "../../../drizzle/schema";

/** Sincroniza corridas e ofertas demo entre localStorage e memória do servidor. */
export function useDemoRideHydration() {
  const utils = trpc.useUtils();
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.ride.hydrateDemoState.useMutation({
    onSuccess: async (data) => {
      if (data.offers?.length) {
        persistDemoOffersFromServer(data.offers as never);
      }
      await utils.ride.getById.invalidate();
      await utils.ride.available.invalidate();
      await utils.ride.active.invalidate();
      await utils.ride.myRides.invalidate();
      await utils.ride.myDrives.invalidate();
      await utils.user.getRecentRides.invalidate();
    },
  });

  useEffect(() => {
    if (!isLocalDemoDev() || hydratedRef.current) return;
    const storedRides = loadDemoRides();
    const storedOffers = loadDemoOffers();
    if (storedRides.length === 0 && storedOffers.length === 0) return;
    hydratedRef.current = true;
    hydrateMutation.mutate({
      rides: storedRides as never,
      offers: storedOffers as never,
    });
  }, [hydrateMutation]);
}

export function persistDemoRideFromServer(ride: Ride): void {
  if (!isLocalDemoDev() || ride.id < 900_001) return;
  upsertDemoRide(ride);
}

export function isDemoRideIdClient(rideId: number): boolean {
  return rideId >= 900_001;
}

/** Sincroniza snapshot de ofertas demo após mutações do dispatcher. */
export async function syncDemoOffersSnapshot(
  fetchOffers: () => Promise<{ offers: unknown[] }>
): Promise<void> {
  if (!isLocalDemoDev()) return;
  try {
    const data = await fetchOffers();
    if (data.offers?.length) {
      persistDemoOffersFromServer(data.offers as never);
    }
  } catch {
    // ignore
  }
}
