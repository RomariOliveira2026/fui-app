import { getDemoDriverProfileById } from "./demoDriver";
import { createNotificationWithPush } from "../routers/notification";
import * as db from "../db";
import { VEHICLE_TYPE_LABELS } from "@shared/rideCategories";
import { formatRidePriceBRL } from "@shared/rideCategories";

type RideOfferPushInput = {
  rideId: number;
  driverIds: number[];
  vehicleType: string;
  originAddress: string;
  destinationAddress: string;
  estimatedPriceCents: number;
  expiresAt?: Date;
  offerRound?: number;
};

function shortenAddress(address: string): string {
  return address.split(",")[0]?.trim() || address;
}

/** Notifica motoristas que receberam oferta formal (não broadcast genérico). */
export async function notifyDriversAboutRideOffer(input: RideOfferPushInput): Promise<void> {
  if (input.driverIds.length === 0) return;

  const database = await db.getDb();
  const vehicleLabel =
    VEHICLE_TYPE_LABELS[input.vehicleType as keyof typeof VEHICLE_TYPE_LABELS] ??
    input.vehicleType;
  const price = formatRidePriceBRL(input.estimatedPriceCents);
  const origin = shortenAddress(input.originAddress);
  const destination = shortenAddress(input.destinationAddress);
  const expiresAt = input.expiresAt?.toISOString();
  const roundLabel =
    input.offerRound != null && input.offerRound > 1
      ? ` (rodada ${input.offerRound})`
      : "";
  const title = input.offerRound != null && input.offerRound > 1
    ? "Nova chance de corrida"
    : "Nova corrida para você";

  await Promise.all(
    input.driverIds.map(async (driverId) => {
      const demoProfile = getDemoDriverProfileById(driverId);
      const profile = demoProfile ?? (database ? await db.getDriverProfileById(driverId) : null);
      if (!profile?.userId) return;

      await createNotificationWithPush(database, profile.userId, {
        type: "ride",
        title,
        message: `${vehicleLabel} — ${origin} → ${destination} (${price})${roundLabel}`,
        actionUrl: `/driver-dashboard?offerRide=${input.rideId}`,
        actionLabel: "Ver oferta",
        metadata: {
          rideId: input.rideId,
          event: "ride_offer",
          expiresAt,
          offerRound: input.offerRound,
        },
      });
    })
  );
}
