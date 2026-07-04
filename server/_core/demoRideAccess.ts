import { TRPCError } from "@trpc/server";
import type { Ride } from "../../drizzle/schema";
import { getDemoDriverProfileByUserId } from "./demoDriver";
import { buildDemoRideClientPayload, type DemoRideClientPayload } from "./demoRideClientMeta";
import { getDemoRide, hydrateDemoRides, isDemoRideId } from "./demoRide";
import { processDispatchForDemoRide } from "./dispatchEngine";

/** Carrega corrida demo, reidratando do snapshot do cliente se necessário (Vercel/serverless). */
export function fetchDemoRideDetailsForUser(
  rideId: number,
  userId: number,
  demoSnapshot?: unknown
): DemoRideClientPayload {
  if (!isDemoRideId(rideId)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Not a demo ride" });
  }

  let ride = getDemoRide(rideId);
  if (!ride && demoSnapshot && isDemoRideId(Number((demoSnapshot as Ride).id))) {
    hydrateDemoRides([demoSnapshot as never]);
    ride = getDemoRide(rideId);
  }
  if (!ride) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
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
  return buildDemoRideClientPayload(ride);
}
