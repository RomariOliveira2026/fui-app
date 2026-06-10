import type { Ride } from "../../../drizzle/schema";

/** ETA demo exibido após pagamento aprovado (minutos). */
export function getDemoEtaMinutes(ride: Pick<Ride, "duration">): number {
  if (ride.duration && ride.duration > 0) {
    return Math.max(3, Math.min(15, Math.round((ride.duration / 60) * 0.35)));
  }
  return 8;
}

/** Marca pagamento aprovado e avança corrida demo para etapa “motorista a caminho”. */
export function applyDemoPayment<T extends Ride>(ride: T): T {
  const hasDriver = ride.driverId != null;
  const canAdvanceStatus =
    hasDriver && ride.status !== "cancelled" && ride.status !== "completed";

  return {
    ...ride,
    paymentStatus: "paid",
    status: canAdvanceStatus ? "accepted" : ride.status,
    updatedAt: new Date(),
  };
}

export function isDemoPaymentApproved(ride: Pick<Ride, "paymentStatus" | "paymentMethod">): boolean {
  return ride.paymentStatus === "paid" || ride.paymentMethod === "cash";
}

export function shouldShowDriverEnRoute(
  ride: Pick<Ride, "driverId" | "status" | "paymentStatus" | "paymentMethod">
): boolean {
  return (
    !!ride.driverId &&
    isDemoPaymentApproved(ride) &&
    (ride.status === "accepted" || ride.status === "in_progress")
  );
}
