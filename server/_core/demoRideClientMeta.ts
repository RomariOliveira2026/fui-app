import type { Ride } from "../../drizzle/schema";
import type { RoutePoint } from "@shared/routeAnimation";
import { getDemoRideDriverDetails } from "./demoDriver";
import { attachDispatchMeta } from "./dispatchEngine";
import { getDemoTripPath, getDemoRouteSnapshotFields, getDemoTripPathSource, scheduleDemoRoutePathUpgrade } from "./demoRoutePaths";
import { getOperationalEtaSeconds } from "./demoOperationalRide";
import { attachSimulationMeta, getSimulationEtaSeconds, syncDemoRideState } from "./demoRideSimulation";

export type DemoRideClientPayload = Ride & {
  simulationPhase?: string;
  demoDriver?: ReturnType<typeof getDemoRideDriverDetails>;
  tripPath?: RoutePoint[];
  tripPathSource?: "osrm" | "fallback";
  demoRoutePolyline?: string;
  etaSecondsRemaining?: number;
};

/** Payload completo para o cliente (sync, fase, motorista, rota para ETA). */
export function buildDemoRideClientPayload(ride: Ride): DemoRideClientPayload {
  const synced = syncDemoRideState(ride);
  const withMeta = attachSimulationMeta(synced);
  const withDispatch = attachDispatchMeta(withMeta);
  const demoDriver = getDemoRideDriverDetails(synced);
  const tripPath = getDemoTripPath(synced);
  const tripPathSource = getDemoTripPathSource(synced.id) ?? "fallback";

  const base = (demoDriver ? { ...withDispatch, demoDriver } : withDispatch) as DemoRideClientPayload;

  if (tripPath.length >= 2) {
    base.tripPath = tripPath;
    base.tripPathSource = tripPathSource;
    const routeFields = getDemoRouteSnapshotFields(synced.id);
    if (routeFields.demoRoutePolyline) {
      base.demoRoutePolyline = routeFields.demoRoutePolyline;
    }
  }

  if (tripPathSource === "fallback") {
    scheduleDemoRoutePathUpgrade(synced);
  }

  const etaSeconds =
    getOperationalEtaSeconds(synced.id) ?? getSimulationEtaSeconds(synced.id);
  if (etaSeconds != null) {
    base.etaSecondsRemaining = etaSeconds;
  }

  return base;
}
