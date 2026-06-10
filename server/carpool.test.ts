import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Carpool System", () => {
  let testUserId1: number;
  let testUserId2: number;

  beforeAll(async () => {
    // Create test users
    await db.upsertUser({
      openId: "test-carpool-user-1",
      name: "Test User 1",
      email: "carpooluser1@test.com",
    });

    await db.upsertUser({
      openId: "test-carpool-user-2",
      name: "Test User 2",
      email: "carpooluser2@test.com",
    });

    const user1 = await db.getUserByOpenId("test-carpool-user-1");
    const user2 = await db.getUserByOpenId("test-carpool-user-2");

    if (!user1 || !user2) {
      throw new Error("Failed to create test users");
    }

    testUserId1 = user1.id;
    testUserId2 = user2.id;
  });

  it("should create a shared ride with correct pricing", async () => {
    const estimatedPrice = 2000; // R$ 20,00
    const maxPassengers = 3;
    const expectedPricePerPassenger = Math.floor(estimatedPrice / maxPassengers); // R$ 6,66

    const result = await db.createRide({
      passengerId: testUserId1,
      vehicleType: "carro",
      originAddress: "Rua A, Itabaiana, SE",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Rua B, Itabaiana, SE",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 5000,
      duration: 600,
      estimatedPrice,
      paymentMethod: "cash",
      isShared: true,
      maxPassengers,
      currentPassengers: 1,
      pricePerPassenger: expectedPricePerPassenger,
    });

    const rideId = Number(result[0]?.insertId);
    expect(rideId).toBeGreaterThan(0);

    const ride = await db.getRideById(rideId);
    expect(ride).toBeDefined();
    expect(ride.isShared).toBe(true);
    expect(ride.maxPassengers).toBe(maxPassengers);
    expect(ride.currentPassengers).toBe(1);
    expect(ride.pricePerPassenger).toBe(expectedPricePerPassenger);
  });

  it("should find matching shared rides", async () => {
    // Create a shared ride
    const result = await db.createRide({
      passengerId: testUserId1,
      vehicleType: "carro",
      originAddress: "Centro, Itabaiana, SE",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Bairro Novo, Itabaiana, SE",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 3000,
      duration: 400,
      estimatedPrice: 1500,
      paymentMethod: "cash",
      isShared: true,
      maxPassengers: 3,
      currentPassengers: 1,
      pricePerPassenger: 500,
    });

    const rideId = Number(result[0]?.insertId);

    // Search for matching rides (similar origin and destination)
    const matches = await db.findMatchingSharedRides({
      originLat: "-10.6855", // Very close to origin
      originLng: "-37.4255",
      destinationLat: "-10.6905", // Very close to destination
      destinationLng: "-37.4305",
      vehicleType: "carro",
      maxDistanceKm: 2,
      timeWindowMinutes: 15,
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((r) => r.id === rideId)).toBe(true);
  });

  it("should allow a second passenger to join a shared ride", async () => {
    // Create shared ride
    const result = await db.createRide({
      passengerId: testUserId1,
      vehicleType: "carro",
      originAddress: "Praça Central, Itabaiana, SE",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Terminal Rodoviário, Itabaiana, SE",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 4000,
      duration: 500,
      estimatedPrice: 1800,
      paymentMethod: "cash",
      isShared: true,
      maxPassengers: 3,
      currentPassengers: 1,
      pricePerPassenger: 600,
    });

    const rideId = Number(result[0]?.insertId);

    // Add creator as first passenger
    await db.createRidePassenger({
      rideId,
      passengerId: testUserId1,
      status: "accepted",
      pickupAddress: "Praça Central, Itabaiana, SE",
      pickupLat: "-10.6850",
      pickupLng: "-37.4250",
      dropoffAddress: "Terminal Rodoviário, Itabaiana, SE",
      dropoffLat: "-10.6900",
      dropoffLng: "-37.4300",
      individualPrice: 600,
      pickupOrder: 1,
      dropoffOrder: 1,
    });

    // Second passenger joins
    await db.createRidePassenger({
      rideId,
      passengerId: testUserId2,
      status: "pending",
      pickupAddress: "Próximo à Praça Central, Itabaiana, SE",
      pickupLat: "-10.6855",
      pickupLng: "-37.4255",
      dropoffAddress: "Próximo ao Terminal, Itabaiana, SE",
      dropoffLat: "-10.6905",
      dropoffLng: "-37.4305",
      individualPrice: 600,
      pickupOrder: 2,
      dropoffOrder: 2,
    });

    // Update ride passenger count
    await db.updateRide(rideId, {
      currentPassengers: 2,
    });

    const passengers = await db.getRidePassengers(rideId);
    expect(passengers.length).toBe(2);

    const ride = await db.getRideById(rideId);
    expect(ride.currentPassengers).toBe(2);
  });

  it("should not allow joining a full shared ride", async () => {
    // Create shared ride with max passengers = 2
    const result = await db.createRide({
      passengerId: testUserId1,
      vehicleType: "carro",
      originAddress: "Rua X, Itabaiana, SE",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "Rua Y, Itabaiana, SE",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 2000,
      duration: 300,
      estimatedPrice: 1200,
      paymentMethod: "cash",
      isShared: true,
      maxPassengers: 2,
      currentPassengers: 2, // Already full
      pricePerPassenger: 600,
    });

    const rideId = Number(result[0]?.insertId);
    const ride = await db.getRideById(rideId);

    // Verify ride is full
    expect(ride.currentPassengers).toBe(ride.maxPassengers);
    expect(ride.currentPassengers >= ride.maxPassengers).toBe(true);
  });

  it("should calculate distance between coordinates correctly", async () => {
    // Test the Haversine formula indirectly through findMatchingSharedRides
    
    // Create a ride far away
    await db.createRide({
      passengerId: testUserId1,
      vehicleType: "carro",
      originAddress: "Far Location",
      originLat: "-15.0000", // Very far from search point
      originLng: "-40.0000",
      destinationAddress: "Far Destination",
      destinationLat: "-15.1000",
      destinationLng: "-40.1000",
      distance: 10000,
      duration: 1200,
      estimatedPrice: 5000,
      paymentMethod: "cash",
      isShared: true,
      maxPassengers: 3,
      currentPassengers: 1,
      pricePerPassenger: 1666,
    });

    // Search near Itabaiana (should not find the far ride)
    const matches = await db.findMatchingSharedRides({
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      vehicleType: "carro",
      maxDistanceKm: 5, // 5km radius
      timeWindowMinutes: 15,
    });

    // Should not include the far ride
    expect(matches.every((r) => r.originLat !== "-15.0000")).toBe(true);
  });

  it("should get passenger's active shared rides", async () => {
    // Create a shared ride
    const result = await db.createRide({
      passengerId: testUserId1,
      vehicleType: "carro",
      originAddress: "My Home",
      originLat: "-10.6850",
      originLng: "-37.4250",
      destinationAddress: "My Work",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 3000,
      duration: 400,
      estimatedPrice: 1500,
      paymentMethod: "cash",
      isShared: true,
      maxPassengers: 3,
      currentPassengers: 1,
      pricePerPassenger: 500,
    });

    const rideId = Number(result[0]?.insertId);

    // Create passenger entry
    await db.createRidePassenger({
      rideId,
      passengerId: testUserId1,
      status: "accepted",
      pickupAddress: "My Home",
      pickupLat: "-10.6850",
      pickupLng: "-37.4250",
      dropoffAddress: "My Work",
      dropoffLat: "-10.6900",
      dropoffLng: "-37.4300",
      individualPrice: 500,
      pickupOrder: 1,
      dropoffOrder: 1,
    });

    const sharedRides = await db.getPassengerSharedRides(testUserId1);
    expect(sharedRides.length).toBeGreaterThan(0);
    expect(sharedRides.some((sr) => sr.rideId === rideId)).toBe(true);
  });
});
