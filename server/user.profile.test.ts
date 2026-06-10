import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

describe("User Profile", () => {
  let testUserId: number;
  let testContext: TrpcContext;

  beforeAll(async () => {
    // Create a test user
    const testUser = {
      openId: `test-profile-user-${Date.now()}`,
      name: "Test Profile User",
      email: "profile@test.com",
      phone: "(79) 98888-7777",
      loginMethod: "oauth" as const,
      lastSignedIn: new Date(),
      role: "user" as const,
    };

    await db.upsertUser(testUser);
    const user = await db.getUserByOpenId(testUser.openId);
    if (!user) throw new Error("Failed to create test user");
    
    testUserId = user.id;

    // Mock context with authenticated user
    testContext = {
      user: user,
      req: {} as any,
      res: {} as any,
    };
  });

  it("should update user profile successfully", async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.user.updateProfile({
      name: "Updated Name",
      phone: "(79) 99999-8888",
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updatedUser = await db.getUserById(testUserId);
    expect(updatedUser?.name).toBe("Updated Name");
    expect(updatedUser?.phone).toBe("(79) 99999-8888");
  });

  it("should get user rides", async () => {
    const caller = appRouter.createCaller(testContext);

    const rides = await caller.ride.myRides();

    // Should return an array (empty or with rides)
    expect(Array.isArray(rides)).toBe(true);
  });

  it("should allow partial profile updates", async () => {
    const caller = appRouter.createCaller(testContext);

    // Update only name
    await caller.user.updateProfile({
      name: "Only Name Changed",
    });

    const user = await db.getUserById(testUserId);
    expect(user?.name).toBe("Only Name Changed");
    // Phone should remain from previous test
    expect(user?.phone).toBe("(79) 99999-8888");
  });

  it("should allow updating only phone", async () => {
    const caller = appRouter.createCaller(testContext);

    await caller.user.updateProfile({
      phone: "(79) 91111-2222",
    });

    const user = await db.getUserById(testUserId);
    expect(user?.phone).toBe("(79) 91111-2222");
    // Name should remain from previous test
    expect(user?.name).toBe("Only Name Changed");
  });
});
