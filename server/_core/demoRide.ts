import type { InsertRide, Ride } from "../../drizzle/schema";
import { DEMO_PASSENGER_OPEN_ID } from "@shared/const";

/** IDs de corridas demo em memória (não colidem com auto-increment do MySQL). */
const DEMO_RIDE_ID_START = 900_001;

const demoRides = new Map<number, Ride>();
let nextDemoRideId = DEMO_RIDE_ID_START;

export function isDemoRideId(rideId: number): boolean {
  return rideId >= DEMO_RIDE_ID_START;
}

export function getDemoRide(rideId: number): Ride | undefined {
  return demoRides.get(rideId);
}

function buildDemoRide(values: InsertRide & { id: number }): Ride {
  const now = new Date();
  return {
    id: values.id,
    passengerId: values.passengerId,
    driverId: values.driverId ?? null,
    vehicleId: values.vehicleId ?? null,
    status: values.status ?? "requested",
    vehicleType: values.vehicleType,
    originAddress: values.originAddress,
    originLat: values.originLat,
    originLng: values.originLng,
    destinationAddress: values.destinationAddress,
    destinationLat: values.destinationLat,
    destinationLng: values.destinationLng,
    driverCurrentLat: values.driverCurrentLat ?? null,
    driverCurrentLng: values.driverCurrentLng ?? null,
    distance: values.distance ?? null,
    duration: values.duration ?? null,
    estimatedPrice: values.estimatedPrice ?? null,
    finalPrice: values.finalPrice ?? null,
    paymentMethod: values.paymentMethod,
    paymentStatus: values.paymentStatus ?? "pending",
    stripePaymentIntentId: values.stripePaymentIntentId ?? null,
    couponId: values.couponId ?? null,
    couponCode: values.couponCode ?? null,
    discountAmount: values.discountAmount ?? 0,
    isShared: values.isShared ?? false,
    maxPassengers: values.maxPassengers ?? 1,
    currentPassengers: values.currentPassengers ?? 1,
    pricePerPassenger: values.pricePerPassenger ?? null,
    isFreight: values.isFreight ?? false,
    cargoWeight: values.cargoWeight ?? null,
    cargoType: values.cargoType ?? null,
    cargoDescription: values.cargoDescription ?? null,
    needsHelpers: values.needsHelpers ?? false,
    numberOfHelpers: values.numberOfHelpers ?? 0,
    shareToken: values.shareToken ?? `demo-${values.id}`,
    sosActivated: false,
    sosActivatedAt: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
    scheduledFor: values.scheduledFor ?? null,
    isScheduled: values.isScheduled ?? "no",
    cancelledBy: null,
    cancellationReason: null,
    passengerPremiumMeta: values.passengerPremiumMeta ?? null,
  };
}

/** Cria corrida demo em memória (sem MySQL). */
export function createDemoRide(values: InsertRide): Ride {
  const id = nextDemoRideId++;
  const ride = buildDemoRide({ ...values, id });
  demoRides.set(id, ride);
  return ride;
}

export function getAllDemoRides(): Ride[] {
  return Array.from(demoRides.values());
}

function sortRidesNewestFirst(list: Ride[]): Ride[] {
  return [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Corridas do passageiro demo (inclui concluídas e canceladas). */
export function getDemoPassengerRides(passengerId: number): Ride[] {
  return sortRidesNewestFirst(
    Array.from(demoRides.values()).filter((ride) => ride.passengerId === passengerId)
  );
}

/** Corridas do motorista demo (inclui concluídas; exclui canceladas opcionalmente). */
export function getDemoDriverRides(
  driverId: number,
  options?: { includeCancelled?: boolean }
): Ride[] {
  return sortRidesNewestFirst(
    Array.from(demoRides.values()).filter((ride) => {
      if (ride.driverId !== driverId) return false;
      if (!options?.includeCancelled && ride.status === "cancelled") return false;
      return true;
    })
  );
}

function parseRideDates(ride: Ride): Ride {
  return {
    ...ride,
    createdAt: new Date(ride.createdAt),
    updatedAt: new Date(ride.updatedAt),
    completedAt: ride.completedAt ? new Date(ride.completedAt) : null,
    cancelledAt: ride.cancelledAt ? new Date(ride.cancelledAt) : null,
    scheduledFor: ride.scheduledFor ? new Date(ride.scheduledFor) : null,
    sosActivatedAt: ride.sosActivatedAt ? new Date(ride.sosActivatedAt) : null,
  };
}

/** Restaura corridas demo enviadas pelo cliente (localStorage). */
export function hydrateDemoRides(rides: Ride[]): void {
  for (const raw of rides) {
    if (!isDemoRideId(raw.id)) continue;
    const ride = parseRideDates(raw);
    const existing = demoRides.get(ride.id);
    if (existing && existing.updatedAt.getTime() > ride.updatedAt.getTime()) {
      continue;
    }
    demoRides.set(ride.id, ride);
    if (ride.id >= nextDemoRideId) {
      nextDemoRideId = ride.id + 1;
    }
  }
}

export function isDemoPassengerOpenId(openId: string | null | undefined): boolean {
  return openId === DEMO_PASSENGER_OPEN_ID;
}

export function updateDemoRide(rideId: number, updates: Partial<Ride>): Ride | undefined {
  const ride = demoRides.get(rideId);
  if (!ride) return undefined;
  const updated: Ride = { ...ride, ...updates, updatedAt: new Date() };
  demoRides.set(rideId, updated);
  return updated;
}

export function getDemoRequestedRides(): Ride[] {
  return Array.from(demoRides.values())
    .filter((ride) => ride.status === "requested" && ride.driverId == null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getDemoActiveRidesForUser(
  userId: number,
  driverProfileId?: number | null
): Ride[] {
  return Array.from(demoRides.values()).filter(
    (ride) =>
      (["requested", "accepted", "in_progress"] as const).includes(
        ride.status as "requested" | "accepted" | "in_progress"
      ) &&
      (ride.passengerId === userId ||
        (driverProfileId != null && ride.driverId === driverProfileId))
  );
}
