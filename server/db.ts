import { eq, and, desc, sql, inArray, lt, isNull, ne } from "drizzle-orm";
import { getDispatcherOfferTimeoutMs } from "@shared/rideDispatcher";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  driverProfiles,
  InsertDriverProfile,
  vehicles,
  InsertVehicle,
  rides,
  InsertRide,
  ratings,
  InsertRating,
  pricingConfig,
  InsertPricingConfig,
  driverLocations,
  InsertDriverLocation,
  rideOffers,
  InsertRideOffer,
  InsertCoupon,
  InsertCouponUsage,
  chatMessages,
  InsertChatMessage,
  coupons,
  savedAddresses,
  InsertSavedAddress,
  fcmTokens,
  InsertFcmToken,
  ridePassengers,
  InsertRidePassenger,
  loyaltyHistory,
  InsertLoyaltyHistory,
  emergencyContacts,
  InsertEmergencyContact,
  sosAlerts,
  InsertSosAlert,
  driverPremiumPreferences,
  platformFinanceSettings,
  financialLedger,
  driverApplications,
  type DriverApplicationRow,
} from "../drizzle/schema";
import type { PlatformFinanceConfig } from "@shared/adminFinance";
import type { DriverPremiumPreferences } from "@shared/driverPremium";
import type { FinancialLedgerEntry } from "@shared/financialLedger";
import type { DriverApplication } from "@shared/driverRegistration";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "driver" | "passenger") {
  const db = await getDb();
  if (!db) return false;

  await db.update(users).set({ role }).where(eq(users.id, userId));
  return true;
}

export async function updateUserProfile(userId: number, updates: { name?: string; phone?: string; avatarUrl?: string; }) {
  const db = await getDb();
  if (!db) return false;

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }
  return true;
}

export async function getRecentRides(userId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(and(eq(rides.passengerId, userId), eq(rides.status, "completed")))
    .orderBy(desc(rides.createdAt))
    .limit(limit);
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalRides: 0, totalSpent: 0, totalSaved: 0, memberSince: null };

  const allRides = await db.select().from(rides)
    .where(and(eq(rides.passengerId, userId), eq(rides.status, "completed")));
  
  const user = await getUserById(userId);
  
  const totalSpent = allRides.reduce((sum, r) => sum + (r.finalPrice || 0), 0);
  const totalSaved = allRides.reduce((sum, r) => {
    if (r.couponCode) {
      return sum + (r.discountAmount || 0);
    }
    return sum;
  }, 0);

  return {
    totalRides: allRides.length,
    totalSpent,
    totalSaved,
    memberSince: user?.createdAt || null,
  };
}

// ============= DRIVER PROFILE OPERATIONS =============

export async function createDriverProfile(profile: InsertDriverProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(driverProfiles).values(profile);
  return result;
}

export async function getDriverProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDriverProfile(driverId: number, updates: Partial<InsertDriverProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(driverProfiles).set(updates).where(eq(driverProfiles.id, driverId));
}

export async function updateDriverAvailability(driverId: number, isAvailable: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(driverProfiles).set({ isAvailable }).where(eq(driverProfiles.id, driverId));
}

export async function getAvailableDrivers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(driverProfiles).where(
    and(
      eq(driverProfiles.isAvailable, true),
      eq(driverProfiles.status, "approved")
    )
  );
}

// ============= VEHICLE OPERATIONS =============

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicles).values(vehicle);
  return result;
}

export async function getVehiclesByDriverId(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVehicle(vehicleId: number, updates: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicles).set(updates).where(eq(vehicles.id, vehicleId));
}

// ============= RIDE OPERATIONS =============

export async function createRide(ride: InsertRide) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(rides).values(ride);
  return result;
}

export async function getRideById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRide(rideId: number, updates: Partial<InsertRide>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(rides).set(updates).where(eq(rides.id, rideId));
}

export async function getPassengerRides(passengerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(eq(rides.passengerId, passengerId))
    .orderBy(desc(rides.createdAt));
}

export async function getDriverRides(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(eq(rides.driverId, driverId))
    .orderBy(desc(rides.createdAt));
}

export async function getActiveRides() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(inArray(rides.status, ["requested", "accepted", "in_progress"]))
    .orderBy(desc(rides.createdAt));
}

export async function getRequestedRides() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(eq(rides.status, "requested"))
    .orderBy(desc(rides.createdAt));
}

// ============= RIDE OFFERS (DISPATCHER) =============

export async function createRideOffers(
  offers: Array<{
    rideId: number;
    driverId: number;
    distanceMeters: number;
    offerRound?: number;
  }>
) {
  const db = await getDb();
  if (!db || offers.length === 0) return;

  await db.insert(rideOffers).values(
    offers.map((o) => ({
      rideId: o.rideId,
      driverId: o.driverId,
      distanceMeters: o.distanceMeters,
      offerRound: o.offerRound ?? 1,
      status: "pending" as const,
    }))
  );
}

export async function driverHasPendingRideOffer(
  rideId: number,
  driverId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select({ id: rideOffers.id })
    .from(rideOffers)
    .where(
      and(
        eq(rideOffers.rideId, rideId),
        eq(rideOffers.driverId, driverId),
        eq(rideOffers.status, "pending")
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function getRequestedRidesWithPendingOfferForDriver(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  await expireStalePendingRideOffers();

  const cutoff = getOfferExpiryCutoff();
  const rows = await db
    .select({
      ride: rides,
      distanceMeters: rideOffers.distanceMeters,
      offerRound: rideOffers.offerRound,
      createdAt: rideOffers.createdAt,
    })
    .from(rideOffers)
    .innerJoin(rides, eq(rideOffers.rideId, rides.id))
    .where(
      and(
        eq(rideOffers.driverId, driverId),
        eq(rideOffers.status, "pending"),
        eq(rides.status, "requested")
      )
    )
    .orderBy(desc(rides.createdAt));

  return rows
    .filter((row) => row.createdAt.getTime() > cutoff.getTime())
    .map((row) => ({
      ...row.ride,
      offerDistanceMeters: row.distanceMeters,
      offerRound: row.offerRound,
      offerExpiresAt: new Date(
        row.createdAt.getTime() + getDispatcherOfferTimeoutMs()
      ).toISOString(),
    }));
}

export async function expirePendingRideOffersForRide(rideId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(rideOffers)
    .set({ status: "expired" })
    .where(and(eq(rideOffers.rideId, rideId), eq(rideOffers.status, "pending")));
}

function getOfferExpiryCutoff(): Date {
  return new Date(Date.now() - getDispatcherOfferTimeoutMs());
}

/** Expira ofertas pendentes vencidas por tempo (produção). */
export async function expireStalePendingRideOffers(rideId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const cutoff = getOfferExpiryCutoff();
  const conditions = [
    eq(rideOffers.status, "pending"),
    lt(rideOffers.createdAt, cutoff),
  ];
  if (rideId != null) {
    conditions.push(eq(rideOffers.rideId, rideId));
  }

  const stale = await db
    .select({ id: rideOffers.id })
    .from(rideOffers)
    .where(and(...conditions));

  if (stale.length === 0) return 0;

  await db
    .update(rideOffers)
    .set({ status: "expired" })
    .where(
      and(
        eq(rideOffers.status, "pending"),
        lt(rideOffers.createdAt, cutoff),
        ...(rideId != null ? [eq(rideOffers.rideId, rideId)] : [])
      )
    );

  return stale.length;
}

export async function countPendingRideOffers(rideId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  await expireStalePendingRideOffers(rideId);

  const rows = await db
    .select({ id: rideOffers.id })
    .from(rideOffers)
    .where(and(eq(rideOffers.rideId, rideId), eq(rideOffers.status, "pending")));

  return rows.length;
}

export async function getMaxOfferRoundForRide(rideId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rows = await db
    .select({ offerRound: rideOffers.offerRound })
    .from(rideOffers)
    .where(eq(rideOffers.rideId, rideId));

  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.offerRound));
}

export async function getNextOfferRoundForRide(rideId: number): Promise<number> {
  const max = await getMaxOfferRoundForRide(rideId);
  return max === 0 ? 1 : max + 1;
}

export async function getPreviouslyOfferedDriverIdsForRide(rideId: number): Promise<Set<number>> {
  const db = await getDb();
  if (!db) return new Set();

  const rows = await db
    .select({ driverId: rideOffers.driverId })
    .from(rideOffers)
    .where(eq(rideOffers.rideId, rideId));

  return new Set(rows.map((r) => r.driverId));
}

export async function getDriversBlockedFromReOffer(rideId: number): Promise<Set<number>> {
  const db = await getDb();
  if (!db) return new Set();

  await expireStalePendingRideOffers(rideId);
  const cutoff = getOfferExpiryCutoff();
  const rows = await db
    .select({
      driverId: rideOffers.driverId,
      status: rideOffers.status,
      createdAt: rideOffers.createdAt,
    })
    .from(rideOffers)
    .where(eq(rideOffers.rideId, rideId));

  const blocked = new Set<number>();
  for (const row of rows) {
    if (row.status === "declined" || row.status === "accepted") {
      blocked.add(row.driverId);
    } else if (row.status === "pending" && row.createdAt.getTime() > cutoff.getTime()) {
      blocked.add(row.driverId);
    }
  }
  return blocked;
}

export async function declineRideOffer(
  rideId: number,
  driverId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await expireStalePendingRideOffers(rideId);
  const cutoff = getOfferExpiryCutoff();

  const rows = await db
    .select({ id: rideOffers.id, createdAt: rideOffers.createdAt })
    .from(rideOffers)
    .where(
      and(
        eq(rideOffers.rideId, rideId),
        eq(rideOffers.driverId, driverId),
        eq(rideOffers.status, "pending")
      )
    )
    .limit(1);

  const offer = rows[0];
  if (!offer || offer.createdAt.getTime() <= cutoff.getTime()) {
    return false;
  }

  await db
    .update(rideOffers)
    .set({ status: "declined" })
    .where(eq(rideOffers.id, offer.id));

  return true;
}

export async function getRequestedRideIdsWithoutDriver(): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select({ id: rides.id })
      .from(rides)
      .where(and(eq(rides.status, "requested"), isNull(rides.driverId)));

    return rows.map((r) => r.id);
  } catch (error) {
    console.warn("[Database] getRequestedRideIdsWithoutDriver:", error);
    return [];
  }
}

export async function resolveRideOffersOnAccept(
  rideId: number,
  acceptedDriverId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const offers = await db
    .select()
    .from(rideOffers)
    .where(eq(rideOffers.rideId, rideId));

  for (const offer of offers) {
    const status =
      offer.driverId === acceptedDriverId && offer.status === "pending"
        ? ("accepted" as const)
        : offer.status === "pending"
          ? ("superseded" as const)
          : offer.status;

    if (status !== offer.status) {
      await db
        .update(rideOffers)
        .set({ status })
        .where(eq(rideOffers.id, offer.id));
    }
  }
}

// ============= RATING OPERATIONS =============

export async function createRating(rating: InsertRating) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(ratings).values(rating);
  
  // Update driver's average rating
  if (rating.toUserId) {
    await updateDriverRating(rating.toUserId);
  }
  
  return result;
}

export async function getRatingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(ratings)
    .where(eq(ratings.toUserId, userId))
    .orderBy(desc(ratings.createdAt));
}

export async function getRatingByRideId(rideId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(ratings).where(eq(ratings.rideId, rideId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

async function updateDriverRating(userId: number) {
  const db = await getDb();
  if (!db) return;

  const driverProfile = await getDriverProfileByUserId(userId);
  if (!driverProfile) return;

  const allRatings = await getRatingsByUserId(userId);
  if (allRatings.length === 0) return;

  const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
  const ratingInt = Math.round(avgRating * 100); // Store as 450 for 4.50 stars

  await updateDriverProfile(driverProfile.id, {
    rating: ratingInt,
    totalRides: allRatings.length
  });
}

// ============= PRICING OPERATIONS =============

export async function getPricingByVehicleType(vehicleType: "moto" | "carro" | "van" | "utilitario") {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pricingConfig)
    .where(eq(pricingConfig.vehicleType, vehicleType))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertPricing(pricing: InsertPricingConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(pricingConfig).values(pricing).onDuplicateKeyUpdate({
    set: {
      basePrice: pricing.basePrice,
      pricePerKm: pricing.pricePerKm,
      pricePerMinute: pricing.pricePerMinute,
      minimumPrice: pricing.minimumPrice,
    }
  });
}

export async function getAllPricing() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pricingConfig);
}

// ============= DRIVER LOCATION OPERATIONS =============

export async function updateDriverLocation(location: InsertDriverLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(driverLocations).values(location).onDuplicateKeyUpdate({
    set: {
      lat: location.lat,
      lng: location.lng,
      heading: location.heading,
    }
  });
}

export async function getDriverLocation(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(driverLocations)
    .where(eq(driverLocations.driverId, driverId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getNearbyDrivers(lat: string, lng: string, radiusKm: number = 5) {
  const db = await getDb();
  if (!db) return [];

  // Get available drivers with their locations
  const availableDrivers = await db
    .select({
      driver: driverProfiles,
      location: driverLocations,
      user: users
    })
    .from(driverProfiles)
    .innerJoin(driverLocations, eq(driverProfiles.id, driverLocations.driverId))
    .innerJoin(users, eq(driverProfiles.userId, users.id))
    .where(
      and(
        eq(driverProfiles.isAvailable, true),
        eq(driverProfiles.status, "approved")
      )
    );

  // Filter by distance (simple approximation)
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  
  return availableDrivers.filter(d => {
    const driverLat = parseFloat(d.location.lat);
    const driverLng = parseFloat(d.location.lng);
    const distance = Math.sqrt(
      Math.pow(driverLat - userLat, 2) + Math.pow(driverLng - userLng, 2)
    ) * 111; // Rough conversion to km
    return distance <= radiusKm;
  });
}

// ============= COUPON OPERATIONS =============

export async function createCoupon(coupon: InsertCoupon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { coupons } = await import("../drizzle/schema");
  return await db.insert(coupons).values(coupon);
}

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { coupons } = await import("../drizzle/schema");
  const result = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCoupons() {
  const db = await getDb();
  if (!db) return [];
  const { coupons } = await import("../drizzle/schema");
  return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function getActiveCoupons() {
  const db = await getDb();
  if (!db) return [];
  const { coupons } = await import("../drizzle/schema");
  const now = new Date();
  return await db.select().from(coupons).where(eq(coupons.isActive, 1));
}

export async function updateCoupon(id: number, updates: Partial<InsertCoupon>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { coupons } = await import("../drizzle/schema");
  return await db.update(coupons).set(updates).where(eq(coupons.id, id));
}

export async function recordCouponUsage(usage: InsertCouponUsage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { couponUsage, coupons } = await import("../drizzle/schema");
  
  // Record usage
  await db.insert(couponUsage).values(usage);
  
  // Increment used count
  await db.update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(eq(coupons.id, usage.couponId));
}

export async function getCouponUsageByUser(userId: number, couponId: number) {
  const db = await getDb();
  if (!db) return [];
  const { couponUsage } = await import("../drizzle/schema");
  return await db.select().from(couponUsage)
    .where(and(
      eq(couponUsage.userId, userId),
      eq(couponUsage.couponId, couponId)
    ));
}

// ==================== Chat Messages ====================

export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(chatMessages).values(message);
  return result.insertId;
}

export async function getChatMessagesByRide(rideId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.rideId, rideId))
    .orderBy(chatMessages.createdAt);
}

export async function getAllRides() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides);
}

export async function getApprovedDriverProfiles() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(driverProfiles)
    .where(eq(driverProfiles.status, "approved"));
}

export async function getPendingDriverProfiles() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(driverProfiles)
    .where(eq(driverProfiles.status, "pending"));
}

export async function updateRidePaymentStatus(
  rideId: number,
  paymentStatus: "pending" | "paid" | "failed",
  stripePaymentIntentId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { paymentStatus };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  await db
    .update(rides)
    .set(updateData)
    .where(eq(rides.id, rideId));
}

export async function getScheduledRidesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(rides)
    .where(
      and(
        eq(rides.passengerId, userId),
        eq(rides.isScheduled, "yes"),
        eq(rides.status, "requested")
      )
    )
    .orderBy(rides.scheduledFor);
}

export async function cancelRide(rideId: number, userId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(rides)
    .set({
      status: "cancelled",
      cancelledBy: userId,
      cancellationReason: reason,
      cancelledAt: new Date(),
    })
    .where(eq(rides.id, rideId));
}

export async function validateCoupon(
  code: string,
  rideValue: number,
  vehicleType: string
) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const result = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.code, code),
        eq(coupons.isActive, 1)
      )
    )
    .limit(1);

  if (result.length === 0) return null;
  const coupon = result[0];

  // Check expiration
  if (coupon.validUntil && coupon.validUntil < now) return null;
  if (coupon.validFrom && coupon.validFrom > now) return null;

  // Check minimum order value
  if (coupon.minRideValue && rideValue < coupon.minRideValue) return null;

  // Check vehicle type restriction
  if (coupon.vehicleTypes && !coupon.vehicleTypes.includes(vehicleType)) return null;

  // Check usage limit
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null;

  return coupon;
}

// ============= SAVED ADDRESSES OPERATIONS =============

export async function createSavedAddress(address: InsertSavedAddress) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(savedAddresses).values(address);
  return result;
}

export async function getSavedAddressesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(savedAddresses)
    .where(eq(savedAddresses.userId, userId))
    .orderBy(savedAddresses.createdAt);
}

export async function getSavedAddressByLabel(userId: number, label: "home" | "work" | "other") {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(savedAddresses)
    .where(and(
      eq(savedAddresses.userId, userId),
      eq(savedAddresses.label, label)
    ))
    .limit(1);

  return result[0] || null;
}

export async function updateSavedAddress(id: number, updates: Partial<InsertSavedAddress>) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(savedAddresses)
    .set(updates)
    .where(eq(savedAddresses.id, id));

  return true;
}

export async function deleteSavedAddress(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(savedAddresses)
    .where(eq(savedAddresses.id, id));

  return true;
}

// ============= FCM TOKENS OPERATIONS =============

export async function saveFcmToken(userId: number, token: string, deviceInfo?: string) {
  const db = await getDb();
  if (!db) return false;

  // Check if token already exists for this user
  const existing = await db
    .select()
    .from(fcmTokens)
    .where(and(
      eq(fcmTokens.userId, userId),
      eq(fcmTokens.token, token)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing token
    await db
      .update(fcmTokens)
      .set({ deviceInfo, updatedAt: new Date() })
      .where(eq(fcmTokens.id, existing[0].id));
  } else {
    // Insert new token
    await db.insert(fcmTokens).values({
      userId,
      token,
      deviceInfo,
    });
  }

  return true;
}

export async function getUserFcmTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(fcmTokens)
    .where(eq(fcmTokens.userId, userId));
}

export async function deleteFcmToken(token: string) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(fcmTokens)
    .where(eq(fcmTokens.token, token));

  return true;
}

export async function getDriverProfileById(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const driverProfile = await db
    .select()
    .from(driverProfiles)
    .where(eq(driverProfiles.id, driverId))
    .limit(1);

  if (driverProfile.length === 0) return undefined;

  const driver = driverProfile[0];

  // Get user info
  const userInfo = await db
    .select()
    .from(users)
    .where(eq(users.id, driver.userId))
    .limit(1);

  // Get vehicles
  const driverVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.driverId, driver.id));

  // Get ratings
  const driverRatings = await getRatingsByUserId(driver.userId);
  const averageRating = driverRatings.length > 0
    ? driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length
    : null;

  return {
    ...driver,
    user: userInfo[0] || null,
    vehicles: driverVehicles,
    averageRating,
    totalRatings: driverRatings.length,
  };
}

// ============= CARPOOL / SHARED RIDES OPERATIONS =============

/**
 * Create a ride passenger entry
 */
export async function createRidePassenger(passenger: InsertRidePassenger) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(ridePassengers).values(passenger);
}

/**
 * Get all passengers for a ride
 */
export async function getRidePassengers(rideId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const passengers = await db
    .select()
    .from(ridePassengers)
    .where(eq(ridePassengers.rideId, rideId))
    .orderBy(ridePassengers.pickupOrder);
  
  // Get user info for each passenger
  const passengersWithInfo = await Promise.all(
    passengers.map(async (p) => {
      const user = await getUserById(p.passengerId);
      return {
        ...p,
        user,
      };
    })
  );
  
  return passengersWithInfo;
}

/**
 * Update ride passenger status
 */
export async function updateRidePassengerStatus(
  id: number,
  status: "pending" | "accepted" | "declined" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(ridePassengers)
    .set({ status })
    .where(eq(ridePassengers.id, id));
  
  return true;
}

/**
 * Find available shared rides going to similar destination
 * within a time window and distance radius
 */
export async function findMatchingSharedRides(params: {
  originLat: string;
  originLng: string;
  destinationLat: string;
  destinationLng: string;
  vehicleType: "moto" | "carro" | "van" | "utilitario";
  maxDistanceKm?: number; // Max distance from origin/destination to consider a match
  timeWindowMinutes?: number; // Time window to look for rides
}) {
  const db = await getDb();
  if (!db) return [];
  
  const {
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    vehicleType,
    maxDistanceKm = 2, // 2km radius by default
    timeWindowMinutes = 15, // 15 minutes window
  } = params;
  
  // Get all shared rides that:
  // 1. Are in "requested" status
  // 2. Have same vehicle type
  // 3. Have available seats (currentPassengers < maxPassengers)
  // 4. Were created within the time window
  const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const availableRides = await db
    .select()
    .from(rides)
    .where(
      and(
        eq(rides.isShared, true),
        eq(rides.status, "requested"),
        eq(rides.vehicleType, vehicleType),
        sql`${rides.currentPassengers} < ${rides.maxPassengers}`,
        sql`${rides.createdAt} >= ${timeThreshold}`
      )
    );
  
  // Filter by distance (simple approximation)
  // In production, use proper geospatial queries or Haversine formula
  const matchingRides = availableRides.filter((ride) => {
    const originDistance = calculateDistance(
      parseFloat(originLat),
      parseFloat(originLng),
      parseFloat(ride.originLat),
      parseFloat(ride.originLng)
    );
    
    const destDistance = calculateDistance(
      parseFloat(destinationLat),
      parseFloat(destinationLng),
      parseFloat(ride.destinationLat),
      parseFloat(ride.destinationLng)
    );
    
    return originDistance <= maxDistanceKm && destDistance <= maxDistanceKm;
  });
  
  return matchingRides;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get passenger's active shared rides
 */
export async function getPassengerSharedRides(passengerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const passengerRides = await db
    .select()
    .from(ridePassengers)
    .where(
      and(
        eq(ridePassengers.passengerId, passengerId),
        sql`${ridePassengers.status} IN ('pending', 'accepted')`
      )
    );
  
  // Get full ride details for each
  const ridesWithDetails = await Promise.all(
    passengerRides.map(async (pr) => {
      const ride = await getRideById(pr.rideId);
      const allPassengers = await getRidePassengers(pr.rideId);
      return {
        ...pr,
        ride,
        allPassengers,
      };
    })
  );
  
  return ridesWithDetails;
}


// ============= LOYALTY PROGRAM OPERATIONS =============

/**
 * VIP level thresholds and benefits
 */
export const VIP_LEVELS = {
  bronze: { minPoints: 0, discount: 0 },
  prata: { minPoints: 500, discount: 5 },
  ouro: { minPoints: 2000, discount: 10 },
  diamante: { minPoints: 5000, discount: 15 },
} as const;

export type VipLevel = keyof typeof VIP_LEVELS;

/**
 * Calculate VIP level based on points
 */
export function calculateVipLevel(points: number): VipLevel {
  if (points >= VIP_LEVELS.diamante.minPoints) return "diamante";
  if (points >= VIP_LEVELS.ouro.minPoints) return "ouro";
  if (points >= VIP_LEVELS.prata.minPoints) return "prata";
  return "bronze";
}

/**
 * Get discount percentage for VIP level
 */
export function getVipDiscount(level: VipLevel): number {
  return VIP_LEVELS[level].discount;
}

/**
 * Add loyalty points to user
 */
export async function addLoyaltyPoints(
  userId: number,
  points: number,
  description: string,
  rideId?: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Add points to user
  await db
    .update(users)
    .set({
      loyaltyPoints: sql`${users.loyaltyPoints} + ${points}`,
    })
    .where(eq(users.id, userId));

  // Update VIP level (points already added above, so user.loyaltyPoints is already updated)
  const user = await getUserById(userId);
  if (user) {
    const newLevel = calculateVipLevel(user.loyaltyPoints);
    if (newLevel !== user.vipLevel) {
      await db
        .update(users)
        .set({ vipLevel: newLevel })
        .where(eq(users.id, userId));
    }
  }

  // Record in history
  await db.insert(loyaltyHistory).values({
    userId,
    type: "earned",
    points,
    description,
    rideId,
  });
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints(
  userId: number,
  points: number,
  description: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const user = await getUserById(userId);
  if (!user || user.loyaltyPoints < points) {
    return false; // Not enough points
  }

  // Deduct points
  await db
    .update(users)
    .set({
      loyaltyPoints: sql`${users.loyaltyPoints} - ${points}`,
    })
    .where(eq(users.id, userId));

  // Update VIP level if needed
  const newLevel = calculateVipLevel(user.loyaltyPoints - points);
  if (newLevel !== user.vipLevel) {
    await db
      .update(users)
      .set({ vipLevel: newLevel })
      .where(eq(users.id, userId));
  }

  // Record in history
  await db.insert(loyaltyHistory).values({
    userId,
    type: "redeemed",
    points: -points,
    description,
  });

  return true;
}

/**
 * Get loyalty history for user
 */
export async function getLoyaltyHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(loyaltyHistory)
    .where(eq(loyaltyHistory.userId, userId))
    .orderBy(desc(loyaltyHistory.createdAt))
    .limit(50);
}

/**
 * Get user's loyalty stats
 */
export async function getUserLoyaltyStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserById(userId);
  if (!user) return null;

  const history = await getLoyaltyHistory(userId);
  
  const totalEarned = history
    .filter((h) => h.type === "earned")
    .reduce((sum, h) => sum + h.points, 0);
  
  const totalRedeemed = history
    .filter((h) => h.type === "redeemed")
    .reduce((sum, h) => sum + Math.abs(h.points), 0);

  const currentLevel = user.vipLevel;
  const nextLevel = getNextVipLevel(currentLevel);
  const pointsToNextLevel = nextLevel 
    ? VIP_LEVELS[nextLevel].minPoints - user.loyaltyPoints
    : 0;

  return {
    currentPoints: user.loyaltyPoints,
    currentLevel,
    currentDiscount: getVipDiscount(currentLevel),
    nextLevel,
    pointsToNextLevel,
    totalEarned,
    totalRedeemed,
    history: history.slice(0, 10), // Last 10 transactions
  };
}

/**
 * Get next VIP level
 */
function getNextVipLevel(currentLevel: VipLevel): VipLevel | null {
  const levels: VipLevel[] = ["bronze", "prata", "ouro", "diamante"];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}


// ============= SAFETY & SECURITY OPERATIONS =============

/**
 * Generate a unique share token for ride tracking
 */
export function generateShareToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create emergency contact
 */
export async function createEmergencyContact(contact: InsertEmergencyContact) {
  const db = await getDb();
  if (!db) return null;

  // If this is marked as primary, unmark all other primary contacts for this user
  if (contact.isPrimary) {
    await db
      .update(emergencyContacts)
      .set({ isPrimary: false })
      .where(eq(emergencyContacts.userId, contact.userId));
  }

  return await db.insert(emergencyContacts).values(contact);
}

/**
 * Get all emergency contacts for a user
 */
export async function getEmergencyContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.userId, userId))
    .orderBy(desc(emergencyContacts.isPrimary), desc(emergencyContacts.createdAt));
}

/**
 * Delete emergency contact
 */
export async function deleteEmergencyContact(contactId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(emergencyContacts)
    .where(
      and(
        eq(emergencyContacts.id, contactId),
        eq(emergencyContacts.userId, userId)
      )
    );

  return true;
}

/**
 * Update emergency contact
 */
export async function updateEmergencyContact(
  contactId: number,
  userId: number,
  updates: Partial<InsertEmergencyContact>
) {
  const db = await getDb();
  if (!db) return false;

  // If marking as primary, unmark others first
  if (updates.isPrimary) {
    await db
      .update(emergencyContacts)
      .set({ isPrimary: false })
      .where(eq(emergencyContacts.userId, userId));
  }

  await db
    .update(emergencyContacts)
    .set(updates)
    .where(
      and(
        eq(emergencyContacts.id, contactId),
        eq(emergencyContacts.userId, userId)
      )
    );

  return true;
}

/**
 * Trigger SOS alert
 */
export async function triggerSOS(
  rideId: number,
  userId: number,
  location: string,
  lat: string,
  lng: string
) {
  const db = await getDb();
  if (!db) return null;

  // Mark ride as SOS activated
  await db
    .update(rides)
    .set({
      sosActivated: true,
      sosActivatedAt: new Date(),
    })
    .where(eq(rides.id, rideId));

  // Create SOS alert record
  const result = await db.insert(sosAlerts).values({
    rideId,
    userId,
    location,
    lat,
    lng,
    status: "active",
  });

  const alertId = Number(result[0]?.insertId || 0);

  // Get emergency contacts
  const contacts = await getEmergencyContacts(userId);

  // Send notifications to all emergency contacts (via SMS/WhatsApp in production)
  // For now, we'll just return the alert ID
  
  return { alertId, contacts };
}

/**
 * Get ride by share token (for public tracking)
 */
export async function getRideByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return null;

  const ride = await db
    .select()
    .from(rides)
    .where(eq(rides.shareToken, shareToken))
    .limit(1);

  return ride[0] || null;
}

/**
 * Get active SOS alerts (for admin dashboard)
 */
export async function getActiveSosAlerts() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sosAlerts)
    .where(eq(sosAlerts.status, "active"))
    .orderBy(desc(sosAlerts.createdAt));
}

/**
 * Resolve SOS alert
 */
export async function resolveSosAlert(
  alertId: number,
  resolvedBy: number,
  status: "resolved" | "false_alarm",
  notes?: string
) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(sosAlerts)
    .set({
      status,
      resolvedAt: new Date(),
      resolvedBy,
      notes,
    })
    .where(eq(sosAlerts.id, alertId));

  return true;
}


// ============= FAVORITE DRIVERS OPERATIONS =============

import { favoriteDrivers, InsertFavoriteDriver, referrals, InsertReferral, deliveryOrders, InsertDeliveryOrder } from "../drizzle/schema";
import { createInitialDeliveryPremiumMeta } from "@shared/deliveryPremium";

export async function addFavoriteDriver(data: InsertFavoriteDriver) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already favorited
  const existing = await db
    .select()
    .from(favoriteDrivers)
    .where(
      and(
        eq(favoriteDrivers.passengerId, data.passengerId),
        eq(favoriteDrivers.driverId, data.driverId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Driver already in favorites");
  }

  return await db.insert(favoriteDrivers).values(data);
}

export async function removeFavoriteDriver(passengerId: number, driverId: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(favoriteDrivers)
    .where(
      and(
        eq(favoriteDrivers.passengerId, passengerId),
        eq(favoriteDrivers.driverId, driverId)
      )
    );
  return true;
}

export async function getFavoriteDrivers(passengerId: number) {
  const db = await getDb();
  if (!db) return [];

  const favorites = await db
    .select()
    .from(favoriteDrivers)
    .where(eq(favoriteDrivers.passengerId, passengerId))
    .orderBy(desc(favoriteDrivers.lastRideAt));

  // Enrich with driver and user info
  const enriched = await Promise.all(
    favorites.map(async (fav) => {
      const driverProfile = await db
        .select()
        .from(driverProfiles)
        .where(eq(driverProfiles.id, fav.driverId))
        .limit(1);

      let user = null;
      let driverVehicles: any[] = [];
      if (driverProfile.length > 0) {
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, driverProfile[0].userId))
          .limit(1);
        user = userResult[0] || null;

        driverVehicles = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.driverId, fav.driverId));
      }

      return {
        ...fav,
        driver: driverProfile[0] || null,
        user,
        vehicles: driverVehicles,
      };
    })
  );

  return enriched;
}

export async function isFavoriteDriver(passengerId: number, driverId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(favoriteDrivers)
    .where(
      and(
        eq(favoriteDrivers.passengerId, passengerId),
        eq(favoriteDrivers.driverId, driverId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function updateFavoriteDriver(
  passengerId: number,
  driverId: number,
  updates: { nickname?: string; note?: string }
) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(favoriteDrivers)
    .set(updates)
    .where(
      and(
        eq(favoriteDrivers.passengerId, passengerId),
        eq(favoriteDrivers.driverId, driverId)
      )
    );
  return true;
}

export async function incrementFavoriteDriverRides(passengerId: number, driverId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(favoriteDrivers)
    .set({
      ridesCompleted: sql`${favoriteDrivers.ridesCompleted} + 1`,
      lastRideAt: new Date(),
    })
    .where(
      and(
        eq(favoriteDrivers.passengerId, passengerId),
        eq(favoriteDrivers.driverId, driverId)
      )
    );
}

// ============= REFERRAL PROGRAM OPERATIONS =============

export async function createReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has an active referral code
  const existing = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, "pending")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].referralCode;
  }

  // Generate unique code: FUI + first 6 chars of random
  const code = "FUI" + Math.random().toString(36).substring(2, 8).toUpperCase();

  await db.insert(referrals).values({
    referrerId: userId,
    referralCode: code,
    status: "pending",
  });

  return code;
}

export async function getReferralByCode(code: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referralCode, code.toUpperCase()))
    .limit(1);

  return result[0] || null;
}

export async function getReferralByReferredUser(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredId, userId))
    .limit(1);

  return result[0] || null;
}

export async function getUserReferrals(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const refs = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));

  // Enrich with referred user info
  const enriched = await Promise.all(
    refs.map(async (ref) => {
      let referredUser = null;
      if (ref.referredId) {
        referredUser = await getUserById(ref.referredId);
      }
      return { ...ref, referredUser };
    })
  );

  return enriched;
}

export async function getUserActiveReferralCode(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  // Get or create referral code for user
  const existing = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt))
    .limit(1);

  // Return most recent code regardless of status
  if (existing.length > 0) {
    return existing[0].referralCode;
  }

  return null;
}

export async function registerReferral(code: string, referredUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const referral = await getReferralByCode(code);
  if (!referral) return false;
  if (referral.status !== "pending") return false;
  if (referral.referrerId === referredUserId) return false; // Can't refer yourself

  await db
    .update(referrals)
    .set({
      referredId: referredUserId,
      status: "registered",
    })
    .where(eq(referrals.id, referral.id));

  return true;
}

export async function completeReferral(referredUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Find the referral where this user was referred
  const referral = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referredId, referredUserId),
        eq(referrals.status, "registered")
      )
    )
    .limit(1);

  if (referral.length === 0) return false;

  const ref = referral[0];

  // Mark as completed
  await db
    .update(referrals)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(referrals.id, ref.id));

  // Add loyalty points as reward to both users (500 cents = R$5 = 50 points)
  await addLoyaltyPoints(ref.referrerId, 50, `Indicação completada! Amigo fez a primeira corrida.`);
  await addLoyaltyPoints(referredUserId, 50, `Bônus de boas-vindas por indicação!`);

  return true;
}

export async function getReferralStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalReferred: 0, totalCompleted: 0, totalEarned: 0, pendingCode: null };

  const allReferrals = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const totalReferred = allReferrals.filter(r => r.status !== "pending").length;
  const totalCompleted = allReferrals.filter(r => r.status === "completed").length;
  const totalEarned = totalCompleted * 500; // R$ 5.00 per completed referral

  // Get active pending code
  const pendingCode = allReferrals.find(r => r.status === "pending")?.referralCode || null;

  return { totalReferred, totalCompleted, totalEarned, pendingCode };
}

// ============= DELIVERY ORDERS OPERATIONS =============

export async function createDeliveryOrder(order: InsertDeliveryOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate tracking code
  const trackingCode = "FUI" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).substring(2, 4).toUpperCase();

  const result = await db.insert(deliveryOrders).values({
    ...order,
    trackingCode,
    deliveryPremiumMeta: order.deliveryPremiumMeta ?? createInitialDeliveryPremiumMeta("requested"),
  });

  return { insertId: Number(result[0]?.insertId || 0), trackingCode };
}

export async function getDeliveryOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getDeliveryOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.senderId, userId))
    .orderBy(desc(deliveryOrders.createdAt));
}

export async function getDeliveryOrdersByDriver(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.driverId, driverId))
    .orderBy(desc(deliveryOrders.createdAt));
}

export async function getAllDeliveryOrders() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(deliveryOrders).orderBy(desc(deliveryOrders.createdAt));
}

export async function getActiveDeliveryOrders() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(deliveryOrders)
    .where(inArray(deliveryOrders.status, ["requested", "accepted", "picked_up", "in_transit"]))
    .orderBy(desc(deliveryOrders.createdAt));
}

export async function updateDeliveryOrder(id: number, updates: Partial<InsertDeliveryOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(deliveryOrders)
    .set(updates)
    .where(eq(deliveryOrders.id, id));
}

export async function getDeliveryOrderByTrackingCode(trackingCode: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.trackingCode, trackingCode))
    .limit(1);

  return result[0] || null;
}

// ============= DRIVER PREMIUM PREFERENCES =============

export async function getDriverPremiumPreferences(driverId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(driverPremiumPreferences)
    .where(eq(driverPremiumPreferences.driverId, driverId))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertDriverPremiumPreferences(
  driverId: number,
  prefs: DriverPremiumPreferences
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(driverPremiumPreferences)
    .values({
      driverId,
      dailyGoalCents: prefs.dailyGoalCents,
      smartPause: prefs.smartPause,
      serviceFilters: prefs.serviceFilters,
    })
    .onDuplicateKeyUpdate({
      set: {
        dailyGoalCents: prefs.dailyGoalCents,
        smartPause: prefs.smartPause,
        serviceFilters: prefs.serviceFilters,
      },
    });
}

// ============= PLATFORM FINANCE SETTINGS =============

export async function getPlatformFinanceConfig(): Promise<PlatformFinanceConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(platformFinanceSettings)
    .where(eq(platformFinanceSettings.configKey, "default"))
    .limit(1);
  return result[0]?.configJson ?? null;
}

export async function upsertPlatformFinanceConfig(config: PlatformFinanceConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(platformFinanceSettings)
    .values({ configKey: "default", configJson: config })
    .onDuplicateKeyUpdate({ set: { configJson: config } });
}

// ============= FINANCIAL LEDGER =============

function rowToLedgerEntry(row: typeof financialLedger.$inferSelect): FinancialLedgerEntry {
  return {
    id: row.id,
    driverId: row.driverId,
    entityType: row.entityType,
    entityId: row.entityId,
    serviceKey: row.serviceKey,
    grossCents: row.grossCents,
    commissionCents: row.commissionCents,
    driverNetCents: row.driverNetCents,
    couponCode: row.couponCode,
    couponDiscountCents: row.couponDiscountCents,
    completedAt: row.completedAt.toISOString(),
  };
}

export async function insertFinancialLedgerEntry(
  input: Omit<FinancialLedgerEntry, "id">
): Promise<FinancialLedgerEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(financialLedger)
    .where(
      and(
        eq(financialLedger.entityType, input.entityType),
        eq(financialLedger.entityId, input.entityId)
      )
    )
    .limit(1);

  if (existing[0]) {
    return rowToLedgerEntry(existing[0]);
  }

  const result = await db.insert(financialLedger).values({
    driverId: input.driverId,
    entityType: input.entityType,
    entityId: input.entityId,
    serviceKey: input.serviceKey,
    grossCents: input.grossCents,
    commissionCents: input.commissionCents,
    driverNetCents: input.driverNetCents,
    couponCode: input.couponCode ?? null,
    couponDiscountCents: input.couponDiscountCents,
    completedAt: new Date(input.completedAt),
  });

  const insertId = Number(result[0].insertId);
  const rows = await db
    .select()
    .from(financialLedger)
    .where(eq(financialLedger.id, insertId))
    .limit(1);
  return rowToLedgerEntry(rows[0]!);
}

export async function getFinancialLedgerByDriver(
  driverId: number
): Promise<FinancialLedgerEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(financialLedger)
    .where(eq(financialLedger.driverId, driverId))
    .orderBy(desc(financialLedger.completedAt));
  return rows.map(rowToLedgerEntry);
}

export async function getAllFinancialLedgerEntries(): Promise<FinancialLedgerEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select().from(financialLedger).orderBy(desc(financialLedger.completedAt));
  return rows.map(rowToLedgerEntry);
}

// ============= DRIVER APPLICATION OPERATIONS =============

async function driverApplicationsTable() {
  return driverApplications;
}

export async function getDriverApplicationByUserId(userId: number): Promise<DriverApplicationRow | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const table = await driverApplicationsTable();
    const rows = await db.select().from(table).where(eq(table.userId, userId)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getDriverApplicationById(id: number): Promise<DriverApplicationRow | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const table = await driverApplicationsTable();
    const rows = await db.select().from(table).where(eq(table.id, id)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function listDriverApplications(): Promise<DriverApplicationRow[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const table = await driverApplicationsTable();
    return await db
      .select()
      .from(table)
      .where(ne(table.status, "rascunho"))
      .orderBy(desc(table.updatedAt));
  } catch {
    return [];
  }
}

export async function upsertDriverApplicationDraft(userId: number, app: DriverApplication): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const table = await driverApplicationsTable();
    const existing = await getDriverApplicationByUserId(userId);
    const payload = {
      status: "rascunho" as const,
      personalData: app.personal ?? null,
      cnhData: app.cnh ?? null,
      vehicleData: app.vehicle ?? null,
      securityData: app.security ?? null,
      termsData: app.terms ?? null,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(table).set(payload).where(eq(table.userId, userId));
    } else {
      await db.insert(table).values({ userId, ...payload });
    }
  } catch {
    /* tabela pode não existir ainda — store em memória */
  }
}

export async function submitDriverApplicationRow(userId: number, app: DriverApplication): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const table = await driverApplicationsTable();
    const existing = await getDriverApplicationByUserId(userId);
    const payload = {
      status: "enviado" as const,
      personalData: app.personal ?? null,
      cnhData: app.cnh ?? null,
      vehicleData: app.vehicle ?? null,
      securityData: app.security ?? null,
      termsData: app.terms ?? null,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(table).set(payload).where(eq(table.userId, userId));
    } else {
      await db.insert(table).values({ userId, ...payload });
    }
  } catch {
    /* fallback memória */
  }
}

export async function updateDriverApplicationStatus(
  applicationId: number,
  app: DriverApplication
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const table = await driverApplicationsTable();
    await db
      .update(table)
      .set({
        status: app.status,
        reviewNotes: app.reviewNotes ?? null,
        reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : null,
        reviewedBy: app.reviewedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(table.id, applicationId));
  } catch {
    /* fallback memória */
  }
}
