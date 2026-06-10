/** Tipos compartilhados — Central Operacional Admin (Módulo 6). */

export type AdminDriverOperationalStatus = "available" | "busy" | "offline" | "pending";

export type AdminOperationalDriver = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  isAvailable: boolean;
  operationalStatus: AdminDriverOperationalStatus;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  rating: number;
  totalRides: number;
  totalEarningsCents: number;
  areaLabel: string;
};

export type AdminOperationalRide = {
  id: number;
  status: string;
  vehicleType: string;
  originAddress: string;
  destinationAddress: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  driverId: number | null;
  driverName: string | null;
  passengerName: string | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  completedAt: string | null;
  areaLabel: string;
};

export type AdminOperationalMetrics = {
  pendingRides: number;
  acceptedRides: number;
  inProgressRides: number;
  completedToday: number;
  driversOnline: number;
  driversAvailable: number;
  revenueTodayCents: number;
};

export type AdminOperationalOverview = {
  metrics: AdminOperationalMetrics;
  rides: AdminOperationalRide[];
  drivers: AdminOperationalDriver[];
  updatedAt: string;
};

export const ADMIN_MAP_DEFAULT_CENTER = { lat: -10.6833, lng: -37.425 };

export const ADMIN_DEMO_AREAS = [
  "Centro",
  "Rodoviária",
  "Hospital",
  "Praça da Matriz",
  "UFS Campus",
] as const;
