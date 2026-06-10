import { describe, expect, it } from "vitest";
import type { Ride } from "../drizzle/schema";
import {
  clearDemoDriverTrack,
  initDemoDriverTrack,
  syncDemoDriverTracking,
  tickDemoDriverLocation,
} from "./_core/demoDriverTracking";
import { createDemoRide, getDemoRide } from "./_core/demoRide";

function baseRide(): Ride {
  return createDemoRide({
    passengerId: 1,
    vehicleType: "carro",
    originAddress: "Centro, Itabaiana - SE",
    originLat: "-10.685",
    originLng: "-37.425",
    destinationAddress: "Hospital, Itabaiana - SE",
    destinationLat: "-10.688",
    destinationLng: "-37.422",
    paymentMethod: "cash",
    paymentStatus: "paid",
    status: "requested",
  });
}

describe("demoDriverTracking", () => {
  it("inicia motorista afastado da origem após aceite", () => {
    const ride = baseRide();
    clearDemoDriverTrack(ride.id);

    const start = initDemoDriverTrack(ride.id, ride, "to_pickup");
    const lat = Number.parseFloat(start.driverCurrentLat);
    const lng = Number.parseFloat(start.driverCurrentLng);

    expect(Number.isFinite(lat)).toBe(true);
    expect(Number.isFinite(lng)).toBe(true);
    expect(Math.abs(lat - (-10.685))).toBeGreaterThan(0.001);
  });

  it("avança posição ao longo do percurso demo", () => {
    const ride = baseRide();
    clearDemoDriverTrack(ride.id);

    const accepted = {
      ...ride,
      driverId: 10,
      status: "accepted" as const,
      ...initDemoDriverTrack(ride.id, ride, "to_pickup"),
    };

    const first = tickDemoDriverLocation(accepted);
    expect(first).not.toBeNull();

    const synced = syncDemoDriverTracking(accepted);
    expect(synced.driverCurrentLat).toBeTruthy();
    expect(synced.driverCurrentLng).toBeTruthy();
    expect(getDemoRide(ride.id)?.driverCurrentLat).toBe(synced.driverCurrentLat);
  });
});
