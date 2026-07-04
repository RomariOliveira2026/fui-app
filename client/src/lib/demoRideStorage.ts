import type { Ride } from "../../../drizzle/schema";

export const FUI_DEMO_RIDES_KEY = "fui_demo_rides";
export const FUI_DEMO_CHAT_PREFIX = "fui_demo_chat_";

function reviveRide(raw: Ride): Ride {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
    cancelledAt: raw.cancelledAt ? new Date(raw.cancelledAt) : null,
    scheduledFor: raw.scheduledFor ? new Date(raw.scheduledFor) : null,
    sosActivatedAt: raw.sosActivatedAt ? new Date(raw.sosActivatedAt) : null,
  };
}

export function loadDemoRides(): Ride[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_RIDES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Ride[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(reviveRide);
  } catch {
    return [];
  }
}

export function saveDemoRides(rides: Ride[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_RIDES_KEY, JSON.stringify(rides));
  } catch (error) {
    console.warn("[demoRideStorage] save failed:", error);
  }
}

/** Remove campos grandes do payload antes de persistir no localStorage. */
export function stripDemoRideForStorage(ride: Ride): Ride {
  const copy = { ...ride } as Ride & {
    tripPath?: unknown;
    categoryQuotes?: unknown;
    demoDriver?: unknown;
    simulationPhase?: unknown;
    etaSecondsRemaining?: unknown;
    dispatchMeta?: unknown;
  };
  delete copy.tripPath;
  delete copy.categoryQuotes;
  delete copy.demoDriver;
  delete copy.simulationPhase;
  delete copy.etaSecondsRemaining;
  delete copy.dispatchMeta;
  return copy as Ride;
}

export function upsertDemoRide(ride: Ride): void {
  const rides = loadDemoRides().filter((r) => r.id !== ride.id);
  rides.unshift(stripDemoRideForStorage(reviveRide(ride)));
  saveDemoRides(rides);
}

/** Snapshot para reidratar corrida demo no servidor (Vercel/serverless). */
export function getDemoRideSnapshot(rideId: number): Ride | undefined {
  return loadDemoRides().find((ride) => ride.id === rideId);
}

export type DemoChatMessageSnapshot = {
  id: number;
  senderId: number;
  message: string;
  createdAt: string;
};

export function loadDemoChatMessages(rideId: number): DemoChatMessageSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${FUI_DEMO_CHAT_PREFIX}${rideId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoChatMessageSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDemoChatMessages(
  rideId: number,
  messages: DemoChatMessageSnapshot[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${FUI_DEMO_CHAT_PREFIX}${rideId}`, JSON.stringify(messages));
  } catch (error) {
    console.warn("[demoRideStorage] chat save failed:", error);
  }
}
