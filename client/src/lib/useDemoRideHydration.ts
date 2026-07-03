import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isDemoAppClient, isLocalDemoDev } from "@/lib/demoMode";
import { getDemoRideSnapshot, loadDemoRides, upsertDemoRide } from "@/lib/demoRideStorage";
import { loadDemoOffers, persistDemoOffersFromServer } from "@/lib/demoOfferStorage";
import { useBetaDemoRuntime } from "@/lib/useBetaDemoRuntime";
import type { Ride } from "../../../drizzle/schema";

/** Sincroniza corridas e ofertas demo entre localStorage e memória do servidor. */
export function useDemoRideHydration() {
  const { active: betaDemo } = useBetaDemoRuntime(false);
  const demoClient = isLocalDemoDev() || betaDemo;
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
    if (!demoClient || hydratedRef.current) return;
    const storedRides = loadDemoRides();
    const storedOffers = loadDemoOffers();
    if (storedRides.length === 0 && storedOffers.length === 0) return;
    hydratedRef.current = true;
    hydrateMutation.mutate({
      rides: storedRides as never,
      offers: storedOffers as never,
    });
  }, [demoClient, hydrateMutation]);
}

export function persistDemoRideFromServer(ride: Ride): void {
  if (ride.id < 900_001) return;
  upsertDemoRide(ride);
}

export function isDemoRideIdClient(rideId: number): boolean {
  return rideId >= 900_001;
}

/** Após ride.request — persiste snapshot para reidratar getById em serverless. */
export async function persistDemoRideAfterRequest(
  fetchRideById: (rideId: number) => Promise<Ride>,
  rideId: number,
  demoRide?: Ride | null
): Promise<void> {
  if (!isDemoRideIdClient(rideId)) return;
  if (demoRide) {
    persistDemoRideFromServer(demoRide);
    return;
  }
  try {
    const created = await fetchRideById(rideId);
    persistDemoRideFromServer(created);
  } catch {
    // ignore — RideDetails tentará de novo com snapshot
  }
}

/** Sincroniza snapshot de ofertas demo após mutações do dispatcher. */
export async function syncDemoOffersSnapshot(
  fetchOffers: () => Promise<{ offers: unknown[] }>
): Promise<void> {
  if (!isDemoAppClient()) return;
  try {
    const data = await fetchOffers();
    if (data.offers?.length) {
      persistDemoOffersFromServer(data.offers as never);
    }
  } catch {
    // ignore
  }
}
