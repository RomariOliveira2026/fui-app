import type { DriverProfile, InsertDriverProfile, Vehicle } from "../../drizzle/schema";
import {
  DEMO_SIMULATION_DRIVER_ID,
  DEMO_SIMULATION_DRIVER_NAME,
} from "@shared/demoSimulation";
import { ensureDemoSimulationDriver, isDemoSimulationDriverId } from "./demoSimulationDriver";
import { getDemoFleetDriverMeta, getDemoFleetDriverName } from "./demoFleet";

const DEMO_DRIVER_PROFILE_ID_START = 800_001;
const DEMO_VEHICLE_ID_START = 850_001;

const demoProfilesByUserId = new Map<number, DriverProfile>();
const demoVehiclesById = new Map<number, Vehicle>();
const demoVehiclesByDriverId = new Map<number, Vehicle[]>();
const demoDriverLocations = new Map<number, { lat: string; lng: string; updatedAt: Date }>();

let nextDemoProfileId = DEMO_DRIVER_PROFILE_ID_START;
let nextDemoVehicleId = DEMO_VEHICLE_ID_START;

export function isDemoDriverProfileId(id: number): boolean {
  return id >= DEMO_DRIVER_PROFILE_ID_START;
}

export function isDemoVehicleId(id: number): boolean {
  return id >= DEMO_VEHICLE_ID_START;
}

export function getDemoDriverProfileByUserId(userId: number): DriverProfile | undefined {
  return demoProfilesByUserId.get(userId);
}

export function getDemoDriverProfileById(driverId: number): DriverProfile | undefined {
  if (!isDemoDriverProfileId(driverId)) return undefined;
  return Array.from(demoProfilesByUserId.values()).find((profile) => profile.id === driverId);
}

export function getDemoVehicleById(vehicleId: number): Vehicle | undefined {
  return demoVehiclesById.get(vehicleId);
}

export function getDemoVehiclesByDriverId(driverId: number): Vehicle[] {
  return demoVehiclesByDriverId.get(driverId) ?? [];
}

export function getAllDemoDriverProfiles(): DriverProfile[] {
  return Array.from(demoProfilesByUserId.values());
}

export function updateDemoDriverLocation(driverId: number, lat: string, lng: string): void {
  demoDriverLocations.set(driverId, { lat, lng, updatedAt: new Date() });
}

export function getDemoDriverLocationCoords(driverId: number): { lat: number; lng: number } | null {
  const loc = demoDriverLocations.get(driverId);
  if (!loc) return null;
  const lat = Number.parseFloat(loc.lat);
  const lng = Number.parseFloat(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function updateDemoDriverAvailability(driverId: number, isAvailable: boolean): void {
  for (const [userId, profile] of Array.from(demoProfilesByUserId.entries())) {
    if (profile.id === driverId) {
      const updated: DriverProfile = {
        ...profile,
        isAvailable,
        updatedAt: new Date(),
      };
      demoProfilesByUserId.set(userId, updated);
      return;
    }
  }
}

function createDefaultDemoVehicle(driverId: number): Vehicle {
  const now = new Date();
  const vehicle: Vehicle = {
    id: nextDemoVehicleId++,
    driverId,
    type: "carro",
    brand: "Demo",
    model: "Sedan",
    year: 2024,
    plate: "DEM0A00",
    color: "Prata",
    photoUrl: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  demoVehiclesById.set(vehicle.id, vehicle);
  demoVehiclesByDriverId.set(driverId, [vehicle]);
  return vehicle;
}

export function getDemoPendingDriverProfiles(): DriverProfile[] {
  return Array.from(demoProfilesByUserId.values()).filter((p) => p.status === "pending");
}

export function updateDemoDriverProfileStatus(
  driverId: number,
  status: DriverProfile["status"]
): boolean {
  for (const [userId, profile] of Array.from(demoProfilesByUserId.entries())) {
    if (profile.id === driverId) {
      demoProfilesByUserId.set(userId, {
        ...profile,
        status,
        updatedAt: new Date(),
      });
      return true;
    }
  }
  return false;
}

/** Cria perfil demo pendente de aprovação (sem veículo ativo). */
export function createDemoPendingDriverProfile(
  input: Pick<InsertDriverProfile, "userId" | "cpf" | "cnh" | "cnhImageUrl">
): DriverProfile {
  const now = new Date();
  const profile: DriverProfile = {
    id: nextDemoProfileId++,
    userId: input.userId,
    cpf: input.cpf ?? null,
    cnh: input.cnh ?? null,
    cnhImageUrl: input.cnhImageUrl ?? null,
    status: "pending",
    rating: 0,
    totalRides: 0,
    isAvailable: false,
    createdAt: now,
    updatedAt: now,
  };
  demoProfilesByUserId.set(input.userId, profile);
  return profile;
}

/** Cria perfil demo aprovado e disponível, com veículo padrão para testes. */
export function createDemoDriverProfile(
  input: Pick<InsertDriverProfile, "userId" | "cpf" | "cnh" | "cnhImageUrl">
): DriverProfile {
  const existing = demoProfilesByUserId.get(input.userId);
  if (existing) return existing;

  const now = new Date();
  const profile: DriverProfile = {
    id: nextDemoProfileId++,
    userId: input.userId,
    cpf: input.cpf ?? null,
    cnh: input.cnh ?? null,
    cnhImageUrl: input.cnhImageUrl ?? null,
    status: "approved",
    rating: 480,
    totalRides: 0,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  };

  demoProfilesByUserId.set(input.userId, profile);
  createDefaultDemoVehicle(profile.id);
  return profile;
}

/** Perfil demo para frota operacional — sem veículo padrão (veículo é criado depois). */
export function createDemoFleetDriverProfile(
  userId: number,
  rating: number
): DriverProfile {
  const existing = demoProfilesByUserId.get(userId);
  if (existing) return existing;

  const now = new Date();
  const profile: DriverProfile = {
    id: nextDemoProfileId++,
    userId,
    cpf: null,
    cnh: null,
    cnhImageUrl: null,
    status: "approved",
    rating,
    totalRides: 42,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  };

  demoProfilesByUserId.set(userId, profile);
  return profile;
}

export function getDemoRideDriverDetails(ride: {
  driverId?: number | null;
  vehicleId?: number | null;
  vehicleType?: string;
}) {
  if (!ride.driverId) return null;

  if (isDemoSimulationDriverId(ride.driverId)) {
    const { vehicle } = ensureDemoSimulationDriver();
    return {
      driverName: DEMO_SIMULATION_DRIVER_NAME,
      rating: "4.9",
      vehicleBrand: vehicle.brand ?? "Demo",
      vehicleModel: vehicle.model ?? "Sedan Simulação",
      vehiclePlate: vehicle.plate ?? "SIM0A00",
      vehicleColor: vehicle.color ?? "Laranja",
      vehicleType: vehicle.type ?? ride.vehicleType ?? "carro",
    };
  }

  const profile = getDemoDriverProfileById(ride.driverId);
  const vehicle = ride.vehicleId ? getDemoVehicleById(ride.vehicleId) : null;
  const fallbackVehicle = vehicle ?? getDemoVehiclesByDriverId(ride.driverId)[0];
  const fleetMeta = getDemoFleetDriverMeta(ride.driverId);

  return {
    driverName: fleetMeta?.name ?? getDemoFleetDriverName(ride.driverId) ?? "Motorista Demo",
    rating: ((fleetMeta?.rating ?? profile?.rating ?? 480) / 100).toFixed(1),
    vehicleBrand: fallbackVehicle?.brand ?? "Demo",
    vehicleModel: fallbackVehicle?.model ?? "Sedan",
    vehiclePlate: fallbackVehicle?.plate ?? "DEM0A00",
    vehicleColor: fallbackVehicle?.color ?? "Prata",
    vehicleType: fallbackVehicle?.type ?? ride.vehicleType ?? "carro",
    avatarUrl: fleetMeta?.avatarUrl,
  };
}

export function createDemoVehicle(
  driverId: number,
  input: {
    type: Vehicle["type"];
    brand?: string;
    model?: string;
    year?: number;
    plate: string;
    color?: string;
    photoUrl?: string;
  }
): Vehicle {
  const now = new Date();
  const vehicle: Vehicle = {
    id: nextDemoVehicleId++,
    driverId,
    type: input.type,
    brand: input.brand ?? null,
    model: input.model ?? null,
    year: input.year ?? null,
    plate: input.plate,
    color: input.color ?? null,
    photoUrl: input.photoUrl ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  demoVehiclesById.set(vehicle.id, vehicle);
  const list = demoVehiclesByDriverId.get(driverId) ?? [];
  demoVehiclesByDriverId.set(driverId, [vehicle, ...list]);
  return vehicle;
}
