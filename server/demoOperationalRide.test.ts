import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ride } from "../drizzle/schema";

vi.mock("@shared/demoOperationalRides", () => ({
  isDemoOperationalRidesEnabledServer: () => true,
  DEMO_OPERATIONAL_ACCEPT_DELAY_MS: 0,
  DEMO_OPERATIONAL_PICKUP_WAIT_MS: 0,
  DEMO_OPERATIONAL_SEGMENT_MS: 800,
}));

vi.mock("@shared/demoSimulation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/demoSimulation")>();
  return {
    ...actual,
    isDemoDriverSimulationEnabledServer: () => false,
  };
});

vi.mock("./_core/demoFleet", () => ({
  ensureDemoFleetSeed: vi.fn(),
  findNearestAvailableFleetDriver: vi.fn(() => ({
    profile: { id: 9001 },
    vehicle: { id: 8001 },
  })),
  releaseFleetDriver: vi.fn(),
  setFleetDriverOnRide: vi.fn(),
}));

vi.mock("./_core/demoDriver", () => ({
  updateDemoDriverLocation: vi.fn(),
}));

vi.mock("./_core/demoRoutePaths", () => ({
  getDemoTripPath: vi.fn(() => [
    { lat: -10.685, lng: -37.425 },
    { lat: -10.6865, lng: -37.4235 },
    { lat: -10.688, lng: -37.422 },
  ]),
  registerDemoRoutePathUpgradeHandler: vi.fn(),
}));

const rideStore = new Map<number, Ride>();

vi.mock("./_core/demoRide", () => ({
  isDemoRideId: (id: number) => id < 0,
  getDemoRide: (id: number) => rideStore.get(id),
  updateDemoRide: (id: number, patch: Partial<Ride>) => {
    const current = rideStore.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    rideStore.set(id, updated);
    return updated;
  },
}));

import {
  advanceOperationalDemoRide,
  clearAllOperationalDemoStates,
  ensureOperationalTripStarted,
  getOperationalEtaSeconds,
  getOperationalPhase,
  registerOperationalDemoRide,
  restoreOperationalStateFromRide,
} from "./_core/demoOperationalRide";
import { getDemoTripPath } from "./_core/demoRoutePaths";

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: -42,
    passengerId: 1,
    driverId: 9001,
    vehicleId: 8001,
    status: "requested",
    originLat: "-10.685000",
    originLng: "-37.425000",
    destinationLat: "-10.688000",
    destinationLng: "-37.422000",
    vehicleType: "carro",
    paymentMethod: "cash",
    paymentStatus: "pending",
    estimatedPrice: "25.00",
    finalPrice: null,
    driverCurrentLat: null,
    driverCurrentLng: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides,
  } as Ride;
}

describe("demoOperationalRide", () => {
  beforeEach(() => {
    rideStore.clear();
    clearAllOperationalDemoStates();
    vi.useFakeTimers();
  });

  it("ancora busca em createdAt da corrida (serverless)", () => {
    const createdAt = new Date("2026-01-01T12:00:00.000Z");
    rideStore.set(-42, makeRide({ createdAt }));
    vi.setSystemTime(new Date("2026-01-01T12:00:05.000Z"));

    registerOperationalDemoRide(-42, "carro", "-10.685000", "-37.425000");
    let ride = advanceOperationalDemoRide(rideStore.get(-42)!);
    expect(ride.status).toBe("accepted");

    vi.useRealTimers();
  });

  it("inicia viagem no embarque e conclui somente no destino", () => {
    rideStore.set(
      -42,
      makeRide({
        driverId: null,
        vehicleId: null,
        createdAt: new Date(0),
      })
    );
    registerOperationalDemoRide(-42, "carro", "-10.685000", "-37.425000");
    vi.advanceTimersByTime(1);

    let ride = advanceOperationalDemoRide(rideStore.get(-42)!);
    expect(ride.status).toBe("accepted");
    expect(getOperationalPhase(ride.id)).toBe("to_pickup");

    vi.advanceTimersByTime(30_000);
    ride = advanceOperationalDemoRide(getDemoRideFromStore());
    expect(getOperationalPhase(ride.id)).toBe("arrived_pickup");

    vi.advanceTimersByTime(1_000);
    ride = advanceOperationalDemoRide(getDemoRideFromStore());
    expect(ride.status).toBe("in_progress");
    expect(getOperationalPhase(ride.id)).toBe("in_trip");

    vi.advanceTimersByTime(60_000);
    ride = advanceOperationalDemoRide(getDemoRideFromStore());
    expect(ride.status).toBe("completed");

    const endLat = Number.parseFloat(ride.driverCurrentLat ?? "");
    const endLng = Number.parseFloat(ride.driverCurrentLng ?? "");
    expect(Math.abs(endLat - -10.688)).toBeLessThan(0.01);
    expect(Math.abs(endLng - -37.422)).toBeLessThan(0.01);

    vi.useRealTimers();
  });

  it("restaura estado após perda de memória e continua viagem longa", () => {
    const longPath = Array.from({ length: 120 }, (_, i) => ({
      lat: -10.685 + i * 0.002,
      lng: -37.425 + i * 0.003,
    }));
    vi.mocked(getDemoTripPath).mockReturnValue(longPath);

    rideStore.set(
      -42,
      makeRide({
        status: "in_progress",
        driverCurrentLat: "-10.684000",
        driverCurrentLng: "-37.424000",
      })
    );
    restoreOperationalStateFromRide(rideStore.get(-42)!);

    expect(getOperationalPhase(-42)).toBe("in_trip");

    const etaStart = getOperationalEtaSeconds(-42);
    expect(etaStart).not.toBeNull();

    vi.advanceTimersByTime(5_000);
    let ride = advanceOperationalDemoRide(getDemoRideFromStore());
    const latAfter5s = Number.parseFloat(ride.driverCurrentLat ?? "");
    expect(latAfter5s).toBeGreaterThan(-10.685);

    const etaMid = getOperationalEtaSeconds(-42);
    expect(etaMid).not.toBeNull();
    if (etaStart != null && etaMid != null) {
      expect(etaMid).toBeLessThan(etaStart);
    }

    vi.advanceTimersByTime((etaStart ?? 60) * 1000 + 2_000);
    ride = advanceOperationalDemoRide(getDemoRideFromStore());
    expect(ride.status).toBe("completed");

    vi.useRealTimers();
  });

  it("aguarda início manual quando simulação DEV está ativa", async () => {
    const simModule = await import("@shared/demoSimulation");
    const spy = vi.spyOn(simModule, "isDemoDriverSimulationEnabledServer").mockReturnValue(true);

    rideStore.set(
      -43,
      makeRide({
        id: -43,
        driverId: null,
        vehicleId: null,
        createdAt: new Date(0),
      })
    );
    registerOperationalDemoRide(-43, "carro", "-10.685000", "-37.425000");
    vi.advanceTimersByTime(1);

    let ride = advanceOperationalDemoRide(rideStore.get(-43)!);
    vi.advanceTimersByTime(30_000);
    ride = advanceOperationalDemoRide(rideStore.get(-43)!);
    expect(getOperationalPhase(ride.id)).toBe("arrived_pickup");
    expect(ride.status).toBe("accepted");

    vi.advanceTimersByTime(10_000);
    ride = advanceOperationalDemoRide(rideStore.get(-43)!);
    expect(ride.status).toBe("accepted");
    expect(getOperationalPhase(ride.id)).toBe("arrived_pickup");

    const started = ensureOperationalTripStarted(ride.id);
    expect(started?.status).toBe("in_progress");
    expect(getOperationalPhase(ride.id)).toBe("in_trip");

    spy.mockRestore();
    vi.useRealTimers();
  });
});

function getDemoRideFromStore(): Ride {
  const ride = rideStore.get(-42);
  if (!ride) throw new Error("ride missing");
  return ride;
}
