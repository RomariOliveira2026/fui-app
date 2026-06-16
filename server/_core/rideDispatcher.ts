import { BRAZIL_MAP_CENTER } from "@shared/mapDefaults";
import type { Ride } from "../../drizzle/schema";
import {
  DISPATCHER_TOP_N_OFFERS,
  type DispatchResult,
  type DispatcherEligibleDriver,
} from "@shared/rideDispatcher";
import { haversineMeters } from "@shared/demoMaps";
import {
  getAllDemoDriverProfiles,
  getDemoDriverLocationCoords,
  getDemoVehiclesByDriverId,
  updateDemoDriverLocation,
} from "./demoDriver";
import {
  createDemoRideOffer,
  declineDemoRideOffer,
  driverHasDemoPendingOffer,
  getDemoDriversBlockedFromReOffer,
  getDemoOfferDistanceForDriver,
  getDemoOfferForDriver,
  getDemoPendingOffersForDriver,
  getDemoPreviouslyOfferedDriverIds,
  resolveDemoOffersOnAccept,
} from "./demoRideOffers";
import { selectDriversForRound } from "@shared/rideDispatcher";
import { getDemoRide, getDemoRequestedRides } from "./demoRide";
import { shouldDriverReceiveOffer } from "./driverPrefsStore";
import { sortDriversByDispatchScore } from "./driverDispatcherScore";
import * as db from "../db";

export { DISPATCHER_TOP_N_OFFERS };

const DEMO_DISPATCH_FALLBACK_CENTER = BRAZIL_MAP_CENTER;

export function parseCoord(value: string | number | null | undefined): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

function sortByDistance(drivers: DispatcherEligibleDriver[]): DispatcherEligibleDriver[] {
  return [...drivers].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function sortEligibleDrivers(
  drivers: DispatcherEligibleDriver[],
  vehicleType: string
): DispatcherEligibleDriver[] {
  if (drivers.length <= 1) return drivers;
  return sortDriversByDispatchScore(drivers, vehicleType);
}

function defaultDemoDriverCoords(
  driverId: number,
  near?: { lat: number; lng: number }
): { lat: number; lng: number } {
  const base = near ?? DEMO_DISPATCH_FALLBACK_CENTER;
  const offset = (driverId % 5) * 0.002;
  return { lat: base.lat + offset, lng: base.lng - offset * 0.5 };
}

/** Motoristas demo disponíveis com veículo compatível e posição conhecida/fallback. */
export function findEligibleDemoDrivers(
  vehicleType: string,
  originLat: string,
  originLng: string
): DispatcherEligibleDriver[] {
  const lat = parseCoord(originLat);
  const lng = parseCoord(originLng);
  if (lat == null || lng == null) return [];
  const origin = { lat, lng };

  const eligible: DispatcherEligibleDriver[] = [];

  for (const profile of getAllDemoDriverProfiles()) {
    if (!profile.isAvailable || profile.status !== "approved") continue;
    if (!shouldDriverReceiveOffer(profile.id, vehicleType, "ride")) continue;

    const vehicles = getDemoVehiclesByDriverId(profile.id).filter(
      (v) => v.status === "active" && v.type === vehicleType
    );
    if (vehicles.length === 0) continue;

    const coords =
      getDemoDriverLocationCoords(profile.id) ?? defaultDemoDriverCoords(profile.id, origin);

    eligible.push({
      driverId: profile.id,
      lat: coords.lat,
      lng: coords.lng,
      distanceMeters: Math.round(haversineMeters(origin, coords)),
    });
  }

  return sortEligibleDrivers(eligible, vehicleType);
}

function buildDemoEligibleWithFallback(
  vehicleType: string,
  originLat: string,
  originLng: string
): { eligible: DispatcherEligibleDriver[]; usedFallback: boolean } {
  let eligible = findEligibleDemoDrivers(vehicleType, originLat, originLng);
  let usedFallback = false;

  if (eligible.length === 0) {
    usedFallback = true;
    const origin = { lat: parseCoord(originLat)!, lng: parseCoord(originLng)! };
    const fallbackEligible: DispatcherEligibleDriver[] = [];

    for (const profile of getAllDemoDriverProfiles()) {
      if (!profile.isAvailable || profile.status !== "approved") continue;
      if (!shouldDriverReceiveOffer(profile.id, vehicleType, "ride")) continue;
      const vehicles = getDemoVehiclesByDriverId(profile.id).filter(
        (v) => v.status === "active" && v.type === vehicleType
      );
      if (vehicles.length === 0) continue;
      const coords = defaultDemoDriverCoords(profile.id, origin);
      fallbackEligible.push({
        driverId: profile.id,
        lat: coords.lat,
        lng: coords.lng,
        distanceMeters: Math.round(haversineMeters(origin, coords)),
      });
    }
    eligible = sortEligibleDrivers(fallbackEligible, vehicleType);
  }

  return { eligible, usedFallback };
}

/** Cria ofertas para motoristas da rodada atual (sequencial / ampliada). */
export function dispatchDemoRideOffers(
  rideId: number,
  vehicleType: string,
  originLat: string,
  originLng: string,
  options?: { offerRound?: number; expandPool?: boolean }
): DispatchResult {
  const requestedRound = options?.offerRound ?? 1;
  const { eligible, usedFallback } = buildDemoEligibleWithFallback(
    vehicleType,
    originLat,
    originLng
  );

  const excludeIds = options?.expandPool
    ? getDemoDriversBlockedFromReOffer(rideId)
    : getDemoPreviouslyOfferedDriverIds(rideId);
  const pool = eligible.filter((d) => !excludeIds.has(d.driverId));
  const selection = selectDriversForRound(pool, requestedRound, new Set<number>());

  let created = 0;
  for (const driver of selection.drivers) {
    if (driverHasDemoPendingOffer(rideId, driver.driverId)) continue;
    createDemoRideOffer({
      rideId,
      driverId: driver.driverId,
      distanceMeters: driver.distanceMeters,
      offerRound: selection.offerRound,
    });
    created++;
  }

  return {
    offersCreated: created,
    eligibleCount: eligible.length,
    usedFallback,
    offerRound: selection.offerRound,
    expandedPool: selection.expandedPool,
  };
}

export type RideWithOfferMeta = Ride & {
  offerDistanceMeters?: number;
  offerRound?: number;
  offerExpiresAt?: string;
};

/** Corridas visíveis no dashboard do motorista demo (somente com oferta pending válida). */
export function getDemoAvailableRidesForDriver(driverId: number): RideWithOfferMeta[] {
  const pendingOffers = getDemoPendingOffersForDriver(driverId);
  const rideIds = new Set(pendingOffers.map((o) => o.rideId));

  return getDemoRequestedRides()
    .filter((ride) => rideIds.has(ride.id))
    .filter((ride) => shouldDriverReceiveOffer(driverId, ride.vehicleType, "ride"))
    .map((ride) => {
      const offer = getDemoOfferForDriver(ride.id, driverId);
      return {
        ...ride,
        offerDistanceMeters: offer?.distanceMeters,
        offerRound: offer?.offerRound,
        offerExpiresAt: offer?.expiresAt.toISOString(),
      };
    });
}

export function validateDemoDriverCanAccept(rideId: number, driverId: number): boolean {
  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "requested" || ride.driverId != null) return false;
  return driverHasDemoPendingOffer(rideId, driverId);
}

export function acceptDemoRideOffers(rideId: number, driverId: number): void {
  resolveDemoOffersOnAccept(rideId, driverId);
}

export function declineDemoRideOfferForDriver(
  rideId: number,
  driverId: number
): boolean {
  return declineDemoRideOffer(rideId, driverId) != null;
}

export async function declineProductionRideOfferForDriver(
  rideId: number,
  driverId: number
): Promise<boolean> {
  return db.declineRideOffer(rideId, driverId);
}

/** Produção: motoristas com veículo compatível + localização (ou centro fallback). */
export async function findEligibleProductionDrivers(
  vehicleType: string,
  originLat: string,
  originLng: string
): Promise<DispatcherEligibleDriver[]> {
  const lat = parseCoord(originLat);
  const lng = parseCoord(originLng);
  if (lat == null || lng == null) return [];
  const origin = { lat, lng };

  const profiles = await db.getAvailableDrivers();
  const eligible: DispatcherEligibleDriver[] = [];

  for (const profile of profiles) {
    if (!shouldDriverReceiveOffer(profile.id, vehicleType, "ride")) continue;
    const vehicles = (await db.getVehiclesByDriverId(profile.id)).filter(
      (v) => v.status === "active" && v.type === vehicleType
    );
    if (vehicles.length === 0) continue;

    const location = await db.getDriverLocation(profile.id);
    const coords = location
      ? { lat: parseCoord(location.lat)!, lng: parseCoord(location.lng)! }
      : defaultDemoDriverCoords(profile.id);

    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) continue;

    eligible.push({
      driverId: profile.id,
      lat: coords.lat,
      lng: coords.lng,
      distanceMeters: Math.round(haversineMeters(origin, coords)),
    });
  }

  return sortByDistance(eligible);
}

export async function dispatchProductionRideOffers(
  rideId: number,
  vehicleType: string,
  originLat: string,
  originLng: string,
  options?: { offerRound?: number; expandPool?: boolean }
): Promise<DispatchResult> {
  const requestedRound = options?.offerRound ?? 1;
  let eligible = await findEligibleProductionDrivers(vehicleType, originLat, originLng);
  let usedFallback = false;

  if (eligible.length === 0) {
    usedFallback = true;
    eligible = await findEligibleProductionDrivers(vehicleType, originLat, originLng);
  }

  const excludeIds = options?.expandPool
    ? await db.getDriversBlockedFromReOffer(rideId)
    : await db.getPreviouslyOfferedDriverIdsForRide(rideId);
  const pool = eligible.filter((d) => !excludeIds.has(d.driverId));
  const selection = selectDriversForRound(pool, requestedRound, new Set<number>());

  const toCreate: Array<{
    rideId: number;
    driverId: number;
    distanceMeters: number;
    offerRound: number;
  }> = [];

  for (const driver of selection.drivers) {
    const hasPending = await db.driverHasPendingRideOffer(rideId, driver.driverId);
    if (hasPending) continue;
    toCreate.push({
      rideId,
      driverId: driver.driverId,
      distanceMeters: driver.distanceMeters,
      offerRound: selection.offerRound,
    });
  }

  if (toCreate.length > 0) {
    await db.createRideOffers(toCreate);
  }

  return {
    offersCreated: toCreate.length,
    eligibleCount: eligible.length,
    usedFallback,
    offerRound: selection.offerRound,
    expandedPool: selection.expandedPool,
  };
}

export async function getProductionAvailableRidesForDriver(
  driverId: number
): Promise<RideWithOfferMeta[]> {
  try {
    return await db.getRequestedRidesWithPendingOfferForDriver(driverId);
  } catch {
    const rides = await db.getRequestedRides();
    return rides.filter((r) => r.driverId == null);
  }
}

export async function validateProductionDriverCanAccept(
  rideId: number,
  driverId: number
): Promise<boolean> {
  try {
    return await db.driverHasPendingRideOffer(rideId, driverId);
  } catch {
    return true;
  }
}

export async function acceptProductionRideOffers(
  rideId: number,
  driverId: number
): Promise<void> {
  try {
    await db.resolveRideOffersOnAccept(rideId, driverId);
  } catch (error) {
    console.warn("[Dispatcher] resolveRideOffersOnAccept failed:", error);
  }
}

/** Atualiza posição demo do motorista (persistida em memória). */
export function reportDemoDriverLocation(
  driverId: number,
  lat: string,
  lng: string
): void {
  updateDemoDriverLocation(driverId, lat, lng);
}
