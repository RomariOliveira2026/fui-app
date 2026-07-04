import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { isDemoAppClient, isLocalDemoDev } from "@/lib/demoMode";
import { getDemoRideSnapshot, loadDemoRides, upsertDemoRide } from "@/lib/demoRideStorage";
import { loadDemoOffers, persistDemoOffersFromServer } from "@/lib/demoOfferStorage";
import { useBetaDemoRuntime } from "@/lib/useBetaDemoRuntime";
import type { Ride } from "../../../drizzle/schema";

type HydrateDemoStateInput = {
  rides: Ride[];
  offers?: unknown[];
};

type HydrateDemoStateFn = (input: HydrateDemoStateInput) => Promise<unknown>;

/** Envia snapshot via POST — nunca na query string do getById (estoura URL na Vercel). */
export async function hydrateDemoRideOnServer(
  hydrateDemoState: HydrateDemoStateFn,
  ride: Ride
): Promise<void> {
  persistDemoRideFromServer(ride);
  await hydrateDemoState({ rides: [ride] });
}

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

/** Após ride.request — persiste e reidrata servidor antes de abrir /ride/:id. */
export async function persistDemoRideAfterRequest(
  hydrateDemoState: HydrateDemoStateFn,
  rideId: number,
  demoRide?: Ride | null
): Promise<void> {
  if (!isDemoRideIdClient(rideId)) return;
  if (demoRide) {
    await hydrateDemoRideOnServer(hydrateDemoState, demoRide);
    return;
  }
  const snapshot = getDemoRideSnapshot(rideId);
  if (snapshot) {
    await hydrateDemoRideOnServer(hydrateDemoState, snapshot);
  }
}

/** Garante corrida demo no servidor antes do primeiro getById (serverless). */
export function useEnsureDemoRideHydrated(rideId: number) {
  const utils = trpc.useUtils();
  const { active: betaDemo, pending: betaPending } = useBetaDemoRuntime(false);
  const demoClient = isLocalDemoDev() || betaDemo;
  const [ready, setReady] = useState(() => !isDemoRideIdClient(rideId));

  useEffect(() => {
    if (!isDemoRideIdClient(rideId)) {
      setReady(true);
      return;
    }
    if (betaPending && !getDemoRideSnapshot(rideId)) {
      setReady(false);
      return;
    }
    if (!demoClient) {
      setReady(true);
      return;
    }

    const snapshot = getDemoRideSnapshot(rideId);
    if (!snapshot) {
      setReady(true);
      return;
    }

    setReady(false);
    let cancelled = false;

    void utils.client.ride.hydrateDemoState
      .mutate({ rides: [snapshot as never] })
      .catch(() => {
        // getById tentará na mesma instância serverless
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [rideId, demoClient, betaPending, utils.client.ride.hydrateDemoState]);

  return { ready, betaPending };
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
