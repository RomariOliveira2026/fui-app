import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

describe("User Profile Extended Features", () => {
  let testUserId: number;
  let testContext: TrpcContext;

  beforeAll(async () => {
    const testUser = {
      openId: `test-profile-ext-${Date.now()}`,
      name: "Profile Extended User",
      email: "profile-ext@test.com",
      phone: "(79) 98765-4321",
      loginMethod: "oauth" as const,
      lastSignedIn: new Date(),
      role: "user" as const,
    };

    await db.upsertUser(testUser);
    const user = await db.getUserByOpenId(testUser.openId);
    if (!user) throw new Error("Failed to create test user");

    testUserId = user.id;

    testContext = {
      user: user,
      req: {} as any,
      res: {} as any,
    };
  });

  describe("updateProfile with avatarUrl", () => {
    it("should update profile with avatarUrl", async () => {
      const caller = appRouter.createCaller(testContext);

      const result = await caller.user.updateProfile({
        name: "Avatar User",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      expect(result.success).toBe(true);

      const updatedUser = await db.getUserById(testUserId);
      expect(updatedUser?.name).toBe("Avatar User");
      expect(updatedUser?.avatarUrl).toBe("https://example.com/avatar.jpg");
    });

    it("should update only avatarUrl without changing other fields", async () => {
      const caller = appRouter.createCaller(testContext);

      await caller.user.updateProfile({
        avatarUrl: "https://example.com/new-avatar.png",
      });

      const updatedUser = await db.getUserById(testUserId);
      expect(updatedUser?.avatarUrl).toBe("https://example.com/new-avatar.png");
      expect(updatedUser?.name).toBe("Avatar User"); // unchanged
      expect(updatedUser?.phone).toBe("(79) 98765-4321"); // unchanged
    });
  });

  describe("uploadAvatar", () => {
    it("should reject images larger than 5MB", async () => {
      const caller = appRouter.createCaller(testContext);

      // Create a base64 string that decodes to >5MB
      // 5MB = 5 * 1024 * 1024 = 5242880 bytes
      // base64 encodes 3 bytes into 4 chars, so we need ~7MB of base64 for >5MB decoded
      const largeBase64 = Buffer.alloc(6 * 1024 * 1024).toString("base64");

      await expect(
        caller.user.uploadAvatar({
          base64: largeBase64,
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow("Imagem muito grande");
    });
  });

  describe("getStats", () => {
    it("should return user stats with correct structure", async () => {
      const caller = appRouter.createCaller(testContext);

      const stats = await caller.user.getStats();

      expect(stats).toHaveProperty("totalRides");
      expect(stats).toHaveProperty("totalSpent");
      expect(stats).toHaveProperty("totalSaved");
      expect(stats).toHaveProperty("memberSince");
      expect(typeof stats.totalRides).toBe("number");
      expect(typeof stats.totalSpent).toBe("number");
      expect(typeof stats.totalSaved).toBe("number");
    });

    it("should return zero stats for new user", async () => {
      const caller = appRouter.createCaller(testContext);

      const stats = await caller.user.getStats();

      expect(stats.totalRides).toBe(0);
      expect(stats.totalSpent).toBe(0);
      expect(stats.totalSaved).toBe(0);
    });
  });

  describe("getRecentRides", () => {
    it("should return an array of recent rides", async () => {
      const caller = appRouter.createCaller(testContext);

      const rides = await caller.user.getRecentRides();

      expect(Array.isArray(rides)).toBe(true);
    });

    it("should return empty array for new user", async () => {
      const caller = appRouter.createCaller(testContext);

      const rides = await caller.user.getRecentRides();

      expect(rides).toHaveLength(0);
    });

    it("should accept optional limit parameter", async () => {
      const caller = appRouter.createCaller(testContext);

      const rides = await caller.user.getRecentRides({ limit: 3 });

      expect(Array.isArray(rides)).toBe(true);
    });
  });
});
