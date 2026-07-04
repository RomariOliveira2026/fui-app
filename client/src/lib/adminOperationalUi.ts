import type {
  AdminOperationalDriver,
  AdminOperationalRide,
} from "@shared/adminOperational";

export type AdminRideStatusFilter =
  | "all"
  | "requested"
  | "accepted"
  | "in_progress"
  | "completed";

export type AdminDriverStatusFilter =
  | "all"
  | "available"
  | "busy"
  | "offline";

export type AdminVehicleFilter = "all" | "moto" | "carro" | "van" | "utilitario";

export type AdminAreaFilter = "all" | string;

export type AdminSelection =
  | { type: "ride"; id: number }
  | { type: "driver"; id: number }
  | null;

export type AdminFiltersState = {
  rideStatus: AdminRideStatusFilter;
  driverStatus: AdminDriverStatusFilter;
  vehicleType: AdminVehicleFilter;
  area: AdminAreaFilter;
  showCompletedRides: boolean;
};

export const DEFAULT_ADMIN_FILTERS: AdminFiltersState = {
  rideStatus: "all",
  driverStatus: "all",
  vehicleType: "all",
  area: "all",
  showCompletedRides: false,
};

const RIDE_STATUS_SORT: Record<string, number> = {
  requested: 0,
  in_progress: 1,
  accepted: 2,
  completed: 3,
  cancelled: 4,
};

export function sortAdminRides(rides: AdminOperationalRide[]): AdminOperationalRide[] {
  return [...rides].sort((a, b) => {
    const diff = (RIDE_STATUS_SORT[a.status] ?? 9) - (RIDE_STATUS_SORT[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function filterAdminRides(
  rides: AdminOperationalRide[],
  filters: AdminFiltersState
): AdminOperationalRide[] {
  const showCompleted =
    filters.showCompletedRides || filters.rideStatus === "completed";

  const filtered = rides.filter((ride) => {
    if (!showCompleted && ride.status === "completed") return false;
    if (filters.rideStatus !== "all" && ride.status !== filters.rideStatus) return false;
    if (filters.vehicleType !== "all" && ride.vehicleType !== filters.vehicleType) return false;
    if (filters.area !== "all" && ride.areaLabel !== filters.area) return false;
    return true;
  });

  return sortAdminRides(filtered);
}

export function filterAdminDrivers(
  drivers: AdminOperationalDriver[],
  filters: AdminFiltersState
): AdminOperationalDriver[] {
  return drivers.filter((driver) => {
    if (filters.driverStatus === "available" && driver.operationalStatus !== "available") {
      return false;
    }
    if (filters.driverStatus === "busy" && driver.operationalStatus !== "busy") {
      return false;
    }
    if (filters.driverStatus === "offline" && driver.operationalStatus !== "offline") {
      return false;
    }
    if (filters.vehicleType !== "all" && driver.vehicleType !== filters.vehicleType) {
      return false;
    }
    if (filters.area !== "all" && driver.areaLabel !== filters.area) {
      return false;
    }
    return true;
  });
}

export function formatAdminPrice(cents: number | null | undefined): string {
  return `R$ ${((cents ?? 0) / 100).toFixed(2)}`;
}

export function canAdminCancelRide(status: string): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function canAdminRedispatchRide(
  status: string,
  driverId?: number | null
): boolean {
  return status === "requested" && (driverId == null || driverId === 0);
}

export function canAdminAssignRide(
  status: string,
  driverId?: number | null
): boolean {
  return status === "requested" && (driverId == null || driverId === 0);
}

/** Formata segundos em rótulo curto (ETA / espera). */
export function formatAdminDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Classes de destaque por prioridade operacional. */
export function priorityAccentClass(priority: string): string {
  switch (priority) {
    case "sos":
      return "border-red-500/70 bg-red-500/10 ring-1 ring-red-500/40";
    case "critical":
      return "border-orange-500/60 bg-orange-500/[0.07] ring-1 ring-orange-500/25";
    case "warning":
      return "border-amber-400/50 bg-amber-400/[0.06]";
    default:
      return "";
  }
}

export function priorityDotClass(priority: string): string {
  switch (priority) {
    case "sos":
      return "bg-red-500";
    case "critical":
      return "bg-orange-500";
    case "warning":
      return "bg-amber-400";
    default:
      return "bg-emerald-400/70";
  }
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
