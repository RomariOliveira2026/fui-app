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
import { clearDemoDriverTrack } from "./demoDriverTracking";
import { clearSimulationState } from "./demoRideSimulation";
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

export function isAdminDemoContext(user: { openId: string }): boolean {
  return isDemoPassenger(user);
}
