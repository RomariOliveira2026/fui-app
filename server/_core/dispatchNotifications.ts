import type { DispatchResult } from "@shared/rideDispatcher";
import { getDispatcherOfferTimeoutMs } from "@shared/rideDispatcher";
import { getDemoRide, isDemoRideId } from "./demoRide";
import { notifyDriversAboutRideOffer } from "./driverOfferNotifications";
import * as db from "../db";

/** Push + in-app para cada rodada de dispatch/redispatch com ofertas criadas. */
export async function notifyRideOfferDispatch(
  rideId: number,
  dispatch: DispatchResult
): Promise<void> {
  if (dispatch.offersCreated === 0 || dispatch.offeredDriverIds.length === 0) {
    return;
  }

  let originAddress: string;
  let destinationAddress: string;
  let vehicleType: string;
  let estimatedPrice: number;

  if (isDemoRideId(rideId)) {
    const ride = getDemoRide(rideId);
    if (!ride) return;
    originAddress = ride.originAddress;
    destinationAddress = ride.destinationAddress;
    vehicleType = ride.vehicleType;
    estimatedPrice = ride.estimatedPrice ?? 0;
  } else {
    const ride = await db.getRideById(rideId);
    if (!ride) return;
    originAddress = ride.originAddress;
    destinationAddress = ride.destinationAddress;
    vehicleType = ride.vehicleType;
    estimatedPrice = ride.estimatedPrice ?? 0;
  }

  try {
    await notifyDriversAboutRideOffer({
      rideId,
      driverIds: dispatch.offeredDriverIds,
      vehicleType,
      originAddress,
      destinationAddress,
      estimatedPriceCents: estimatedPrice,
      expiresAt: new Date(Date.now() + getDispatcherOfferTimeoutMs()),
      offerRound: dispatch.offerRound,
    });
  } catch (error) {
    console.warn(
      `[Push] Falha ao notificar motoristas (corrida #${rideId}, rodada ${dispatch.offerRound}):`,
      error
    );
  }
}
