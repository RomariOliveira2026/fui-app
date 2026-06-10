import type { DispatcherEligibleDriver } from "@shared/rideDispatcher";
import { getAllDemoDriverProfiles } from "./demoDriver";
import { shouldDriverReceiveOffer } from "./demoDriverPremium";
import { getAllDemoRideOffers } from "./demoRideOffers";

const MAX_DISTANCE_FOR_SCORE = 6_000;
const RECENT_ACCEPT_HOURS = 48;

function getRecentAcceptedOfferCount(driverId: number): number {
  const cutoff = Date.now() - RECENT_ACCEPT_HOURS * 60 * 60 * 1000;
  return getAllDemoRideOffers().filter(
    (o) =>
      o.driverId === driverId &&
      o.status === "accepted" &&
      o.updatedAt.getTime() >= cutoff
  ).length;
}

/** Score 0–100 para priorizar motoristas no dispatcher demo. */
export function computeDriverDispatchScore(input: {
  driverId: number;
  distanceMeters: number;
  vehicleType: string;
  isAvailable: boolean;
}): number {
  let score = 0;

  if (input.isAvailable) score += 25;
  if (shouldDriverReceiveOffer(input.driverId, input.vehicleType, "ride")) score += 15;

  const proximity =
    input.distanceMeters <= 0
      ? 35
      : Math.max(0, 35 - (input.distanceMeters / MAX_DISTANCE_FOR_SCORE) * 35);
  score += proximity;

  const recentAccepts = getRecentAcceptedOfferCount(input.driverId);
  score += Math.min(25, recentAccepts * 10);

  return Math.round(Math.min(100, score));
}

export function sortDriversByDispatchScore(
  drivers: DispatcherEligibleDriver[],
  vehicleType: string
): DispatcherEligibleDriver[] {
  const profiles = getAllDemoDriverProfiles();
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return [...drivers].sort((a, b) => {
    const profileA = profileById.get(a.driverId);
    const profileB = profileById.get(b.driverId);
    const scoreA = computeDriverDispatchScore({
      driverId: a.driverId,
      distanceMeters: a.distanceMeters,
      vehicleType,
      isAvailable: profileA?.isAvailable ?? false,
    });
    const scoreB = computeDriverDispatchScore({
      driverId: b.driverId,
      distanceMeters: b.distanceMeters,
      vehicleType,
      isAvailable: profileB?.isAvailable ?? false,
    });
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.distanceMeters - b.distanceMeters;
  });
}
