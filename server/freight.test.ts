import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Freight System", () => {
  it("should create a freight ride with cargo information", async () => {
    const rideData = {
      passengerId: 1, // Assuming test user exists
      vehicleType: "utilitario" as const,
      originAddress: "Praça Etelvino Mendonça, Itabaiana",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Rodoviária de Itabaiana",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 2.5,
      duration: 10,
      estimatedPrice: 25.0,
      paymentMethod: "cash" as const,
      status: "requested" as const,
      isFreight: true,
      cargoWeight: 50,
      cargoType: "mudanca",
      cargoDescription: "Móveis pequenos",
      needsHelpers: true,
      numberOfHelpers: 2,
    };

    const result = await db.createRide(rideData);
    const rideId = Number(result[0]?.insertId);

    expect(rideId).toBeGreaterThan(0);

    // Verify ride was created with freight data
    const ride = await db.getRideById(rideId);

    expect(ride).toBeDefined();
    expect(ride.vehicleType).toBe("utilitario");
    expect(ride.isFreight).toBe(true);
    expect(ride.cargoWeight).toBe(50);
    expect(ride.cargoType).toBe("mudanca");
    expect(ride.cargoDescription).toBe("Móveis pequenos");
    expect(ride.needsHelpers).toBe(true);
    expect(ride.numberOfHelpers).toBe(2);
  });

  it("should get pricing config for utility vehicles", async () => {
    const pricing = await db.getPricingByVehicleType("utilitario");

    expect(pricing).toBeDefined();
    expect(pricing?.vehicleType).toBe("utilitario");
    expect(pricing?.basePrice).toBeGreaterThan(0);
    expect(pricing?.pricePerKm).toBeGreaterThan(0);
  });

  it("should create a regular ride without freight data when not utility vehicle", async () => {
    const rideData = {
      passengerId: 1,
      vehicleType: "carro" as const,
      originAddress: "Praça Etelvino Mendonça, Itabaiana",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Rodoviária de Itabaiana",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 2.5,
      duration: 10,
      estimatedPrice: 15.0,
      paymentMethod: "cash" as const,
      status: "requested" as const,
    };

    const result = await db.createRide(rideData);
    const rideId = Number(result[0]?.insertId);

    expect(rideId).toBeGreaterThan(0);

    // Verify ride was created without freight data
    const ride = await db.getRideById(rideId);

    expect(ride).toBeDefined();
    expect(ride.vehicleType).toBe("carro");
    expect(ride.isFreight).toBe(false);
    expect(ride.cargoWeight).toBeNull();
    expect(ride.cargoType).toBeNull();
  });

  it("should allow freight ride without helpers", async () => {
    const rideData = {
      passengerId: 1,
      vehicleType: "utilitario" as const,
      originAddress: "Praça Etelvino Mendonça, Itabaiana",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Rodoviária de Itabaiana",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 1.5,
      duration: 8,
      estimatedPrice: 22.0,
      paymentMethod: "pix" as const,
      status: "requested" as const,
      isFreight: true,
      cargoWeight: 30,
      cargoType: "entrega",
      needsHelpers: false,
    };

    const result = await db.createRide(rideData);
    const rideId = Number(result[0]?.insertId);

    expect(rideId).toBeGreaterThan(0);

    const ride = await db.getRideById(rideId);

    expect(ride.needsHelpers).toBe(false);
    // numberOfHelpers can be 0 or null when helpers are not needed
    expect([0, null]).toContain(ride.numberOfHelpers);
  });

  it("should handle optional freight fields", async () => {
    const rideData = {
      passengerId: 1,
      vehicleType: "utilitario" as const,
      originAddress: "Praça Etelvino Mendonça, Itabaiana",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Rodoviária de Itabaiana",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 1.0,
      duration: 5,
      estimatedPrice: 20.0,
      paymentMethod: "card" as const,
      status: "requested" as const,
      isFreight: true,
      cargoWeight: 20,
      cargoType: "outros",
      // cargoDescription is optional
      needsHelpers: false,
    };

    const result = await db.createRide(rideData);
    const rideId = Number(result[0]?.insertId);

    expect(rideId).toBeGreaterThan(0);

    const ride = await db.getRideById(rideId);

    expect(ride.isFreight).toBe(true);
    expect(ride.cargoWeight).toBe(20);
    expect(ride.cargoType).toBe("outros");
    expect(ride.cargoDescription).toBeNull();
  });
});
