import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";

describe("Safety & Security System", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create test user
    const openId = `test-safety-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Test Safety User",
      email: `safety${Date.now()}@test.com`,
    });
    const user = await db.getUserByOpenId(openId);
    testUserId = user!.id;
  });

  it("should generate unique share tokens", () => {
    const token1 = db.generateShareToken();
    const token2 = db.generateShareToken();

    expect(token1).toBeTruthy();
    expect(token2).toBeTruthy();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(10);
  });

  it("should create emergency contact", async () => {
    await db.createEmergencyContact({
      userId: testUserId,
      name: "João Silva",
      phone: "(79) 99999-9999",
      relationship: "Pai",
      isPrimary: true,
    });

    const contacts = await db.getEmergencyContacts(testUserId);
    expect(contacts.length).toBe(1);
    expect(contacts[0].name).toBe("João Silva");
    expect(contacts[0].isPrimary).toBe(true);
  });

  it("should set only one primary contact", async () => {
    // Create first contact as primary
    await db.createEmergencyContact({
      userId: testUserId,
      name: "Contact 1",
      phone: "111",
      isPrimary: true,
    });

    // Create second contact as primary (should unmark first)
    await db.createEmergencyContact({
      userId: testUserId,
      name: "Contact 2",
      phone: "222",
      isPrimary: true,
    });

    const contacts = await db.getEmergencyContacts(testUserId);
    const primaryContacts = contacts.filter((c) => c.isPrimary);

    expect(primaryContacts.length).toBe(1);
    expect(primaryContacts[0].name).toBe("Contact 2");
  });

  it("should delete emergency contact", async () => {
    await db.createEmergencyContact({
      userId: testUserId,
      name: "To Delete",
      phone: "123",
    });

    let contacts = await db.getEmergencyContacts(testUserId);
    expect(contacts.length).toBe(1);

    await db.deleteEmergencyContact(contacts[0].id, testUserId);

    contacts = await db.getEmergencyContacts(testUserId);
    expect(contacts.length).toBe(0);
  });

  it("should update emergency contact", async () => {
    await db.createEmergencyContact({
      userId: testUserId,
      name: "Original Name",
      phone: "111",
      isPrimary: false,
    });

    const contacts = await db.getEmergencyContacts(testUserId);
    const contactId = contacts[0].id;

    await db.updateEmergencyContact(contactId, testUserId, {
      name: "Updated Name",
      isPrimary: true,
    });

    const updated = await db.getEmergencyContacts(testUserId);
    expect(updated[0].name).toBe("Updated Name");
    expect(updated[0].isPrimary).toBe(true);
  });

  it("should trigger SOS alert", async () => {
    // Create a ride first
    const rideResult = await db.createRide({
      passengerId: testUserId,
      vehicleType: "carro",
      originAddress: "Origin",
      originLat: "-10.6847",
      originLng: "-37.4250",
      destinationAddress: "Destination",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 5000,
      duration: 600,
      estimatedPrice: 1500,
      paymentMethod: "cash",
      shareToken: db.generateShareToken(),
    });

    const rideId = Number(rideResult[0]?.insertId || 0);

    // Create emergency contact
    await db.createEmergencyContact({
      userId: testUserId,
      name: "Emergency Contact",
      phone: "999",
      isPrimary: true,
    });

    // Trigger SOS
    const result = await db.triggerSOS(
      rideId,
      testUserId,
      "Test Location",
      "-10.6847",
      "-37.4250"
    );

    expect(result).toBeTruthy();
    expect(result?.alertId).toBeGreaterThan(0);
    expect(result?.contacts.length).toBe(1);

    // Verify ride was marked as SOS activated
    const ride = await db.getRideById(rideId);
    expect(ride?.sosActivated).toBe(true);
    expect(ride?.sosActivatedAt).toBeTruthy();
  });

  it("should get ride by share token", async () => {
    const shareToken = db.generateShareToken();

    const rideResult = await db.createRide({
      passengerId: testUserId,
      vehicleType: "carro",
      originAddress: "Origin",
      originLat: "-10.6847",
      originLng: "-37.4250",
      destinationAddress: "Destination",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 5000,
      duration: 600,
      estimatedPrice: 1500,
      paymentMethod: "cash",
      shareToken,
    });

    const ride = await db.getRideByShareToken(shareToken);
    expect(ride).toBeTruthy();
    expect(ride?.shareToken).toBe(shareToken);
    expect(ride?.passengerId).toBe(testUserId);
  });

  it("should resolve SOS alert", async () => {
    // Create ride and trigger SOS
    const rideResult = await db.createRide({
      passengerId: testUserId,
      vehicleType: "carro",
      originAddress: "Origin",
      originLat: "-10.6847",
      originLng: "-37.4250",
      destinationAddress: "Destination",
      destinationLat: "-10.6900",
      destinationLng: "-37.4300",
      distance: 5000,
      duration: 600,
      estimatedPrice: 1500,
      paymentMethod: "cash",
      shareToken: db.generateShareToken(),
    });

    const rideId = Number(rideResult[0]?.insertId || 0);

    const sosResult = await db.triggerSOS(
      rideId,
      testUserId,
      "Test Location",
      "-10.6847",
      "-37.4250"
    );

    const alertId = sosResult?.alertId || 0;

    // Resolve alert
    await db.resolveSosAlert(alertId, testUserId, "resolved", "False alarm");

    // Verify resolution
    const alerts = await db.getActiveSosAlerts();
    const activeAlert = alerts.find((a) => a.id === alertId);
    expect(activeAlert).toBeUndefined(); // Should not be in active alerts
  });
});
