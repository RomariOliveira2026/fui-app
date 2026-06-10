import { describe, expect, it } from "vitest";
import {
  createDemoRide,
  getDemoDriverRides,
  getDemoPassengerRides,
  updateDemoRide,
} from "./_core/demoRide";

describe("demo ride history", () => {
  it("mantém corridas concluídas no histórico do passageiro", () => {
    const ride = createDemoRide({
      passengerId: 0,
      vehicleType: "carro",
      originAddress: "A",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "B",
      destinationLat: "-10.688",
      destinationLng: "-37.422",
      paymentMethod: "cash",
      status: "requested",
    });

    updateDemoRide(ride.id, {
      driverId: 800_001,
      status: "completed",
      completedAt: new Date(),
      finalPrice: 2500,
      paymentStatus: "paid",
    });

    const history = getDemoPassengerRides(0);
    expect(history.some((r) => r.id === ride.id && r.status === "completed")).toBe(true);
  });

  it("mantém corridas concluídas no histórico do motorista", () => {
    const ride = createDemoRide({
      passengerId: 0,
      driverId: 800_002,
      vehicleType: "carro",
      originAddress: "A",
      originLat: "-10.685",
      originLng: "-37.425",
      destinationAddress: "B",
      destinationLat: "-10.688",
      destinationLng: "-37.422",
      paymentMethod: "cash",
      status: "completed",
      completedAt: new Date(),
      finalPrice: 1800,
      paymentStatus: "paid",
    });

    const history = getDemoDriverRides(800_002);
    expect(history.some((r) => r.id === ride.id)).toBe(true);
  });
});
