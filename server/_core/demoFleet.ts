import { haversineMeters } from "@shared/demoMaps";
import {
  DEMO_FLEET_DRIVERS,
  type DemoFleetDriverSeed,
  type DemoFleetDriverStatus,
  type DemoFleetVehicleType,
} from "@shared/demoFleet";
import { BRAZIL_MAP_CENTER } from "@shared/mapDefaults";
import type { DriverProfile, Vehicle } from "../../drizzle/schema";
import {
  createDemoDriverProfile,
  createDemoFleetDriverProfile,
  createDemoVehicle,
  getAllDemoDriverProfiles,
  getDemoDriverLocationCoords,
  getDemoDriverProfileById,
  getDemoVehiclesByDriverId,
  updateDemoDriverAvailability,
  updateDemoDriverLocation,
} from "./demoDriver";
import { parseCoord } from "./rideDispatcher";

type FleetRuntime = DemoFleetDriverSeed & {
  driverId: number;
  vehicleId: number;
  status: DemoFleetDriverStatus;
  activeRideId: number | null;
};

const fleetByDriverId = new Map<number, FleetRuntime>();
let fleetCenter: { lat: number; lng: number } = {
  lat: BRAZIL_MAP_CENTER.lat,
  lng: BRAZIL_MAP_CENTER.lng,
};
let fleetSeeded = false;

function coordsForSeed(seed: DemoFleetDriverSeed, center: { lat: number; lng: number }) {
  return {
    lat: center.lat + seed.offsetLat,
    lng: center.lng + seed.offsetLng,
  };
}

function resolveFleetStatus(runtime: FleetRuntime): DemoFleetDriverStatus {
  if (runtime.activeRideId != null) {
    return runtime.status === "em_corrida" ? "em_corrida" : "a_caminho";
  }
  const profile = getDemoDriverProfileById(runtime.driverId);
  if (profile?.isAvailable) return "online";
  return "offline";
}

export function ensureDemoFleetSeed(near?: { lat: number; lng: number } | null): void {
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    fleetCenter = { lat: near.lat, lng: near.lng };
  }

  if (!fleetSeeded) {
    for (const seed of DEMO_FLEET_DRIVERS) {
      const profile = createDemoFleetDriverProfile(seed.userId, seed.rating);
      const vehicle = createDemoVehicle(profile.id, {
        type: seed.vehicleType,
        brand: seed.brand,
        model: seed.model,
        plate: seed.plate,
        color: seed.color,
        year: 2023,
      });
      const coords = coordsForSeed(seed, fleetCenter);
      updateDemoDriverLocation(profile.id, coords.lat.toFixed(6), coords.lng.toFixed(6));

      fleetByDriverId.set(profile.id, {
        ...seed,
        driverId: profile.id,
        vehicleId: vehicle.id,
        status: "online",
        activeRideId: null,
      });
    }
    fleetSeeded = true;
    return;
  }

  for (const runtime of Array.from(fleetByDriverId.values())) {
    if (runtime.activeRideId != null) continue;
    const coords = coordsForSeed(runtime, fleetCenter);
    updateDemoDriverLocation(runtime.driverId, coords.lat.toFixed(6), coords.lng.toFixed(6));
    updateDemoDriverAvailability(runtime.driverId, true);
    runtime.status = "online";
    runtime.activeRideId = null;
  }
}

export function getDemoFleetRuntime(driverId: number): FleetRuntime | undefined {
  return fleetByDriverId.get(driverId);
}

export function getDemoFleetDriverMeta(driverId: number): {
  name: string;
  avatarUrl: string;
  rating: number;
  status: DemoFleetDriverStatus;
} | null {
  const runtime = fleetByDriverId.get(driverId);
  if (!runtime) return null;
  return {
    name: runtime.name,
    avatarUrl: runtime.avatarUrl,
    rating: runtime.rating,
    status: resolveFleetStatus(runtime),
  };
}

export function setFleetDriverOnRide(
  driverId: number,
  rideId: number,
  status: "a_caminho" | "em_corrida"
): void {
  const runtime = fleetByDriverId.get(driverId);
  if (!runtime) return;
  runtime.activeRideId = rideId;
  runtime.status = status;
  updateDemoDriverAvailability(driverId, false);
}

export function releaseFleetDriver(driverId: number): void {
  const runtime = fleetByDriverId.get(driverId);
  if (!runtime) return;
  runtime.activeRideId = null;
  runtime.status = "online";
  updateDemoDriverAvailability(driverId, true);
}

export function findNearestAvailableFleetDriver(
  vehicleType: DemoFleetVehicleType,
  originLat: string,
  originLng: string
): { profile: DriverProfile; vehicle: Vehicle; runtime: FleetRuntime; distanceM: number } | null {
  const lat = parseCoord(originLat);
  const lng = parseCoord(originLng);
  if (lat == null || lng == null) return null;

  const origin = { lat, lng };
  let best: {
    profile: DriverProfile;
    vehicle: Vehicle;
    runtime: FleetRuntime;
    distanceM: number;
  } | null = null;

  for (const runtime of Array.from(fleetByDriverId.values())) {
    if (runtime.activeRideId != null) continue;
    if (runtime.vehicleType !== vehicleType) continue;

    const profile = getDemoDriverProfileById(runtime.driverId);
    if (!profile?.isAvailable || profile.status !== "approved") continue;

    const vehicle =
      getDemoVehiclesByDriverId(runtime.driverId).find((v) => v.id === runtime.vehicleId) ??
      getDemoVehiclesByDriverId(runtime.driverId)[0];
    if (!vehicle || vehicle.status !== "active") continue;

    const coords = getDemoDriverLocationCoords(runtime.driverId) ?? coordsForSeed(runtime, fleetCenter);
    const distanceM = haversineMeters(origin, coords);

    if (!best || distanceM < best.distanceM) {
      best = { profile, vehicle, runtime, distanceM };
    }
  }

  return best;
}

export type DemoFleetMapDriver = {
  driverId: number;
  name: string;
  vehicleType: DemoFleetVehicleType;
  plate: string;
  avatarUrl: string;
  rating: number;
  status: DemoFleetDriverStatus;
  lat: number;
  lng: number;
};

export function listDemoFleetForMap(): DemoFleetMapDriver[] {
  if (!fleetSeeded) ensureDemoFleetSeed();
  const out: DemoFleetMapDriver[] = [];

  for (const runtime of Array.from(fleetByDriverId.values())) {
    const coords = getDemoDriverLocationCoords(runtime.driverId) ?? coordsForSeed(runtime, fleetCenter);
    out.push({
      driverId: runtime.driverId,
      name: runtime.name,
      vehicleType: runtime.vehicleType,
      plate: runtime.plate,
      avatarUrl: runtime.avatarUrl,
      rating: runtime.rating,
      status: resolveFleetStatus(runtime),
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  return out;
}

/** Nome exibido para motorista da frota (admin / corridas). */
export function getDemoFleetDriverName(driverId: number): string | null {
  return fleetByDriverId.get(driverId)?.name ?? null;
}

export function hydrateDemoFleetFromProfiles(): void {
  if (fleetSeeded) return;
  const profiles = getAllDemoDriverProfiles();
  if (profiles.length === 0) return;

  for (const seed of DEMO_FLEET_DRIVERS) {
    const profile = profiles.find((p) => p.userId === seed.userId);
    if (!profile) continue;
    const vehicle = getDemoVehiclesByDriverId(profile.id)[0];
    if (!vehicle) continue;
    fleetByDriverId.set(profile.id, {
      ...seed,
      driverId: profile.id,
      vehicleId: vehicle.id,
      status: profile.isAvailable ? "online" : "offline",
      activeRideId: null,
    });
  }
  if (fleetByDriverId.size > 0) fleetSeeded = true;
}
