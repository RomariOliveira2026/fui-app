import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NODE_ENV", "development");
vi.stubEnv("VITE_ENABLE_DEMO_DRIVER", "true");

import { createDemoRide, getDemoRide } from "./_core/demoRide";
import {
  advanceDemoRideSimulation,
  getSimulationPhase,
  registerDemoRideForSimulation,
  simulationAcceptRide,
  simulationStartRide,
} from "./_core/demoRideSimulation";

function baseRide() {
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

describe("demoRideSimulation", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("aceita corrida com Motorista Demo e avança fase", () => {
    const ride = baseRide();
    registerDemoRideForSimulation(ride.id);

    const accepted = simulationAcceptRide(ride.id);
    expect(accepted?.driverId).toBe(799_999);
    expect(accepted?.status).toBe("accepted");
    expect(getSimulationPhase(ride.id)).toBe("to_pickup");
    expect(accepted?.driverCurrentLat).toBeTruthy();
  });

  it("inicia corrida após chegada simulada ao embarque", () => {
    vi.useFakeTimers();

    const ride = baseRide();
    registerDemoRideForSimulation(ride.id);
    simulationAcceptRide(ride.id);

    vi.advanceTimersByTime(120_000);

    const current = advanceDemoRideSimulation(getDemoRide(ride.id)!);

    expect(getSimulationPhase(current.id)).toBe("arrived_pickup");

    const started = simulationStartRide(current.id);
    expect(started?.status).toBe("in_progress");
    expect(getSimulationPhase(current.id)).toBe("in_trip");

    vi.useRealTimers();
  });
});
