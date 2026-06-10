import type { Ride } from "../../drizzle/schema";
import type { RideDispatchMeta } from "@shared/rideDispatcher";
import { DISPATCHER_MAX_ROUNDS, isRideReadyForDispatch } from "@shared/rideDispatcher";
import {
  countDemoDeclinedOffers,
  expireDemoStalePendingOffers,
  expireDemoPendingOffersForRide,
  getDemoMaxOfferRound,
  getDemoNextOfferRound,
  getDemoOffersForRide,
  getDemoValidPendingOffersForRide,
} from "./demoRideOffers";
import { getDemoRide, getDemoRequestedRides } from "./demoRide";
import { dispatchDemoRideOffers, dispatchProductionRideOffers } from "./rideDispatcher";
import { isDemoRideId } from "./demoRide";
import * as db from "../db";

export function buildDemoDispatchMeta(rideId: number): RideDispatchMeta {
  expireDemoStalePendingOffers(rideId);
  const ride = getDemoRide(rideId);
  const offers = getDemoOffersForRide(rideId);
  const pending = offers.filter((o) => o.status === "pending" && o.expiresAt.getTime() > Date.now());
  const rounds = new Set(offers.map((o) => o.offerRound));
  const maxRound = getDemoMaxOfferRound(rideId);
  const lastOffer = offers.reduce<RideDispatchMeta["lastDispatchAt"]>((latest, o) => {
    const iso = o.createdAt.toISOString();
    return !latest || iso > latest ? iso : latest;
  }, null);
  const scheduledWaiting = ride != null && !isRideReadyForDispatch(ride);

  return {
    currentRound: pending.length > 0 ? Math.max(...pending.map((o) => o.offerRound)) : maxRound || 1,
    dispatchAttempts: rounds.size || (offers.length > 0 ? 1 : 0),
    pendingOffers: pending.length,
    declinedOffers: countDemoDeclinedOffers(rideId),
    lastDispatchAt: lastOffer,
    isExpandedRound:
      maxRound >= DISPATCHER_MAX_ROUNDS &&
      pending.some((o) => o.offerRound >= DISPATCHER_MAX_ROUNDS),
    isScheduledWaiting: scheduledWaiting,
    scheduledFor: ride?.scheduledFor ? new Date(ride.scheduledFor).toISOString() : null,
  };
}

export function attachDispatchMeta<T extends { id: number; status: string; driverId?: number | null }>(
  ride: T
): T & { dispatchMeta?: RideDispatchMeta } {
  if (ride.status !== "requested" || ride.driverId != null) {
    return ride;
  }
  if (isDemoRideId(ride.id)) {
    return { ...ride, dispatchMeta: buildDemoDispatchMeta(ride.id) };
  }
  return ride;
}

/** Avança dispatch demo: expira ofertas vencidas e reenfileira próxima rodada. */
export function processDispatchForDemoRide(rideId: number): boolean {
  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "requested" || ride.driverId != null) {
    return false;
  }
  if (!isRideReadyForDispatch(ride)) {
    return false;
  }

  expireDemoStalePendingOffers(rideId);

  if (getDemoValidPendingOffersForRide(rideId).length > 0) {
    return false;
  }

  const maxRound = getDemoMaxOfferRound(rideId);
  const nextRound = maxRound === 0 ? 1 : maxRound + 1;
  const expandPool = nextRound >= DISPATCHER_MAX_ROUNDS;
  const offerRound = expandPool ? DISPATCHER_MAX_ROUNDS : nextRound;

  const result = dispatchDemoRideOffers(
    rideId,
    ride.vehicleType,
    ride.originLat,
    ride.originLng,
    { offerRound, expandPool }
  );

  if (result.offersCreated > 0) {
    console.log(
      `[Dispatcher] Auto-redispatch corrida demo #${rideId} · rodada ${result.offerRound}` +
        `${result.expandedPool ? " (ampliada)" : ""} · ${result.offersCreated} oferta(s)`
    );
    return true;
  }

  return false;
}

export async function processDispatchForProductionRide(rideId: number): Promise<boolean> {
  const ride = await db.getRideById(rideId);
  if (!ride || ride.status !== "requested" || ride.driverId != null) {
    return false;
  }
  if (!isRideReadyForDispatch(ride)) {
    return false;
  }

  await db.expireStalePendingRideOffers(rideId);

  const pendingCount = await db.countPendingRideOffers(rideId);
  if (pendingCount > 0) {
    return false;
  }

  const maxRound = await db.getMaxOfferRoundForRide(rideId);
  const nextRound = maxRound === 0 ? 1 : maxRound + 1;
  const expandPool = nextRound >= DISPATCHER_MAX_ROUNDS;
  const offerRound = expandPool ? DISPATCHER_MAX_ROUNDS : nextRound;

  const result = await dispatchProductionRideOffers(
    rideId,
    ride.vehicleType,
    ride.originLat,
    ride.originLng,
    { offerRound, expandPool }
  );

  return result.offersCreated > 0;
}

export function processDispatchTick(): void {
  for (const ride of getDemoRequestedRides()) {
    processDispatchForDemoRide(ride.id);
  }
}

export async function processProductionDispatchTick(): Promise<void> {
  try {
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    const rideIds = await db.getRequestedRideIdsWithoutDriver();
    for (const rideId of rideIds) {
      try {
        await processDispatchForProductionRide(rideId);
      } catch (error) {
        console.warn(`[Dispatcher] Falha auto-redispatch produção #${rideId}:`, error);
      }
    }
  } catch (error) {
    console.warn("[Dispatcher] Tick produção indisponível (DB offline):", error);
  }
}

/** Redispatch unificado (admin ou automático). */
export function redispatchDemoRideOffers(rideId: number): ReturnType<typeof dispatchDemoRideOffers> {
  const ride = getDemoRide(rideId);
  if (!ride) {
    throw new Error("Corrida não encontrada");
  }

  expireDemoStalePendingOffers(rideId);
  const pending = getDemoValidPendingOffersForRide(rideId);
  if (pending.length > 0) {
    expireDemoPendingOffersForRide(rideId);
  }

  const offerRound = getDemoNextOfferRound(rideId);
  const expandPool = offerRound >= DISPATCHER_MAX_ROUNDS;

  return dispatchDemoRideOffers(rideId, ride.vehicleType, ride.originLat, ride.originLng, {
    offerRound,
    expandPool,
  });
}

export async function redispatchProductionRideOffers(
  rideId: number
): Promise<Awaited<ReturnType<typeof dispatchProductionRideOffers>>> {
  const ride = await db.getRideById(rideId);
  if (!ride) {
    throw new Error("Corrida não encontrada");
  }

  await db.expirePendingRideOffersForRide(rideId);
  const offerRound = await db.getNextOfferRoundForRide(rideId);
  const expandPool = offerRound >= DISPATCHER_MAX_ROUNDS;

  return dispatchProductionRideOffers(
    rideId,
    ride.vehicleType,
    ride.originLat,
    ride.originLng,
    { offerRound, expandPool }
  );
}

export function attachDispatchMetaToRide(ride: Ride): Ride & { dispatchMeta?: RideDispatchMeta } {
  return attachDispatchMeta(ride);
}
