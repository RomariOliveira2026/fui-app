import { describe, expect, it } from "vitest";
import type { Ride } from "../drizzle/schema";
import {
  computeRideHistoryStats,
  filterRideHistory,
  formatRideDuration,
  groupRidesByMonth,
} from "@shared/rideHistoryUtils";

function ride(partial: Partial<Ride> & Pick<Ride, "id" | "status">): Ride {
  return {
    id: partial.id,
    passengerId: 1,
    driverId: null,
    vehicleId: null,
    status: partial.status,
    vehicleType: "carro",
    originAddress: partial.originAddress ?? "Origem A",
    originLat: "-10",
    originLng: "-37",
    destinationAddress: partial.destinationAddress ?? "Destino B",
    destinationLat: "-10",
    destinationLng: "-37",
    driverCurrentLat: null,
    driverCurrentLng: null,
    distance: partial.distance ?? 1400,
    duration: partial.duration ?? 600,
    estimatedPrice: partial.estimatedPrice ?? 1200,
    finalPrice: partial.finalPrice ?? 1492,
    paymentMethod: "pix",
    paymentStatus: "paid",
    stripePaymentIntentId: null,
    couponId: null,
    couponCode: partial.couponCode ?? null,
    discountAmount: partial.discountAmount ?? 0,
    isShared: false,
    maxPassengers: 1,
    currentPassengers: 1,
    pricePerPassenger: null,
    isFreight: false,
    cargoWeight: null,
    cargoType: null,
    cargoDescription: null,
    needsHelpers: false,
    numberOfHelpers: 0,
    shareToken: null,
    sosActivated: false,
    sosActivatedAt: null,
    createdAt: partial.createdAt ?? new Date("2026-07-08T22:00:00"),
    updatedAt: new Date("2026-07-08T22:00:00"),
    acceptedAt: null,
    arrivedAt: null,
    startedAt: null,
    completedAt: partial.completedAt ?? new Date("2026-07-08T22:15:00"),
    cancelledAt: null,
    scheduledFor: null,
    isScheduled: "no",
    cancelledBy: null,
    cancellationReason: null,
    passengerPremiumMeta: null,
  };
}

describe("rideHistoryUtils", () => {
  it("calculates stats from completed rides only for money and distance", () => {
    const rides = [
      ride({ id: 1, status: "completed", finalPrice: 1000, distance: 2000 }),
      ride({ id: 2, status: "cancelled", finalPrice: 500, distance: 1000 }),
      ride({ id: 3, status: "completed", finalPrice: 3000, distance: 4000 }),
    ];

    const stats = computeRideHistoryStats(rides);
    expect(stats.totalRides).toBe(3);
    expect(stats.completedRides).toBe(2);
    expect(stats.totalSpentCents).toBe(4000);
    expect(stats.totalDistanceMeters).toBe(6000);
    expect(stats.avgPriceCents).toBe(2000);
  });

  it("filters by status and search query", () => {
    const rides = [
      ride({ id: 900001, status: "completed", originAddress: "Rua Vera Cândida" }),
      ride({ id: 900002, status: "cancelled", destinationAddress: "Supermercado Nunes" }),
    ];

    expect(filterRideHistory(rides, "completed", "").map((r) => r.id)).toEqual([900001]);
    expect(filterRideHistory(rides, "all", "nunes").map((r) => r.id)).toEqual([900002]);
    expect(filterRideHistory(rides, "all", "900001").map((r) => r.id)).toEqual([900001]);
  });

  it("groups rides by month newest first", () => {
    const rides = [
      ride({ id: 1, status: "completed", completedAt: new Date("2026-06-10T10:00:00") }),
      ride({ id: 2, status: "completed", completedAt: new Date("2026-07-08T22:00:00") }),
    ];

    const groups = groupRidesByMonth(rides);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.rides[0]?.id).toBe(2);
    expect(groups[1]?.rides[0]?.id).toBe(1);
  });

  it("formats duration", () => {
    expect(formatRideDuration(600)).toBe("10 min");
    expect(formatRideDuration(3660)).toBe("1h 1min");
  });
});
