import type { DeliveryOrder, Ride } from "../../drizzle/schema";
import type { DriverEarningsSummary, DriverStatementItem } from "@shared/driverPremium";

const VEHICLE_LABELS: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

function rideAmount(ride: Ride): number {
  return ride.finalPrice ?? ride.estimatedPrice ?? 0;
}

function deliveryAmount(order: DeliveryOrder): number {
  return order.finalPrice ?? order.estimatedPrice ?? 0;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isWithinLastDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

export function buildDriverEarningsSummary(
  rides: Ride[],
  deliveries: DeliveryOrder[] = []
): DriverEarningsSummary {
  const now = new Date();
  const completedRides = rides.filter((r) => r.status === "completed");
  const completedDeliveries = deliveries.filter((d) => d.status === "delivered");

  const todayRides = completedRides.filter((r) => {
    const at = r.completedAt ? new Date(r.completedAt) : null;
    return at && isSameDay(at, now);
  });
  const weekRides = completedRides.filter((r) => {
    const at = r.completedAt ? new Date(r.completedAt) : null;
    return at && isWithinLastDays(at, 7);
  });

  const todayDeliveries = completedDeliveries.filter((d) => {
    const at = d.deliveredAt ? new Date(d.deliveredAt) : null;
    return at && isSameDay(at, now);
  });
  const weekDeliveries = completedDeliveries.filter((d) => {
    const at = d.deliveredAt ? new Date(d.deliveredAt) : null;
    return at && isWithinLastDays(at, 7);
  });

  const todayTotal =
    todayRides.reduce((s, r) => s + rideAmount(r), 0) +
    todayDeliveries.reduce((s, d) => s + deliveryAmount(d), 0);
  const weekTotal =
    weekRides.reduce((s, r) => s + rideAmount(r), 0) +
    weekDeliveries.reduce((s, d) => s + deliveryAmount(d), 0);

  const todayCount = todayRides.length + todayDeliveries.length;
  const weekCount = weekRides.length + weekDeliveries.length;

  return {
    todayTotalCents: todayTotal,
    weekTotalCents: weekTotal,
    todayRideCount: todayRides.length,
    weekRideCount: weekRides.length,
    todayDeliveryCount: todayDeliveries.length,
    weekDeliveryCount: weekDeliveries.length,
    todayAvgTicketCents: todayCount > 0 ? Math.round(todayTotal / todayCount) : 0,
    weekAvgTicketCents: weekCount > 0 ? Math.round(weekTotal / weekCount) : 0,
  };
}

export function buildDriverStatement(
  rides: Ride[],
  deliveries: DeliveryOrder[] = []
): DriverStatementItem[] {
  const rideItems: DriverStatementItem[] = rides
    .filter((r) => r.status === "completed")
    .map((r) => ({
      id: r.id,
      type: "ride" as const,
      date: (r.completedAt ?? r.createdAt).toString(),
      originLabel: r.originAddress,
      destinationLabel: r.destinationAddress,
      amountCents: rideAmount(r),
      serviceLabel: VEHICLE_LABELS[r.vehicleType] ?? r.vehicleType,
    }));

  const deliveryItems: DriverStatementItem[] = deliveries
    .filter((d) => d.status === "delivered")
    .map((d) => ({
      id: d.id,
      type: "delivery" as const,
      date: (d.deliveredAt ?? d.createdAt).toString(),
      originLabel: d.pickupAddress,
      destinationLabel: d.deliveryAddress,
      amountCents: deliveryAmount(d),
      serviceLabel: "Entrega",
    }));

  return [...rideItems, ...deliveryItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
