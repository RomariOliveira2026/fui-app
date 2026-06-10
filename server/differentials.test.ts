import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================
// Test Helpers
// ============================================

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ============================================
// FAVORITES ROUTER TESTS
// ============================================

describe("favorites router", () => {
  it("should require authentication for list", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.favorites.list()).rejects.toThrow();
  });

  it("should require authentication for add", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.favorites.add({ driverId: 1 })
    ).rejects.toThrow();
  });

  it("should require authentication for remove", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.favorites.remove({ driverId: 1 })
    ).rejects.toThrow();
  });

  it("should require authentication for isFavorite", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.favorites.isFavorite({ driverId: 1 })
    ).rejects.toThrow();
  });

  it("should require authentication for update", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.favorites.update({ driverId: 1, nickname: "Test" })
    ).rejects.toThrow();
  });

  it("should validate add input - driverId is required", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error - testing invalid input
      caller.favorites.add({})
    ).rejects.toThrow();
  });

  it("should validate update input - driverId is required", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error - testing invalid input
      caller.favorites.update({ nickname: "Test" })
    ).rejects.toThrow();
  });

  it("should validate nickname max length", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.favorites.add({
        driverId: 1,
        nickname: "a".repeat(101), // exceeds 100 char limit
      })
    ).rejects.toThrow();
  });

  it("should validate note max length", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.favorites.add({
        driverId: 1,
        note: "a".repeat(501), // exceeds 500 char limit
      })
    ).rejects.toThrow();
  });
});

// ============================================
// REFERRALS ROUTER TESTS
// ============================================

describe("referrals router", () => {
  it("should require authentication for getMyCode", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.referrals.getMyCode()).rejects.toThrow();
  });

  it("should require authentication for getStats", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.referrals.getStats()).rejects.toThrow();
  });

  it("should require authentication for list", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.referrals.list()).rejects.toThrow();
  });

  it("should require authentication for redeemCode", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.referrals.redeemCode({ code: "TEST123" })
    ).rejects.toThrow();
  });

  it("should require authentication for generateCode", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.referrals.generateCode()).rejects.toThrow();
  });

  it("should allow public access to validate", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw auth error - just return invalid code response
    const result = await caller.referrals.validate({ code: "NONEXISTENT" });
    expect(result).toHaveProperty("valid");
    expect(result.valid).toBe(false);
  });

  it("should validate code input for validate - min length", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.referrals.validate({ code: "" })
    ).rejects.toThrow();
  });

  it("should validate code input for redeemCode - min length", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.referrals.redeemCode({ code: "" })
    ).rejects.toThrow();
  });
});

// ============================================
// DELIVERY ROUTER TESTS
// ============================================

describe("delivery router", () => {
  it("should require authentication for create", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.delivery.create({
        pickupAddress: "Rua A",
        pickupLat: "-10.68",
        pickupLng: "-37.42",
        deliveryAddress: "Rua B",
        deliveryLat: "-10.69",
        deliveryLng: "-37.43",
        recipientName: "João",
        recipientPhone: "79999999999",
        packageType: "documento",
        distance: 3000,
        duration: 600,
        estimatedPrice: 800,
        paymentMethod: "pix",
      })
    ).rejects.toThrow();
  });

  it("should require authentication for myOrders", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.delivery.myOrders()).rejects.toThrow();
  });

  it("should require authentication for cancel", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.delivery.cancel({ id: 1 })
    ).rejects.toThrow();
  });

  it("should allow public access to calculatePrice", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.delivery.calculatePrice({
      distance: 3000, // 3km
      packageType: "documento",
      isFragile: false,
      requiresSignature: false,
    });

    expect(result).toHaveProperty("estimatedPrice");
    expect(result.estimatedPrice).toBeGreaterThan(0);
    expect(typeof result.estimatedPrice).toBe("number");
  });

  it("should calculate higher price for fragile packages", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    const normalPrice = await caller.delivery.calculatePrice({
      distance: 3000,
      packageType: "documento",
      isFragile: false,
      requiresSignature: false,
    });

    const fragilePrice = await caller.delivery.calculatePrice({
      distance: 3000,
      packageType: "documento",
      isFragile: true,
      requiresSignature: false,
    });

    expect(fragilePrice.estimatedPrice).toBeGreaterThan(normalPrice.estimatedPrice);
  });

  it("should calculate higher price for signature required", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    const normalPrice = await caller.delivery.calculatePrice({
      distance: 3000,
      packageType: "documento",
      isFragile: false,
      requiresSignature: false,
    });

    const signaturePrice = await caller.delivery.calculatePrice({
      distance: 3000,
      packageType: "documento",
      isFragile: false,
      requiresSignature: true,
    });

    expect(signaturePrice.estimatedPrice).toBeGreaterThan(normalPrice.estimatedPrice);
  });

  it("should calculate higher price for larger packages", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    const smallPrice = await caller.delivery.calculatePrice({
      distance: 3000,
      packageType: "pacote_pequeno",
      isFragile: false,
      requiresSignature: false,
    });

    const largePrice = await caller.delivery.calculatePrice({
      distance: 3000,
      packageType: "pacote_grande",
      isFragile: false,
      requiresSignature: false,
    });

    expect(largePrice.estimatedPrice).toBeGreaterThan(smallPrice.estimatedPrice);
  });

  it("should calculate higher price for longer distances", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    const shortPrice = await caller.delivery.calculatePrice({
      distance: 1000, // 1km
      packageType: "documento",
      isFragile: false,
      requiresSignature: false,
    });

    const longPrice = await caller.delivery.calculatePrice({
      distance: 10000, // 10km
      packageType: "documento",
      isFragile: false,
      requiresSignature: false,
    });

    expect(longPrice.estimatedPrice).toBeGreaterThan(shortPrice.estimatedPrice);
  });

  it("should validate packageType enum", async () => {
    const ctx = createAnonContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.delivery.calculatePrice({
        distance: 3000,
        // @ts-expect-error - testing invalid input
        packageType: "invalid_type",
        isFragile: false,
        requiresSignature: false,
      })
    ).rejects.toThrow();
  });

  it("should validate paymentMethod enum on create", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.delivery.create({
        pickupAddress: "Rua A",
        pickupLat: "-10.68",
        pickupLng: "-37.42",
        deliveryAddress: "Rua B",
        deliveryLat: "-10.69",
        deliveryLng: "-37.43",
        recipientName: "João",
        recipientPhone: "79999999999",
        packageType: "documento",
        distance: 3000,
        duration: 600,
        estimatedPrice: 800,
        // @ts-expect-error - testing invalid input
        paymentMethod: "bitcoin",
      })
    ).rejects.toThrow();
  });
});
