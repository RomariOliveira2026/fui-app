import { TRPCError } from "@trpc/server";
import type { DispatchResult } from "@shared/rideDispatcher";
import { isDemoRideId, getDemoRide, updateDemoRide } from "./demoRide";
import { isDemoPassenger } from "./demoUser";
import { expireDemoPendingOffersForRide } from "./demoRideOffers";
import {
  redispatchDemoRideOffers,
  redispatchProductionRideOffers,
} from "./dispatchEngine";
import { notifyRideOfferDispatch } from "./dispatchNotifications";
import { clearDemoDriverTrack, initDemoDriverTrack } from "./demoDriverTracking";
import { clearSimulationState, syncDemoRideState } from "./demoRideSimulation";
import { restoreOperationalStateFromRide } from "./demoOperationalRide";
import { setFleetDriverOnRide } from "./demoFleet";
import { getDemoDriverProfileById, getDemoVehiclesByDriverId } from "./demoDriver";
import * as db from "../db";
import { recordCancellationAudit } from "./demoAdminFinance";

export function canAdminCancelRide(status: string): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function canAdminRedispatchRide(status: string, driverId?: number | null): boolean {
  return status === "requested" && (driverId == null || driverId === 0);
}

export async function adminCancelRide(
  rideId: number,
  cancelledByUserId: number,
  reason?: string
): Promise<{ success: true }> {
  if (isDemoRideId(rideId)) {
    const ride = getDemoRide(rideId);
    if (!ride) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
    }
    if (!canAdminCancelRide(ride.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida não pode ser cancelada" });
    }

    updateDemoRide(rideId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: cancelledByUserId,
      cancellationReason: reason ?? "Cancelada pela central operacional",
    });
    recordCancellationAudit({
      entityType: "ride",
      entityId: rideId,
      origin: "admin",
      reason: reason ?? "Cancelada pela central operacional",
      cancelledByUserId,
      cancelledByLabel: "Central operacional",
    });
    expireDemoPendingOffersForRide(rideId);
    clearDemoDriverTrack(rideId);
    clearSimulationState(rideId);
    return { success: true };
  }

  const ride = await db.getRideById(rideId);
  if (!ride) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
  }
  if (!canAdminCancelRide(ride.status)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida não pode ser cancelada" });
  }

  await db.updateRide(rideId, {
    status: "cancelled",
    cancelledAt: new Date(),
    cancelledBy: cancelledByUserId,
    cancellationReason: reason ?? "Cancelada pela central operacional",
  });
  recordCancellationAudit({
    entityType: "ride",
    entityId: rideId,
    origin: "admin",
    reason: reason ?? "Cancelada pela central operacional",
    cancelledByUserId,
    cancelledByLabel: "Central operacional",
  });
  await db.expirePendingRideOffersForRide(rideId);
  return { success: true };
}

export async function adminRedispatchRide(
  rideId: number,
  isDemoContext: boolean
): Promise<DispatchResult & { offerRound: number }> {
  if (isDemoRideId(rideId) || isDemoContext) {
    const ride = getDemoRide(rideId);
    if (!ride) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
    }
    if (!canAdminRedispatchRide(ride.status, ride.driverId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Só é possível reenfileirar corridas pendentes sem motorista",
      });
    }

    expireDemoPendingOffersForRide(rideId);
    const result = redispatchDemoRideOffers(rideId);
    void notifyRideOfferDispatch(rideId, result);
    return { ...result, offerRound: result.offerRound };
  }

  const ride = await db.getRideById(rideId);
  if (!ride) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
  }
  if (!canAdminRedispatchRide(ride.status, ride.driverId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Só é possível reenfileirar corridas pendentes sem motorista",
    });
  }

  const result = await redispatchProductionRideOffers(rideId);
  await notifyRideOfferDispatch(rideId, result);
  return { ...result, offerRound: result.offerRound };
}

export function canAdminAssignRide(status: string, driverId?: number | null): boolean {
  return status === "requested" && (driverId == null || driverId === 0);
}

/** Assign manual de um motorista específico a uma corrida pendente (Central). */
export async function adminAssignRide(
  rideId: number,
  driverId: number,
  isDemoContext: boolean
): Promise<{ success: true }> {
  if (isDemoRideId(rideId) || isDemoContext) {
    const ride = getDemoRide(rideId);
    if (!ride) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
    }
    if (!canAdminAssignRide(ride.status, ride.driverId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Só é possível designar motorista para corridas pendentes",
      });
    }

    const profile = getDemoDriverProfileById(driverId);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Motorista não encontrado" });
    }
    const vehicle =
      getDemoVehiclesByDriverId(driverId).find((v) => v.type === ride.vehicleType) ??
      getDemoVehiclesByDriverId(driverId)[0];

    expireDemoPendingOffersForRide(rideId);
    const startCoords = initDemoDriverTrack(rideId, ride, "to_pickup");

    updateDemoRide(rideId, {
      driverId,
      vehicleId: vehicle?.id ?? null,
      status: "accepted",
      acceptedAt: new Date(),
      driverCurrentLat: startCoords.driverCurrentLat,
      driverCurrentLng: startCoords.driverCurrentLng,
    });

    setFleetDriverOnRide(driverId, rideId, "a_caminho");
    const fresh = getDemoRide(rideId);
    if (fresh) {
      restoreOperationalStateFromRide(fresh);
      syncDemoRideState(fresh);
    }
    return { success: true };
  }

  const ride = await db.getRideById(rideId);
  if (!ride) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
  }
  if (!canAdminAssignRide(ride.status, ride.driverId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Só é possível designar motorista para corridas pendentes",
    });
  }

  const profile = await db.getDriverProfileById(driverId);
  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Motorista não encontrado" });
  }
  const vehicles = await db.getVehiclesByDriverId(driverId);
  const vehicle = vehicles.find((v) => v.type === ride.vehicleType) ?? vehicles[0];
  if (!vehicle) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Motorista não possui veículo compatível cadastrado",
    });
  }

  const driverLocation = await db.getDriverLocation(driverId);
  await db.updateRide(rideId, {
    driverId,
    vehicleId: vehicle.id,
    status: "accepted",
    acceptedAt: new Date(),
    ...(driverLocation
      ? { driverCurrentLat: driverLocation.lat, driverCurrentLng: driverLocation.lng }
      : {}),
  });
  await db.expirePendingRideOffersForRide(rideId);
  return { success: true };
}

export function isAdminDemoContext(user: { openId: string }): boolean {
  return isDemoPassenger(user);
}
