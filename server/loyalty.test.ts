import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Loyalty Program", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    await db.upsertUser({
      openId: "test-loyalty-user",
      name: "Test Loyalty User",
      email: "loyalty@test.com",
    });

    const user = await db.getUserByOpenId("test-loyalty-user");
    testUserId = user!.id;
  });

  it("should calculate VIP level correctly", () => {
    expect(db.calculateVipLevel(0)).toBe("bronze");
    expect(db.calculateVipLevel(499)).toBe("bronze");
    expect(db.calculateVipLevel(500)).toBe("prata");
    expect(db.calculateVipLevel(1999)).toBe("prata");
    expect(db.calculateVipLevel(2000)).toBe("ouro");
    expect(db.calculateVipLevel(4999)).toBe("ouro");
    expect(db.calculateVipLevel(5000)).toBe("diamante");
    expect(db.calculateVipLevel(10000)).toBe("diamante");
  });

  it("should get correct discount for VIP levels", () => {
    expect(db.getVipDiscount("bronze")).toBe(0);
    expect(db.getVipDiscount("prata")).toBe(5);
    expect(db.getVipDiscount("ouro")).toBe(10);
    expect(db.getVipDiscount("diamante")).toBe(15);
  });

  it("should add loyalty points and update VIP level", async () => {
    // Add 600 points
    await db.addLoyaltyPoints(
      testUserId,
      600,
      "Test points",
    );

    const user = await db.getUserById(testUserId);
    expect(user?.loyaltyPoints).toBeGreaterThanOrEqual(600);
    // VIP level should match the calculated level for the current points
    const expectedLevel = db.calculateVipLevel(user!.loyaltyPoints);
    expect(user?.vipLevel).toBe(expectedLevel);
  });

  it("should record loyalty history", async () => {
    const history = await db.getLoyaltyHistory(testUserId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].type).toBe("earned");
    expect(history[0].points).toBeGreaterThan(0);
  });

  it("should redeem loyalty points", async () => {
    const userBefore = await db.getUserById(testUserId);
    const pointsBefore = userBefore!.loyaltyPoints;

    const success = await db.redeemLoyaltyPoints(
      testUserId,
      100,
      "Test redemption"
    );

    expect(success).toBe(true);

    const userAfter = await db.getUserById(testUserId);
    expect(userAfter!.loyaltyPoints).toBe(pointsBefore - 100);
  });

  it("should fail to redeem more points than available", async () => {
    const user = await db.getUserById(testUserId);
    const availablePoints = user!.loyaltyPoints;

    const success = await db.redeemLoyaltyPoints(
      testUserId,
      availablePoints + 1000,
      "Invalid redemption"
    );

    expect(success).toBe(false);
  });

  it("should get loyalty stats correctly", async () => {
    const stats = await db.getUserLoyaltyStats(testUserId);

    expect(stats).not.toBeNull();
    expect(stats!.currentPoints).toBeGreaterThan(0);
    expect(stats!.currentLevel).toBeTruthy();
    expect(stats!.currentDiscount).toBeGreaterThanOrEqual(0);
    expect(stats!.totalEarned).toBeGreaterThan(0);
    expect(stats!.totalRedeemed).toBeGreaterThan(0);
    expect(Array.isArray(stats!.history)).toBe(true);
  });
});
