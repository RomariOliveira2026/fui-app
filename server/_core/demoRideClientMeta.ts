import type { Ride } from "../../drizzle/schema";
import type { RoutePoint } from "@shared/routeAnimation";
import { getDemoRideDriverDetails } from "./demoDriver";
import { attachDispatchMeta } from "./dispatchEngine";
import { getDemoTripPath } from "./demoRoutePaths";
import { getOperationalEtaSeconds } from "./demoOperationalRide";
import { attachSimulationMeta, syncDemoRideState } from "./demoRideSimulation";

export type DemoRideClientPayload = Ride & {
  simulationPhase?: string;
  demoDriver?: ReturnType<typeof getDemoRideDriverDetails>;
  tripPath?: RoutePoint[];
  etaSecondsRemaining?: number;
};

/** Payload completo para o cliente (sync, fase, motorista, rota para ETA). */
export function buildDemoRideClientPayload(ride: Ride): DemoRideClientPayload {
  const synced = syncDemoRideState(ride);
  const withMeta = attachSimulationMeta(synced);
  const withDispatch = attachDispatchMeta(withMeta);
  const demoDriver = getDemoRideDriverDetails(synced);
  const tripPath = getDemoTripPath(synced);

  const base = (demoDriver ? { ...withDispatch, demoDriver } : withDispatch) as DemoRideClientPayload;

  if (tripPath.length >= 2) {
    base.tripPath = tripPath;
  }

  const etaSeconds = getOperationalEtaSeconds(synced.id);
  if (etaSeconds != null) {
    base.etaSecondsRemaining = etaSeconds;
  }

  return base;
}
