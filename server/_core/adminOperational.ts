import type { Ride } from "../../drizzle/schema";
import {
  ADMIN_MAP_DEFAULT_CENTER,
  type AdminOperationalDriver,
  type AdminOperationalMetrics,
  type AdminOperationalOverview,
  type AdminOperationalRide,
  type AdminDriverOperationalStatus,
} from "@shared/adminOperational";
import { DEMO_PLACES } from "@shared/demoMaps";
import { DEMO_SIMULATION_DRIVER_ID, DEMO_SIMULATION_DRIVER_NAME } from "@shared/demoSimulation";
import * as db from "../db";
import {
  ensureDemoFleetSeed,
  getDemoFleetDriverName,
} from "./demoFleet";
import {
  getAllDemoDriverProfiles,
  getDemoDriverLocationCoords,
  getDemoVehiclesByDriverId,
} from "./demoDriver";
import { getAllDemoRides } from "./demoRide";
import { ensureDemoSimulationDriver } from "./demoSimulationDriver";
import { ENV } from "./env";
import { parseCoord } from "./rideDispatcher";

const ITABAIANA_CENTER = ADMIN_MAP_DEFAULT_CENTER;

function inferAreaLabel(address: string): string {
  for (const place of DEMO_PLACES) {
    if (address.toLowerCase().includes(place.mainText.toLowerCase())) {
      return place.mainText;
    }
  }
  const parts = address.split(",");
  return parts[0]?.trim() || ENV.appCity || "região";
}

function defaultDriverCoords(driverId: number): { lat: number; lng: number } {
  const place = DEMO_PLACES[driverId % DEMO_PLACES.length] ?? DEMO_PLACES[0];
  const offset = (driverId % 7) * 0.0015;
  return { lat: place.lat + offset, lng: place.lng - offset * 0.5 };
}

function resolveDriverOperationalStatus(
  profile: { isAvailable: boolean | null; status: string },
  hasActiveRide: boolean
): AdminDriverOperationalStatus {
  if (profile.status === "pending") return "pending";
  if (hasActiveRide) return "busy";
  if (profile.isAvailable) return "available";
  return "offline";
}

function rideToOperational(ride: Ride, driverName: string | null, passengerName: string | null): AdminOperationalRide | null {
  const originLat = parseCoord(ride.originLat);
  const originLng = parseCoord(ride.originLng);
  const destinationLat = parseCoord(ride.destinationLat);
  const destinationLng = parseCoord(ride.destinationLng);
  if (originLat == null || originLng == null || destinationLat == null || destinationLng == null) {
    return null;
  }

  return {
    id: ride.id,
    status: ride.status,
    vehicleType: ride.vehicleType,
    originAddress: ride.originAddress,
    destinationAddress: ride.destinationAddress,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    driverId: ride.driverId ?? null,
    driverName,
    passengerName,
    estimatedPrice: ride.estimatedPrice ?? null,
    finalPrice: ride.finalPrice ?? null,
    createdAt: ride.createdAt.toISOString(),
    completedAt: ride.completedAt?.toISOString() ?? null,
    areaLabel: inferAreaLabel(ride.originAddress),
  };
}

function computeMetrics(rides: AdminOperationalRide[], drivers: AdminOperationalDriver[]): AdminOperationalMetrics {
  const today = new Date().toDateString();
  const completedToday = rides.filter(
    (r) => r.status === "completed" && r.completedAt && new Date(r.completedAt).toDateString() === today
  );

  return {
    pendingRides: rides.filter((r) => r.status === "requested").length,
    acceptedRides: rides.filter((r) => r.status === "accepted").length,
    inProgressRides: rides.filter((r) => r.status === "in_progress").length,
    completedToday: completedToday.length,
    driversOnline: drivers.filter((d) => d.operationalStatus !== "offline" && d.operationalStatus !== "pending").length,
    driversAvailable: drivers.filter((d) => d.operationalStatus === "available").length,
    revenueTodayCents: completedToday.reduce((sum, r) => sum + (r.finalPrice ?? r.estimatedPrice ?? 0), 0),
  };
}

/** Garante motoristas demo visíveis no mapa admin quando a store está vazia. */
export function ensureDemoOperationalSeed(): void {
  ensureDemoFleetSeed();
}

function buildDemoDriverEntry(
  profile: {
    id: number;
    isAvailable: boolean | null;
    status: string;
    rating: number | null;
    totalRides: number | null;
  },
  name: string,
  activeRideDriverIds: Set<number>
): AdminOperationalDriver {
  const coords = getDemoDriverLocationCoords(profile.id) ?? defaultDriverCoords(profile.id);
  const vehicle = getDemoVehiclesByDriverId(profile.id)[0];
  const areaPlace = DEMO_PLACES[profile.id % DEMO_PLACES.length];

  return {
    id: profile.id,
    name,
    lat: coords.lat,
    lng: coords.lng,
    isAvailable: profile.isAvailable ?? false,
    operationalStatus: resolveDriverOperationalStatus(profile, activeRideDriverIds.has(profile.id)),
    vehicleType: vehicle?.type ?? "carro",
    vehicleBrand: vehicle?.brand ?? "Demo",
    vehicleModel: vehicle?.model ?? "Sedan",
    vehiclePlate: vehicle?.plate ?? "DEM0A00",
    rating: (profile.rating ?? 480) / 100,
    totalRides: profile.totalRides ?? 0,
    totalEarningsCents: 0,
    areaLabel: areaPlace?.mainText ?? "Centro",
  };
}

export function getDemoOperationalOverview(): AdminOperationalOverview {
  ensureDemoOperationalSeed();
  ensureDemoSimulationDriver();

  const rawRides = getAllDemoRides();
  const activeDriverIds = new Set(
    rawRides
      .filter((r) => r.driverId && (r.status === "accepted" || r.status === "in_progress"))
      .map((r) => r.driverId as number)
  );

  const rides: AdminOperationalRide[] = rawRides
    .map((ride) => {
      let driverName: string | null = null;
      if (ride.driverId === DEMO_SIMULATION_DRIVER_ID) {
        driverName = DEMO_SIMULATION_DRIVER_NAME;
      } else if (ride.driverId) {
        driverName = getDemoFleetDriverName(ride.driverId) ?? "Motorista Demo";
      }
      return rideToOperational(ride, driverName, "Passageiro Demo");
    })
    .filter((r): r is AdminOperationalRide => r != null)
    .sort((a, b) => {
      const order: Record<string, number> = {
        requested: 0,
        in_progress: 1,
        accepted: 2,
        completed: 3,
        cancelled: 4,
      };
      const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const drivers: AdminOperationalDriver[] = [];

  for (const profile of getAllDemoDriverProfiles()) {
    const fleetName = getDemoFleetDriverName(profile.id) ?? "Motorista Demo";
    drivers.push(buildDemoDriverEntry(profile, fleetName, activeDriverIds));
  }

  const sim = ensureDemoSimulationDriver();
  const simCoords =
    getDemoDriverLocationCoords(DEMO_SIMULATION_DRIVER_ID) ?? defaultDriverCoords(DEMO_SIMULATION_DRIVER_ID);
  drivers.push({
    id: DEMO_SIMULATION_DRIVER_ID,
    name: DEMO_SIMULATION_DRIVER_NAME,
    lat: simCoords.lat,
    lng: simCoords.lng,
    isAvailable: sim.profile.isAvailable ?? true,
    operationalStatus: resolveDriverOperationalStatus(sim.profile, activeDriverIds.has(DEMO_SIMULATION_DRIVER_ID)),
    vehicleType: sim.vehicle.type,
    vehicleBrand: sim.vehicle.brand ?? "Demo",
    vehicleModel: sim.vehicle.model ?? "Sedan Simulação",
    vehiclePlate: sim.vehicle.plate ?? "SIM0A00",
    rating: (sim.profile.rating ?? 490) / 100,
    totalRides: sim.profile.totalRides ?? 0,
    totalEarningsCents: 0,
    areaLabel: "Centro",
  });

  return {
    metrics: computeMetrics(rides, drivers),
    rides,
    drivers,
    updatedAt: new Date().toISOString(),
  };
}

export async function getProductionOperationalOverview(): Promise<AdminOperationalOverview> {
  const allRides = await db.getAllRides();
  const approvedDrivers = await db.getApprovedDriverProfiles();

  const activeDriverIds = new Set(
    allRides
      .filter((r) => r.driverId && (r.status === "accepted" || r.status === "in_progress"))
      .map((r) => r.driverId as number)
  );

  const rides: AdminOperationalRide[] = [];
  for (const ride of allRides) {
    let driverName: string | null = null;
    if (ride.driverId) {
      const dp = await db.getDriverProfileById(ride.driverId);
      if (dp?.userId) {
        const user = await db.getUserById(dp.userId);
        driverName = user?.name ?? null;
      }
    }
    const passenger = await db.getUserById(ride.passengerId);
    const mapped = rideToOperational(ride, driverName, passenger?.name ?? null);
    if (mapped) rides.push(mapped);
  }

  rides.sort((a, b) => {
    const order: Record<string, number> = {
      requested: 0,
      in_progress: 1,
      accepted: 2,
      completed: 3,
      cancelled: 4,
    };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const drivers: AdminOperationalDriver[] = [];
  for (const profile of approvedDrivers) {
    const loc = await db.getDriverLocation(profile.id);
    const lat = parseCoord(loc?.lat) ?? ITABAIANA_CENTER.lat;
    const lng = parseCoord(loc?.lng) ?? ITABAIANA_CENTER.lng;
    const vehicles = await db.getVehiclesByDriverId(profile.id);
    const vehicle = vehicles[0];
    const user = await db.getUserById(profile.userId);
    const driverRides = allRides.filter((r) => r.driverId === profile.id && r.status === "completed");
    const earnings = driverRides.reduce((sum, r) => sum + (r.finalPrice ?? 0), 0);

    drivers.push({
      id: profile.id,
      name: user?.name ?? `Motorista #${profile.id}`,
      lat,
      lng,
      isAvailable: profile.isAvailable ?? false,
      operationalStatus: resolveDriverOperationalStatus(profile, activeDriverIds.has(profile.id)),
      vehicleType: vehicle?.type ?? "carro",
      vehicleBrand: vehicle?.brand ?? "",
      vehicleModel: vehicle?.model ?? "",
      vehiclePlate: vehicle?.plate ?? "",
      rating: (profile.rating ?? 0) / 100,
      totalRides: profile.totalRides ?? 0,
      totalEarningsCents: earnings,
      areaLabel: inferAreaLabel(`${lat},${lng}`),
    });
  }

  return {
    metrics: computeMetrics(rides, drivers),
    rides,
    drivers,
    updatedAt: new Date().toISOString(),
  };
}
