import { TRPCError } from "@trpc/server";
import type { Ride } from "../../drizzle/schema";
import { getDemoDriverProfileByUserId } from "./demoDriver";
import { buildDemoRideClientPayload, type DemoRideClientPayload } from "./demoRideClientMeta";
import { getDemoRide, hydrateDemoRides, isDemoRideId } from "./demoRide";
import { ensureDemoRoutePath, getDemoTripPathSource, hydrateDemoRouteFromSnapshot } from "./demoRoutePaths";
import { processDispatchForDemoRide } from "./dispatchEngine";
import { restoreOperationalStateFromRide } from "./demoOperationalRide";
import { restoreSimulationStateFromRide } from "./demoRideSimulation";

/** Carrega corrida demo, reidratando do snapshot do cliente se necessário (Vercel/serverless). */
export async function fetchDemoRideDetailsForUser(
  rideId: number,
  userId: number,
  demoSnapshot?: unknown
): Promise<DemoRideClientPayload> {
  if (!isDemoRideId(rideId)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Not a demo ride" });
  }

  let ride = getDemoRide(rideId);
  if (!ride && demoSnapshot && isDemoRideId(Number((demoSnapshot as Ride).id))) {
    hydrateDemoRides([demoSnapshot as never]);
    hydrateDemoRouteFromSnapshot(demoSnapshot as Ride & { demoRoutePolyline?: string; tripPathSource?: "osrm" | "fallback" });
    ride = getDemoRide(rideId);
  } else if (ride && demoSnapshot) {
    hydrateDemoRouteFromSnapshot(demoSnapshot as Ride & { demoRoutePolyline?: string; tripPathSource?: "osrm" | "fallback" });
  }
  if (!ride) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
  }

  if (ride.status === "accepted" || ride.status === "in_progress") {
    restoreOperationalStateFromRide(ride);
    restoreSimulationStateFromRide(ride);
  }

  const driverProfile = getDemoDriverProfileByUserId(userId);
  const canAccess =
    ride.passengerId === userId ||
    (driverProfile != null && ride.driverId === driverProfile.id);
  if (!canAccess) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  processDispatchForDemoRide(rideId);
  ride = getDemoRide(rideId)!;

  if (
    (ride.status === "accepted" || ride.status === "in_progress" || ride.status === "requested") &&
    getDemoTripPathSource(rideId) !== "osrm"
  ) {
    await ensureDemoRoutePath(ride);
    ride = getDemoRide(rideId)!;
  }

  return buildDemoRideClientPayload(ride);
}
