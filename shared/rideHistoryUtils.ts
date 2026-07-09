import type { Ride } from "../drizzle/schema";

export type RideHistoryStatusFilter = "all" | "completed" | "active" | "cancelled";

export const RIDE_HISTORY_STATUS_LABELS: Record<string, string> = {
  requested: "Solicitada",
  accepted: "Aceita",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  card: "Cartão",
  cash: "Dinheiro",
};

export type RideHistoryStats = {
  totalRides: number;
  completedRides: number;
  totalSpentCents: number;
  totalDistanceMeters: number;
  avgPriceCents: number;
};

export type RideHistoryMonthGroup = {
  key: string;
  label: string;
  rides: Ride[];
};

function rideTimestamp(ride: Ride): number {
  return new Date(ride.completedAt ?? ride.createdAt).getTime();
}

export function getRidePriceCents(ride: Ride): number {
  return ride.finalPrice ?? ride.estimatedPrice ?? 0;
}

export function formatRideDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
}

export function formatRideDistanceMeters(meters?: number | null): string | null {
  if (!meters || meters <= 0) return null;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function computeRideHistoryStats(rides: Ride[]): RideHistoryStats {
  const completed = rides.filter((r) => r.status === "completed");
  const totalSpentCents = completed.reduce((sum, r) => sum + getRidePriceCents(r), 0);
  const totalDistanceMeters = completed.reduce((sum, r) => sum + (r.distance ?? 0), 0);

  return {
    totalRides: rides.length,
    completedRides: completed.length,
    totalSpentCents,
    totalDistanceMeters,
    avgPriceCents: completed.length > 0 ? Math.round(totalSpentCents / completed.length) : 0,
  };
}

export function filterRideHistory(
  rides: Ride[],
  statusFilter: RideHistoryStatusFilter,
  searchQuery: string
): Ride[] {
  const q = searchQuery.trim().toLowerCase();

  return rides.filter((ride) => {
    if (statusFilter === "completed" && ride.status !== "completed") return false;
    if (statusFilter === "cancelled" && ride.status !== "cancelled") return false;
    if (
      statusFilter === "active" &&
      !["requested", "accepted", "in_progress"].includes(ride.status)
    ) {
      return false;
    }

    if (!q) return true;

    return (
      ride.originAddress.toLowerCase().includes(q) ||
      ride.destinationAddress.toLowerCase().includes(q) ||
      String(ride.id).includes(q) ||
      (ride.couponCode?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function groupRidesByMonth(rides: Ride[]): RideHistoryMonthGroup[] {
  const sorted = [...rides].sort((a, b) => rideTimestamp(b) - rideTimestamp(a));
  const groups = new Map<string, RideHistoryMonthGroup>();

  for (const ride of sorted) {
    const date = new Date(ride.completedAt ?? ride.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const existing = groups.get(key);
    if (existing) {
      existing.rides.push(ride);
    } else {
      groups.set(key, { key, label: capitalizeMonthLabel(label), rides: [ride] });
    }
  }

  return Array.from(groups.values());
}

function capitalizeMonthLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatRideDateTime(ride: Ride): string {
  return new Date(ride.completedAt ?? ride.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBrlFromCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2)}`;
}
