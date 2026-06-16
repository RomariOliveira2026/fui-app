var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      /** Server-side Google Maps REST (prefer GOOGLE_MAPS_API_KEY; VITE_ for local dev parity). */
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
      // White-label configuration
      appName: process.env.VITE_APP_TITLE ?? "Fui!",
      appCity: process.env.VITE_APP_CITY ?? "Itabaiana",
      platformFeePercent: Number(process.env.VITE_PLATFORM_FEE_PERCENT ?? "15"),
      supportWhatsApp: process.env.VITE_SUPPORT_WHATSAPP ?? "",
      /** Beta demo na Vercel: passageiro demo quando não há sessão OAuth. */
      betaDemo: process.env.BETA_DEMO === "true"
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  couponUsage: () => couponUsage,
  coupons: () => coupons,
  deliveryOrders: () => deliveryOrders,
  driverLocations: () => driverLocations,
  driverPremiumPreferences: () => driverPremiumPreferences,
  driverProfiles: () => driverProfiles,
  emergencyContacts: () => emergencyContacts,
  favoriteDrivers: () => favoriteDrivers,
  fcmTokens: () => fcmTokens,
  financialLedger: () => financialLedger,
  loyaltyHistory: () => loyaltyHistory,
  notifications: () => notifications,
  platformFinanceSettings: () => platformFinanceSettings,
  pricingConfig: () => pricingConfig,
  ratings: () => ratings,
  referrals: () => referrals,
  rideOffers: () => rideOffers,
  ridePassengers: () => ridePassengers,
  rides: () => rides,
  savedAddresses: () => savedAddresses,
  sosAlerts: () => sosAlerts,
  users: () => users,
  vehicles: () => vehicles
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
var users, driverProfiles, vehicles, rides, ratings, coupons, couponUsage, chatMessages, pricingConfig, driverLocations, rideOffers, savedAddresses, fcmTokens, ridePassengers, loyaltyHistory, emergencyContacts, sosAlerts, notifications, favoriteDrivers, referrals, deliveryOrders, driverPremiumPreferences, platformFinanceSettings, financialLedger;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      phone: varchar("phone", { length: 20 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin", "driver", "passenger"]).default("passenger").notNull(),
      avatarUrl: text("avatarUrl"),
      // Loyalty program
      loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
      vipLevel: mysqlEnum("vipLevel", ["bronze", "prata", "ouro", "diamante"]).default("bronze").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    driverProfiles = mysqlTable("driver_profiles", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      cpf: varchar("cpf", { length: 14 }),
      cnh: varchar("cnh", { length: 20 }),
      cnhImageUrl: text("cnhImageUrl"),
      // URL da foto da CNH
      status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
      rating: int("rating").default(0),
      // Stored as integer (e.g., 450 = 4.50 stars)
      totalRides: int("totalRides").default(0),
      isAvailable: boolean("isAvailable").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    vehicles = mysqlTable("vehicles", {
      id: int("id").autoincrement().primaryKey(),
      driverId: int("driverId").notNull(),
      type: mysqlEnum("type", ["moto", "carro", "van", "utilitario"]).notNull(),
      brand: varchar("brand", { length: 100 }),
      model: varchar("model", { length: 100 }),
      year: int("year"),
      plate: varchar("plate", { length: 10 }).notNull(),
      color: varchar("color", { length: 50 }),
      photoUrl: text("photoUrl"),
      status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    rides = mysqlTable("rides", {
      id: int("id").autoincrement().primaryKey(),
      passengerId: int("passengerId").notNull(),
      driverId: int("driverId"),
      vehicleId: int("vehicleId"),
      status: mysqlEnum("status", ["requested", "accepted", "in_progress", "completed", "cancelled"]).default("requested").notNull(),
      vehicleType: mysqlEnum("vehicleType", ["moto", "carro", "van", "utilitario"]).notNull(),
      // Location data
      originAddress: text("originAddress").notNull(),
      originLat: varchar("originLat", { length: 20 }).notNull(),
      originLng: varchar("originLng", { length: 20 }).notNull(),
      destinationAddress: text("destinationAddress").notNull(),
      destinationLat: varchar("destinationLat", { length: 20 }).notNull(),
      destinationLng: varchar("destinationLng", { length: 20 }).notNull(),
      // Driver current location (for tracking)
      driverCurrentLat: varchar("driverCurrentLat", { length: 20 }),
      driverCurrentLng: varchar("driverCurrentLng", { length: 20 }),
      // Ride details
      distance: int("distance"),
      // in meters
      duration: int("duration"),
      // in seconds
      estimatedPrice: int("estimatedPrice"),
      // in cents
      finalPrice: int("finalPrice"),
      // in cents
      paymentMethod: mysqlEnum("paymentMethod", ["pix", "card", "cash"]).notNull(),
      paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
      stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
      // Coupon
      couponId: int("couponId"),
      couponCode: varchar("couponCode", { length: 50 }),
      discountAmount: int("discountAmount").default(0).notNull(),
      // Carpool/Shared ride fields
      isShared: boolean("isShared").default(false).notNull(),
      maxPassengers: int("maxPassengers").default(1).notNull(),
      // Total seats available
      currentPassengers: int("currentPassengers").default(1).notNull(),
      // Current number of passengers
      pricePerPassenger: int("pricePerPassenger"),
      // Price divided by passengers (in cents)
      // Freight-specific fields
      isFreight: boolean("isFreight").default(false).notNull(),
      cargoWeight: int("cargoWeight"),
      // in kg
      cargoType: varchar("cargoType", { length: 100 }),
      // mudança, entrega, materiais, etc
      cargoDescription: text("cargoDescription"),
      needsHelpers: boolean("needsHelpers").default(false),
      numberOfHelpers: int("numberOfHelpers").default(0),
      // Safety & Security fields
      shareToken: varchar("shareToken", { length: 64 }),
      // Token for public live tracking
      sosActivated: boolean("sosActivated").default(false).notNull(),
      sosActivatedAt: timestamp("sosActivatedAt"),
      // Timestamps
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      completedAt: timestamp("completedAt"),
      cancelledAt: timestamp("cancelledAt"),
      scheduledFor: timestamp("scheduledFor"),
      // For scheduled rides
      isScheduled: mysqlEnum("isScheduled", ["yes", "no"]).default("no").notNull(),
      // Cancellation
      cancelledBy: int("cancelledBy"),
      // userId who cancelled
      cancellationReason: text("cancellationReason"),
      /** Premium passageiro: terceiro, paradas, recorrência (JSON opcional). */
      passengerPremiumMeta: json("passengerPremiumMeta").$type()
    });
    ratings = mysqlTable("ratings", {
      id: int("id").autoincrement().primaryKey(),
      rideId: int("rideId").notNull(),
      fromUserId: int("fromUserId").notNull(),
      toUserId: int("toUserId").notNull(),
      rating: int("rating").notNull(),
      // 1-5 stars
      comment: text("comment"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    coupons = mysqlTable("coupons", {
      id: int("id").autoincrement().primaryKey(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      description: text("description"),
      discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
      discountValue: int("discountValue").notNull(),
      // percentage (0-100) or fixed amount in cents
      // Usage limits
      maxUses: int("maxUses"),
      // null = unlimited
      usedCount: int("usedCount").default(0).notNull(),
      maxUsesPerUser: int("maxUsesPerUser").default(1).notNull(),
      // Validity
      validFrom: timestamp("validFrom").notNull(),
      validUntil: timestamp("validUntil").notNull(),
      // Restrictions
      minRideValue: int("minRideValue"),
      // minimum ride value in cents to apply coupon
      vehicleTypes: text("vehicleTypes"),
      // JSON array of allowed vehicle types
      isActive: int("isActive").default(1).notNull(),
      // 1 = active, 0 = inactive
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    couponUsage = mysqlTable("coupon_usage", {
      id: int("id").autoincrement().primaryKey(),
      couponId: int("couponId").notNull(),
      userId: int("userId").notNull(),
      rideId: int("rideId").notNull(),
      discountAmount: int("discountAmount").notNull(),
      // actual discount applied in cents
      usedAt: timestamp("usedAt").defaultNow().notNull()
    });
    chatMessages = mysqlTable("chat_messages", {
      id: int("id").autoincrement().primaryKey(),
      rideId: int("rideId").notNull(),
      senderId: int("senderId").notNull(),
      message: text("message"),
      audioUrl: text("audioUrl"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    pricingConfig = mysqlTable("pricing_config", {
      id: int("id").autoincrement().primaryKey(),
      vehicleType: mysqlEnum("vehicleType", ["moto", "carro", "van", "utilitario"]).notNull().unique(),
      basePrice: int("basePrice").notNull(),
      // in cents
      pricePerKm: int("pricePerKm").notNull(),
      // in cents
      pricePerMinute: int("pricePerMinute").notNull(),
      // in cents
      minimumPrice: int("minimumPrice").notNull(),
      // in cents
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    driverLocations = mysqlTable("driver_locations", {
      id: int("id").autoincrement().primaryKey(),
      driverId: int("driverId").notNull().unique(),
      lat: varchar("lat", { length: 20 }).notNull(),
      lng: varchar("lng", { length: 20 }).notNull(),
      heading: int("heading"),
      // direction in degrees
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    rideOffers = mysqlTable("ride_offers", {
      id: int("id").autoincrement().primaryKey(),
      rideId: int("rideId").notNull(),
      driverId: int("driverId").notNull(),
      status: mysqlEnum("status", [
        "pending",
        "accepted",
        "declined",
        "expired",
        "superseded"
      ]).default("pending").notNull(),
      distanceMeters: int("distanceMeters").notNull(),
      /** Round de oferta — base para oferta sequencial futura. */
      offerRound: int("offerRound").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    savedAddresses = mysqlTable("saved_addresses", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      label: mysqlEnum("label", ["home", "work", "other"]).notNull(),
      customLabel: varchar("customLabel", { length: 50 }),
      // For "other" type
      address: text("address").notNull(),
      lat: varchar("lat", { length: 20 }).notNull(),
      lng: varchar("lng", { length: 20 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    fcmTokens = mysqlTable("fcm_tokens", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      token: text("token").notNull(),
      deviceInfo: text("deviceInfo"),
      // Browser/device information
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    ridePassengers = mysqlTable("ride_passengers", {
      id: int("id").autoincrement().primaryKey(),
      rideId: int("rideId").notNull(),
      passengerId: int("passengerId").notNull(),
      status: mysqlEnum("status", ["pending", "accepted", "declined", "cancelled"]).default("pending").notNull(),
      // Individual passenger pickup/dropoff (for multiple stops)
      pickupAddress: text("pickupAddress").notNull(),
      pickupLat: varchar("pickupLat", { length: 20 }).notNull(),
      pickupLng: varchar("pickupLng", { length: 20 }).notNull(),
      dropoffAddress: text("dropoffAddress").notNull(),
      dropoffLat: varchar("dropoffLat", { length: 20 }).notNull(),
      dropoffLng: varchar("dropoffLng", { length: 20 }).notNull(),
      // Pricing
      individualPrice: int("individualPrice").notNull(),
      // Price this passenger pays (in cents)
      // Pickup order
      pickupOrder: int("pickupOrder").default(1).notNull(),
      // Order in which passenger is picked up
      dropoffOrder: int("dropoffOrder").default(1).notNull(),
      // Order in which passenger is dropped off
      // Timestamps
      joinedAt: timestamp("joinedAt").defaultNow().notNull(),
      pickedUpAt: timestamp("pickedUpAt"),
      droppedOffAt: timestamp("droppedOffAt")
    });
    loyaltyHistory = mysqlTable("loyalty_history", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: mysqlEnum("type", ["earned", "redeemed", "expired"]).notNull(),
      points: int("points").notNull(),
      // Positive for earned, negative for redeemed
      description: text("description").notNull(),
      rideId: int("rideId"),
      // Optional: link to ride if points earned from ride
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    emergencyContacts = mysqlTable("emergency_contacts", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 20 }).notNull(),
      relationship: varchar("relationship", { length: 100 }),
      // mãe, pai, cônjuge, amigo, etc
      isPrimary: boolean("isPrimary").default(false).notNull(),
      // Primary contact gets notified first
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    sosAlerts = mysqlTable("sos_alerts", {
      id: int("id").autoincrement().primaryKey(),
      rideId: int("rideId").notNull(),
      userId: int("userId").notNull(),
      // Who triggered the SOS
      location: text("location"),
      // Address or coordinates at time of alert
      lat: varchar("lat", { length: 20 }),
      lng: varchar("lng", { length: 20 }),
      status: mysqlEnum("status", ["active", "resolved", "false_alarm"]).default("active").notNull(),
      notes: text("notes"),
      // Admin notes or resolution details
      resolvedAt: timestamp("resolvedAt"),
      resolvedBy: int("resolvedBy"),
      // Admin user ID who resolved
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    notifications = mysqlTable("notifications", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: mysqlEnum("type", ["ride", "payment", "promotion", "system", "driver", "safety"]).notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      message: text("message").notNull(),
      actionUrl: text("actionUrl"),
      // Optional: URL to navigate when clicked
      actionLabel: varchar("actionLabel", { length: 100 }),
      // Optional: Button label (e.g., "Ver Corrida")
      isRead: boolean("isRead").default(false).notNull(),
      metadata: json("metadata"),
      // Additional data (rideId, amount, etc.)
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    favoriteDrivers = mysqlTable("favorite_drivers", {
      id: int("id").autoincrement().primaryKey(),
      passengerId: int("passengerId").notNull(),
      driverId: int("driverId").notNull(),
      // driver_profiles.id
      nickname: varchar("nickname", { length: 100 }),
      // Optional custom name
      note: text("note"),
      // Optional note about the driver
      ridesCompleted: int("ridesCompleted").default(0).notNull(),
      // How many rides with this driver
      lastRideAt: timestamp("lastRideAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    referrals = mysqlTable("referrals", {
      id: int("id").autoincrement().primaryKey(),
      referrerId: int("referrerId").notNull(),
      // User who invited
      referredId: int("referredId"),
      // User who signed up (null until they register)
      referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
      status: mysqlEnum("status", ["pending", "registered", "completed", "expired"]).default("pending").notNull(),
      // "pending" = code created, no one used yet
      // "registered" = referred user signed up
      // "completed" = referred user completed first ride, both get reward
      // "expired" = code expired
      referrerRewardCents: int("referrerRewardCents").default(500).notNull(),
      // R$ 5.00 default
      referredRewardCents: int("referredRewardCents").default(500).notNull(),
      // R$ 5.00 default
      referrerPaid: boolean("referrerPaid").default(false).notNull(),
      referredPaid: boolean("referredPaid").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      completedAt: timestamp("completedAt")
    });
    deliveryOrders = mysqlTable("delivery_orders", {
      id: int("id").autoincrement().primaryKey(),
      senderId: int("senderId").notNull(),
      // User who sends the package
      driverId: int("driverId"),
      // Assigned driver
      status: mysqlEnum("status", ["requested", "accepted", "picked_up", "in_transit", "delivered", "cancelled"]).default("requested").notNull(),
      // Pickup location
      pickupAddress: text("pickupAddress").notNull(),
      pickupLat: varchar("pickupLat", { length: 20 }).notNull(),
      pickupLng: varchar("pickupLng", { length: 20 }).notNull(),
      pickupContactName: varchar("pickupContactName", { length: 255 }),
      pickupContactPhone: varchar("pickupContactPhone", { length: 20 }),
      // Delivery location
      deliveryAddress: text("deliveryAddress").notNull(),
      deliveryLat: varchar("deliveryLat", { length: 20 }).notNull(),
      deliveryLng: varchar("deliveryLng", { length: 20 }).notNull(),
      recipientName: varchar("recipientName", { length: 255 }).notNull(),
      recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(),
      // Package details
      packageType: mysqlEnum("packageType", ["documento", "pacote_pequeno", "pacote_medio", "pacote_grande", "alimento", "outro"]).notNull(),
      packageDescription: text("packageDescription"),
      estimatedWeight: int("estimatedWeight"),
      // in grams
      isFragile: boolean("isFragile").default(false).notNull(),
      requiresSignature: boolean("requiresSignature").default(false).notNull(),
      // Pricing
      distance: int("distance"),
      // in meters
      duration: int("duration"),
      // in seconds
      estimatedPrice: int("estimatedPrice"),
      // in cents
      finalPrice: int("finalPrice"),
      // in cents
      paymentMethod: mysqlEnum("paymentMethod", ["pix", "card", "cash"]).notNull(),
      paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
      // Tracking
      trackingCode: varchar("trackingCode", { length: 20 }),
      proofOfDeliveryUrl: text("proofOfDeliveryUrl"),
      // Photo of delivered package
      /** Premium entregas: código confirmação, histórico, assinatura (JSON opcional). */
      deliveryPremiumMeta: json("deliveryPremiumMeta").$type(),
      // Timestamps
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      pickedUpAt: timestamp("pickedUpAt"),
      deliveredAt: timestamp("deliveredAt"),
      cancelledAt: timestamp("cancelledAt")
    });
    driverPremiumPreferences = mysqlTable("driver_premium_preferences", {
      id: int("id").autoincrement().primaryKey(),
      driverId: int("driverId").notNull().unique(),
      dailyGoalCents: int("dailyGoalCents").default(15e3).notNull(),
      smartPause: boolean("smartPause").default(false).notNull(),
      serviceFilters: json("serviceFilters").$type().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    platformFinanceSettings = mysqlTable("platform_finance_settings", {
      id: int("id").autoincrement().primaryKey(),
      configKey: varchar("configKey", { length: 64 }).notNull().unique(),
      configJson: json("configJson").$type().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    financialLedger = mysqlTable("financial_ledger", {
      id: int("id").autoincrement().primaryKey(),
      driverId: int("driverId").notNull(),
      entityType: mysqlEnum("entityType", ["ride", "delivery"]).notNull(),
      entityId: int("entityId").notNull(),
      serviceKey: varchar("serviceKey", { length: 32 }).notNull(),
      grossCents: int("grossCents").notNull(),
      commissionCents: int("commissionCents").notNull(),
      driverNetCents: int("driverNetCents").notNull(),
      couponCode: varchar("couponCode", { length: 50 }),
      couponDiscountCents: int("couponDiscountCents").default(0).notNull(),
      completedAt: timestamp("completedAt").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// shared/rideDispatcher.ts
function getDispatcherOfferTimeoutMs() {
  const env = Number(process.env.DISPATCHER_OFFER_TIMEOUT_MS);
  return Number.isFinite(env) && env > 0 ? env : DISPATCHER_OFFER_TIMEOUT_MS_DEFAULT;
}
function selectDriversForRound(eligible, offerRound, previouslyOfferedDriverIds) {
  const fresh = eligible.filter((d) => !previouslyOfferedDriverIds.has(d.driverId));
  const expandedPool = offerRound >= DISPATCHER_MAX_ROUNDS;
  if (expandedPool) {
    return {
      drivers: eligible.slice(0, DISPATCHER_TOP_N_OFFERS),
      offerRound,
      expandedPool: true
    };
  }
  return {
    drivers: fresh.slice(0, DISPATCHER_TOP_N_OFFERS),
    offerRound,
    expandedPool: false
  };
}
function isRideReadyForDispatch(ride) {
  if (ride.isScheduled !== "yes" || !ride.scheduledFor) {
    return true;
  }
  const scheduled = new Date(ride.scheduledFor);
  if (Number.isNaN(scheduled.getTime())) {
    return true;
  }
  return Date.now() >= scheduled.getTime() - DISPATCHER_SCHEDULED_DISPATCH_WINDOW_MS;
}
var DISPATCHER_TOP_N_OFFERS, DISPATCHER_MAX_ROUNDS, DISPATCHER_OFFER_TIMEOUT_MS_DEFAULT, DISPATCHER_SCHEDULED_DISPATCH_WINDOW_MS;
var init_rideDispatcher = __esm({
  "shared/rideDispatcher.ts"() {
    "use strict";
    DISPATCHER_TOP_N_OFFERS = 3;
    DISPATCHER_MAX_ROUNDS = 3;
    DISPATCHER_OFFER_TIMEOUT_MS_DEFAULT = 45e3;
    DISPATCHER_SCHEDULED_DISPATCH_WINDOW_MS = 30 * 60 * 1e3;
  }
});

// shared/deliveryPremium.ts
function generateDeliveryConfirmationCode() {
  return String(Math.floor(1e5 + Math.random() * 9e5));
}
function createInitialDeliveryPremiumMeta(status = "requested") {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    confirmationCode: generateDeliveryConfirmationCode(),
    statusHistory: [
      {
        status,
        label: DELIVERY_STATUS_LABELS[status],
        at: now
      }
    ]
  };
}
function appendDeliveryStatusEvent(meta, status) {
  const base = meta ?? createInitialDeliveryPremiumMeta("requested");
  const at = (/* @__PURE__ */ new Date()).toISOString();
  const last = base.statusHistory[base.statusHistory.length - 1];
  if (last?.status === status) {
    return base;
  }
  return {
    ...base,
    statusHistory: [
      ...base.statusHistory,
      { status, label: DELIVERY_STATUS_LABELS[status], at }
    ]
  };
}
function getDemoProofPlaceholder(orderId) {
  return `${DEMO_PROOF_PLACEHOLDER}&id=${orderId}`;
}
function getNextDemoDeliveryStatus(current) {
  const idx = DEMO_DELIVERY_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= DEMO_DELIVERY_STATUS_FLOW.length - 1) return null;
  return DEMO_DELIVERY_STATUS_FLOW[idx + 1] ?? null;
}
var DELIVERY_STATUS_LABELS, DEMO_PROOF_PLACEHOLDER, DEMO_DELIVERY_STATUS_FLOW;
var init_deliveryPremium = __esm({
  "shared/deliveryPremium.ts"() {
    "use strict";
    DELIVERY_STATUS_LABELS = {
      requested: "Solicitado",
      accepted: "Aceito",
      picked_up: "Em coleta",
      in_transit: "Em rota",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };
    DEMO_PROOF_PLACEHOLDER = "https://placehold.co/400x300/1a1a1a/F39200?text=Prova+de+Entrega+Fui";
    DEMO_DELIVERY_STATUS_FLOW = [
      "requested",
      "accepted",
      "picked_up",
      "in_transit"
    ];
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  VIP_LEVELS: () => VIP_LEVELS,
  addFavoriteDriver: () => addFavoriteDriver,
  addLoyaltyPoints: () => addLoyaltyPoints,
  calculateVipLevel: () => calculateVipLevel,
  cancelRide: () => cancelRide,
  completeReferral: () => completeReferral,
  countPendingRideOffers: () => countPendingRideOffers,
  createChatMessage: () => createChatMessage,
  createCoupon: () => createCoupon,
  createDeliveryOrder: () => createDeliveryOrder,
  createDriverProfile: () => createDriverProfile,
  createEmergencyContact: () => createEmergencyContact,
  createRating: () => createRating,
  createReferralCode: () => createReferralCode,
  createRide: () => createRide,
  createRideOffers: () => createRideOffers,
  createRidePassenger: () => createRidePassenger,
  createSavedAddress: () => createSavedAddress,
  createVehicle: () => createVehicle,
  declineRideOffer: () => declineRideOffer,
  deleteEmergencyContact: () => deleteEmergencyContact,
  deleteFcmToken: () => deleteFcmToken,
  deleteSavedAddress: () => deleteSavedAddress,
  driverHasPendingRideOffer: () => driverHasPendingRideOffer,
  expirePendingRideOffersForRide: () => expirePendingRideOffersForRide,
  expireStalePendingRideOffers: () => expireStalePendingRideOffers,
  findMatchingSharedRides: () => findMatchingSharedRides,
  generateShareToken: () => generateShareToken,
  getActiveCoupons: () => getActiveCoupons,
  getActiveDeliveryOrders: () => getActiveDeliveryOrders,
  getActiveRides: () => getActiveRides,
  getActiveSosAlerts: () => getActiveSosAlerts,
  getAllCoupons: () => getAllCoupons,
  getAllDeliveryOrders: () => getAllDeliveryOrders,
  getAllFinancialLedgerEntries: () => getAllFinancialLedgerEntries,
  getAllPricing: () => getAllPricing,
  getAllRides: () => getAllRides,
  getApprovedDriverProfiles: () => getApprovedDriverProfiles,
  getAvailableDrivers: () => getAvailableDrivers,
  getChatMessagesByRide: () => getChatMessagesByRide,
  getCouponByCode: () => getCouponByCode,
  getCouponUsageByUser: () => getCouponUsageByUser,
  getDb: () => getDb,
  getDeliveryOrderById: () => getDeliveryOrderById,
  getDeliveryOrderByTrackingCode: () => getDeliveryOrderByTrackingCode,
  getDeliveryOrdersByDriver: () => getDeliveryOrdersByDriver,
  getDeliveryOrdersByUser: () => getDeliveryOrdersByUser,
  getDriverLocation: () => getDriverLocation,
  getDriverPremiumPreferences: () => getDriverPremiumPreferences,
  getDriverProfileById: () => getDriverProfileById,
  getDriverProfileByUserId: () => getDriverProfileByUserId,
  getDriverRides: () => getDriverRides,
  getDriversBlockedFromReOffer: () => getDriversBlockedFromReOffer,
  getEmergencyContacts: () => getEmergencyContacts,
  getFavoriteDrivers: () => getFavoriteDrivers,
  getFinancialLedgerByDriver: () => getFinancialLedgerByDriver,
  getLoyaltyHistory: () => getLoyaltyHistory,
  getMaxOfferRoundForRide: () => getMaxOfferRoundForRide,
  getNearbyDrivers: () => getNearbyDrivers,
  getNextOfferRoundForRide: () => getNextOfferRoundForRide,
  getPassengerRides: () => getPassengerRides,
  getPassengerSharedRides: () => getPassengerSharedRides,
  getPendingDriverProfiles: () => getPendingDriverProfiles,
  getPlatformFinanceConfig: () => getPlatformFinanceConfig,
  getPreviouslyOfferedDriverIdsForRide: () => getPreviouslyOfferedDriverIdsForRide,
  getPricingByVehicleType: () => getPricingByVehicleType,
  getRatingByRideId: () => getRatingByRideId,
  getRatingsByUserId: () => getRatingsByUserId,
  getRecentRides: () => getRecentRides,
  getReferralByCode: () => getReferralByCode,
  getReferralByReferredUser: () => getReferralByReferredUser,
  getReferralStats: () => getReferralStats,
  getRequestedRideIdsWithoutDriver: () => getRequestedRideIdsWithoutDriver,
  getRequestedRides: () => getRequestedRides,
  getRequestedRidesWithPendingOfferForDriver: () => getRequestedRidesWithPendingOfferForDriver,
  getRideById: () => getRideById,
  getRideByShareToken: () => getRideByShareToken,
  getRidePassengers: () => getRidePassengers,
  getSavedAddressByLabel: () => getSavedAddressByLabel,
  getSavedAddressesByUser: () => getSavedAddressesByUser,
  getScheduledRidesByUser: () => getScheduledRidesByUser,
  getUserActiveReferralCode: () => getUserActiveReferralCode,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserFcmTokens: () => getUserFcmTokens,
  getUserLoyaltyStats: () => getUserLoyaltyStats,
  getUserReferrals: () => getUserReferrals,
  getUserStats: () => getUserStats,
  getVehicleById: () => getVehicleById,
  getVehiclesByDriverId: () => getVehiclesByDriverId,
  getVipDiscount: () => getVipDiscount,
  incrementFavoriteDriverRides: () => incrementFavoriteDriverRides,
  insertFinancialLedgerEntry: () => insertFinancialLedgerEntry,
  isFavoriteDriver: () => isFavoriteDriver,
  recordCouponUsage: () => recordCouponUsage,
  redeemLoyaltyPoints: () => redeemLoyaltyPoints,
  registerReferral: () => registerReferral,
  removeFavoriteDriver: () => removeFavoriteDriver,
  resolveRideOffersOnAccept: () => resolveRideOffersOnAccept,
  resolveSosAlert: () => resolveSosAlert,
  saveFcmToken: () => saveFcmToken,
  triggerSOS: () => triggerSOS,
  updateCoupon: () => updateCoupon,
  updateDeliveryOrder: () => updateDeliveryOrder,
  updateDriverAvailability: () => updateDriverAvailability,
  updateDriverLocation: () => updateDriverLocation,
  updateDriverProfile: () => updateDriverProfile,
  updateEmergencyContact: () => updateEmergencyContact,
  updateFavoriteDriver: () => updateFavoriteDriver,
  updateRide: () => updateRide,
  updateRidePassengerStatus: () => updateRidePassengerStatus,
  updateRidePaymentStatus: () => updateRidePaymentStatus,
  updateSavedAddress: () => updateSavedAddress,
  updateUserProfile: () => updateUserProfile,
  updateUserRole: () => updateUserRole,
  updateVehicle: () => updateVehicle,
  upsertDriverPremiumPreferences: () => upsertDriverPremiumPreferences,
  upsertPlatformFinanceConfig: () => upsertPlatformFinanceConfig,
  upsertPricing: () => upsertPricing,
  upsertUser: () => upsertUser,
  validateCoupon: () => validateCoupon
});
import { eq, and, desc, sql, inArray, lt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "phone", "avatarUrl"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return true;
}
async function updateUserProfile(userId, updates) {
  const db = await getDb();
  if (!db) return false;
  const updateData = {};
  if (updates.name !== void 0) updateData.name = updates.name;
  if (updates.phone !== void 0) updateData.phone = updates.phone;
  if (updates.avatarUrl !== void 0) updateData.avatarUrl = updates.avatarUrl;
  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }
  return true;
}
async function getRecentRides(userId, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides).where(and(eq(rides.passengerId, userId), eq(rides.status, "completed"))).orderBy(desc(rides.createdAt)).limit(limit);
}
async function getUserStats(userId) {
  const db = await getDb();
  if (!db) return { totalRides: 0, totalSpent: 0, totalSaved: 0, memberSince: null };
  const allRides = await db.select().from(rides).where(and(eq(rides.passengerId, userId), eq(rides.status, "completed")));
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
    memberSince: user?.createdAt || null
  };
}
async function createDriverProfile(profile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(driverProfiles).values(profile);
  return result;
}
async function getDriverProfileByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateDriverProfile(driverId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(driverProfiles).set(updates).where(eq(driverProfiles.id, driverId));
}
async function updateDriverAvailability(driverId, isAvailable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(driverProfiles).set({ isAvailable }).where(eq(driverProfiles.id, driverId));
}
async function getAvailableDrivers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(driverProfiles).where(
    and(
      eq(driverProfiles.isAvailable, true),
      eq(driverProfiles.status, "approved")
    )
  );
}
async function createVehicle(vehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicles).values(vehicle);
  return result;
}
async function getVehiclesByDriverId(driverId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
}
async function getVehicleById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateVehicle(vehicleId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(updates).where(eq(vehicles.id, vehicleId));
}
async function createRide(ride) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rides).values(ride);
  return result;
}
async function getRideById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateRide(rideId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rides).set(updates).where(eq(rides.id, rideId));
}
async function getPassengerRides(passengerId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides).where(eq(rides.passengerId, passengerId)).orderBy(desc(rides.createdAt));
}
async function getDriverRides(driverId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides).where(eq(rides.driverId, driverId)).orderBy(desc(rides.createdAt));
}
async function getActiveRides() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides).where(inArray(rides.status, ["requested", "accepted", "in_progress"])).orderBy(desc(rides.createdAt));
}
async function getRequestedRides() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides).where(eq(rides.status, "requested")).orderBy(desc(rides.createdAt));
}
async function createRideOffers(offers) {
  const db = await getDb();
  if (!db || offers.length === 0) return;
  await db.insert(rideOffers).values(
    offers.map((o) => ({
      rideId: o.rideId,
      driverId: o.driverId,
      distanceMeters: o.distanceMeters,
      offerRound: o.offerRound ?? 1,
      status: "pending"
    }))
  );
}
async function driverHasPendingRideOffer(rideId, driverId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: rideOffers.id }).from(rideOffers).where(
    and(
      eq(rideOffers.rideId, rideId),
      eq(rideOffers.driverId, driverId),
      eq(rideOffers.status, "pending")
    )
  ).limit(1);
  return result.length > 0;
}
async function getRequestedRidesWithPendingOfferForDriver(driverId) {
  const db = await getDb();
  if (!db) return [];
  await expireStalePendingRideOffers();
  const cutoff = getOfferExpiryCutoff();
  const rows = await db.select({
    ride: rides,
    distanceMeters: rideOffers.distanceMeters,
    offerRound: rideOffers.offerRound,
    createdAt: rideOffers.createdAt
  }).from(rideOffers).innerJoin(rides, eq(rideOffers.rideId, rides.id)).where(
    and(
      eq(rideOffers.driverId, driverId),
      eq(rideOffers.status, "pending"),
      eq(rides.status, "requested")
    )
  ).orderBy(desc(rides.createdAt));
  return rows.filter((row) => row.createdAt.getTime() > cutoff.getTime()).map((row) => ({
    ...row.ride,
    offerDistanceMeters: row.distanceMeters,
    offerRound: row.offerRound,
    offerExpiresAt: new Date(
      row.createdAt.getTime() + getDispatcherOfferTimeoutMs()
    ).toISOString()
  }));
}
async function expirePendingRideOffersForRide(rideId) {
  const db = await getDb();
  if (!db) return;
  await db.update(rideOffers).set({ status: "expired" }).where(and(eq(rideOffers.rideId, rideId), eq(rideOffers.status, "pending")));
}
function getOfferExpiryCutoff() {
  return new Date(Date.now() - getDispatcherOfferTimeoutMs());
}
async function expireStalePendingRideOffers(rideId) {
  const db = await getDb();
  if (!db) return 0;
  const cutoff = getOfferExpiryCutoff();
  const conditions = [
    eq(rideOffers.status, "pending"),
    lt(rideOffers.createdAt, cutoff)
  ];
  if (rideId != null) {
    conditions.push(eq(rideOffers.rideId, rideId));
  }
  const stale = await db.select({ id: rideOffers.id }).from(rideOffers).where(and(...conditions));
  if (stale.length === 0) return 0;
  await db.update(rideOffers).set({ status: "expired" }).where(
    and(
      eq(rideOffers.status, "pending"),
      lt(rideOffers.createdAt, cutoff),
      ...rideId != null ? [eq(rideOffers.rideId, rideId)] : []
    )
  );
  return stale.length;
}
async function countPendingRideOffers(rideId) {
  const db = await getDb();
  if (!db) return 0;
  await expireStalePendingRideOffers(rideId);
  const rows = await db.select({ id: rideOffers.id }).from(rideOffers).where(and(eq(rideOffers.rideId, rideId), eq(rideOffers.status, "pending")));
  return rows.length;
}
async function getMaxOfferRoundForRide(rideId) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ offerRound: rideOffers.offerRound }).from(rideOffers).where(eq(rideOffers.rideId, rideId));
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.offerRound));
}
async function getNextOfferRoundForRide(rideId) {
  const max = await getMaxOfferRoundForRide(rideId);
  return max === 0 ? 1 : max + 1;
}
async function getPreviouslyOfferedDriverIdsForRide(rideId) {
  const db = await getDb();
  if (!db) return /* @__PURE__ */ new Set();
  const rows = await db.select({ driverId: rideOffers.driverId }).from(rideOffers).where(eq(rideOffers.rideId, rideId));
  return new Set(rows.map((r) => r.driverId));
}
async function getDriversBlockedFromReOffer(rideId) {
  const db = await getDb();
  if (!db) return /* @__PURE__ */ new Set();
  await expireStalePendingRideOffers(rideId);
  const cutoff = getOfferExpiryCutoff();
  const rows = await db.select({
    driverId: rideOffers.driverId,
    status: rideOffers.status,
    createdAt: rideOffers.createdAt
  }).from(rideOffers).where(eq(rideOffers.rideId, rideId));
  const blocked = /* @__PURE__ */ new Set();
  for (const row of rows) {
    if (row.status === "declined" || row.status === "accepted") {
      blocked.add(row.driverId);
    } else if (row.status === "pending" && row.createdAt.getTime() > cutoff.getTime()) {
      blocked.add(row.driverId);
    }
  }
  return blocked;
}
async function declineRideOffer(rideId, driverId) {
  const db = await getDb();
  if (!db) return false;
  await expireStalePendingRideOffers(rideId);
  const cutoff = getOfferExpiryCutoff();
  const rows = await db.select({ id: rideOffers.id, createdAt: rideOffers.createdAt }).from(rideOffers).where(
    and(
      eq(rideOffers.rideId, rideId),
      eq(rideOffers.driverId, driverId),
      eq(rideOffers.status, "pending")
    )
  ).limit(1);
  const offer = rows[0];
  if (!offer || offer.createdAt.getTime() <= cutoff.getTime()) {
    return false;
  }
  await db.update(rideOffers).set({ status: "declined" }).where(eq(rideOffers.id, offer.id));
  return true;
}
async function getRequestedRideIdsWithoutDriver() {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.select({ id: rides.id }).from(rides).where(and(eq(rides.status, "requested"), isNull(rides.driverId)));
    return rows.map((r) => r.id);
  } catch (error) {
    console.warn("[Database] getRequestedRideIdsWithoutDriver:", error);
    return [];
  }
}
async function resolveRideOffersOnAccept(rideId, acceptedDriverId) {
  const db = await getDb();
  if (!db) return;
  const offers = await db.select().from(rideOffers).where(eq(rideOffers.rideId, rideId));
  for (const offer of offers) {
    const status = offer.driverId === acceptedDriverId && offer.status === "pending" ? "accepted" : offer.status === "pending" ? "superseded" : offer.status;
    if (status !== offer.status) {
      await db.update(rideOffers).set({ status }).where(eq(rideOffers.id, offer.id));
    }
  }
}
async function createRating(rating) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ratings).values(rating);
  if (rating.toUserId) {
    await updateDriverRating(rating.toUserId);
  }
  return result;
}
async function getRatingsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(ratings).where(eq(ratings.toUserId, userId)).orderBy(desc(ratings.createdAt));
}
async function getRatingByRideId(rideId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(ratings).where(eq(ratings.rideId, rideId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateDriverRating(userId) {
  const db = await getDb();
  if (!db) return;
  const driverProfile = await getDriverProfileByUserId(userId);
  if (!driverProfile) return;
  const allRatings = await getRatingsByUserId(userId);
  if (allRatings.length === 0) return;
  const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
  const ratingInt = Math.round(avgRating * 100);
  await updateDriverProfile(driverProfile.id, {
    rating: ratingInt,
    totalRides: allRatings.length
  });
}
async function getPricingByVehicleType(vehicleType) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(pricingConfig).where(eq(pricingConfig.vehicleType, vehicleType)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertPricing(pricing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pricingConfig).values(pricing).onDuplicateKeyUpdate({
    set: {
      basePrice: pricing.basePrice,
      pricePerKm: pricing.pricePerKm,
      pricePerMinute: pricing.pricePerMinute,
      minimumPrice: pricing.minimumPrice
    }
  });
}
async function getAllPricing() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pricingConfig);
}
async function updateDriverLocation(location) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(driverLocations).values(location).onDuplicateKeyUpdate({
    set: {
      lat: location.lat,
      lng: location.lng,
      heading: location.heading
    }
  });
}
async function getDriverLocation(driverId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(driverLocations).where(eq(driverLocations.driverId, driverId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getNearbyDrivers(lat, lng, radiusKm = 5) {
  const db = await getDb();
  if (!db) return [];
  const availableDrivers = await db.select({
    driver: driverProfiles,
    location: driverLocations,
    user: users
  }).from(driverProfiles).innerJoin(driverLocations, eq(driverProfiles.id, driverLocations.driverId)).innerJoin(users, eq(driverProfiles.userId, users.id)).where(
    and(
      eq(driverProfiles.isAvailable, true),
      eq(driverProfiles.status, "approved")
    )
  );
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  return availableDrivers.filter((d) => {
    const driverLat = parseFloat(d.location.lat);
    const driverLng = parseFloat(d.location.lng);
    const distance = Math.sqrt(
      Math.pow(driverLat - userLat, 2) + Math.pow(driverLng - userLng, 2)
    ) * 111;
    return distance <= radiusKm;
  });
}
async function createCoupon(coupon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { coupons: coupons2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.insert(coupons2).values(coupon);
}
async function getCouponByCode(code) {
  const db = await getDb();
  if (!db) return void 0;
  const { coupons: coupons2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(coupons2).where(eq(coupons2.code, code.toUpperCase())).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllCoupons() {
  const db = await getDb();
  if (!db) return [];
  const { coupons: coupons2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(coupons2).orderBy(desc(coupons2.createdAt));
}
async function getActiveCoupons() {
  const db = await getDb();
  if (!db) return [];
  const { coupons: coupons2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const now = /* @__PURE__ */ new Date();
  return await db.select().from(coupons2).where(eq(coupons2.isActive, 1));
}
async function updateCoupon(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { coupons: coupons2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.update(coupons2).set(updates).where(eq(coupons2.id, id));
}
async function recordCouponUsage(usage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { couponUsage: couponUsage2, coupons: coupons2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.insert(couponUsage2).values(usage);
  await db.update(coupons2).set({ usedCount: sql`${coupons2.usedCount} + 1` }).where(eq(coupons2.id, usage.couponId));
}
async function getCouponUsageByUser(userId, couponId) {
  const db = await getDb();
  if (!db) return [];
  const { couponUsage: couponUsage2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(couponUsage2).where(and(
    eq(couponUsage2.userId, userId),
    eq(couponUsage2.couponId, couponId)
  ));
}
async function createChatMessage(message) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(chatMessages).values(message);
  return result.insertId;
}
async function getChatMessagesByRide(rideId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages).where(eq(chatMessages.rideId, rideId)).orderBy(chatMessages.createdAt);
}
async function getAllRides() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides);
}
async function getApprovedDriverProfiles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(driverProfiles).where(eq(driverProfiles.status, "approved"));
}
async function getPendingDriverProfiles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(driverProfiles).where(eq(driverProfiles.status, "pending"));
}
async function updateRidePaymentStatus(rideId, paymentStatus, stripePaymentIntentId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { paymentStatus };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }
  await db.update(rides).set(updateData).where(eq(rides.id, rideId));
}
async function getScheduledRidesByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rides).where(
    and(
      eq(rides.passengerId, userId),
      eq(rides.isScheduled, "yes"),
      eq(rides.status, "requested")
    )
  ).orderBy(rides.scheduledFor);
}
async function cancelRide(rideId, userId, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rides).set({
    status: "cancelled",
    cancelledBy: userId,
    cancellationReason: reason,
    cancelledAt: /* @__PURE__ */ new Date()
  }).where(eq(rides.id, rideId));
}
async function validateCoupon(code, rideValue, vehicleType) {
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
  const result = await db.select().from(coupons).where(
    and(
      eq(coupons.code, code),
      eq(coupons.isActive, 1)
    )
  ).limit(1);
  if (result.length === 0) return null;
  const coupon = result[0];
  if (coupon.validUntil && coupon.validUntil < now) return null;
  if (coupon.validFrom && coupon.validFrom > now) return null;
  if (coupon.minRideValue && rideValue < coupon.minRideValue) return null;
  if (coupon.vehicleTypes && !coupon.vehicleTypes.includes(vehicleType)) return null;
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null;
  return coupon;
}
async function createSavedAddress(address) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(savedAddresses).values(address);
  return result;
}
async function getSavedAddressesByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId)).orderBy(savedAddresses.createdAt);
}
async function getSavedAddressByLabel(userId, label) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(savedAddresses).where(and(
    eq(savedAddresses.userId, userId),
    eq(savedAddresses.label, label)
  )).limit(1);
  return result[0] || null;
}
async function updateSavedAddress(id, updates) {
  const db = await getDb();
  if (!db) return false;
  await db.update(savedAddresses).set(updates).where(eq(savedAddresses.id, id));
  return true;
}
async function deleteSavedAddress(id) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(savedAddresses).where(eq(savedAddresses.id, id));
  return true;
}
async function saveFcmToken(userId, token, deviceInfo) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(fcmTokens).where(and(
    eq(fcmTokens.userId, userId),
    eq(fcmTokens.token, token)
  )).limit(1);
  if (existing.length > 0) {
    await db.update(fcmTokens).set({ deviceInfo, updatedAt: /* @__PURE__ */ new Date() }).where(eq(fcmTokens.id, existing[0].id));
  } else {
    await db.insert(fcmTokens).values({
      userId,
      token,
      deviceInfo
    });
  }
  return true;
}
async function getUserFcmTokens(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fcmTokens).where(eq(fcmTokens.userId, userId));
}
async function deleteFcmToken(token) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(fcmTokens).where(eq(fcmTokens.token, token));
  return true;
}
async function getDriverProfileById(driverId) {
  const db = await getDb();
  if (!db) return void 0;
  const driverProfile = await db.select().from(driverProfiles).where(eq(driverProfiles.id, driverId)).limit(1);
  if (driverProfile.length === 0) return void 0;
  const driver = driverProfile[0];
  const userInfo = await db.select().from(users).where(eq(users.id, driver.userId)).limit(1);
  const driverVehicles = await db.select().from(vehicles).where(eq(vehicles.driverId, driver.id));
  const driverRatings = await getRatingsByUserId(driver.userId);
  const averageRating = driverRatings.length > 0 ? driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length : null;
  return {
    ...driver,
    user: userInfo[0] || null,
    vehicles: driverVehicles,
    averageRating,
    totalRatings: driverRatings.length
  };
}
async function createRidePassenger(passenger) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(ridePassengers).values(passenger);
}
async function getRidePassengers(rideId) {
  const db = await getDb();
  if (!db) return [];
  const passengers = await db.select().from(ridePassengers).where(eq(ridePassengers.rideId, rideId)).orderBy(ridePassengers.pickupOrder);
  const passengersWithInfo = await Promise.all(
    passengers.map(async (p) => {
      const user = await getUserById(p.passengerId);
      return {
        ...p,
        user
      };
    })
  );
  return passengersWithInfo;
}
async function updateRidePassengerStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ridePassengers).set({ status }).where(eq(ridePassengers.id, id));
  return true;
}
async function findMatchingSharedRides(params) {
  const db = await getDb();
  if (!db) return [];
  const {
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    vehicleType,
    maxDistanceKm = 2,
    // 2km radius by default
    timeWindowMinutes = 15
    // 15 minutes window
  } = params;
  const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1e3);
  const availableRides = await db.select().from(rides).where(
    and(
      eq(rides.isShared, true),
      eq(rides.status, "requested"),
      eq(rides.vehicleType, vehicleType),
      sql`${rides.currentPassengers} < ${rides.maxPassengers}`,
      sql`${rides.createdAt} >= ${timeThreshold}`
    )
  );
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
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
async function getPassengerSharedRides(passengerId) {
  const db = await getDb();
  if (!db) return [];
  const passengerRides = await db.select().from(ridePassengers).where(
    and(
      eq(ridePassengers.passengerId, passengerId),
      sql`${ridePassengers.status} IN ('pending', 'accepted')`
    )
  );
  const ridesWithDetails = await Promise.all(
    passengerRides.map(async (pr) => {
      const ride = await getRideById(pr.rideId);
      const allPassengers = await getRidePassengers(pr.rideId);
      return {
        ...pr,
        ride,
        allPassengers
      };
    })
  );
  return ridesWithDetails;
}
function calculateVipLevel(points) {
  if (points >= VIP_LEVELS.diamante.minPoints) return "diamante";
  if (points >= VIP_LEVELS.ouro.minPoints) return "ouro";
  if (points >= VIP_LEVELS.prata.minPoints) return "prata";
  return "bronze";
}
function getVipDiscount(level) {
  return VIP_LEVELS[level].discount;
}
async function addLoyaltyPoints(userId, points, description, rideId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    loyaltyPoints: sql`${users.loyaltyPoints} + ${points}`
  }).where(eq(users.id, userId));
  const user = await getUserById(userId);
  if (user) {
    const newLevel = calculateVipLevel(user.loyaltyPoints);
    if (newLevel !== user.vipLevel) {
      await db.update(users).set({ vipLevel: newLevel }).where(eq(users.id, userId));
    }
  }
  await db.insert(loyaltyHistory).values({
    userId,
    type: "earned",
    points,
    description,
    rideId
  });
}
async function redeemLoyaltyPoints(userId, points, description) {
  const db = await getDb();
  if (!db) return false;
  const user = await getUserById(userId);
  if (!user || user.loyaltyPoints < points) {
    return false;
  }
  await db.update(users).set({
    loyaltyPoints: sql`${users.loyaltyPoints} - ${points}`
  }).where(eq(users.id, userId));
  const newLevel = calculateVipLevel(user.loyaltyPoints - points);
  if (newLevel !== user.vipLevel) {
    await db.update(users).set({ vipLevel: newLevel }).where(eq(users.id, userId));
  }
  await db.insert(loyaltyHistory).values({
    userId,
    type: "redeemed",
    points: -points,
    description
  });
  return true;
}
async function getLoyaltyHistory(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(loyaltyHistory).where(eq(loyaltyHistory.userId, userId)).orderBy(desc(loyaltyHistory.createdAt)).limit(50);
}
async function getUserLoyaltyStats(userId) {
  const db = await getDb();
  if (!db) return null;
  const user = await getUserById(userId);
  if (!user) return null;
  const history = await getLoyaltyHistory(userId);
  const totalEarned = history.filter((h) => h.type === "earned").reduce((sum, h) => sum + h.points, 0);
  const totalRedeemed = history.filter((h) => h.type === "redeemed").reduce((sum, h) => sum + Math.abs(h.points), 0);
  const currentLevel = user.vipLevel;
  const nextLevel = getNextVipLevel(currentLevel);
  const pointsToNextLevel = nextLevel ? VIP_LEVELS[nextLevel].minPoints - user.loyaltyPoints : 0;
  return {
    currentPoints: user.loyaltyPoints,
    currentLevel,
    currentDiscount: getVipDiscount(currentLevel),
    nextLevel,
    pointsToNextLevel,
    totalEarned,
    totalRedeemed,
    history: history.slice(0, 10)
    // Last 10 transactions
  };
}
function getNextVipLevel(currentLevel) {
  const levels = ["bronze", "prata", "ouro", "diamante"];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}
function generateShareToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
async function createEmergencyContact(contact) {
  const db = await getDb();
  if (!db) return null;
  if (contact.isPrimary) {
    await db.update(emergencyContacts).set({ isPrimary: false }).where(eq(emergencyContacts.userId, contact.userId));
  }
  return await db.insert(emergencyContacts).values(contact);
}
async function getEmergencyContacts(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId)).orderBy(desc(emergencyContacts.isPrimary), desc(emergencyContacts.createdAt));
}
async function deleteEmergencyContact(contactId, userId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(emergencyContacts).where(
    and(
      eq(emergencyContacts.id, contactId),
      eq(emergencyContacts.userId, userId)
    )
  );
  return true;
}
async function updateEmergencyContact(contactId, userId, updates) {
  const db = await getDb();
  if (!db) return false;
  if (updates.isPrimary) {
    await db.update(emergencyContacts).set({ isPrimary: false }).where(eq(emergencyContacts.userId, userId));
  }
  await db.update(emergencyContacts).set(updates).where(
    and(
      eq(emergencyContacts.id, contactId),
      eq(emergencyContacts.userId, userId)
    )
  );
  return true;
}
async function triggerSOS(rideId, userId, location, lat, lng) {
  const db = await getDb();
  if (!db) return null;
  await db.update(rides).set({
    sosActivated: true,
    sosActivatedAt: /* @__PURE__ */ new Date()
  }).where(eq(rides.id, rideId));
  const result = await db.insert(sosAlerts).values({
    rideId,
    userId,
    location,
    lat,
    lng,
    status: "active"
  });
  const alertId = Number(result[0]?.insertId || 0);
  const contacts = await getEmergencyContacts(userId);
  return { alertId, contacts };
}
async function getRideByShareToken(shareToken) {
  const db = await getDb();
  if (!db) return null;
  const ride = await db.select().from(rides).where(eq(rides.shareToken, shareToken)).limit(1);
  return ride[0] || null;
}
async function getActiveSosAlerts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sosAlerts).where(eq(sosAlerts.status, "active")).orderBy(desc(sosAlerts.createdAt));
}
async function resolveSosAlert(alertId, resolvedBy, status, notes) {
  const db = await getDb();
  if (!db) return false;
  await db.update(sosAlerts).set({
    status,
    resolvedAt: /* @__PURE__ */ new Date(),
    resolvedBy,
    notes
  }).where(eq(sosAlerts.id, alertId));
  return true;
}
async function addFavoriteDriver(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(favoriteDrivers).where(
    and(
      eq(favoriteDrivers.passengerId, data.passengerId),
      eq(favoriteDrivers.driverId, data.driverId)
    )
  ).limit(1);
  if (existing.length > 0) {
    throw new Error("Driver already in favorites");
  }
  return await db.insert(favoriteDrivers).values(data);
}
async function removeFavoriteDriver(passengerId, driverId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(favoriteDrivers).where(
    and(
      eq(favoriteDrivers.passengerId, passengerId),
      eq(favoriteDrivers.driverId, driverId)
    )
  );
  return true;
}
async function getFavoriteDrivers(passengerId) {
  const db = await getDb();
  if (!db) return [];
  const favorites = await db.select().from(favoriteDrivers).where(eq(favoriteDrivers.passengerId, passengerId)).orderBy(desc(favoriteDrivers.lastRideAt));
  const enriched = await Promise.all(
    favorites.map(async (fav) => {
      const driverProfile = await db.select().from(driverProfiles).where(eq(driverProfiles.id, fav.driverId)).limit(1);
      let user = null;
      let driverVehicles = [];
      if (driverProfile.length > 0) {
        const userResult = await db.select().from(users).where(eq(users.id, driverProfile[0].userId)).limit(1);
        user = userResult[0] || null;
        driverVehicles = await db.select().from(vehicles).where(eq(vehicles.driverId, fav.driverId));
      }
      return {
        ...fav,
        driver: driverProfile[0] || null,
        user,
        vehicles: driverVehicles
      };
    })
  );
  return enriched;
}
async function isFavoriteDriver(passengerId, driverId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(favoriteDrivers).where(
    and(
      eq(favoriteDrivers.passengerId, passengerId),
      eq(favoriteDrivers.driverId, driverId)
    )
  ).limit(1);
  return result.length > 0;
}
async function updateFavoriteDriver(passengerId, driverId, updates) {
  const db = await getDb();
  if (!db) return false;
  await db.update(favoriteDrivers).set(updates).where(
    and(
      eq(favoriteDrivers.passengerId, passengerId),
      eq(favoriteDrivers.driverId, driverId)
    )
  );
  return true;
}
async function incrementFavoriteDriverRides(passengerId, driverId) {
  const db = await getDb();
  if (!db) return;
  await db.update(favoriteDrivers).set({
    ridesCompleted: sql`${favoriteDrivers.ridesCompleted} + 1`,
    lastRideAt: /* @__PURE__ */ new Date()
  }).where(
    and(
      eq(favoriteDrivers.passengerId, passengerId),
      eq(favoriteDrivers.driverId, driverId)
    )
  );
}
async function createReferralCode(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(referrals).where(
    and(
      eq(referrals.referrerId, userId),
      eq(referrals.status, "pending")
    )
  ).limit(1);
  if (existing.length > 0) {
    return existing[0].referralCode;
  }
  const code = "FUI" + Math.random().toString(36).substring(2, 8).toUpperCase();
  await db.insert(referrals).values({
    referrerId: userId,
    referralCode: code,
    status: "pending"
  });
  return code;
}
async function getReferralByCode(code) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referrals).where(eq(referrals.referralCode, code.toUpperCase())).limit(1);
  return result[0] || null;
}
async function getReferralByReferredUser(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referrals).where(eq(referrals.referredId, userId)).limit(1);
  return result[0] || null;
}
async function getUserReferrals(userId) {
  const db = await getDb();
  if (!db) return [];
  const refs = await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt));
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
async function getUserActiveReferralCode(userId) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt)).limit(1);
  if (existing.length > 0) {
    return existing[0].referralCode;
  }
  return null;
}
async function registerReferral(code, referredUserId) {
  const db = await getDb();
  if (!db) return false;
  const referral = await getReferralByCode(code);
  if (!referral) return false;
  if (referral.status !== "pending") return false;
  if (referral.referrerId === referredUserId) return false;
  await db.update(referrals).set({
    referredId: referredUserId,
    status: "registered"
  }).where(eq(referrals.id, referral.id));
  return true;
}
async function completeReferral(referredUserId) {
  const db = await getDb();
  if (!db) return false;
  const referral = await db.select().from(referrals).where(
    and(
      eq(referrals.referredId, referredUserId),
      eq(referrals.status, "registered")
    )
  ).limit(1);
  if (referral.length === 0) return false;
  const ref = referral[0];
  await db.update(referrals).set({
    status: "completed",
    completedAt: /* @__PURE__ */ new Date()
  }).where(eq(referrals.id, ref.id));
  await addLoyaltyPoints(ref.referrerId, 50, `Indica\xE7\xE3o completada! Amigo fez a primeira corrida.`);
  await addLoyaltyPoints(referredUserId, 50, `B\xF4nus de boas-vindas por indica\xE7\xE3o!`);
  return true;
}
async function getReferralStats(userId) {
  const db = await getDb();
  if (!db) return { totalReferred: 0, totalCompleted: 0, totalEarned: 0, pendingCode: null };
  const allReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
  const totalReferred = allReferrals.filter((r) => r.status !== "pending").length;
  const totalCompleted = allReferrals.filter((r) => r.status === "completed").length;
  const totalEarned = totalCompleted * 500;
  const pendingCode = allReferrals.find((r) => r.status === "pending")?.referralCode || null;
  return { totalReferred, totalCompleted, totalEarned, pendingCode };
}
async function createDeliveryOrder(order) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const trackingCode = "FUI" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).substring(2, 4).toUpperCase();
  const result = await db.insert(deliveryOrders).values({
    ...order,
    trackingCode,
    deliveryPremiumMeta: order.deliveryPremiumMeta ?? createInitialDeliveryPremiumMeta("requested")
  });
  return { insertId: Number(result[0]?.insertId || 0), trackingCode };
}
async function getDeliveryOrderById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deliveryOrders).where(eq(deliveryOrders.id, id)).limit(1);
  return result[0] || null;
}
async function getDeliveryOrdersByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveryOrders).where(eq(deliveryOrders.senderId, userId)).orderBy(desc(deliveryOrders.createdAt));
}
async function getDeliveryOrdersByDriver(driverId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveryOrders).where(eq(deliveryOrders.driverId, driverId)).orderBy(desc(deliveryOrders.createdAt));
}
async function getAllDeliveryOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveryOrders).orderBy(desc(deliveryOrders.createdAt));
}
async function getActiveDeliveryOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveryOrders).where(inArray(deliveryOrders.status, ["requested", "accepted", "picked_up", "in_transit"])).orderBy(desc(deliveryOrders.createdAt));
}
async function updateDeliveryOrder(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveryOrders).set(updates).where(eq(deliveryOrders.id, id));
}
async function getDeliveryOrderByTrackingCode(trackingCode) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deliveryOrders).where(eq(deliveryOrders.trackingCode, trackingCode)).limit(1);
  return result[0] || null;
}
async function getDriverPremiumPreferences(driverId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(driverPremiumPreferences).where(eq(driverPremiumPreferences.driverId, driverId)).limit(1);
  return result[0] ?? null;
}
async function upsertDriverPremiumPreferences(driverId, prefs) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(driverPremiumPreferences).values({
    driverId,
    dailyGoalCents: prefs.dailyGoalCents,
    smartPause: prefs.smartPause,
    serviceFilters: prefs.serviceFilters
  }).onDuplicateKeyUpdate({
    set: {
      dailyGoalCents: prefs.dailyGoalCents,
      smartPause: prefs.smartPause,
      serviceFilters: prefs.serviceFilters
    }
  });
}
async function getPlatformFinanceConfig() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(platformFinanceSettings).where(eq(platformFinanceSettings.configKey, "default")).limit(1);
  return result[0]?.configJson ?? null;
}
async function upsertPlatformFinanceConfig(config) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(platformFinanceSettings).values({ configKey: "default", configJson: config }).onDuplicateKeyUpdate({ set: { configJson: config } });
}
function rowToLedgerEntry(row) {
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
    completedAt: row.completedAt.toISOString()
  };
}
async function insertFinancialLedgerEntry(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(financialLedger).where(
    and(
      eq(financialLedger.entityType, input.entityType),
      eq(financialLedger.entityId, input.entityId)
    )
  ).limit(1);
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
    completedAt: new Date(input.completedAt)
  });
  const insertId = Number(result[0].insertId);
  const rows = await db.select().from(financialLedger).where(eq(financialLedger.id, insertId)).limit(1);
  return rowToLedgerEntry(rows[0]);
}
async function getFinancialLedgerByDriver(driverId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(financialLedger).where(eq(financialLedger.driverId, driverId)).orderBy(desc(financialLedger.completedAt));
  return rows.map(rowToLedgerEntry);
}
async function getAllFinancialLedgerEntries() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(financialLedger).orderBy(desc(financialLedger.completedAt));
  return rows.map(rowToLedgerEntry);
}
var _db, VIP_LEVELS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_rideDispatcher();
    init_schema();
    init_env();
    init_schema();
    init_deliveryPremium();
    _db = null;
    VIP_LEVELS = {
      bronze: { minPoints: 0, discount: 0 },
      prata: { minPoints: 500, discount: 5 },
      ouro: { minPoints: 2e3, discount: 10 },
      diamante: { minPoints: 5e3, discount: 15 }
    };
  }
});

// server/_core/fcm.ts
var fcm_exports = {};
__export(fcm_exports, {
  notifyUser: () => notifyUser,
  sendPushNotification: () => sendPushNotification
});
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getMessaging();
  }
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || "fui-app-4c062",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
  };
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    return getMessaging();
  } catch (error) {
    console.error("[FCM] Failed to initialize Firebase Admin:", error);
    throw error;
  }
}
async function sendPushNotification(tokens, notification) {
  if (tokens.length === 0) {
    return { success: true, failedTokens: [] };
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn("[FCM] Firebase credentials not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
    return { success: false, failedTokens: tokens };
  }
  const failedTokens = [];
  try {
    const messaging = getFirebaseAdmin();
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.icon
          },
          data: notification.data || {},
          webpush: {
            notification: {
              icon: notification.icon || "/icon-192.png",
              badge: notification.badge || "/icon-192.png"
            },
            fcmOptions: {
              link: "/"
            }
          }
        });
      } catch (error) {
        console.error(`[FCM] Failed to send to token:`, error.message);
        failedTokens.push(token);
      }
    }
    return {
      success: failedTokens.length === 0,
      failedTokens
    };
  } catch (error) {
    console.error("[FCM] Error sending notifications:", error);
    return { success: false, failedTokens: tokens };
  }
}
async function notifyUser(userId, notification) {
  const { getUserFcmTokens: getUserFcmTokens2, deleteFcmToken: deleteFcmToken2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const userTokens = await getUserFcmTokens2(userId);
  if (userTokens.length === 0) {
    console.log(`[FCM] No tokens found for user ${userId}`);
    return false;
  }
  const tokens = userTokens.map((t2) => t2.token);
  const result = await sendPushNotification(tokens, notification);
  if (result.failedTokens.length > 0) {
    console.log(`[FCM] Cleaning up ${result.failedTokens.length} failed tokens`);
    for (const token of result.failedTokens) {
      await deleteFcmToken2(token);
    }
  }
  return result.success;
}
var init_fcm = __esm({
  "server/_core/fcm.ts"() {
    "use strict";
  }
});

// server/trpcVercel.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { z as z13 } from "zod";
import { TRPCError as TRPCError13 } from "@trpc/server";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var DEMO_PASSENGER_OPEN_ID = "local-demo-passenger";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.warn("[Notification] Forge API not configured \u2014 skipping owner notification.");
    return false;
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// shared/commercialLead.ts
import { z as z2 } from "zod";
var COMMERCIAL_PROFILE_TYPES = [
  "Empres\xE1rio local",
  "Investidor",
  "Operador de transporte",
  "Log\xEDstica / entregas",
  "Cooperativa",
  "Outro"
];
var commercialLeadSchema = z2.object({
  name: z2.string().trim().min(2, "Informe seu nome"),
  city: z2.string().trim().min(2, "Informe a cidade"),
  state: z2.string().trim().min(2, "Informe o estado").max(2, "Use a sigla do estado (ex.: SE)").transform((v) => v.toUpperCase()),
  whatsapp: z2.string().trim().min(10, "Informe um WhatsApp v\xE1lido").max(20, "WhatsApp inv\xE1lido"),
  email: z2.string().trim().email("Informe um e-mail v\xE1lido"),
  profileType: z2.enum(COMMERCIAL_PROFILE_TYPES, {
    message: "Selecione o perfil da opera\xE7\xE3o"
  }),
  message: z2.string().trim().max(2e3).optional()
});

// server/_core/demoCommercialLeads.ts
import { nanoid } from "nanoid";
var leads = [];
function saveDemoCommercialLead(input) {
  const record = {
    ...input,
    id: nanoid(10),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  leads.unshift(record);
  if (leads.length > 200) leads.pop();
  console.info("[CommercialLead] Novo lead registrado:", {
    id: record.id,
    city: record.city,
    state: record.state,
    profileType: record.profileType
  });
  return record;
}
function formatCommercialLeadNotification(input) {
  const lines = [
    `Nome: ${input.name}`,
    `Cidade: ${input.city} \u2014 ${input.state}`,
    `WhatsApp: ${input.whatsapp}`,
    `E-mail: ${input.email}`,
    `Perfil: ${input.profileType}`
  ];
  if (input.message?.trim()) {
    lines.push(`Observa\xE7\xE3o: ${input.message.trim()}`);
  }
  return {
    title: `Lead Fui Licenciamento \u2014 ${input.city}/${input.state}`,
    content: lines.join("\n")
  };
}

// server/routers/landing.ts
var landingRouter = router({
  submitCommercialLead: publicProcedure.input(commercialLeadSchema).mutation(async ({ input }) => {
    const lead = saveDemoCommercialLead(input);
    let notified = false;
    try {
      notified = await notifyOwner(formatCommercialLeadNotification(input));
    } catch {
    }
    return {
      success: true,
      id: lead.id,
      notified
    };
  })
});

// server/routers/notification.ts
import { z as z3 } from "zod";
init_schema();
init_db();
import { eq as eq2, desc as desc2, and as and2, inArray as inArray2, sql as sql2 } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/demoUser.ts
function isDemoPassenger(user) {
  return user?.openId === DEMO_PASSENGER_OPEN_ID;
}
function canDemoPassengerUseAdminModules(user) {
  if (!isDemoPassenger(user)) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.BETA_DEMO === "true";
}
function getStaticDemoPassenger() {
  const now = /* @__PURE__ */ new Date();
  return {
    id: 0,
    openId: DEMO_PASSENGER_OPEN_ID,
    name: "Passageiro Demo",
    email: "demo.passageiro@local.dev",
    phone: null,
    loginMethod: "demo",
    role: "passenger",
    loyaltyPoints: 0,
    vipLevel: "bronze",
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now
  };
}

// server/routers/notification.ts
init_env();
async function createNotificationWithPush(db, userId, data) {
  await db.insert(notifications).values({
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
    metadata: data.metadata
  });
  try {
    const { notifyUser: notifyUser2 } = await Promise.resolve().then(() => (init_fcm(), fcm_exports));
    await notifyUser2(userId, {
      title: data.title,
      body: data.message,
      data: data.actionUrl ? { url: data.actionUrl } : void 0
    });
  } catch (e) {
    console.log(`[Notification] Push failed for user ${userId}:`, e);
  }
}
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role === "admin") return next({ ctx });
  if (!ENV.isProduction && isDemoPassenger(ctx.user)) return next({ ctx });
  throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
});
var notificationRouter = router({
  /**
   * List all notifications for the current user
   */
  list: protectedProcedure.input(
    z3.object({
      limit: z3.number().min(1).max(100).default(50),
      onlyUnread: z3.boolean().optional()
    })
  ).query(async ({ ctx, input }) => {
    const conditions = [eq2(notifications.userId, ctx.user.id)];
    if (input.onlyUnread) {
      conditions.push(eq2(notifications.isRead, false));
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(notifications).where(and2(...conditions)).orderBy(desc2(notifications.createdAt)).limit(input.limit);
    return result;
  }),
  /**
   * Get count of unread notifications
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(notifications).where(
      and2(
        eq2(notifications.userId, ctx.user.id),
        eq2(notifications.isRead, false)
      )
    );
    return { count: result.length };
  }),
  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure.input(z3.object({ notificationId: z3.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(notifications).set({ isRead: true }).where(
      and2(
        eq2(notifications.id, input.notificationId),
        eq2(notifications.userId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(notifications).set({ isRead: true }).where(
      and2(
        eq2(notifications.userId, ctx.user.id),
        eq2(notifications.isRead, false)
      )
    );
    return { success: true };
  }),
  /**
   * Delete a notification
   */
  delete: protectedProcedure.input(z3.object({ notificationId: z3.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(notifications).where(
      and2(
        eq2(notifications.id, input.notificationId),
        eq2(notifications.userId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  /**
   * Create a notification (for testing or admin use)
   */
  create: protectedProcedure.input(
    z3.object({
      type: z3.enum(["ride", "payment", "promotion", "system", "driver", "safety"]),
      title: z3.string(),
      message: z3.string(),
      actionUrl: z3.string().optional(),
      actionLabel: z3.string().optional(),
      metadata: z3.any().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [notification] = await db.insert(notifications).values({
      userId: ctx.user.id,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      metadata: input.metadata
    }).$returningId();
    return notification;
  }),
  // ============= ADMIN NOTIFICATION PROCEDURES =============
  /**
   * Admin: Send notification to all users or a specific segment
   */
  adminSendBroadcast: adminProcedure2.input(
    z3.object({
      type: z3.enum(["promotion", "system"]),
      title: z3.string().min(1).max(255),
      message: z3.string().min(1).max(1e3),
      actionUrl: z3.string().optional(),
      actionLabel: z3.string().optional(),
      segment: z3.enum(["all", "passengers", "drivers", "active_last_30d"]).default("all")
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    let targetUsers;
    switch (input.segment) {
      case "passengers":
        targetUsers = await db.select({ id: users.id }).from(users).where(eq2(users.role, "passenger"));
        break;
      case "drivers":
        targetUsers = await db.select({ id: users.id }).from(users).where(eq2(users.role, "driver"));
        break;
      case "active_last_30d":
        const thirtyDaysAgo = /* @__PURE__ */ new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        targetUsers = await db.select({ id: users.id }).from(users).where(sql2`${users.lastSignedIn} >= ${thirtyDaysAgo}`);
        break;
      default:
        targetUsers = await db.select({ id: users.id }).from(users);
        break;
    }
    if (targetUsers.length === 0) {
      return { success: true, sentCount: 0 };
    }
    const notificationValues = targetUsers.map((u) => ({
      userId: u.id,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel
    }));
    for (let i = 0; i < notificationValues.length; i += 100) {
      const batch = notificationValues.slice(i, i + 100);
      await db.insert(notifications).values(batch);
    }
    const userIds = targetUsers.map((u) => u.id);
    Promise.resolve().then(() => (init_fcm(), fcm_exports)).then(async ({ notifyUser: notifyUser2 }) => {
      for (const userId of userIds.slice(0, 50)) {
        try {
          await notifyUser2(userId, {
            title: input.title,
            body: input.message,
            data: input.actionUrl ? { url: input.actionUrl } : void 0
          });
        } catch (e) {
        }
      }
    }).catch(() => {
    });
    return { success: true, sentCount: targetUsers.length };
  }),
  /**
   * Admin: Send notification to a specific user
   */
  adminSendToUser: adminProcedure2.input(
    z3.object({
      userId: z3.number(),
      type: z3.enum(["ride", "payment", "promotion", "system", "driver", "safety"]),
      title: z3.string().min(1).max(255),
      message: z3.string().min(1).max(1e3),
      actionUrl: z3.string().optional(),
      actionLabel: z3.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await createNotificationWithPush(db, input.userId, {
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel
    });
    return { success: true };
  }),
  /**
   * Admin: Get notification stats
   */
  adminGetStats: adminProcedure2.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [totalResult] = await db.select({ count: sql2`count(*)` }).from(notifications);
    const [unreadResult] = await db.select({ count: sql2`count(*)` }).from(notifications).where(eq2(notifications.isRead, false));
    const [todayResult] = await db.select({ count: sql2`count(*)` }).from(notifications).where(sql2`DATE(${notifications.createdAt}) = CURDATE()`);
    const typeStats = await db.select({
      type: notifications.type,
      count: sql2`count(*)`
    }).from(notifications).groupBy(notifications.type);
    return {
      total: totalResult?.count || 0,
      unread: unreadResult?.count || 0,
      today: todayResult?.count || 0,
      byType: typeStats
    };
  }),
  /**
   * Admin: List all users for targeting notifications
   */
  adminListUsers: adminProcedure2.input(
    z3.object({
      search: z3.string().optional(),
      role: z3.enum(["all", "passenger", "driver", "admin"]).default("all"),
      limit: z3.number().min(1).max(100).default(50)
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const conditions = [];
    if (input.role !== "all") {
      conditions.push(eq2(users.role, input.role));
    }
    if (input.search) {
      conditions.push(
        sql2`(${users.name} LIKE ${`%${input.search}%`} OR ${users.email} LIKE ${`%${input.search}%`})`
      );
    }
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastSignedIn: users.lastSignedIn
    }).from(users).where(conditions.length > 0 ? and2(...conditions) : void 0).orderBy(desc2(users.lastSignedIn)).limit(input.limit);
    return result;
  }),
  /**
   * Admin: Get recent broadcast history
   */
  adminGetBroadcastHistory: adminProcedure2.input(z3.object({ limit: z3.number().min(1).max(50).default(20) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select({
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      createdAt: notifications.createdAt,
      recipientCount: sql2`count(DISTINCT ${notifications.userId})`
    }).from(notifications).where(
      inArray2(notifications.type, ["promotion", "system"])
    ).groupBy(notifications.title, notifications.message, notifications.type, notifications.createdAt).orderBy(desc2(notifications.createdAt)).limit(input.limit);
    return result;
  })
});

// server/routers/maps.ts
import { z as z4 } from "zod";

// server/_core/map.ts
init_env();
function getMapsConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    return null;
  }
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey
  };
}
function getDirectGoogleApiKey() {
  const key = ENV.googleMapsApiKey.trim();
  return key || null;
}
function isMapsConfigured() {
  return getMapsConfig() !== null || getDirectGoogleApiKey() !== null;
}
function buildGoogleMapsUrl(endpoint, apiKey, params) {
  const url = new URL(`https://maps.googleapis.com${endpoint}`);
  url.searchParams.append("key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== void 0 && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  return url;
}
async function fetchGoogleMapsJson(url, options = {}) {
  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : void 0
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }
  return await response.json();
}
async function makeRequest(endpoint, params = {}, options = {}) {
  const config = getMapsConfig();
  if (config) {
    const url = new URL(`${config.baseUrl}/v1/maps/proxy${endpoint}`);
    url.searchParams.append("key", config.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return fetchGoogleMapsJson(url, options);
  }
  const directKey = getDirectGoogleApiKey();
  if (directKey) {
    const url = buildGoogleMapsUrl(endpoint, directKey, params);
    return fetchGoogleMapsJson(url, options);
  }
  throw new Error(
    "Google Maps API credentials missing: set GOOGLE_MAPS_API_KEY (or VITE_GOOGLE_MAPS_API_KEY) or BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
  );
}

// server/routers/maps.ts
init_env();

// shared/demoMaps.ts
var DEMO_PLACES = [
  {
    placeId: "demo-centro",
    description: "Centro, Itabaiana - SE",
    mainText: "Centro",
    secondaryText: "Itabaiana - SE",
    lat: -10.685,
    lng: -37.425
  },
  {
    placeId: "demo-rodoviaria",
    description: "Rodovi\xE1ria, Itabaiana - SE",
    mainText: "Rodovi\xE1ria",
    secondaryText: "Itabaiana - SE",
    lat: -10.682,
    lng: -37.428
  },
  {
    placeId: "demo-hospital",
    description: "Hospital Dr. Jos\xE9 Henrique, Itabaiana - SE",
    mainText: "Hospital Dr. Jos\xE9 Henrique",
    secondaryText: "Itabaiana - SE",
    lat: -10.688,
    lng: -37.422
  },
  {
    placeId: "demo-praca",
    description: "Pra\xE7a da Matriz, Itabaiana - SE",
    mainText: "Pra\xE7a da Matriz",
    secondaryText: "Itabaiana - SE",
    lat: -10.6845,
    lng: -37.4245
  },
  {
    placeId: "demo-universidade",
    description: "UFS - Campus Itabaiana, SE",
    mainText: "UFS Campus Itabaiana",
    secondaryText: "Itabaiana - SE",
    lat: -10.691,
    lng: -37.418
  }
];
function filterDemoPlaces(input) {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];
  return DEMO_PLACES.filter(
    (p) => p.description.toLowerCase().includes(q) || p.mainText.toLowerCase().includes(q)
  );
}
function findDemoPlaceByPlaceId(placeId) {
  return DEMO_PLACES.find((p) => p.placeId === placeId);
}
function findDemoPlaceByText(text2) {
  const q = text2.trim().toLowerCase();
  return DEMO_PLACES.find((p) => p.description.toLowerCase() === q);
}
function haversineMeters(a, b) {
  const R = 6371e3;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function encodeDemoPolyline(points) {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    result += encodeSigned(lat - lastLat);
    result += encodeSigned(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
}
function encodeSigned(value) {
  let s = value < 0 ? ~(value << 1) : value << 1;
  let result = "";
  while (s >= 32) {
    result += String.fromCharCode((32 | s & 31) + 63);
    s >>= 5;
  }
  result += String.fromCharCode(s + 63);
  return result;
}
function resolveDemoLocation(input) {
  if (input.startsWith("place_id:")) {
    const placeId = input.slice("place_id:".length);
    const place = findDemoPlaceByPlaceId(placeId);
    if (place) {
      return { lat: place.lat, lng: place.lng, address: place.description };
    }
  }
  const byText = findDemoPlaceByText(input);
  if (byText) {
    return { lat: byText.lat, lng: byText.lng, address: byText.description };
  }
  const partial = DEMO_PLACES.find(
    (p) => input.toLowerCase().includes(p.mainText.toLowerCase())
  );
  if (partial) {
    return { lat: partial.lat, lng: partial.lng, address: partial.description };
  }
  const centro = DEMO_PLACES[0];
  return { lat: centro.lat, lng: centro.lng, address: input || centro.description };
}
function demoDirections(origin, destination) {
  const start = resolveDemoLocation(origin);
  const end = resolveDemoLocation(destination);
  const distanceM = Math.max(Math.round(haversineMeters(start, end)), 500);
  const durationS = Math.max(Math.round(distanceM / 1e3 / 30 * 3600), 120);
  return {
    distance: {
      text: `${(distanceM / 1e3).toFixed(1)} km`,
      value: distanceM
    },
    duration: {
      text: `${Math.round(durationS / 60)} min`,
      value: durationS
    },
    startAddress: start.address,
    endAddress: end.address,
    startLocation: { lat: start.lat, lng: start.lng },
    endLocation: { lat: end.lat, lng: end.lng },
    overviewPolyline: encodeDemoPolyline([
      { lat: start.lat, lng: start.lng },
      { lat: end.lat, lng: end.lng }
    ]),
    steps: []
  };
}

// server/_core/nominatim.ts
var NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
var USER_AGENT = "FuiApp/1.0 (passenger-route; contact@contentfy.com.br)";
var TIMEOUT_MS = 12e3;
function buildPlaceId(row) {
  if (row.osm_type && row.osm_id != null) {
    return `osm:${row.osm_type}:${row.osm_id}`;
  }
  return `nominatim:${row.place_id}`;
}
function normalizeQuery(address) {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.includes("brasil") || lower.includes("brazil")) {
    return trimmed;
  }
  return `${trimmed}, Brasil`;
}
async function fetchNominatimSearch(query) {
  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "1",
    countrycodes: "br",
    addressdetails: "0"
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": USER_AGENT
      }
    });
    if (!response.ok) {
      console.warn("[nominatim] HTTP error:", response.status, query);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[nominatim] search failed:", query, error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
async function geocodeAddressWithNominatim(address) {
  const query = normalizeQuery(address);
  if (query.length < 2) return null;
  const rows = await fetchNominatimSearch(query);
  const first = rows[0];
  if (!first) return null;
  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    displayName: first.display_name,
    placeId: buildPlaceId(first)
  };
}
function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// server/_core/osrmRoute.ts
var OSRM_BASE = "https://router.project-osrm.org";
var TIMEOUT_MS2 = 12e3;
var HAVERSINE_ROAD_FACTOR = 1.25;
var AVG_SPEED_KMH = 45;
function formatDistance(meters) {
  if (meters >= 1e3) {
    return `${(meters / 1e3).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
function formatDuration(seconds) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }
  return `${totalMinutes} min`;
}
function haversineRoute(origin, destination) {
  const straightM = haversineMeters(origin, destination);
  const distanceM = Math.max(Math.round(straightM * HAVERSINE_ROAD_FACTOR), 100);
  const durationS = Math.max(
    Math.round(distanceM / 1e3 / AVG_SPEED_KMH * 3600),
    60
  );
  const routePath = [origin, destination];
  return {
    distance: { text: formatDistance(distanceM), value: distanceM },
    duration: { text: formatDuration(durationS), value: durationS },
    startLocation: origin,
    endLocation: destination,
    overviewPolyline: encodeDemoPolyline(routePath),
    routePath,
    usedHaversineFallback: true
  };
}
function haversineMultiRoute(points) {
  let distanceM = 0;
  let durationS = 0;
  const routePath = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (routePath.length === 0 || routePath[routePath.length - 1] !== point) {
      routePath.push(point);
    }
    if (i === 0) continue;
    const segment = haversineRoute(points[i - 1], point);
    distanceM += segment.distance.value;
    durationS += segment.duration.value;
  }
  return {
    distance: { text: formatDistance(distanceM), value: distanceM },
    duration: { text: formatDuration(durationS), value: durationS },
    startLocation: points[0],
    endLocation: points[points.length - 1],
    overviewPolyline: encodeDemoPolyline(routePath),
    routePath,
    usedHaversineFallback: true
  };
}
async function calculateDrivingRouteWithWaypoints(waypoints) {
  if (waypoints.length < 2) {
    throw new Error("Pelo menos dois pontos s\xE3o necess\xE1rios para calcular a rota.");
  }
  if (waypoints.length === 2) {
    return calculateDrivingRouteWithOsrm(waypoints[0], waypoints[1]);
  }
  const coordStr = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE}/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS2);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn("[osrm] multi-waypoint HTTP error:", response.status);
      return haversineMultiRoute(waypoints);
    }
    const data = await response.json();
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !route || !coords?.length) {
      console.warn("[osrm] multi-waypoint no route returned");
      return haversineMultiRoute(waypoints);
    }
    const routePath = coords.map(([lng, lat]) => ({ lat, lng }));
    const distanceM = Math.max(Math.round(route.distance), 1);
    const durationS = Math.max(Math.round(route.duration), 1);
    return {
      distance: { text: formatDistance(distanceM), value: distanceM },
      duration: { text: formatDuration(durationS), value: durationS },
      startLocation: routePath[0] ?? waypoints[0],
      endLocation: routePath[routePath.length - 1] ?? waypoints[waypoints.length - 1],
      overviewPolyline: encodeDemoPolyline(routePath),
      routePath,
      usedHaversineFallback: false
    };
  } catch (error) {
    console.warn("[osrm] multi-waypoint route failed:", error);
    return haversineMultiRoute(waypoints);
  } finally {
    clearTimeout(timer);
  }
}
async function calculateDrivingRouteWithOsrm(origin, destination) {
  const url = `${OSRM_BASE}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS2);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn("[osrm] HTTP error:", response.status);
      return haversineRoute(origin, destination);
    }
    const data = await response.json();
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !route || !coords?.length) {
      console.warn("[osrm] no route returned");
      return haversineRoute(origin, destination);
    }
    const routePath = coords.map(([lng, lat]) => ({ lat, lng }));
    const distanceM = Math.max(Math.round(route.distance), 1);
    const durationS = Math.max(Math.round(route.duration), 1);
    return {
      distance: { text: formatDistance(distanceM), value: distanceM },
      duration: { text: formatDuration(durationS), value: durationS },
      startLocation: routePath[0] ?? origin,
      endLocation: routePath[routePath.length - 1] ?? destination,
      overviewPolyline: encodeDemoPolyline(routePath),
      routePath,
      usedHaversineFallback: false
    };
  } catch (error) {
    console.warn("[osrm] route failed:", error);
    return haversineRoute(origin, destination);
  } finally {
    clearTimeout(timer);
  }
}

// shared/demoPricing.ts
var DEMO_PRICING = [
  {
    vehicleType: "moto",
    basePrice: 500,
    pricePerKm: 150,
    pricePerMinute: 30,
    minimumPrice: 800
  },
  {
    vehicleType: "carro",
    basePrice: 700,
    pricePerKm: 250,
    pricePerMinute: 50,
    minimumPrice: 1200
  },
  {
    vehicleType: "van",
    basePrice: 1e3,
    pricePerKm: 350,
    pricePerMinute: 70,
    minimumPrice: 1800
  },
  {
    vehicleType: "utilitario",
    basePrice: 1500,
    pricePerKm: 400,
    pricePerMinute: 80,
    minimumPrice: 2e3
  }
];
function getDemoPricingByVehicleType(vehicleType) {
  return DEMO_PRICING.find((p) => p.vehicleType === vehicleType);
}

// server/_core/passengerRoute.ts
function computeEstimatedPrice(vehicleType, distanceM, durationS) {
  const pricing = getDemoPricingByVehicleType(vehicleType);
  if (!pricing) return 0;
  const distanceKm = distanceM / 1e3;
  const durationMin = durationS / 60;
  const raw = pricing.basePrice + distanceKm * pricing.pricePerKm + durationMin * pricing.pricePerMinute;
  return Math.round(Math.max(raw, pricing.minimumPrice));
}
async function resolveLocation(address, placeId, allowDemoFallback) {
  const trimmed = address.trim();
  if (placeId?.startsWith("demo-")) {
    const demo = findDemoPlaceByPlaceId(placeId);
    const exactDemo = findDemoPlaceByText(trimmed);
    if (demo && exactDemo?.placeId === placeId) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        displayName: demo.description,
        placeId: demo.placeId,
        source: "demo_catalog"
      };
    }
  }
  if (trimmed.length >= 2) {
    const exactDemo = findDemoPlaceByText(trimmed);
    if (exactDemo) {
      return {
        lat: exactDemo.lat,
        lng: exactDemo.lng,
        displayName: exactDemo.description,
        placeId: exactDemo.placeId,
        source: "demo_catalog"
      };
    }
  }
  if (trimmed.length >= 2) {
    const geocoded = await geocodeAddressWithNominatim(trimmed);
    if (geocoded) {
      return {
        lat: geocoded.lat,
        lng: geocoded.lng,
        displayName: geocoded.displayName,
        placeId: geocoded.placeId,
        source: "nominatim"
      };
    }
  }
  if (allowDemoFallback && trimmed.length >= 2) {
    const fallback = resolveDemoLocation(trimmed);
    const partialDemo = findDemoPlaceByText(fallback.address);
    return {
      lat: fallback.lat,
      lng: fallback.lng,
      displayName: fallback.address,
      placeId: partialDemo?.placeId,
      source: "demo_fallback"
    };
  }
  return null;
}
async function resolveStops(stops, allowDemoFallback) {
  const resolved = [];
  if (!stops?.length) return resolved;
  for (const stop of stops) {
    await sleepMs(1100);
    const location = await resolveLocation(stop.address, stop.placeId, allowDemoFallback);
    if (!location) {
      throw new Error(`N\xE3o foi poss\xEDvel localizar a parada: ${stop.address}`);
    }
    resolved.push(location);
  }
  return resolved;
}
async function calculatePassengerRoute(input) {
  const allowDemoFallback = input.allowDemoFallback ?? true;
  const origin = await resolveLocation(
    input.originAddress,
    input.originPlaceId,
    allowDemoFallback
  );
  if (!origin) {
    throw new Error("N\xE3o foi poss\xEDvel localizar a origem. Verifique o endere\xE7o.");
  }
  await sleepMs(1100);
  const intermediateStops = await resolveStops(input.intermediateStops, allowDemoFallback);
  if (intermediateStops.length > 0) {
    await sleepMs(1100);
  }
  const destination = await resolveLocation(
    input.destinationAddress,
    input.destinationPlaceId,
    allowDemoFallback
  );
  if (!destination) {
    throw new Error("N\xE3o foi poss\xEDvel localizar o destino. Verifique o endere\xE7o.");
  }
  const waypoints = [
    { lat: origin.lat, lng: origin.lng },
    ...intermediateStops.map((s) => ({ lat: s.lat, lng: s.lng })),
    { lat: destination.lat, lng: destination.lng }
  ];
  const route = waypoints.length > 2 ? await calculateDrivingRouteWithWaypoints(waypoints) : await calculateDrivingRouteWithOsrm(waypoints[0], waypoints[1]);
  const estimatedPrice = computeEstimatedPrice(
    input.vehicleType,
    route.distance.value,
    route.duration.value
  );
  return {
    origin,
    destination,
    intermediateStops: intermediateStops.length > 0 ? intermediateStops : void 0,
    distance: route.distance.value,
    duration: route.duration.value,
    distanceText: route.distance.text,
    durationText: route.duration.text,
    estimatedPrice,
    routePath: route.routePath,
    overviewPolyline: route.overviewPolyline,
    usedHaversineFallback: route.usedHaversineFallback,
    usedDemoLocationFallback: origin.source === "demo_fallback" || destination.source === "demo_fallback" || intermediateStops.some((s) => s.source === "demo_fallback")
  };
}

// server/routers/maps.ts
var demoVehicleTypeSchema = z4.enum(["moto", "carro", "van", "utilitario"]);
async function geocodeWithOsmOrDemo(params) {
  if (params.placeId) {
    const demo = findDemoPlaceByPlaceId(params.placeId);
    if (demo) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        formattedAddress: demo.description,
        placeId: demo.placeId
      };
    }
  }
  if (params.address && params.address.trim().length >= 2) {
    const nominatim = await geocodeAddressWithNominatim(params.address);
    if (nominatim) {
      return {
        lat: nominatim.lat,
        lng: nominatim.lng,
        formattedAddress: nominatim.displayName,
        placeId: nominatim.placeId
      };
    }
    const loc = resolveDemoLocation(params.address);
    const demoMatch = findDemoPlaceByText(loc.address);
    return {
      lat: loc.lat,
      lng: loc.lng,
      formattedAddress: loc.address,
      placeId: demoMatch?.placeId ?? "demo-centro"
    };
  }
  return null;
}
function parseLatLngPair(value) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
async function resolveEndpoint(value) {
  const coords = parseLatLngPair(value);
  if (coords) {
    return { ...coords, formattedAddress: value };
  }
  if (value.startsWith("place_id:")) {
    const placeId = value.slice("place_id:".length);
    const demo = findDemoPlaceByPlaceId(placeId);
    if (demo) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        formattedAddress: demo.description,
        placeId: demo.placeId
      };
    }
    return geocodeWithOsmOrDemo({ placeId });
  }
  return geocodeWithOsmOrDemo({ address: value });
}
var mapsRouter = router({
  /** Whether Google Maps REST APIs are configured (direct key or Forge proxy). */
  isConfigured: publicProcedure.query(() => isMapsConfigured()),
  /**
   * Place Autocomplete - Real-time suggestions as user types
   */
  autocomplete: publicProcedure.input(z4.object({
    input: z4.string().min(2),
    location: z4.string().optional(),
    // "lat,lng" to bias results
    radius: z4.number().optional().default(5e4),
    // 50km default
    language: z4.string().optional().default("pt-BR"),
    components: z4.string().optional().default("country:br")
  })).query(async ({ input: params }) => {
    if (!isMapsConfigured() && !ENV.isProduction) {
      return filterDemoPlaces(params.input).map((p) => ({
        description: p.description,
        place_id: p.placeId,
        structured_formatting: {
          main_text: p.mainText,
          secondary_text: p.secondaryText
        },
        types: ["geocode"]
      }));
    }
    const result = await makeRequest("/maps/api/place/autocomplete/json", {
      input: params.input,
      location: params.location || "-10.6833,-37.4250",
      // Default: Itabaiana, SE
      radius: params.radius,
      language: params.language,
      components: params.components
    });
    if (result.status === "OK" || result.status === "ZERO_RESULTS") {
      return result.predictions || [];
    }
    return [];
  }),
  /**
   * Geocode - Convert address to coordinates
   */
  geocode: publicProcedure.input(z4.object({
    address: z4.string().optional(),
    placeId: z4.string().optional(),
    latlng: z4.string().optional(),
    // For reverse geocoding
    language: z4.string().optional().default("pt-BR")
  })).query(async ({ input: params }) => {
    if (!isMapsConfigured() && !ENV.isProduction) {
      if (params.placeId) {
        const demo = findDemoPlaceByPlaceId(params.placeId);
        if (demo) {
          return {
            lat: demo.lat,
            lng: demo.lng,
            formattedAddress: demo.description,
            placeId: demo.placeId
          };
        }
      }
      if (params.address) {
        const osm = await geocodeWithOsmOrDemo({
          address: params.address,
          placeId: params.placeId
        });
        if (osm) return osm;
      }
      if (params.latlng) {
        const parsed = parseLatLngPair(params.latlng);
        if (parsed) {
          return {
            lat: parsed.lat,
            lng: parsed.lng,
            formattedAddress: params.latlng,
            placeId: `coord:${parsed.lat},${parsed.lng}`
          };
        }
      }
      return null;
    }
    const queryParams = {
      language: params.language
    };
    if (params.placeId) {
      queryParams.place_id = params.placeId;
    } else if (params.latlng) {
      queryParams.latlng = params.latlng;
    } else if (params.address) {
      queryParams.address = params.address;
    } else {
      return null;
    }
    const result = await makeRequest(
      "/maps/api/geocode/json",
      queryParams
    );
    if (result.status !== "OK" || !result.results.length) {
      return null;
    }
    const first = result.results[0];
    return {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      formattedAddress: first.formatted_address,
      placeId: first.place_id
    };
  }),
  /**
   * Directions - Get route between two points
   */
  directions: publicProcedure.input(z4.object({
    origin: z4.string(),
    // "lat,lng" or address or place_id:xxx
    destination: z4.string(),
    mode: z4.enum(["driving", "walking", "bicycling", "transit"]).optional().default("driving"),
    language: z4.string().optional().default("pt-BR"),
    alternatives: z4.boolean().optional().default(false)
  })).query(async ({ input: params }) => {
    if (!isMapsConfigured() && !ENV.isProduction) {
      const start = await resolveEndpoint(params.origin);
      await sleepMs(1100);
      const end = await resolveEndpoint(params.destination);
      if (start && end) {
        const route2 = await calculateDrivingRouteWithOsrm(start, end);
        return {
          distance: route2.distance,
          duration: route2.duration,
          startAddress: start.formattedAddress,
          endAddress: end.formattedAddress,
          startLocation: route2.startLocation,
          endLocation: route2.endLocation,
          overviewPolyline: route2.overviewPolyline,
          routePath: route2.routePath,
          steps: []
        };
      }
      return demoDirections(params.origin, params.destination);
    }
    const result = await makeRequest(
      "/maps/api/directions/json",
      {
        origin: params.origin,
        destination: params.destination,
        mode: params.mode,
        language: params.language,
        alternatives: params.alternatives
      }
    );
    if (result.status !== "OK" || !result.routes.length) {
      return null;
    }
    const route = result.routes[0];
    const leg = route.legs[0];
    return {
      distance: leg.distance,
      duration: leg.duration,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      startLocation: leg.start_location,
      endLocation: leg.end_location,
      overviewPolyline: route.overview_polyline.points,
      steps: leg.steps.map((s) => ({
        distance: s.distance,
        duration: s.duration,
        instructions: s.html_instructions,
        startLocation: s.start_location,
        endLocation: s.end_location
      }))
    };
  }),
  /**
   * Place Details - Get details for a place_id
   */
  placeDetails: publicProcedure.input(z4.object({
    placeId: z4.string(),
    fields: z4.string().optional().default("geometry,formatted_address,name"),
    language: z4.string().optional().default("pt-BR")
  })).query(async ({ input: params }) => {
    if (!isMapsConfigured() && !ENV.isProduction) {
      const place = findDemoPlaceByPlaceId(params.placeId);
      if (place) {
        return {
          placeId: place.placeId,
          name: place.mainText,
          formattedAddress: place.description,
          lat: place.lat,
          lng: place.lng
        };
      }
      return null;
    }
    const result = await makeRequest("/maps/api/place/details/json", {
      place_id: params.placeId,
      fields: params.fields,
      language: params.language
    });
    if (result.status !== "OK") {
      return null;
    }
    return {
      placeId: result.result.place_id,
      name: result.result.name,
      formattedAddress: result.result.formatted_address,
      lat: result.result.geometry.location.lat,
      lng: result.result.geometry.location.lng
    };
  }),
  /**
   * Calcula rota real do passageiro: Nominatim + OSRM (+ fallback local só se necessário).
   */
  calculatePassengerRoute: publicProcedure.input(
    z4.object({
      originAddress: z4.string().min(2),
      destinationAddress: z4.string().min(2),
      vehicleType: demoVehicleTypeSchema,
      originPlaceId: z4.string().optional(),
      destinationPlaceId: z4.string().optional(),
      intermediateStops: z4.array(
        z4.object({
          address: z4.string().min(2),
          placeId: z4.string().optional()
        })
      ).max(2).optional(),
      allowDemoFallback: z4.boolean().optional().default(true)
    })
  ).mutation(async ({ input }) => {
    return calculatePassengerRoute(input);
  })
});

// server/routers/favorites.ts
import { z as z5 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";
init_db();
var favoritesRouter = router({
  /**
   * List all favorite drivers for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getFavoriteDrivers(ctx.user.id);
  }),
  /**
   * Add a driver to favorites
   */
  add: protectedProcedure.input(
    z5.object({
      driverId: z5.number(),
      nickname: z5.string().max(100).optional(),
      note: z5.string().max(500).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      await addFavoriteDriver({
        passengerId: ctx.user.id,
        driverId: input.driverId,
        nickname: input.nickname,
        note: input.note
      });
      return { success: true };
    } catch (error) {
      if (error.message === "Driver already in favorites") {
        throw new TRPCError4({
          code: "CONFLICT",
          message: "Este motorista j\xE1 est\xE1 nos seus favoritos"
        });
      }
      throw error;
    }
  }),
  /**
   * Remove a driver from favorites
   */
  remove: protectedProcedure.input(z5.object({ driverId: z5.number() })).mutation(async ({ ctx, input }) => {
    await removeFavoriteDriver(ctx.user.id, input.driverId);
    return { success: true };
  }),
  /**
   * Check if a driver is favorited
   */
  isFavorite: protectedProcedure.input(z5.object({ driverId: z5.number() })).query(async ({ ctx, input }) => {
    return await isFavoriteDriver(ctx.user.id, input.driverId);
  }),
  /**
   * Update favorite driver info (nickname, note)
   */
  update: protectedProcedure.input(
    z5.object({
      driverId: z5.number(),
      nickname: z5.string().max(100).optional(),
      note: z5.string().max(500).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const { driverId, ...updates } = input;
    await updateFavoriteDriver(ctx.user.id, driverId, updates);
    return { success: true };
  })
});

// server/routers/referrals.ts
import { z as z6 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";

// shared/demoReferrals.ts
var DEMO_SAMPLE_REFERRAL_CODE = "FUIDEMO";
var DEMO_SAMPLE_REFERRER_ID = 920001;

// server/_core/demoReferrals.ts
var referrals2 = [];
var nextId = 960001;
var seeded = false;
function seedIfNeeded() {
  if (seeded) return;
  seeded = true;
  referrals2.push({
    id: nextId++,
    referrerId: DEMO_SAMPLE_REFERRER_ID,
    referredId: null,
    referralCode: DEMO_SAMPLE_REFERRAL_CODE,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function hydrateDemoReferrals(snapshot) {
  if (snapshot.referrals?.length) {
    referrals2 = snapshot.referrals.map((r) => ({ ...r }));
    nextId = Math.max(nextId, snapshot.nextId ?? 960001);
    seeded = true;
  } else {
    seedIfNeeded();
  }
}
function exportDemoReferralsSnapshot() {
  seedIfNeeded();
  return {
    referrals: referrals2.map((r) => ({ ...r })),
    nextId
  };
}
function generateCode() {
  return "FUI" + Math.random().toString(36).substring(2, 8).toUpperCase();
}
function getDemoReferralCode(userId) {
  seedIfNeeded();
  const pending = referrals2.find(
    (r) => r.referrerId === userId && r.status === "pending" && !r.referredId
  );
  if (pending) return pending.referralCode;
  const code = generateCode();
  referrals2.push({
    id: nextId++,
    referrerId: userId,
    referredId: null,
    referralCode: code,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return code;
}
function getDemoReferralByCode(code) {
  seedIfNeeded();
  return referrals2.find((r) => r.referralCode === code.toUpperCase()) ?? null;
}
function getDemoReferralByReferredUser(userId) {
  seedIfNeeded();
  return referrals2.find((r) => r.referredId === userId) ?? null;
}
function getDemoUserReferrals(userId) {
  seedIfNeeded();
  return referrals2.filter((r) => r.referrerId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((r) => ({
    ...r,
    referredUser: r.referredUser ?? null
  }));
}
function getDemoReferralStats(userId) {
  seedIfNeeded();
  const mine = referrals2.filter((r) => r.referrerId === userId);
  const totalReferred = mine.filter((r) => r.referredId != null).length;
  const totalCompleted = mine.filter((r) => r.status === "completed").length;
  const pendingCode = mine.find((r) => r.status === "pending" && !r.referredId)?.referralCode ?? null;
  return {
    totalReferred,
    totalCompleted,
    totalEarned: totalCompleted * 500,
    pendingCode
  };
}
function registerDemoReferral(code, referredUserId, referredUser) {
  seedIfNeeded();
  if (getDemoReferralByReferredUser(referredUserId)) {
    return { ok: false, reason: "already_applied" };
  }
  const referral = getDemoReferralByCode(code);
  if (!referral) return { ok: false, reason: "invalid" };
  if (referral.referrerId === referredUserId) return { ok: false, reason: "self" };
  if (referral.status !== "pending" || referral.referredId != null) {
    return { ok: false, reason: "used" };
  }
  referral.referredId = referredUserId;
  referral.status = "registered";
  referral.referredUser = {
    name: referredUser?.name ?? "Novo indicado",
    email: referredUser?.email
  };
  const newCode = generateCode();
  referrals2.push({
    id: nextId++,
    referrerId: referral.referrerId,
    referredId: null,
    referralCode: newCode,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { ok: true };
}
function demoReferralErrorMessage(reason) {
  switch (reason) {
    case "invalid":
      return "C\xF3digo de indica\xE7\xE3o inv\xE1lido";
    case "used":
      return "Este c\xF3digo j\xE1 foi utilizado";
    case "self":
      return "Voc\xEA n\xE3o pode usar seu pr\xF3prio c\xF3digo de indica\xE7\xE3o";
    case "already_applied":
      return "Voc\xEA j\xE1 utilizou um c\xF3digo de indica\xE7\xE3o";
  }
}

// server/routers/referrals.ts
init_db();
async function useDemoReferrals(user) {
  if (isDemoPassenger(user)) return true;
  return !await getDb();
}
var referralsRouter = router({
  hydrateDemoState: protectedProcedure.input(
    z6.object({
      referrals: z6.array(z6.any()).optional(),
      nextId: z6.number().optional()
    })
  ).mutation(({ ctx, input }) => {
    if (!isDemoPassenger(ctx.user)) return { success: false };
    hydrateDemoReferrals(input);
    return { success: true, demoSnapshot: exportDemoReferralsSnapshot() };
  }),
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      return {
        code: getDemoReferralCode(ctx.user.id),
        demoSnapshot: exportDemoReferralsSnapshot()
      };
    }
    let code = await getUserActiveReferralCode(ctx.user.id);
    if (!code) {
      code = await createReferralCode(ctx.user.id);
    }
    return { code };
  }),
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      return getDemoReferralStats(ctx.user.id);
    }
    return await getReferralStats(ctx.user.id);
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      const rows2 = getDemoUserReferrals(ctx.user.id);
      return rows2.filter((r) => r.referredId != null);
    }
    const rows = await getUserReferrals(ctx.user.id);
    return rows.filter((r) => r.referredId != null);
  }),
  validate: publicProcedure.input(z6.object({ code: z6.string().min(1) })).query(async ({ input }) => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      const referral2 = getDemoReferralByCode(input.code);
      if (!referral2) {
        return { valid: false, message: "C\xF3digo de indica\xE7\xE3o inv\xE1lido" };
      }
      if (referral2.status !== "pending" || referral2.referredId != null) {
        return { valid: false, message: "Este c\xF3digo j\xE1 foi utilizado" };
      }
      return {
        valid: true,
        message: "C\xF3digo v\xE1lido! Voc\xEA receber\xE1 R$ 5,00 em cr\xE9ditos ap\xF3s sua primeira corrida."
      };
    }
    const referral = await getReferralByCode(input.code);
    if (!referral) {
      return { valid: false, message: "C\xF3digo de indica\xE7\xE3o inv\xE1lido" };
    }
    if (referral.status !== "pending") {
      return { valid: false, message: "Este c\xF3digo j\xE1 foi utilizado" };
    }
    return {
      valid: true,
      message: "C\xF3digo v\xE1lido! Voc\xEA receber\xE1 R$ 5,00 em cr\xE9ditos ap\xF3s sua primeira corrida."
    };
  }),
  redeemCode: protectedProcedure.input(z6.object({ code: z6.string().min(1) })).mutation(async ({ ctx, input }) => {
    const normalized = input.code.trim().toUpperCase();
    if (!normalized) {
      throw new TRPCError5({
        code: "BAD_REQUEST",
        message: "Digite um c\xF3digo de indica\xE7\xE3o"
      });
    }
    if (await useDemoReferrals(ctx.user)) {
      const result = registerDemoReferral(normalized, ctx.user.id, {
        name: ctx.user.name ?? void 0,
        email: ctx.user.email ?? void 0
      });
      if (!result.ok) {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: demoReferralErrorMessage(result.reason)
        });
      }
      return {
        success: true,
        message: "C\xF3digo aplicado! Complete sua primeira corrida para receber R$ 5,00 em cr\xE9ditos.",
        demoSnapshot: exportDemoReferralsSnapshot()
      };
    }
    const existing = await getReferralByReferredUser(ctx.user.id);
    if (existing) {
      throw new TRPCError5({
        code: "BAD_REQUEST",
        message: "Voc\xEA j\xE1 utilizou um c\xF3digo de indica\xE7\xE3o"
      });
    }
    const referral = await getReferralByCode(normalized);
    if (!referral) {
      throw new TRPCError5({
        code: "NOT_FOUND",
        message: "C\xF3digo de indica\xE7\xE3o inv\xE1lido"
      });
    }
    if (referral.status !== "pending") {
      throw new TRPCError5({
        code: "BAD_REQUEST",
        message: "Este c\xF3digo j\xE1 foi utilizado"
      });
    }
    if (referral.referrerId === ctx.user.id) {
      throw new TRPCError5({
        code: "BAD_REQUEST",
        message: "Voc\xEA n\xE3o pode usar seu pr\xF3prio c\xF3digo de indica\xE7\xE3o"
      });
    }
    const success = await registerReferral(normalized, ctx.user.id);
    if (!success) {
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao aplicar c\xF3digo de indica\xE7\xE3o"
      });
    }
    return {
      success: true,
      message: "C\xF3digo aplicado! Complete sua primeira corrida para receber R$ 5,00 em cr\xE9ditos."
    };
  }),
  generateCode: protectedProcedure.mutation(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      const code2 = getDemoReferralCode(ctx.user.id);
      return { code: code2, demoSnapshot: exportDemoReferralsSnapshot() };
    }
    const code = await createReferralCode(ctx.user.id);
    return { code };
  })
});

// server/routers/delivery.ts
import { z as z7 } from "zod";
import { TRPCError as TRPCError6 } from "@trpc/server";
init_db();

// server/_core/demoDelivery.ts
init_deliveryPremium();
var DEMO_DELIVERY_ID_START = 800001;
var demoOrders = /* @__PURE__ */ new Map();
var nextDemoDeliveryId = DEMO_DELIVERY_ID_START;
function isDemoDeliveryId(id) {
  return id >= DEMO_DELIVERY_ID_START;
}
function generateTrackingCode() {
  return "FUI" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).substring(2, 4).toUpperCase();
}
function buildDemoDeliveryOrder(values) {
  const now = /* @__PURE__ */ new Date();
  const status = values.status ?? "requested";
  return {
    id: values.id,
    senderId: values.senderId,
    driverId: values.driverId ?? null,
    status: values.status ?? "requested",
    pickupAddress: values.pickupAddress,
    pickupLat: values.pickupLat,
    pickupLng: values.pickupLng,
    pickupContactName: values.pickupContactName ?? null,
    pickupContactPhone: values.pickupContactPhone ?? null,
    deliveryAddress: values.deliveryAddress,
    deliveryLat: values.deliveryLat,
    deliveryLng: values.deliveryLng,
    recipientName: values.recipientName,
    recipientPhone: values.recipientPhone,
    packageType: values.packageType,
    packageDescription: values.packageDescription ?? null,
    estimatedWeight: values.estimatedWeight ?? null,
    isFragile: values.isFragile ?? false,
    requiresSignature: values.requiresSignature ?? false,
    distance: values.distance ?? null,
    duration: values.duration ?? null,
    estimatedPrice: values.estimatedPrice ?? null,
    finalPrice: values.finalPrice ?? null,
    paymentMethod: values.paymentMethod,
    paymentStatus: values.paymentStatus ?? "pending",
    trackingCode: values.trackingCode,
    proofOfDeliveryUrl: values.proofOfDeliveryUrl ?? null,
    deliveryPremiumMeta: values.deliveryPremiumMeta ?? createInitialDeliveryPremiumMeta(status),
    createdAt: now,
    updatedAt: now,
    pickedUpAt: values.pickedUpAt ?? null,
    deliveredAt: values.deliveredAt ?? null,
    cancelledAt: values.cancelledAt ?? null
  };
}
function createDemoDeliveryOrder(values) {
  const id = nextDemoDeliveryId++;
  const trackingCode = generateTrackingCode();
  const order = buildDemoDeliveryOrder({ ...values, id, trackingCode });
  demoOrders.set(id, order);
  return order;
}
function getDemoDeliveryOrder(id) {
  return demoOrders.get(id);
}
function getDemoDeliveryOrdersBySender(senderId) {
  return Array.from(demoOrders.values()).filter((order) => order.senderId === senderId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function getDemoDeliveryOrdersByDriver(driverId) {
  return Array.from(demoOrders.values()).filter((order) => order.driverId === driverId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function getAllDemoDeliveryOrders() {
  return Array.from(demoOrders.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
function getDemoDeliveryOrderByTrackingCode(trackingCode) {
  const normalized = trackingCode.trim().toUpperCase();
  return Array.from(demoOrders.values()).find(
    (order) => order.trackingCode?.toUpperCase() === normalized
  );
}
function updateDemoDeliveryOrder(id, updates) {
  const order = demoOrders.get(id);
  if (!order) return void 0;
  const updated = { ...order, ...updates, updatedAt: /* @__PURE__ */ new Date() };
  demoOrders.set(id, updated);
  return updated;
}
function updateDemoDeliveryStatus(id, status, extra) {
  const order = demoOrders.get(id);
  if (!order) return void 0;
  let deliveryPremiumMeta = appendDeliveryStatusEvent(
    order.deliveryPremiumMeta,
    status
  );
  const updates = {
    status,
    deliveryPremiumMeta,
    ...extra
  };
  if (status === "picked_up" && !order.pickedUpAt) {
    updates.pickedUpAt = /* @__PURE__ */ new Date();
  }
  if (status === "delivered" && !order.deliveredAt) {
    updates.deliveredAt = /* @__PURE__ */ new Date();
    updates.finalPrice = order.finalPrice ?? order.estimatedPrice;
  }
  if (status === "cancelled" && !order.cancelledAt) {
    updates.cancelledAt = /* @__PURE__ */ new Date();
  }
  return updateDemoDeliveryOrder(id, updates);
}
function parseOrderDates(order) {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    pickedUpAt: order.pickedUpAt ? new Date(order.pickedUpAt) : null,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null
  };
}
function hydrateDemoDeliveryOrders(orders) {
  for (const raw of orders) {
    if (!isDemoDeliveryId(raw.id)) continue;
    const order = parseOrderDates(raw);
    const existing = demoOrders.get(order.id);
    if (existing && existing.updatedAt.getTime() > order.updatedAt.getTime()) {
      continue;
    }
    demoOrders.set(order.id, order);
    if (order.id >= nextDemoDeliveryId) {
      nextDemoDeliveryId = order.id + 1;
    }
  }
}
function toPublicDeliveryTrackInfo(order) {
  const meta = order.deliveryPremiumMeta;
  return {
    id: order.id,
    status: order.status,
    packageType: order.packageType,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    trackingCode: order.trackingCode,
    createdAt: order.createdAt,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    statusHistory: meta?.statusHistory ?? [],
    hasProof: !!order.proofOfDeliveryUrl,
    signatureConfirmed: meta?.signatureConfirmed ?? false
  };
}
function toDeliveryTrackingDetails(order) {
  const meta = order.deliveryPremiumMeta;
  return {
    ...order,
    confirmationCode: meta?.confirmationCode ?? null,
    statusHistory: meta?.statusHistory ?? [],
    signatureConfirmed: meta?.signatureConfirmed ?? false,
    signatureName: meta?.signatureName ?? null
  };
}

// shared/adminFinance.ts
var FINANCE_SERVICE_KEYS = [
  "ride",
  "delivery",
  "moto",
  "carro",
  "van",
  "utilitario"
];
var DEFAULT_COMMISSION_PERCENT = 15;
function buildDefaultFinanceConfig(defaultPercent = DEFAULT_COMMISSION_PERCENT) {
  const rate = defaultPercent;
  return {
    commission: {
      defaultPercent: rate,
      byService: {
        ride: rate,
        delivery: rate,
        moto: rate,
        carro: rate,
        van: rate,
        utilitario: rate
      }
    },
    minimumPrices: {
      regionLabel: "Centro",
      byService: {
        moto: 800,
        carro: 1200,
        van: 1800,
        utilitario: 2e3,
        ride: 1200,
        delivery: 1e3
      }
    }
  };
}
function mergeFinanceConfig(current, patch) {
  return {
    commission: {
      defaultPercent: patch.commission?.defaultPercent ?? current.commission.defaultPercent,
      byService: {
        ...current.commission.byService,
        ...patch.commission?.byService
      }
    },
    minimumPrices: {
      regionLabel: patch.minimumPrices?.regionLabel ?? current.minimumPrices.regionLabel,
      byService: {
        ...current.minimumPrices.byService,
        ...patch.minimumPrices?.byService
      }
    }
  };
}

// server/_core/demoAdminFinance.ts
init_env();

// shared/demoSimulation.ts
var DEMO_SIMULATION_DRIVER_ID = 799999;
var DEMO_SIMULATION_DRIVER_USER_ID = 799998;
var DEMO_SIMULATION_DRIVER_NAME = "Motorista Demo";
function isDemoDriverSimulationFlag(value) {
  return value === "true" || value === "1";
}
function isDemoDriverSimulationEnabledServer() {
  return process.env.NODE_ENV !== "production" && isDemoDriverSimulationFlag(process.env.VITE_ENABLE_DEMO_DRIVER);
}
function isDemoDriverSimulationAutoAcceptServer() {
  if (!isDemoDriverSimulationEnabledServer()) return false;
  const val = process.env.VITE_DEMO_DRIVER_AUTO_ACCEPT;
  if (val === "false" || val === "0") return false;
  return true;
}

// server/_core/demoSimulationDriver.ts
var simulationVehicle = null;
function ensureDemoSimulationDriver() {
  const now = /* @__PURE__ */ new Date();
  if (!simulationVehicle) {
    simulationVehicle = {
      id: 849999,
      driverId: DEMO_SIMULATION_DRIVER_ID,
      type: "carro",
      brand: "Demo",
      model: "Sedan Simula\xE7\xE3o",
      year: 2024,
      plate: "SIM0A00",
      color: "Laranja",
      photoUrl: null,
      status: "active",
      createdAt: now,
      updatedAt: now
    };
  }
  return {
    profile: {
      id: DEMO_SIMULATION_DRIVER_ID,
      userId: DEMO_SIMULATION_DRIVER_USER_ID,
      cpf: null,
      cnh: null,
      cnhImageUrl: null,
      status: "approved",
      rating: 490,
      totalRides: 128,
      isAvailable: true,
      createdAt: now,
      updatedAt: now
    },
    vehicle: simulationVehicle
  };
}
function isDemoSimulationDriverId(driverId) {
  return driverId === DEMO_SIMULATION_DRIVER_ID;
}
function getDemoSimulationVehicle() {
  return ensureDemoSimulationDriver().vehicle;
}

// server/_core/demoDriver.ts
var DEMO_DRIVER_PROFILE_ID_START = 800001;
var DEMO_VEHICLE_ID_START = 850001;
var demoProfilesByUserId = /* @__PURE__ */ new Map();
var demoVehiclesById = /* @__PURE__ */ new Map();
var demoVehiclesByDriverId = /* @__PURE__ */ new Map();
var demoDriverLocations = /* @__PURE__ */ new Map();
var nextDemoProfileId = DEMO_DRIVER_PROFILE_ID_START;
var nextDemoVehicleId = DEMO_VEHICLE_ID_START;
function isDemoDriverProfileId(id) {
  return id >= DEMO_DRIVER_PROFILE_ID_START;
}
function getDemoDriverProfileByUserId(userId) {
  return demoProfilesByUserId.get(userId);
}
function getDemoDriverProfileById(driverId) {
  if (!isDemoDriverProfileId(driverId)) return void 0;
  return Array.from(demoProfilesByUserId.values()).find((profile) => profile.id === driverId);
}
function getDemoVehicleById(vehicleId) {
  return demoVehiclesById.get(vehicleId);
}
function getDemoVehiclesByDriverId(driverId) {
  return demoVehiclesByDriverId.get(driverId) ?? [];
}
function getAllDemoDriverProfiles() {
  return Array.from(demoProfilesByUserId.values());
}
function updateDemoDriverLocation(driverId, lat, lng) {
  demoDriverLocations.set(driverId, { lat, lng, updatedAt: /* @__PURE__ */ new Date() });
}
function getDemoDriverLocationCoords(driverId) {
  const loc = demoDriverLocations.get(driverId);
  if (!loc) return null;
  const lat = Number.parseFloat(loc.lat);
  const lng = Number.parseFloat(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
function updateDemoDriverAvailability(driverId, isAvailable) {
  for (const [userId, profile] of Array.from(demoProfilesByUserId.entries())) {
    if (profile.id === driverId) {
      const updated = {
        ...profile,
        isAvailable,
        updatedAt: /* @__PURE__ */ new Date()
      };
      demoProfilesByUserId.set(userId, updated);
      return;
    }
  }
}
function createDefaultDemoVehicle(driverId) {
  const now = /* @__PURE__ */ new Date();
  const vehicle = {
    id: nextDemoVehicleId++,
    driverId,
    type: "carro",
    brand: "Demo",
    model: "Sedan",
    year: 2024,
    plate: "DEM0A00",
    color: "Prata",
    photoUrl: null,
    status: "active",
    createdAt: now,
    updatedAt: now
  };
  demoVehiclesById.set(vehicle.id, vehicle);
  demoVehiclesByDriverId.set(driverId, [vehicle]);
  return vehicle;
}
function getDemoPendingDriverProfiles() {
  return Array.from(demoProfilesByUserId.values()).filter((p) => p.status === "pending");
}
function updateDemoDriverProfileStatus(driverId, status) {
  for (const [userId, profile] of Array.from(demoProfilesByUserId.entries())) {
    if (profile.id === driverId) {
      demoProfilesByUserId.set(userId, {
        ...profile,
        status,
        updatedAt: /* @__PURE__ */ new Date()
      });
      return true;
    }
  }
  return false;
}
function createDemoPendingDriverProfile(input) {
  const now = /* @__PURE__ */ new Date();
  const profile = {
    id: nextDemoProfileId++,
    userId: input.userId,
    cpf: input.cpf ?? null,
    cnh: input.cnh ?? null,
    cnhImageUrl: input.cnhImageUrl ?? null,
    status: "pending",
    rating: 0,
    totalRides: 0,
    isAvailable: false,
    createdAt: now,
    updatedAt: now
  };
  demoProfilesByUserId.set(input.userId, profile);
  return profile;
}
function createDemoDriverProfile(input) {
  const existing = demoProfilesByUserId.get(input.userId);
  if (existing) return existing;
  const now = /* @__PURE__ */ new Date();
  const profile = {
    id: nextDemoProfileId++,
    userId: input.userId,
    cpf: input.cpf ?? null,
    cnh: input.cnh ?? null,
    cnhImageUrl: input.cnhImageUrl ?? null,
    status: "approved",
    rating: 480,
    totalRides: 0,
    isAvailable: true,
    createdAt: now,
    updatedAt: now
  };
  demoProfilesByUserId.set(input.userId, profile);
  createDefaultDemoVehicle(profile.id);
  return profile;
}
function getDemoRideDriverDetails(ride) {
  if (!ride.driverId) return null;
  if (isDemoSimulationDriverId(ride.driverId)) {
    const { vehicle: vehicle2 } = ensureDemoSimulationDriver();
    return {
      driverName: DEMO_SIMULATION_DRIVER_NAME,
      rating: "4.9",
      vehicleBrand: vehicle2.brand ?? "Demo",
      vehicleModel: vehicle2.model ?? "Sedan Simula\xE7\xE3o",
      vehiclePlate: vehicle2.plate ?? "SIM0A00",
      vehicleColor: vehicle2.color ?? "Laranja",
      vehicleType: vehicle2.type ?? ride.vehicleType ?? "carro"
    };
  }
  const profile = getDemoDriverProfileById(ride.driverId);
  const vehicle = ride.vehicleId ? getDemoVehicleById(ride.vehicleId) : null;
  const fallbackVehicle = vehicle ?? getDemoVehiclesByDriverId(ride.driverId)[0];
  return {
    driverName: "Jo\xE3o Demo",
    rating: ((profile?.rating ?? 480) / 100).toFixed(1),
    vehicleBrand: fallbackVehicle?.brand ?? "Demo",
    vehicleModel: fallbackVehicle?.model ?? "Sedan",
    vehiclePlate: fallbackVehicle?.plate ?? "DEM0A00",
    vehicleColor: fallbackVehicle?.color ?? "Prata",
    vehicleType: fallbackVehicle?.type ?? ride.vehicleType ?? "carro"
  };
}
function createDemoVehicle(driverId, input) {
  const now = /* @__PURE__ */ new Date();
  const vehicle = {
    id: nextDemoVehicleId++,
    driverId,
    type: input.type,
    brand: input.brand ?? null,
    model: input.model ?? null,
    year: input.year ?? null,
    plate: input.plate,
    color: input.color ?? null,
    photoUrl: input.photoUrl ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now
  };
  demoVehiclesById.set(vehicle.id, vehicle);
  const list = demoVehiclesByDriverId.get(driverId) ?? [];
  demoVehiclesByDriverId.set(driverId, [vehicle, ...list]);
  return vehicle;
}

// server/_core/demoAdminFinance.ts
var financeConfig = buildDefaultFinanceConfig(
  ENV.platformFeePercent
);
var cancellationAudit = [];
var demoCoupons = /* @__PURE__ */ new Map();
var nextDemoCouponId = 700001;
var demoPendingReviews = /* @__PURE__ */ new Map();
var seededPending = false;
var seededCoupons = false;
function getDemoFinanceConfig() {
  return financeConfig;
}
function updateDemoFinanceConfig(patch) {
  financeConfig = mergeFinanceConfig(financeConfig, patch);
  return financeConfig;
}
function hydrateDemoFinanceState(payload) {
  if (payload.config) {
    financeConfig = mergeFinanceConfig(buildDefaultFinanceConfig(), payload.config);
  }
  if (payload.cancellationAudit?.length) {
    for (const entry of payload.cancellationAudit) {
      if (!cancellationAudit.some((e) => e.id === entry.id)) {
        cancellationAudit.unshift(entry);
      }
    }
    cancellationAudit.sort(
      (a, b) => new Date(b.cancelledAt).getTime() - new Date(a.cancelledAt).getTime()
    );
  }
  if (payload.coupons?.length) {
    for (const coupon of payload.coupons) {
      demoCoupons.set(coupon.id, coupon);
      if (coupon.id >= nextDemoCouponId) nextDemoCouponId = coupon.id + 1;
    }
  }
  if (payload.pendingDrivers?.length) {
    for (const driver of payload.pendingDrivers) {
      demoPendingReviews.set(driver.driverId, driver);
    }
  }
}
function ensureDemoPendingDriverSeeds() {
  if (seededPending || ENV.isProduction) return;
  seededPending = true;
  if (getDemoPendingDriverProfiles().length > 0) return;
  const samples = [
    { userId: 910001, name: "Carlos Silva", cpf: "123.456.789-00", cnh: "12345678900" },
    { userId: 910002, name: "Ana Souza", cpf: "987.654.321-00", cnh: "98765432100" }
  ];
  for (const sample of samples) {
    const profile = createDemoPendingDriverProfile({
      userId: sample.userId,
      cpf: sample.cpf,
      cnh: sample.cnh,
      cnhImageUrl: "/demo-cnh-placeholder.png"
    });
    demoPendingReviews.set(profile.id, {
      driverId: profile.id,
      userId: sample.userId,
      name: sample.name,
      email: `${sample.name.split(" ")[0].toLowerCase()}@demo.fui`,
      cpf: sample.cpf,
      cnh: sample.cnh,
      cnhImageUrl: profile.cnhImageUrl ?? void 0,
      submittedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
function getDemoPendingDriverReviews() {
  ensureDemoPendingDriverSeeds();
  const fromProfiles = getDemoPendingDriverProfiles().map((profile) => {
    const cached = demoPendingReviews.get(profile.id);
    return cached ?? {
      driverId: profile.id,
      userId: profile.userId,
      name: `Motorista #${profile.id}`,
      cpf: profile.cpf ?? void 0,
      cnh: profile.cnh ?? void 0,
      cnhImageUrl: profile.cnhImageUrl ?? void 0,
      submittedAt: profile.createdAt.toISOString()
    };
  });
  return fromProfiles.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}
function approveDemoDriverReview(driverId) {
  const ok = updateDemoDriverProfileStatus(driverId, "approved");
  if (ok) demoPendingReviews.delete(driverId);
  return ok;
}
function rejectDemoDriverReview(driverId) {
  const ok = updateDemoDriverProfileStatus(driverId, "rejected");
  if (ok) demoPendingReviews.delete(driverId);
  return ok;
}
function recordCancellationAudit(input) {
  const entry = {
    id: `cancel-${input.entityType}-${input.entityId}-${Date.now()}`,
    entityType: input.entityType,
    entityId: input.entityId,
    origin: input.origin,
    reason: input.reason,
    cancelledAt: (/* @__PURE__ */ new Date()).toISOString(),
    cancelledByUserId: input.cancelledByUserId,
    cancelledByLabel: input.cancelledByLabel
  };
  cancellationAudit.unshift(entry);
  if (cancellationAudit.length > 200) cancellationAudit.pop();
  return entry;
}
function getCancellationAuditLog(limit = 50) {
  return cancellationAudit.slice(0, limit);
}
function ensureDemoCouponSeeds() {
  if (seededCoupons || ENV.isProduction) return;
  seededCoupons = true;
  if (demoCoupons.size > 0) return;
  const now = /* @__PURE__ */ new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  createDemoAdminCoupon({
    code: "FUI10",
    description: "10% na primeira corrida",
    discountType: "percentage",
    discountValue: 10,
    maxUses: 500,
    validFrom: now.toISOString(),
    validUntil: nextMonth.toISOString()
  });
  createDemoAdminCoupon({
    code: "ENTREGA5",
    description: "R$ 5 em entregas",
    discountType: "fixed",
    discountValue: 500,
    validFrom: now.toISOString(),
    validUntil: nextMonth.toISOString()
  });
}
function getDemoAdminCoupons() {
  ensureDemoCouponSeeds();
  return Array.from(demoCoupons.values()).sort((a, b) => a.code.localeCompare(b.code));
}
function createDemoAdminCoupon(input) {
  const coupon = {
    id: nextDemoCouponId++,
    usedCount: 0,
    isActive: input.isActive ?? true,
    ...input,
    code: input.code.toUpperCase()
  };
  demoCoupons.set(coupon.id, coupon);
  return coupon;
}
function toggleDemoAdminCoupon(id, isActive) {
  const coupon = demoCoupons.get(id);
  if (!coupon) return void 0;
  const updated = { ...coupon, isActive };
  demoCoupons.set(id, updated);
  return updated;
}

// server/_core/demoRide.ts
var DEMO_RIDE_ID_START = 900001;
var demoRides = /* @__PURE__ */ new Map();
var nextDemoRideId = DEMO_RIDE_ID_START;
function isDemoRideId(rideId) {
  return rideId >= DEMO_RIDE_ID_START;
}
function getDemoRide(rideId) {
  return demoRides.get(rideId);
}
function buildDemoRide(values) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: values.id,
    passengerId: values.passengerId,
    driverId: values.driverId ?? null,
    vehicleId: values.vehicleId ?? null,
    status: values.status ?? "requested",
    vehicleType: values.vehicleType,
    originAddress: values.originAddress,
    originLat: values.originLat,
    originLng: values.originLng,
    destinationAddress: values.destinationAddress,
    destinationLat: values.destinationLat,
    destinationLng: values.destinationLng,
    driverCurrentLat: values.driverCurrentLat ?? null,
    driverCurrentLng: values.driverCurrentLng ?? null,
    distance: values.distance ?? null,
    duration: values.duration ?? null,
    estimatedPrice: values.estimatedPrice ?? null,
    finalPrice: values.finalPrice ?? null,
    paymentMethod: values.paymentMethod,
    paymentStatus: values.paymentStatus ?? "pending",
    stripePaymentIntentId: values.stripePaymentIntentId ?? null,
    couponId: values.couponId ?? null,
    couponCode: values.couponCode ?? null,
    discountAmount: values.discountAmount ?? 0,
    isShared: values.isShared ?? false,
    maxPassengers: values.maxPassengers ?? 1,
    currentPassengers: values.currentPassengers ?? 1,
    pricePerPassenger: values.pricePerPassenger ?? null,
    isFreight: values.isFreight ?? false,
    cargoWeight: values.cargoWeight ?? null,
    cargoType: values.cargoType ?? null,
    cargoDescription: values.cargoDescription ?? null,
    needsHelpers: values.needsHelpers ?? false,
    numberOfHelpers: values.numberOfHelpers ?? 0,
    shareToken: values.shareToken ?? `demo-${values.id}`,
    sosActivated: false,
    sosActivatedAt: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
    scheduledFor: values.scheduledFor ?? null,
    isScheduled: values.isScheduled ?? "no",
    cancelledBy: null,
    cancellationReason: null,
    passengerPremiumMeta: values.passengerPremiumMeta ?? null
  };
}
function createDemoRide(values) {
  const id = nextDemoRideId++;
  const ride = buildDemoRide({ ...values, id });
  demoRides.set(id, ride);
  return ride;
}
function getAllDemoRides() {
  return Array.from(demoRides.values());
}
function sortRidesNewestFirst(list) {
  return [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function getDemoPassengerRides(passengerId) {
  return sortRidesNewestFirst(
    Array.from(demoRides.values()).filter((ride) => ride.passengerId === passengerId)
  );
}
function getDemoDriverRides(driverId, options) {
  return sortRidesNewestFirst(
    Array.from(demoRides.values()).filter((ride) => {
      if (ride.driverId !== driverId) return false;
      if (!options?.includeCancelled && ride.status === "cancelled") return false;
      return true;
    })
  );
}
function parseRideDates(ride) {
  return {
    ...ride,
    createdAt: new Date(ride.createdAt),
    updatedAt: new Date(ride.updatedAt),
    completedAt: ride.completedAt ? new Date(ride.completedAt) : null,
    cancelledAt: ride.cancelledAt ? new Date(ride.cancelledAt) : null,
    scheduledFor: ride.scheduledFor ? new Date(ride.scheduledFor) : null,
    sosActivatedAt: ride.sosActivatedAt ? new Date(ride.sosActivatedAt) : null
  };
}
function hydrateDemoRides(rides2) {
  for (const raw of rides2) {
    if (!isDemoRideId(raw.id)) continue;
    const ride = parseRideDates(raw);
    const existing = demoRides.get(ride.id);
    if (existing && existing.updatedAt.getTime() > ride.updatedAt.getTime()) {
      continue;
    }
    demoRides.set(ride.id, ride);
    if (ride.id >= nextDemoRideId) {
      nextDemoRideId = ride.id + 1;
    }
  }
}
function updateDemoRide(rideId, updates) {
  const ride = demoRides.get(rideId);
  if (!ride) return void 0;
  const updated = { ...ride, ...updates, updatedAt: /* @__PURE__ */ new Date() };
  demoRides.set(rideId, updated);
  return updated;
}
function getDemoRequestedRides() {
  return Array.from(demoRides.values()).filter((ride) => ride.status === "requested" && ride.driverId == null).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function getDemoActiveRidesForUser(userId, driverProfileId) {
  return Array.from(demoRides.values()).filter(
    (ride) => ["requested", "accepted", "in_progress"].includes(
      ride.status
    ) && (ride.passengerId === userId || driverProfileId != null && ride.driverId === driverProfileId)
  );
}

// server/_core/demoFinancialLedger.ts
var DEMO_LEDGER_ID_START = 960001;
var entries = /* @__PURE__ */ new Map();
var nextId2 = DEMO_LEDGER_ID_START;
function entryKey(entityType, entityId) {
  return `${entityType}:${entityId}`;
}
function recordDemoLedgerEntry(input) {
  const key = entryKey(input.entityType, input.entityId);
  const existing = entries.get(key);
  if (existing) return existing;
  const entry = { ...input, id: nextId2++ };
  entries.set(key, entry);
  return entry;
}
function getDemoLedgerEntriesForDriver(driverId) {
  return Array.from(entries.values()).filter((e) => e.driverId === driverId).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}
function getAllDemoLedgerEntries() {
  return Array.from(entries.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

// server/_core/financeConfigStore.ts
init_env();
init_db();
var memoryCache = null;
async function loadFinanceConfig(user) {
  const dbInstance = await getDb();
  const useDemoStore = !dbInstance || user && !ENV.isProduction && isDemoPassenger(user);
  if (useDemoStore) {
    memoryCache = getDemoFinanceConfig();
    return memoryCache;
  }
  const fromDb = await getPlatformFinanceConfig();
  if (fromDb) {
    memoryCache = fromDb;
    return fromDb;
  }
  const defaults = buildDefaultFinanceConfig(ENV.platformFeePercent);
  await upsertPlatformFinanceConfig(defaults);
  memoryCache = defaults;
  return defaults;
}
function getFinanceConfigSync() {
  if (memoryCache) return memoryCache;
  if (!ENV.isProduction) return getDemoFinanceConfig();
  return buildDefaultFinanceConfig(ENV.platformFeePercent);
}
async function saveFinanceConfig(patch, user) {
  const dbInstance = await getDb();
  const useDemoStore = !dbInstance || user && !ENV.isProduction && isDemoPassenger(user);
  if (useDemoStore) {
    const next2 = updateDemoFinanceConfig(patch);
    memoryCache = next2;
    return next2;
  }
  const current = await loadFinanceConfig(user);
  const next = mergeFinanceConfig(current, patch);
  await upsertPlatformFinanceConfig(next);
  memoryCache = next;
  return next;
}

// server/_core/platformFinance.ts
function getPlatformFinanceConfig2() {
  return getFinanceConfigSync();
}
function resolveCommissionPercent(config, serviceKey) {
  return config.commission.byService[serviceKey] ?? config.commission.defaultPercent;
}
function splitGrossRevenue(grossCents, serviceKey, config) {
  const cfg = config ?? getPlatformFinanceConfig2();
  const percent = resolveCommissionPercent(cfg, serviceKey);
  const commissionCents = Math.round(grossCents * percent / 100);
  return {
    grossCents,
    commissionCents,
    driverPayoutCents: grossCents - commissionCents
  };
}
function resolveServiceKeyForRide(vehicleType) {
  if (["moto", "carro", "van", "utilitario"].includes(vehicleType)) {
    return vehicleType;
  }
  return "ride";
}
function resolveMinimumPriceCents(serviceKey, vehicleType, config) {
  const cfg = config ?? getPlatformFinanceConfig2();
  const byService = cfg.minimumPrices.byService;
  if (vehicleType && byService[vehicleType] != null) {
    return byService[vehicleType];
  }
  return byService[serviceKey];
}
function applyFinanceMinimumPrice(estimatedCents, serviceKey, vehicleType, config) {
  const min = resolveMinimumPriceCents(serviceKey, vehicleType, config);
  if (min == null) return estimatedCents;
  return Math.max(estimatedCents, min);
}

// server/_core/financialLedger.ts
init_db();
function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}
function isWithinLastDays(date, days) {
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}
async function recordRideLedgerEntry(ride) {
  if (!ride.driverId) {
    throw new Error("Ride without driver cannot be ledgered");
  }
  const grossCents = ride.finalPrice ?? ride.estimatedPrice ?? 0;
  const config = await loadFinanceConfig();
  const serviceKey = resolveServiceKeyForRide(ride.vehicleType);
  const split = splitGrossRevenue(grossCents, serviceKey, config);
  const payload = {
    driverId: ride.driverId,
    entityType: "ride",
    entityId: ride.id,
    serviceKey,
    grossCents: split.grossCents,
    commissionCents: split.commissionCents,
    driverNetCents: split.driverPayoutCents,
    couponCode: ride.couponCode ?? null,
    couponDiscountCents: ride.discountAmount ?? 0,
    completedAt: (ride.completedAt ?? /* @__PURE__ */ new Date()).toISOString()
  };
  if (isDemoRideId(ride.id)) {
    return recordDemoLedgerEntry(payload);
  }
  const dbInstance = await getDb();
  if (dbInstance) {
    const row = await insertFinancialLedgerEntry(payload);
    return row;
  }
  return recordDemoLedgerEntry(payload);
}
async function recordDeliveryLedgerEntry(order) {
  if (!order.driverId) return null;
  const grossCents = order.finalPrice ?? order.estimatedPrice ?? 0;
  const config = await loadFinanceConfig();
  const split = splitGrossRevenue(grossCents, "delivery", config);
  const payload = {
    driverId: order.driverId,
    entityType: "delivery",
    entityId: order.id,
    serviceKey: "delivery",
    grossCents: split.grossCents,
    commissionCents: split.commissionCents,
    driverNetCents: split.driverPayoutCents,
    couponCode: null,
    couponDiscountCents: 0,
    completedAt: (order.deliveredAt ?? /* @__PURE__ */ new Date()).toISOString()
  };
  if (isDemoDeliveryId(order.id)) {
    return recordDemoLedgerEntry(payload);
  }
  const dbInstance = await getDb();
  if (dbInstance) {
    return insertFinancialLedgerEntry(payload);
  }
  return recordDemoLedgerEntry(payload);
}
async function getLedgerEntriesForDriver(driverId) {
  const dbInstance = await getDb();
  const demoEntries = getDemoLedgerEntriesForDriver(driverId);
  if (!dbInstance) {
    return demoEntries;
  }
  const prodEntries = await getFinancialLedgerByDriver(driverId);
  const merged = /* @__PURE__ */ new Map();
  for (const e of [...prodEntries, ...demoEntries]) {
    merged.set(`${e.entityType}:${e.entityId}`, e);
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}
async function getAllLedgerEntries() {
  const dbInstance = await getDb();
  const demoEntries = getAllDemoLedgerEntries();
  if (!dbInstance) {
    return demoEntries;
  }
  const prodEntries = await getAllFinancialLedgerEntries();
  const merged = /* @__PURE__ */ new Map();
  for (const e of [...prodEntries, ...demoEntries]) {
    merged.set(`${e.entityType}:${e.entityId}`, e);
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}
function aggregateLedgerSummary(entries2, periodLabel) {
  let grossRevenueCents = 0;
  let platformCommissionCents = 0;
  let couponDiscountCents = 0;
  let completedRides = 0;
  let completedDeliveries = 0;
  for (const e of entries2) {
    grossRevenueCents += e.grossCents;
    platformCommissionCents += e.commissionCents;
    couponDiscountCents += e.couponDiscountCents;
    if (e.entityType === "ride") completedRides++;
    else completedDeliveries++;
  }
  return {
    grossRevenueCents,
    platformCommissionCents,
    driverNetCents: grossRevenueCents - platformCommissionCents,
    completedRides,
    completedDeliveries,
    couponDiscountCents,
    periodLabel
  };
}
function buildDriverEarningsFromLedger(entries2) {
  const now = /* @__PURE__ */ new Date();
  const today = entries2.filter((e) => isSameDay(new Date(e.completedAt), now));
  const week = entries2.filter((e) => isWithinLastDays(new Date(e.completedAt), 7));
  const sumNet = (list) => list.reduce((s, e) => s + e.driverNetCents, 0);
  const sumGross = (list) => list.reduce((s, e) => s + e.grossCents, 0);
  const sumCommission = (list) => list.reduce((s, e) => s + e.commissionCents, 0);
  const todayRides = today.filter((e) => e.entityType === "ride").length;
  const weekRides = week.filter((e) => e.entityType === "ride").length;
  const todayDeliveries = today.filter((e) => e.entityType === "delivery").length;
  const weekDeliveries = week.filter((e) => e.entityType === "delivery").length;
  const todayCount = today.length;
  const weekCount = week.length;
  const todayNet = sumNet(today);
  return {
    todayTotalCents: todayNet,
    todayGrossCents: sumGross(today),
    todayCommissionCents: sumCommission(today),
    weekTotalCents: sumNet(week),
    weekGrossCents: sumGross(week),
    weekCommissionCents: sumCommission(week),
    todayRideCount: todayRides,
    weekRideCount: weekRides,
    todayDeliveryCount: todayDeliveries,
    weekDeliveryCount: weekDeliveries,
    todayAvgTicketCents: todayCount > 0 ? Math.round(todayNet / todayCount) : 0,
    weekAvgTicketCents: weekCount > 0 ? Math.round(sumNet(week) / weekCount) : 0
  };
}
function buildDriverStatementFromLedger(entries2, rides2, deliveries) {
  const rideById = new Map(rides2.map((r) => [r.id, r]));
  const deliveryById = new Map(deliveries.map((d) => [d.id, d]));
  const VEHICLE_LABELS4 = {
    moto: "Moto",
    carro: "Carro",
    van: "Van",
    utilitario: "Utilit\xE1rio"
  };
  return entries2.map((e) => {
    if (e.entityType === "ride") {
      const ride = rideById.get(e.entityId);
      return {
        id: e.entityId,
        type: "ride",
        date: e.completedAt,
        originLabel: ride?.originAddress ?? "\u2014",
        destinationLabel: ride?.destinationAddress ?? "\u2014",
        amountCents: e.driverNetCents,
        grossCents: e.grossCents,
        commissionCents: e.commissionCents,
        couponCode: e.couponCode ?? void 0,
        serviceLabel: ride ? VEHICLE_LABELS4[ride.vehicleType] ?? ride.vehicleType : e.serviceKey
      };
    }
    const order = deliveryById.get(e.entityId);
    return {
      id: e.entityId,
      type: "delivery",
      date: e.completedAt,
      originLabel: order?.pickupAddress ?? "\u2014",
      destinationLabel: order?.deliveryAddress ?? "\u2014",
      amountCents: e.driverNetCents,
      grossCents: e.grossCents,
      commissionCents: e.commissionCents,
      serviceLabel: "Entrega"
    };
  });
}
function applyNetToLegacyEarnings(summary, rides2, deliveries) {
  const config = getFinanceConfigSync();
  let todayNet = 0;
  let weekNet = 0;
  let todayGross = 0;
  let weekGross = 0;
  const now = /* @__PURE__ */ new Date();
  const process2 = (gross, serviceKey, at) => {
    const split = splitGrossRevenue(gross, serviceKey, config);
    if (isSameDay(at, now)) {
      todayNet += split.driverPayoutCents;
      todayGross += split.grossCents;
    }
    if (isWithinLastDays(at, 7)) {
      weekNet += split.driverPayoutCents;
      weekGross += split.grossCents;
    }
  };
  for (const r of rides2.filter((x) => x.status === "completed")) {
    const at = r.completedAt ? new Date(r.completedAt) : /* @__PURE__ */ new Date();
    process2(r.finalPrice ?? r.estimatedPrice ?? 0, r.vehicleType, at);
  }
  for (const d of deliveries.filter((x) => x.status === "delivered")) {
    const at = d.deliveredAt ? new Date(d.deliveredAt) : /* @__PURE__ */ new Date();
    process2(d.finalPrice ?? d.estimatedPrice ?? 0, "delivery", at);
  }
  if (summary.todayTotalCents === 0 && todayNet > 0) {
    return { ...summary, todayTotalCents: todayNet, todayGrossCents: todayGross, weekTotalCents: weekNet, weekGrossCents: weekGross };
  }
  return summary;
}

// server/routers/delivery.ts
init_deliveryPremium();
var createInputSchema = z7.object({
  pickupAddress: z7.string().min(1),
  pickupLat: z7.string(),
  pickupLng: z7.string(),
  pickupContactName: z7.string().optional(),
  pickupContactPhone: z7.string().optional(),
  deliveryAddress: z7.string().min(1),
  deliveryLat: z7.string(),
  deliveryLng: z7.string(),
  recipientName: z7.string().min(1),
  recipientPhone: z7.string().min(1),
  packageType: z7.enum([
    "documento",
    "pacote_pequeno",
    "pacote_medio",
    "pacote_grande",
    "alimento",
    "outro"
  ]),
  packageDescription: z7.string().optional(),
  estimatedWeight: z7.number().optional(),
  isFragile: z7.boolean().optional(),
  requiresSignature: z7.boolean().optional(),
  distance: z7.number().optional(),
  duration: z7.number().optional(),
  estimatedPrice: z7.number(),
  paymentMethod: z7.enum(["pix", "card", "cash"])
});
var deliveryRouter = router({
  /**
   * Restaura entregas demo do localStorage do cliente para memória do servidor.
   */
  hydrateDemoState: protectedProcedure.input(z7.object({ orders: z7.array(z7.unknown()) })).mutation(({ input }) => {
    hydrateDemoDeliveryOrders(input.orders);
    return { success: true, count: input.orders.length };
  }),
  /**
   * Create a new delivery order
   */
  create: protectedProcedure.input(createInputSchema).mutation(async ({ ctx, input }) => {
    if (isDemoPassenger(ctx.user)) {
      const order = createDemoDeliveryOrder({
        senderId: ctx.user.id,
        ...input,
        isFragile: input.isFragile ?? false,
        requiresSignature: input.requiresSignature ?? false,
        paymentStatus: input.paymentMethod === "cash" ? "paid" : "pending",
        deliveryPremiumMeta: createInitialDeliveryPremiumMeta("requested")
      });
      return {
        success: true,
        orderId: order.id,
        trackingCode: order.trackingCode,
        confirmationCode: order.deliveryPremiumMeta?.confirmationCode
      };
    }
    const premiumMeta = createInitialDeliveryPremiumMeta("requested");
    const result = await createDeliveryOrder({
      senderId: ctx.user.id,
      ...input,
      isFragile: input.isFragile ?? false,
      requiresSignature: input.requiresSignature ?? false,
      deliveryPremiumMeta: premiumMeta
    });
    return {
      success: true,
      orderId: result.insertId,
      trackingCode: result.trackingCode,
      confirmationCode: premiumMeta.confirmationCode
    };
  }),
  /**
   * Detalhes completos para rastreamento (remetente)
   */
  getTrackingDetails: protectedProcedure.input(z7.object({ id: z7.number() })).query(async ({ ctx, input }) => {
    if (isDemoDeliveryId(input.id)) {
      const order2 = getDemoDeliveryOrder(input.id);
      if (!order2) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      }
      if (order2.senderId !== ctx.user.id) {
        throw new TRPCError6({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return toDeliveryTrackingDetails(order2);
    }
    const order = await getDeliveryOrderById(input.id);
    if (!order) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    if (order.senderId !== ctx.user.id) {
      throw new TRPCError6({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    return toDeliveryTrackingDetails(order);
  }),
  /**
   * Avançar status em demo (simulação motorista)
   */
  advanceDemoStatus: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ ctx, input }) => {
    if (!isDemoPassenger(ctx.user)) {
      throw new TRPCError6({ code: "FORBIDDEN", message: "Dispon\xEDvel apenas em demo local" });
    }
    const order = getDemoDeliveryOrder(input.id);
    if (!order || order.senderId !== ctx.user.id) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    if (order.status === "delivered" || order.status === "cancelled") {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "Entrega j\xE1 finalizada" });
    }
    const next = getNextDemoDeliveryStatus(order.status);
    if (!next) {
      throw new TRPCError6({
        code: "BAD_REQUEST",
        message: "Use concluir entrega para finalizar"
      });
    }
    const updated = updateDemoDeliveryStatus(input.id, next);
    return { success: true, status: updated?.status };
  }),
  /**
   * Concluir entrega com código de confirmação, prova e assinatura
   */
  completeDelivery: protectedProcedure.input(
    z7.object({
      id: z7.number(),
      confirmationCode: z7.string().min(4),
      proofOfDeliveryUrl: z7.string().optional(),
      useDemoProofPlaceholder: z7.boolean().optional(),
      signatureConfirmed: z7.boolean().optional(),
      signatureName: z7.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const finishOrder = (order2, applyUpdate) => {
      const meta = order2.deliveryPremiumMeta;
      const expected = meta?.confirmationCode;
      if (!expected || input.confirmationCode.trim() !== expected) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "C\xF3digo de confirma\xE7\xE3o inv\xE1lido"
        });
      }
      if (order2.requiresSignature && !input.signatureConfirmed) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "Esta entrega exige confirma\xE7\xE3o de assinatura"
        });
      }
      if (!["accepted", "picked_up", "in_transit"].includes(order2.status)) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "Entrega n\xE3o pode ser conclu\xEDda neste status"
        });
      }
      const proofUrl = input.proofOfDeliveryUrl ?? (input.useDemoProofPlaceholder ? getDemoProofPlaceholder(order2.id) : void 0);
      const nextMeta = {
        ...meta ?? createInitialDeliveryPremiumMeta("requested"),
        signatureConfirmed: input.signatureConfirmed ?? false,
        signatureName: input.signatureName?.trim() || void 0
      };
      const withHistory = appendDeliveryStatusEvent(nextMeta, "delivered");
      return applyUpdate(order2.id, {
        status: "delivered",
        deliveredAt: /* @__PURE__ */ new Date(),
        finalPrice: order2.finalPrice ?? order2.estimatedPrice,
        proofOfDeliveryUrl: proofUrl ?? order2.proofOfDeliveryUrl,
        deliveryPremiumMeta: withHistory
      });
    };
    if (isDemoDeliveryId(input.id)) {
      const order2 = getDemoDeliveryOrder(input.id);
      if (!order2 || order2.senderId !== ctx.user.id) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      }
      finishOrder(order2, (id, patch) => {
        updateDemoDeliveryOrder(id, patch);
      });
      const delivered2 = getDemoDeliveryOrder(input.id);
      if (delivered2) {
        try {
          await recordDeliveryLedgerEntry(delivered2);
        } catch (err) {
          console.error("[Ledger] demo delivery:", err);
        }
      }
      return { success: true };
    }
    const order = await getDeliveryOrderById(input.id);
    if (!order || order.senderId !== ctx.user.id) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    await finishOrder(order, async (id, patch) => {
      await updateDeliveryOrder(id, patch);
    });
    const delivered = await getDeliveryOrderById(input.id);
    if (delivered) {
      try {
        await recordDeliveryLedgerEntry(delivered);
      } catch (err) {
        console.error("[Ledger] production delivery:", err);
      }
    }
    return { success: true };
  }),
  /**
   * Get delivery order by ID
   */
  getById: protectedProcedure.input(z7.object({ id: z7.number() })).query(async ({ ctx, input }) => {
    if (isDemoDeliveryId(input.id)) {
      const order2 = getDemoDeliveryOrder(input.id);
      if (!order2) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      }
      if (order2.senderId !== ctx.user.id) {
        throw new TRPCError6({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return toDeliveryTrackingDetails(order2);
    }
    const order = await getDeliveryOrderById(input.id);
    if (!order) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    if (order.senderId !== ctx.user.id) {
      const driverProfile = await getDriverProfileByUserId(ctx.user.id);
      if (!driverProfile || order.driverId !== driverProfile.id) {
        throw new TRPCError6({ code: "FORBIDDEN", message: "Acesso negado" });
      }
    }
    return toDeliveryTrackingDetails(order);
  }),
  /**
   * List user's delivery orders
   */
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user)) {
      return getDemoDeliveryOrdersBySender(ctx.user.id);
    }
    return await getDeliveryOrdersByUser(ctx.user.id);
  }),
  /**
   * Cancel a delivery order
   */
  cancel: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ ctx, input }) => {
    if (isDemoDeliveryId(input.id)) {
      const order2 = getDemoDeliveryOrder(input.id);
      if (!order2) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      }
      if (order2.senderId !== ctx.user.id) {
        throw new TRPCError6({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      if (!["requested", "accepted"].includes(order2.status)) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "N\xE3o \xE9 poss\xEDvel cancelar este pedido no status atual"
        });
      }
      updateDemoDeliveryOrder(input.id, {
        status: "cancelled",
        cancelledAt: /* @__PURE__ */ new Date(),
        deliveryPremiumMeta: appendDeliveryStatusEvent(
          order2.deliveryPremiumMeta,
          "cancelled"
        )
      });
      recordCancellationAudit({
        entityType: "delivery",
        entityId: input.id,
        origin: "passenger",
        reason: "Cancelamento pelo remetente",
        cancelledByUserId: ctx.user.id
      });
      return { success: true };
    }
    const order = await getDeliveryOrderById(input.id);
    if (!order) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    if (order.senderId !== ctx.user.id) {
      throw new TRPCError6({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    if (!["requested", "accepted"].includes(order.status)) {
      throw new TRPCError6({
        code: "BAD_REQUEST",
        message: "N\xE3o \xE9 poss\xEDvel cancelar este pedido no status atual"
      });
    }
    await updateDeliveryOrder(input.id, {
      status: "cancelled",
      cancelledAt: /* @__PURE__ */ new Date()
    });
    recordCancellationAudit({
      entityType: "delivery",
      entityId: input.id,
      origin: "passenger",
      reason: "Cancelamento pelo remetente",
      cancelledByUserId: ctx.user.id
    });
    return { success: true };
  }),
  /**
   * Track delivery by tracking code (public)
   */
  track: publicProcedure.input(z7.object({ trackingCode: z7.string().min(1) })).query(async ({ input }) => {
    const demoOrder = getDemoDeliveryOrderByTrackingCode(input.trackingCode);
    if (demoOrder) {
      return toPublicDeliveryTrackInfo(demoOrder);
    }
    const order = await getDeliveryOrderByTrackingCode(input.trackingCode);
    if (!order) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "C\xF3digo de rastreio n\xE3o encontrado" });
    }
    return toPublicDeliveryTrackInfo(order);
  }),
  /**
   * Calculate delivery price
   */
  calculatePrice: publicProcedure.input(
    z7.object({
      distance: z7.number(),
      packageType: z7.enum([
        "documento",
        "pacote_pequeno",
        "pacote_medio",
        "pacote_grande",
        "alimento",
        "outro"
      ]),
      isFragile: z7.boolean().optional(),
      requiresSignature: z7.boolean().optional()
    })
  ).query(({ input }) => {
    const distanceKm = input.distance / 1e3;
    const BASE_PRICE = 500;
    const PRICE_PER_KM = 200;
    const MIN_PRICE = 800;
    const typeMultipliers = {
      documento: 1,
      pacote_pequeno: 1,
      pacote_medio: 1.2,
      pacote_grande: 1.5,
      alimento: 1.1,
      outro: 1.2
    };
    const multiplier = typeMultipliers[input.packageType] || 1;
    let price = Math.round((BASE_PRICE + PRICE_PER_KM * distanceKm) * multiplier);
    if (input.isFragile) {
      price = Math.round(price * 1.15);
    }
    if (input.requiresSignature) {
      price += 200;
    }
    price = Math.max(price, MIN_PRICE);
    return {
      estimatedPrice: price,
      breakdown: {
        base: BASE_PRICE,
        distance: Math.round(PRICE_PER_KM * distanceKm),
        typeMultiplier: multiplier,
        fragileSurcharge: input.isFragile ? Math.round(price * 0.15 / 1.15) : 0,
        signatureSurcharge: input.requiresSignature ? 200 : 0
      }
    };
  })
});

// server/routers/utilities.ts
import { z as z8 } from "zod";
import { TRPCError as TRPCError7 } from "@trpc/server";

// shared/utilities.ts
var UTILITY_STATUS_LABELS = {
  requested: "Solicitado",
  waiting_driver: "Aguardando utilit\xE1rio",
  accepted: "Aceito",
  picking_up: "Em coleta",
  in_transit: "Em deslocamento",
  arriving: "Chegando",
  completed: "Conclu\xEDdo",
  cancelled: "Cancelado"
};
function createInitialUtilityMeta(status = "requested") {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    trackingCode: generateUtilityTrackingCode(),
    statusHistory: [
      {
        status,
        label: UTILITY_STATUS_LABELS[status],
        at: now
      }
    ]
  };
}
function generateUtilityTrackingCode() {
  return "UTL" + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).substring(2, 4).toUpperCase();
}
function appendUtilityStatusEvent(meta, status) {
  const at = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...meta,
    statusHistory: [
      ...meta.statusHistory,
      { status, label: UTILITY_STATUS_LABELS[status], at }
    ]
  };
}

// server/_core/demoUtilityOffers.ts
var DEMO_UTILITY_OFFER_ID_START = 960001;
var offersById = /* @__PURE__ */ new Map();
var nextOfferId = DEMO_UTILITY_OFFER_ID_START;
function createDemoUtilityOffer(input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const offer = {
    id: nextOfferId++,
    orderId: input.orderId,
    driverId: input.driverId,
    status: "pending",
    distanceToOriginMeters: input.distanceToOriginMeters,
    offerRound: input.offerRound ?? 1,
    createdAt: now,
    updatedAt: now
  };
  offersById.set(offer.id, offer);
  return offer;
}
function getDemoUtilityOffersForOrder(orderId) {
  return Array.from(offersById.values()).filter((o) => o.orderId === orderId);
}
function getDemoUtilityPendingOfferForDriver(orderId, driverId) {
  return getDemoUtilityOffersForOrder(orderId).find(
    (o) => o.driverId === driverId && o.status === "pending"
  );
}
function driverHasDemoUtilityPendingOffer(orderId, driverId) {
  return !!getDemoUtilityPendingOfferForDriver(orderId, driverId);
}
function isDemoUtilityOfferDeclined(orderId, driverId) {
  return getDemoUtilityOffersForOrder(orderId).some(
    (o) => o.driverId === driverId && o.status === "declined"
  );
}
function updateDemoUtilityOfferStatus(offerId, status) {
  const offer = offersById.get(offerId);
  if (!offer) return void 0;
  const updated = {
    ...offer,
    status,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  offersById.set(offerId, updated);
  return updated;
}
function resolveDemoUtilityOffersOnAccept(orderId, driverId) {
  for (const offer of getDemoUtilityOffersForOrder(orderId)) {
    const status = offer.driverId === driverId && offer.status === "pending" ? "accepted" : offer.status === "pending" ? "superseded" : offer.status;
    updateDemoUtilityOfferStatus(offer.id, status);
  }
}
function declineDemoUtilityOffer(orderId, driverId) {
  const pending = getDemoUtilityPendingOfferForDriver(orderId, driverId);
  if (pending) {
    return updateDemoUtilityOfferStatus(pending.id, "declined");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const offer = {
    id: nextOfferId++,
    orderId,
    driverId,
    status: "declined",
    distanceToOriginMeters: 0,
    offerRound: 1,
    createdAt: now,
    updatedAt: now
  };
  offersById.set(offer.id, offer);
  return offer;
}
function cancelDemoUtilityOffersForOrder(orderId) {
  for (const offer of getDemoUtilityOffersForOrder(orderId)) {
    if (offer.status === "pending") {
      updateDemoUtilityOfferStatus(offer.id, "cancelled");
    }
  }
}
function exportDemoUtilityOffers() {
  return Array.from(offersById.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
function hydrateDemoUtilityOffers(offers) {
  for (const offer of offers) {
    offersById.set(offer.id, { ...offer });
    if (offer.id >= nextOfferId) nextOfferId = offer.id + 1;
  }
}
function getDemoUtilityPendingOffersForDriver(driverId) {
  return Array.from(offersById.values()).filter(
    (o) => o.driverId === driverId && o.status === "pending"
  );
}

// shared/utilityTracking.ts
function parseUtilityMapPoint(latValue, lngValue) {
  const lat = typeof latValue === "number" ? latValue : Number.parseFloat(String(latValue ?? ""));
  const lng = typeof lngValue === "number" ? lngValue : Number.parseFloat(String(lngValue ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

// server/_core/demoUtilityTracking.ts
var ITABAIANA_CENTER = { lat: -10.6833, lng: -37.425 };
function lerp(a, b, t2) {
  return a + (b - a) * Math.min(1, Math.max(0, t2));
}
function lerpPoint(from, to, t2) {
  return { lat: lerp(from.lat, to.lat, t2), lng: lerp(from.lng, to.lng, t2) };
}
function defaultDriverStart(driverId) {
  const offset = driverId % 5 * 3e-3;
  return { lat: ITABAIANA_CENTER.lat + offset, lng: ITABAIANA_CENTER.lng - offset * 0.5 };
}
function positionForStatus(order, status) {
  const origin = parseUtilityMapPoint(order.originLat, order.originLng);
  const destination = parseUtilityMapPoint(order.destinationLat, order.destinationLng);
  if (!origin || !destination) return null;
  const driverId = order.driverId ?? 0;
  const start = getDemoDriverLocationCoords(driverId) ?? defaultDriverStart(driverId);
  switch (status) {
    case "accepted":
      return lerpPoint(start, origin, 0.65);
    case "picking_up":
      return origin;
    case "in_transit":
      return lerpPoint(origin, destination, 0.45);
    case "arriving":
      return lerpPoint(origin, destination, 0.88);
    case "completed":
      return destination;
    default:
      return null;
  }
}
function formatCoord(value) {
  return value.toFixed(6);
}
function seedDemoUtilityDriverPosition(order) {
  if (!order.driverId) return order;
  const pos = positionForStatus(order, "accepted");
  if (!pos) return order;
  return updateDemoUtilityOrder(order.id, {
    driverCurrentLat: formatCoord(pos.lat),
    driverCurrentLng: formatCoord(pos.lng)
  });
}
function syncDemoUtilityDriverPositionForStatus(orderId, status, order) {
  if (!order.driverId) return order;
  const pos = positionForStatus(order, status);
  if (!pos) return order;
  return updateDemoUtilityOrder(orderId, {
    driverCurrentLat: formatCoord(pos.lat),
    driverCurrentLng: formatCoord(pos.lng)
  });
}
function tickDemoUtilityDriverPosition(order) {
  if (!order.driverId || !["in_transit", "arriving", "accepted"].includes(order.status)) {
    return order;
  }
  const origin = parseUtilityMapPoint(order.originLat, order.originLng);
  const destination = parseUtilityMapPoint(order.destinationLat, order.destinationLng);
  if (!origin || !destination) return order;
  const elapsedMs = Date.now() - new Date(order.updatedAt).getTime();
  const cycleMs = order.status === "accepted" ? 9e4 : 12e4;
  const baseT = order.status === "accepted" ? 0.45 : order.status === "in_transit" ? 0.35 : 0.78;
  const drift = Math.min(0.35, elapsedMs / cycleMs);
  const t2 = Math.min(0.95, baseT + drift);
  const from = order.status === "accepted" ? defaultDriverStart(order.driverId) : origin;
  const to = order.status === "accepted" ? origin : destination;
  const pos = lerpPoint(from, to, t2);
  const lat = formatCoord(pos.lat);
  const lng = formatCoord(pos.lng);
  if (order.driverCurrentLat === lat && order.driverCurrentLng === lng) {
    return order;
  }
  return updateDemoUtilityOrder(order.id, {
    driverCurrentLat: lat,
    driverCurrentLng: lng
  }) ?? order;
}
function withLiveUtilityTracking(order) {
  return tickDemoUtilityDriverPosition(order);
}

// server/_core/demoUtilities.ts
var DEMO_UTILITY_ID_START = 850001;
var demoOrders2 = /* @__PURE__ */ new Map();
var nextDemoUtilityId = DEMO_UTILITY_ID_START;
function isDemoUtilityId(id) {
  return id >= DEMO_UTILITY_ID_START;
}
function hydrateDemoUtilityOrders(orders) {
  for (const order of orders) {
    demoOrders2.set(order.id, { ...order });
    if (order.id >= nextDemoUtilityId) nextDemoUtilityId = order.id + 1;
  }
}
function exportDemoUtilityOrders() {
  return Array.from(demoOrders2.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
function createDemoUtilityOrder(values) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = nextDemoUtilityId++;
  const order = {
    ...values,
    id,
    driverId: values.driverId ?? null,
    utilityMeta: values.utilityMeta ?? createInitialUtilityMeta(values.status),
    createdAt: now,
    updatedAt: now,
    completedAt: values.completedAt ?? null,
    cancelledAt: values.cancelledAt ?? null
  };
  demoOrders2.set(id, order);
  return order;
}
function getDemoUtilityOrder(id) {
  return demoOrders2.get(id);
}
function getDemoUtilityOrdersBySender(senderId) {
  return Array.from(demoOrders2.values()).filter((o) => o.senderId === senderId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function getDemoUtilityOrdersByDriver(driverId) {
  return Array.from(demoOrders2.values()).filter((o) => o.driverId === driverId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function getDemoAvailableUtilityOrders() {
  return Array.from(demoOrders2.values()).filter((o) => !o.driverId && (o.status === "waiting_driver" || o.status === "requested")).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function acceptDemoUtilityOrder(orderId, driverId) {
  const order = demoOrders2.get(orderId);
  if (!order || order.driverId || !["waiting_driver", "requested"].includes(order.status)) {
    return void 0;
  }
  const utilityMeta = appendUtilityStatusEvent(order.utilityMeta, "accepted");
  const updated = updateDemoUtilityOrder(orderId, {
    driverId,
    status: "accepted",
    utilityMeta
  });
  if (updated) {
    resolveDemoUtilityOffersOnAccept(orderId, driverId);
    return seedDemoUtilityDriverPosition(updated);
  }
  return updated;
}
function advanceDemoUtilityStatusForDriver(id, driverId) {
  const order = demoOrders2.get(id);
  if (!order || order.driverId !== driverId) return void 0;
  return advanceDemoUtilityStatus(id);
}
function updateDemoUtilityOrder(id, patch) {
  const existing = demoOrders2.get(id);
  if (!existing) return void 0;
  const updated = {
    ...existing,
    ...patch,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  demoOrders2.set(id, updated);
  return updated;
}
var DEMO_STATUS_FLOW = [
  "requested",
  "waiting_driver",
  "accepted",
  "picking_up",
  "in_transit",
  "arriving",
  "completed"
];
function getNextDemoUtilityStatus(current) {
  if (current === "cancelled" || current === "completed") return null;
  const idx = DEMO_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= DEMO_STATUS_FLOW.length - 1) return null;
  return DEMO_STATUS_FLOW[idx + 1];
}
function advanceDemoUtilityStatus(id) {
  const order = demoOrders2.get(id);
  if (!order) return void 0;
  const next = getNextDemoUtilityStatus(order.status);
  if (!next) return order;
  const utilityMeta = appendUtilityStatusEvent(order.utilityMeta, next);
  const patch = {
    status: next,
    utilityMeta,
    completedAt: next === "completed" ? (/* @__PURE__ */ new Date()).toISOString() : order.completedAt,
    finalPrice: next === "completed" ? order.estimatedPrice : order.finalPrice,
    paymentStatus: next === "completed" && order.paymentMethod === "cash" ? "paid" : order.paymentStatus
  };
  const updated = updateDemoUtilityOrder(id, patch);
  if (updated && order.driverId) {
    return syncDemoUtilityDriverPositionForStatus(id, next, updated) ?? updated;
  }
  return updated;
}
function cancelDemoUtilityOrder(id) {
  const order = demoOrders2.get(id);
  if (!order || order.status === "completed" || order.status === "cancelled") return void 0;
  const utilityMeta = appendUtilityStatusEvent(order.utilityMeta, "cancelled");
  const updated = updateDemoUtilityOrder(id, {
    status: "cancelled",
    utilityMeta,
    cancelledAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (updated) cancelDemoUtilityOffersForOrder(id);
  return updated;
}

// shared/utilityProvider.ts
var UTILITY_SERVICE_ACCEPT_KEYS = {
  freight_fast: "acceptsFreight",
  small_move: "acceptsSmallMove",
  store_pickup: "acceptsStorePickup",
  bulky_cargo: "acceptsBulkyCargo",
  commercial_transport: "acceptsCommercial"
};
function buildDefaultUtilityProviderProfile(driverId) {
  return {
    driverId,
    vehicleType: "van",
    maxWeightKg: 500,
    maxVolumeM3: 8,
    acceptsFreight: true,
    acceptsSmallMove: true,
    acceptsStorePickup: true,
    acceptsBulkyCargo: false,
    acceptsCommercial: false,
    worksWithHelper: true,
    availableHelpers: 1,
    serviceRadiusKm: 25,
    minimumOrderCents: 5e3,
    isActive: true
  };
}

// shared/utilityDispatcher.ts
var UTILITY_VEHICLE_RANK = {
  light_utility: 1,
  pickup: 2,
  van: 3,
  small_truck: 4,
  medium_truck: 5
};
var UTILITY_SERVICE_ALLOWED_VEHICLES = {
  freight_fast: ["light_utility", "pickup", "van"],
  small_move: ["van", "small_truck"],
  store_pickup: ["light_utility", "pickup", "van"],
  bulky_cargo: ["van", "small_truck", "medium_truck"],
  commercial_transport: ["van", "small_truck", "medium_truck"]
};
function evaluateUtilityProviderMatch(order, profile, options) {
  const reasons = [];
  if (options?.declined) {
    return { compatible: false, reasons: ["declined"] };
  }
  if (!profile.isActive) {
    reasons.push("inactive");
  }
  const acceptKey = UTILITY_SERVICE_ACCEPT_KEYS[order.serviceType];
  if (!profile[acceptKey]) {
    reasons.push("service_not_accepted");
  }
  const allowed = UTILITY_SERVICE_ALLOWED_VEHICLES[order.serviceType];
  if (!allowed.includes(profile.vehicleType)) {
    reasons.push("vehicle_not_allowed");
  }
  const providerRank = UTILITY_VEHICLE_RANK[profile.vehicleType];
  const requiredRank = UTILITY_VEHICLE_RANK[order.vehicleType];
  if (providerRank < requiredRank) {
    reasons.push("vehicle_too_small");
  }
  if (order.serviceType === "commercial_transport") {
    const weight2 = order.cargo.estimatedWeightKg ?? 0;
    const volume2 = order.cargo.estimatedVolumeM3 ?? 0;
    if ((weight2 > 800 || volume2 > 12) && profile.vehicleType === "van") {
      reasons.push("vehicle_too_small");
    }
    if ((weight2 > 1500 || volume2 > 20) && profile.vehicleType === "small_truck") {
      reasons.push("vehicle_too_small");
    }
  }
  const weight = order.cargo.estimatedWeightKg ?? 0;
  if (weight > profile.maxWeightKg) {
    reasons.push("weight_exceeded");
  }
  const volume = order.cargo.estimatedVolumeM3 ?? 0;
  if (volume > 0 && volume > profile.maxVolumeM3) {
    reasons.push("volume_exceeded");
  }
  if (order.extras.needsHelper && !profile.worksWithHelper) {
    reasons.push("helpers_unavailable");
  }
  if (order.extras.needsHelper && (order.extras.helperCount ?? 1) > profile.availableHelpers) {
    reasons.push("helpers_unavailable");
  }
  const price = order.estimatedPrice ?? 0;
  if (price < profile.minimumOrderCents) {
    reasons.push("minimum_price");
  }
  if (options?.distanceToOriginMeters != null) {
    const radiusMeters = profile.serviceRadiusKm * 1e3;
    if (options.distanceToOriginMeters > radiusMeters) {
      reasons.push("out_of_radius");
    }
  }
  if (reasons.length === 0) {
    return { compatible: true, reasons: ["compatible"] };
  }
  return { compatible: false, reasons };
}

// server/_core/demoUtilityProvider.ts
var profiles = /* @__PURE__ */ new Map();
function hydrateDemoUtilityProviderProfiles(entries2) {
  for (const p of entries2) {
    profiles.set(p.driverId, { ...p });
  }
}
function exportDemoUtilityProviderProfiles() {
  return Array.from(profiles.values());
}
function getDemoUtilityProviderProfile(driverId) {
  const existing = profiles.get(driverId);
  if (existing) return existing;
  const created = buildDefaultUtilityProviderProfile(driverId);
  profiles.set(driverId, created);
  return created;
}
function updateDemoUtilityProviderProfile(driverId, patch) {
  const current = getDemoUtilityProviderProfile(driverId);
  const updated = { ...current, ...patch, driverId };
  profiles.set(driverId, updated);
  return updated;
}

// server/_core/utilityDispatcher.ts
var ITABAIANA_CENTER2 = { lat: -10.6833, lng: -37.425 };
function parseUtilityCoord(value) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}
function defaultProviderCoords(driverId) {
  const offset = driverId % 5 * 2e-3;
  return {
    lat: ITABAIANA_CENTER2.lat + offset,
    lng: ITABAIANA_CENTER2.lng - offset * 0.5
  };
}
function getProviderDistanceToOrderOriginMeters(driverId, order) {
  const originLat = parseUtilityCoord(order.originLat);
  const originLng = parseUtilityCoord(order.originLng);
  if (originLat == null || originLng == null) return null;
  const coords = getDemoDriverLocationCoords(driverId) ?? defaultProviderCoords(driverId);
  return Math.round(
    haversineMeters({ lat: originLat, lng: originLng }, coords)
  );
}
function isOrderCompatibleWithProvider(order, profile, driverId) {
  const distanceMeters = getProviderDistanceToOrderOriginMeters(driverId, order);
  const match = evaluateUtilityProviderMatch(order, profile, {
    distanceToOriginMeters: distanceMeters ?? void 0,
    declined: isDemoUtilityOfferDeclined(order.id, driverId)
  });
  return match.compatible;
}
function findCompatibleProvidersForOrder(order) {
  const eligible = [];
  for (const profile of exportDemoUtilityProviderProfiles()) {
    if (!profile.isActive) continue;
    const driverId = profile.driverId;
    if (isDemoUtilityOfferDeclined(order.id, driverId)) continue;
    const distanceToOriginMeters = getProviderDistanceToOrderOriginMeters(driverId, order);
    if (distanceToOriginMeters == null) continue;
    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters,
      declined: false
    });
    if (!match.compatible) continue;
    eligible.push({ driverId, profile, distanceToOriginMeters });
  }
  return eligible.sort((a, b) => a.distanceToOriginMeters - b.distanceToOriginMeters);
}
function createUtilityOffers(order) {
  if (order.driverId || !["waiting_driver", "requested"].includes(order.status)) {
    return;
  }
  const compatible = findCompatibleProvidersForOrder(order);
  for (const { driverId, distanceToOriginMeters } of compatible) {
    if (driverHasDemoUtilityPendingOffer(order.id, driverId)) continue;
    const existing = getDemoUtilityOffersForOrder(order.id).find(
      (o) => o.driverId === driverId && o.status !== "pending"
    );
    if (existing?.status === "declined" || existing?.status === "superseded") continue;
    createDemoUtilityOffer({
      orderId: order.id,
      driverId,
      distanceToOriginMeters,
      offerRound: 1
    });
  }
}
function ensureUtilityOffersForWaitingOrders() {
  for (const order of getDemoAvailableUtilityOrders()) {
    createUtilityOffers(order);
  }
}
function ensureUtilityOffersForProvider(driverId) {
  const profile = getDemoUtilityProviderProfile(driverId);
  if (!profile.isActive) return;
  for (const order of getDemoAvailableUtilityOrders()) {
    if (isDemoUtilityOfferDeclined(order.id, driverId)) continue;
    if (driverHasDemoUtilityPendingOffer(order.id, driverId)) continue;
    const existing = getDemoUtilityOffersForOrder(order.id).find(
      (o) => o.driverId === driverId
    );
    if (existing && ["declined", "superseded", "accepted"].includes(existing.status)) {
      continue;
    }
    const distanceToOriginMeters = getProviderDistanceToOrderOriginMeters(driverId, order);
    if (distanceToOriginMeters == null) continue;
    const match = evaluateUtilityProviderMatch(order, profile, {
      distanceToOriginMeters
    });
    if (!match.compatible) continue;
    createDemoUtilityOffer({
      orderId: order.id,
      driverId,
      distanceToOriginMeters,
      offerRound: 1
    });
  }
}
function getAvailableUtilityOrdersForProvider(driverId, profile) {
  const providerProfile = profile ?? getDemoUtilityProviderProfile(driverId);
  if (!providerProfile.isActive) return [];
  ensureUtilityOffersForWaitingOrders();
  ensureUtilityOffersForProvider(driverId);
  const pendingOrderIds = new Set(
    getDemoUtilityPendingOffersForDriver(driverId).map((o) => o.orderId)
  );
  return getDemoAvailableUtilityOrders().filter((order) => {
    if (!pendingOrderIds.has(order.id)) return false;
    return isOrderCompatibleWithProvider(order, providerProfile, driverId);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function hydrateDemoUtilityDispatcherState(input) {
  if (input.offers?.length) {
    hydrateDemoUtilityOffers(input.offers);
  }
}
function exportUtilityDispatcherSnapshot() {
  return {
    orders: exportDemoUtilityOrders(),
    offers: exportDemoUtilityOffers(),
    profiles: exportDemoUtilityProviderProfiles()
  };
}

// server/_core/utilityPricing.ts
var SERVICE_BASE_CENTS = {
  freight_fast: 3500,
  small_move: 8e3,
  store_pickup: 3e3,
  bulky_cargo: 5e3,
  commercial_transport: 6e3
};
var VEHICLE_SURCHARGE_CENTS = {
  light_utility: 0,
  pickup: 1500,
  van: 2500,
  small_truck: 4500,
  medium_truck: 7500
};
var DISTANCE_RATE_CENTS_PER_KM = 120;
function suggestVehicleForUtility(input) {
  const weight = input.weightKg ?? 0;
  const volume = input.volumeM3 ?? 0;
  const packages = input.packageCount ?? 1;
  if (input.serviceType === "commercial_transport" || weight > 800 || volume > 12) {
    return "medium_truck";
  }
  if (input.serviceType === "bulky_cargo" || input.serviceType === "small_move" || weight > 400 || volume > 6 || packages > 8) {
    return "small_truck";
  }
  if (weight > 150 || volume > 3 || packages > 4 || input.needsHelper) {
    return "van";
  }
  if (weight > 80 || volume > 1.5 || input.serviceType === "freight_fast") {
    return "pickup";
  }
  return "light_utility";
}
function calculateUtilityQuote(input) {
  const distanceKm = Math.max(0.5, input.distanceMeters / 1e3);
  const baseFeeCents = SERVICE_BASE_CENTS[input.serviceType];
  const distanceCents = Math.round(distanceKm * DISTANCE_RATE_CENTS_PER_KM);
  const vehicleCents = VEHICLE_SURCHARGE_CENTS[input.vehicleType];
  const extras = input.extras ?? {};
  const weight = input.cargo?.estimatedWeightKg ?? 0;
  const weightCents = weight > 50 ? Math.round((weight - 50) * 40) : 0;
  const helperCount = extras.needsHelper ? Math.max(1, extras.helperCount ?? 1) : 0;
  const helpersCents = helperCount * 2500;
  const urgencyCents = extras.isUrgent ? Math.round((baseFeeCents + distanceCents) * 0.2) : 0;
  const fragility = input.cargo?.fragility ?? "normal";
  const fragilityCents = fragility === "very_fragile" ? 2e3 : fragility === "fragile" ? 1e3 : 0;
  const stairsCents = extras.hasStairs && !extras.hasElevator ? 1500 : 0;
  const disassemblyCents = extras.needsDisassembly ? 2500 : 0;
  const assemblyCents = extras.needsAssembly ? 2500 : 0;
  const schedulingCents = extras.isScheduled ? 500 : 0;
  const totalCents = baseFeeCents + distanceCents + vehicleCents + helpersCents + urgencyCents + fragilityCents + stairsCents + disassemblyCents + assemblyCents + schedulingCents + weightCents;
  const suggestedVehicle = suggestVehicleForUtility({
    serviceType: input.serviceType,
    weightKg: weight,
    volumeM3: void 0,
    needsHelper: extras.needsHelper
  });
  return {
    baseFeeCents,
    distanceCents,
    vehicleCents,
    helpersCents,
    urgencyCents,
    fragilityCents,
    stairsCents,
    disassemblyCents,
    assemblyCents,
    schedulingCents,
    weightCents,
    totalCents,
    distanceMeters: input.distanceMeters,
    durationSeconds: input.durationSeconds,
    suggestedVehicle
  };
}

// server/routers/utilities.ts
init_db();
var serviceTypeSchema = z8.enum([
  "freight_fast",
  "small_move",
  "store_pickup",
  "bulky_cargo",
  "commercial_transport"
]);
var vehicleTypeSchema = z8.enum([
  "light_utility",
  "pickup",
  "van",
  "small_truck",
  "medium_truck"
]);
var cargoSchema = z8.object({
  itemType: z8.string().optional(),
  description: z8.string().optional(),
  estimatedWeightKg: z8.number().optional(),
  estimatedVolumeM3: z8.number().optional(),
  packageCount: z8.number().optional(),
  fragility: z8.enum(["normal", "fragile", "very_fragile"]).optional(),
  photoUrls: z8.array(z8.string()).optional(),
  roomCount: z8.number().optional(),
  itemSummary: z8.string().optional(),
  storeName: z8.string().optional(),
  storePhone: z8.string().optional(),
  companyName: z8.string().optional(),
  frequency: z8.string().optional(),
  timeWindow: z8.string().optional(),
  recurrence: z8.string().optional()
});
var extrasSchema = z8.object({
  needsHelper: z8.boolean().optional(),
  helperCount: z8.number().optional(),
  needsDisassembly: z8.boolean().optional(),
  needsAssembly: z8.boolean().optional(),
  hasStairs: z8.boolean().optional(),
  hasElevator: z8.boolean().optional(),
  isUrgent: z8.boolean().optional(),
  isScheduled: z8.boolean().optional(),
  scheduledFor: z8.string().optional(),
  notes: z8.string().optional()
});
var createInputSchema2 = z8.object({
  serviceType: serviceTypeSchema,
  originAddress: z8.string().min(1),
  originLat: z8.string(),
  originLng: z8.string(),
  destinationAddress: z8.string().min(1),
  destinationLat: z8.string(),
  destinationLng: z8.string(),
  intermediateStops: z8.array(z8.string()).optional(),
  cargo: cargoSchema,
  extras: extrasSchema,
  vehicleType: vehicleTypeSchema,
  vehicleAutoSuggested: z8.boolean().optional(),
  paymentMethod: z8.enum(["pix", "cash", "card"]),
  distance: z8.number(),
  duration: z8.number(),
  quote: z8.object({
    baseFeeCents: z8.number(),
    distanceCents: z8.number(),
    vehicleCents: z8.number(),
    helpersCents: z8.number(),
    urgencyCents: z8.number(),
    fragilityCents: z8.number(),
    stairsCents: z8.number(),
    disassemblyCents: z8.number(),
    assemblyCents: z8.number(),
    schedulingCents: z8.number(),
    weightCents: z8.number(),
    totalCents: z8.number(),
    distanceMeters: z8.number(),
    durationSeconds: z8.number(),
    suggestedVehicle: vehicleTypeSchema
  })
});
async function useDemoUtilities(user) {
  if (isDemoPassenger(user)) return true;
  return !await getDb();
}
var utilitiesRouter = router({
  hydrateDemoState: protectedProcedure.input(
    z8.object({
      orders: z8.array(z8.unknown()),
      offers: z8.array(z8.unknown()).optional()
    })
  ).mutation(({ input }) => {
    hydrateDemoUtilityOrders(input.orders);
    if (input.offers?.length) {
      hydrateDemoUtilityOffers(input.offers);
    }
    return { success: true, count: input.orders.length };
  }),
  suggestVehicle: publicProcedure.input(
    z8.object({
      serviceType: serviceTypeSchema,
      estimatedWeightKg: z8.number().optional(),
      estimatedVolumeM3: z8.number().optional(),
      packageCount: z8.number().optional(),
      needsHelper: z8.boolean().optional()
    })
  ).query(({ input }) => ({
    vehicle: suggestVehicleForUtility(input)
  })),
  calculateQuote: publicProcedure.input(
    z8.object({
      serviceType: serviceTypeSchema,
      vehicleType: vehicleTypeSchema,
      distanceMeters: z8.number().min(1),
      durationSeconds: z8.number().min(1),
      cargo: cargoSchema.optional(),
      extras: extrasSchema.optional()
    })
  ).query(({ input }) => calculateUtilityQuote(input)),
  create: protectedProcedure.input(createInputSchema2).mutation(async ({ ctx, input }) => {
    const estimatedPrice = input.quote.totalCents;
    const initialStatus = input.extras.isScheduled ? "requested" : "waiting_driver";
    const utilityMeta = createInitialUtilityMeta("requested");
    if (initialStatus === "waiting_driver") {
      utilityMeta.statusHistory.push({
        status: "waiting_driver",
        label: "Aguardando utilit\xE1rio",
        at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (await useDemoUtilities(ctx.user)) {
      const order = createDemoUtilityOrder({
        senderId: ctx.user.id,
        driverId: null,
        serviceType: input.serviceType,
        status: initialStatus,
        originAddress: input.originAddress,
        originLat: input.originLat,
        originLng: input.originLng,
        destinationAddress: input.destinationAddress,
        destinationLat: input.destinationLat,
        destinationLng: input.destinationLng,
        intermediateStops: input.intermediateStops,
        cargo: input.cargo,
        extras: input.extras,
        vehicleType: input.vehicleType,
        vehicleAutoSuggested: input.vehicleAutoSuggested ?? true,
        paymentMethod: input.paymentMethod,
        distance: input.distance,
        duration: input.duration,
        quote: input.quote,
        estimatedPrice,
        finalPrice: null,
        paymentStatus: input.paymentMethod === "cash" ? "paid" : "pending",
        utilityMeta,
        completedAt: null,
        cancelledAt: null
      });
      if (initialStatus === "waiting_driver") {
        createUtilityOffers(order);
      }
      return {
        success: true,
        orderId: order.id,
        trackingCode: order.utilityMeta.trackingCode,
        demoSnapshot: exportUtilityDispatcherSnapshot()
      };
    }
    throw new TRPCError7({
      code: "NOT_IMPLEMENTED",
      message: "Persist\xEAncia real de utilit\xE1rios em breve. Use o modo demo local."
    });
  }),
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoUtilities(ctx.user)) {
      return getDemoUtilityOrdersBySender(ctx.user.id);
    }
    return [];
  }),
  getById: protectedProcedure.input(z8.object({ id: z8.number() })).query(async ({ ctx, input }) => {
    if (isDemoUtilityId(input.id) || await useDemoUtilities(ctx.user)) {
      let order = getDemoUtilityOrder(input.id);
      if (!order) {
        throw new TRPCError7({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      }
      const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
      const isSender = order.senderId === ctx.user.id;
      const isDriver = driverProfile != null && order.driverId === driverProfile.id;
      if (!isSender && !isDriver) {
        throw new TRPCError7({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      }
      order = withLiveUtilityTracking(order);
      return order;
    }
    throw new TRPCError7({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
  }),
  cancel: protectedProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ ctx, input }) => {
    if (!isDemoUtilityId(input.id) && !await useDemoUtilities(ctx.user)) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    const existing = getDemoUtilityOrder(input.id);
    if (!existing || existing.senderId !== ctx.user.id) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    const updated = cancelDemoUtilityOrder(input.id);
    if (!updated) {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "N\xE3o \xE9 poss\xEDvel cancelar este pedido" });
    }
    return { success: true };
  }),
  advanceDemoStatus: protectedProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ ctx, input }) => {
    if (!isDemoPassenger(ctx.user) && await getDb()) {
      throw new TRPCError7({ code: "FORBIDDEN", message: "Apenas demo local" });
    }
    const order = getDemoUtilityOrder(input.id);
    if (!order || order.senderId !== ctx.user.id) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    const updated = advanceDemoUtilityStatus(input.id);
    return { success: true, status: updated?.status };
  }),
  exportDemoSnapshot: protectedProcedure.query(async ({ ctx }) => {
    if (!await useDemoUtilities(ctx.user)) return { orders: [] };
    return { orders: exportDemoUtilityOrders().filter((o) => o.senderId === ctx.user.id) };
  })
});

// server/routers/utilityProvider.ts
import { z as z9 } from "zod";
import { TRPCError as TRPCError9 } from "@trpc/server";

// server/_core/driverProcedure.ts
import { TRPCError as TRPCError8 } from "@trpc/server";
init_db();
var driverProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (isDemoPassenger(ctx.user)) {
    const driverProfile2 = getDemoDriverProfileByUserId(ctx.user.id);
    if (!driverProfile2) {
      throw new TRPCError8({ code: "FORBIDDEN", message: "Driver profile required" });
    }
    return next({ ctx: { ...ctx, driverProfile: driverProfile2 } });
  }
  const driverProfile = await getDriverProfileByUserId(ctx.user.id);
  if (!driverProfile) {
    throw new TRPCError8({ code: "FORBIDDEN", message: "Driver profile required" });
  }
  return next({ ctx: { ...ctx, driverProfile } });
});

// server/_core/utilityProviderOps.ts
var PLATFORM_COMMISSION_PERCENT = 15;
function splitNet(grossCents) {
  const commissionCents = Math.round(grossCents * PLATFORM_COMMISSION_PERCENT / 100);
  return { grossCents, netCents: grossCents - commissionCents };
}
function isSameDay2(a, b) {
  return a.toDateString() === b.toDateString();
}
function isWithinLastDays2(date, days) {
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}
function buildUtilityProviderEarnings(driverId) {
  const completed = getDemoUtilityOrdersByDriver(driverId).filter(
    (o) => o.status === "completed"
  );
  const now = /* @__PURE__ */ new Date();
  const today = completed.filter(
    (o) => isSameDay2(new Date(o.completedAt ?? o.createdAt), now)
  );
  const week = completed.filter(
    (o) => isWithinLastDays2(new Date(o.completedAt ?? o.createdAt), 7)
  );
  const sumNet = (list) => list.reduce((s, o) => s + splitNet(o.finalPrice ?? o.estimatedPrice ?? 0).netCents, 0);
  const todayNet = sumNet(today);
  const weekNet = sumNet(week);
  return {
    todayNetCents: todayNet,
    weekNetCents: weekNet,
    todayCount: today.length,
    weekCount: week.length,
    todayAvgTicketCents: today.length ? Math.round(todayNet / today.length) : 0,
    weekAvgTicketCents: week.length ? Math.round(weekNet / week.length) : 0
  };
}
function buildUtilityProviderStatement(driverId) {
  return getDemoUtilityOrdersByDriver(driverId).filter((o) => o.status === "completed").map((o) => {
    const gross = o.finalPrice ?? o.estimatedPrice ?? 0;
    const { netCents } = splitNet(gross);
    return {
      id: o.id,
      serviceType: o.serviceType,
      date: o.completedAt ?? o.createdAt,
      originLabel: o.originAddress,
      destinationLabel: o.destinationAddress,
      grossCents: gross,
      netCents
    };
  });
}

// server/routers/utilityProvider.ts
init_db();
var vehicleTypeSchema2 = z9.enum([
  "light_utility",
  "pickup",
  "van",
  "small_truck",
  "medium_truck"
]);
var profilePatchSchema = z9.object({
  vehicleType: vehicleTypeSchema2.optional(),
  maxWeightKg: z9.number().min(1).max(5e3).optional(),
  maxVolumeM3: z9.number().min(0.1).max(50).optional(),
  acceptsFreight: z9.boolean().optional(),
  acceptsSmallMove: z9.boolean().optional(),
  acceptsStorePickup: z9.boolean().optional(),
  acceptsBulkyCargo: z9.boolean().optional(),
  acceptsCommercial: z9.boolean().optional(),
  worksWithHelper: z9.boolean().optional(),
  availableHelpers: z9.number().min(0).max(4).optional(),
  serviceRadiusKm: z9.number().min(1).max(100).optional(),
  minimumOrderCents: z9.number().min(0).optional(),
  isActive: z9.boolean().optional()
});
async function useDemoProvider() {
  return !await getDb();
}
function demoSnapshot() {
  return exportUtilityDispatcherSnapshot();
}
var utilityProviderRouter = router({
  hydrateDemoState: driverProcedure.input(
    z9.object({
      orders: z9.array(z9.unknown()).optional(),
      profiles: z9.array(z9.unknown()).optional(),
      offers: z9.array(z9.unknown()).optional()
    })
  ).mutation(({ input }) => {
    if (input.orders?.length) hydrateDemoUtilityOrders(input.orders);
    if (input.profiles?.length) {
      hydrateDemoUtilityProviderProfiles(input.profiles);
    }
    hydrateDemoUtilityDispatcherState({
      offers: input.offers
    });
    ensureUtilityOffersForWaitingOrders();
    return { success: true, ...demoSnapshot() };
  }),
  getProfile: driverProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user) || await useDemoProvider()) {
      return getDemoUtilityProviderProfile(ctx.driverProfile.id);
    }
    throw new TRPCError9({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
  }),
  updateProfile: driverProcedure.input(profilePatchSchema).mutation(async ({ ctx, input }) => {
    if (isDemoPassenger(ctx.user) || await useDemoProvider()) {
      const updated = updateDemoUtilityProviderProfile(ctx.driverProfile.id, input);
      ensureUtilityOffersForWaitingOrders();
      return { profile: updated, demoSnapshot: demoSnapshot() };
    }
    throw new TRPCError9({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
  }),
  getAvailableOrders: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || await useDemoProvider())) return [];
    const profile = getDemoUtilityProviderProfile(ctx.driverProfile.id);
    return getAvailableUtilityOrdersForProvider(ctx.driverProfile.id, profile);
  }),
  getActiveOrders: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || await useDemoProvider())) return [];
    return getDemoUtilityOrdersByDriver(ctx.driverProfile.id).filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    );
  }),
  getOrderById: driverProcedure.input(z9.object({ id: z9.number() })).query(async ({ ctx, input }) => {
    const order = getDemoUtilityOrder(input.id);
    if (!order) throw new TRPCError9({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    const isMine = order.driverId === ctx.driverProfile.id;
    const isAvailable = !order.driverId && ["waiting_driver", "requested"].includes(order.status);
    if (!isMine && !isAvailable) {
      throw new TRPCError9({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    return withLiveUtilityTracking(order);
  }),
  acceptOrder: driverProcedure.input(z9.object({ orderId: z9.number() })).mutation(async ({ ctx, input }) => {
    if (!(isDemoPassenger(ctx.user) || await useDemoProvider())) {
      throw new TRPCError9({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
    }
    const profile = getDemoUtilityProviderProfile(ctx.driverProfile.id);
    if (!profile.isActive) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "Ative seu perfil de utilit\xE1rio" });
    }
    const order = getDemoUtilityOrder(input.orderId);
    if (!order) throw new TRPCError9({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    if (!isOrderCompatibleWithProvider(order, profile, ctx.driverProfile.id)) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "Pedido n\xE3o compat\xEDvel com seu perfil" });
    }
    const accepted = acceptDemoUtilityOrder(input.orderId, ctx.driverProfile.id);
    if (!accepted) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "Pedido j\xE1 foi aceito" });
    }
    return { success: true, order: accepted, demoSnapshot: demoSnapshot() };
  }),
  declineOrder: driverProcedure.input(z9.object({ orderId: z9.number() })).mutation(async ({ ctx, input }) => {
    declineDemoUtilityOffer(input.orderId, ctx.driverProfile.id);
    return { success: true, demoSnapshot: demoSnapshot() };
  }),
  advanceOrderStatus: driverProcedure.input(z9.object({ orderId: z9.number() })).mutation(async ({ ctx, input }) => {
    const updated = advanceDemoUtilityStatusForDriver(input.orderId, ctx.driverProfile.id);
    if (!updated) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "N\xE3o foi poss\xEDvel avan\xE7ar o status" });
    }
    return { success: true, order: updated, demoSnapshot: demoSnapshot() };
  }),
  getEarningsSummary: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || await useDemoProvider())) {
      return {
        todayNetCents: 0,
        weekNetCents: 0,
        todayCount: 0,
        weekCount: 0,
        todayAvgTicketCents: 0,
        weekAvgTicketCents: 0
      };
    }
    return buildUtilityProviderEarnings(ctx.driverProfile.id);
  }),
  getStatement: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || await useDemoProvider())) return [];
    return buildUtilityProviderStatement(ctx.driverProfile.id);
  })
});

// server/routers/utilityChat.ts
import { z as z10 } from "zod";
import { TRPCError as TRPCError10 } from "@trpc/server";

// server/_core/demoUtilityChat.ts
var messagesByOrder = /* @__PURE__ */ new Map();
var nextMessageId = 1;
function getDemoUtilityChatMessages(orderId) {
  return messagesByOrder.get(orderId) ?? [];
}
function addDemoUtilityChatMessage(orderId, senderId, message) {
  const entry = {
    id: nextMessageId++,
    orderId,
    senderId,
    message,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const list = messagesByOrder.get(orderId) ?? [];
  list.push(entry);
  messagesByOrder.set(orderId, list);
  return entry;
}
function exportDemoUtilityChatMessages() {
  return Array.from(messagesByOrder.values()).flat();
}
function hydrateDemoUtilityChatMessages(messages) {
  messagesByOrder.clear();
  for (const msg of messages) {
    const list = messagesByOrder.get(msg.orderId) ?? [];
    list.push({ ...msg });
    messagesByOrder.set(msg.orderId, list);
    if (msg.id >= nextMessageId) nextMessageId = msg.id + 1;
  }
}

// server/routers/utilityChat.ts
init_db();
async function useDemoUtilityChat() {
  return !await getDb();
}
function assertChatAccess(order, userId, driverProfileId) {
  const isSender = order.senderId === userId;
  const isDriver = driverProfileId != null && order.driverId === driverProfileId;
  if (!isSender && !isDriver) {
    throw new TRPCError10({ code: "FORBIDDEN", message: "Acesso negado ao chat" });
  }
  if (order.status === "cancelled") {
    throw new TRPCError10({ code: "BAD_REQUEST", message: "Chat indispon\xEDvel para pedido cancelado" });
  }
  if (!order.driverId) {
    throw new TRPCError10({
      code: "BAD_REQUEST",
      message: "Chat dispon\xEDvel ap\xF3s aceite do prestador"
    });
  }
}
var utilityChatRouter = router({
  hydrateDemoState: protectedProcedure.input(z10.object({ messages: z10.array(z10.unknown()) })).mutation(({ input }) => {
    hydrateDemoUtilityChatMessages(input.messages);
    return { success: true, count: input.messages.length };
  }),
  getMessages: protectedProcedure.input(z10.object({ orderId: z10.number() })).query(async ({ ctx, input }) => {
    if (!(isDemoUtilityId(input.orderId) || await useDemoUtilityChat())) {
      return [];
    }
    const order = getDemoUtilityOrder(input.orderId);
    if (!order) {
      throw new TRPCError10({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
    assertChatAccess(order, ctx.user.id, driverProfile?.id);
    return getDemoUtilityChatMessages(input.orderId);
  }),
  send: protectedProcedure.input(
    z10.object({
      orderId: z10.number(),
      message: z10.string().min(1).max(2e3)
    })
  ).mutation(async ({ ctx, input }) => {
    if (!(isDemoUtilityId(input.orderId) || await useDemoUtilityChat())) {
      throw new TRPCError10({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
    }
    const order = getDemoUtilityOrder(input.orderId);
    if (!order) {
      throw new TRPCError10({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
    }
    const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
    assertChatAccess(order, ctx.user.id, driverProfile?.id);
    const entry = addDemoUtilityChatMessage(input.orderId, ctx.user.id, input.message.trim());
    return {
      success: true,
      messageId: entry.id,
      demoSnapshot: { messages: exportDemoUtilityChatMessages() }
    };
  }),
  exportDemoSnapshot: protectedProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || await useDemoUtilityChat())) {
      return { messages: [] };
    }
    return { messages: exportDemoUtilityChatMessages() };
  })
});

// server/routers/driverPremium.ts
import { z as z11 } from "zod";

// server/_core/driverEarnings.ts
var VEHICLE_LABELS = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilit\xE1rio"
};
function rideAmount(ride) {
  return ride.finalPrice ?? ride.estimatedPrice ?? 0;
}
function deliveryAmount(order) {
  return order.finalPrice ?? order.estimatedPrice ?? 0;
}
function isSameDay3(a, b) {
  return a.toDateString() === b.toDateString();
}
function isWithinLastDays3(date, days) {
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}
function buildDriverEarningsSummary(rides2, deliveries = []) {
  const now = /* @__PURE__ */ new Date();
  const completedRides = rides2.filter((r) => r.status === "completed");
  const completedDeliveries = deliveries.filter((d) => d.status === "delivered");
  const todayRides = completedRides.filter((r) => {
    const at = r.completedAt ? new Date(r.completedAt) : null;
    return at && isSameDay3(at, now);
  });
  const weekRides = completedRides.filter((r) => {
    const at = r.completedAt ? new Date(r.completedAt) : null;
    return at && isWithinLastDays3(at, 7);
  });
  const todayDeliveries = completedDeliveries.filter((d) => {
    const at = d.deliveredAt ? new Date(d.deliveredAt) : null;
    return at && isSameDay3(at, now);
  });
  const weekDeliveries = completedDeliveries.filter((d) => {
    const at = d.deliveredAt ? new Date(d.deliveredAt) : null;
    return at && isWithinLastDays3(at, 7);
  });
  const todayTotal = todayRides.reduce((s, r) => s + rideAmount(r), 0) + todayDeliveries.reduce((s, d) => s + deliveryAmount(d), 0);
  const weekTotal = weekRides.reduce((s, r) => s + rideAmount(r), 0) + weekDeliveries.reduce((s, d) => s + deliveryAmount(d), 0);
  const todayCount = todayRides.length + todayDeliveries.length;
  const weekCount = weekRides.length + weekDeliveries.length;
  return {
    todayTotalCents: todayTotal,
    weekTotalCents: weekTotal,
    todayRideCount: todayRides.length,
    weekRideCount: weekRides.length,
    todayDeliveryCount: todayDeliveries.length,
    weekDeliveryCount: weekDeliveries.length,
    todayAvgTicketCents: todayCount > 0 ? Math.round(todayTotal / todayCount) : 0,
    weekAvgTicketCents: weekCount > 0 ? Math.round(weekTotal / weekCount) : 0
  };
}
function buildDriverStatement(rides2, deliveries = []) {
  const rideItems = rides2.filter((r) => r.status === "completed").map((r) => ({
    id: r.id,
    type: "ride",
    date: (r.completedAt ?? r.createdAt).toString(),
    originLabel: r.originAddress,
    destinationLabel: r.destinationAddress,
    amountCents: rideAmount(r),
    serviceLabel: VEHICLE_LABELS[r.vehicleType] ?? r.vehicleType
  }));
  const deliveryItems = deliveries.filter((d) => d.status === "delivered").map((d) => ({
    id: d.id,
    type: "delivery",
    date: (d.deliveredAt ?? d.createdAt).toString(),
    originLabel: d.pickupAddress,
    destinationLabel: d.deliveryAddress,
    amountCents: deliveryAmount(d),
    serviceLabel: "Entrega"
  }));
  return [...rideItems, ...deliveryItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// shared/operationalIntelligence.ts
var DEFAULT_INTELLIGENCE_PERIOD = {
  preset: "7d"
};
function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round((current - previous) / previous * 1e3) / 10;
}

// server/_core/rideDispatcher.ts
init_rideDispatcher();

// server/_core/demoRideOffers.ts
init_rideDispatcher();
var DEMO_OFFER_ID_START = 950001;
var demoOffersById = /* @__PURE__ */ new Map();
var nextDemoOfferId = DEMO_OFFER_ID_START;
function parseOfferDates(offer) {
  return {
    ...offer,
    createdAt: new Date(offer.createdAt),
    updatedAt: new Date(offer.updatedAt),
    expiresAt: new Date(offer.expiresAt ?? offer.createdAt)
  };
}
function isDemoOfferStillValid(offer, now = /* @__PURE__ */ new Date()) {
  return offer.status === "pending" && offer.expiresAt.getTime() > now.getTime();
}
function createDemoRideOffer(input) {
  const now = /* @__PURE__ */ new Date();
  const offer = {
    id: nextDemoOfferId++,
    rideId: input.rideId,
    driverId: input.driverId,
    status: "pending",
    distanceMeters: input.distanceMeters,
    offerRound: input.offerRound ?? 1,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + getDispatcherOfferTimeoutMs())
  };
  demoOffersById.set(offer.id, offer);
  return offer;
}
function getDemoOffersForRide(rideId) {
  return Array.from(demoOffersById.values()).filter((o) => o.rideId === rideId);
}
function getDemoValidPendingOffersForRide(rideId) {
  expireDemoStalePendingOffers(rideId);
  return getDemoOffersForRide(rideId).filter((o) => isDemoOfferStillValid(o));
}
function getDemoPendingOffersForDriver(driverId) {
  expireDemoStalePendingOffers();
  return Array.from(demoOffersById.values()).filter(
    (o) => o.driverId === driverId && isDemoOfferStillValid(o)
  );
}
function driverHasDemoPendingOffer(rideId, driverId) {
  return getDemoPendingOffersForDriver(driverId).some((o) => o.rideId === rideId);
}
function updateDemoOfferStatus(offerId, status) {
  const offer = demoOffersById.get(offerId);
  if (!offer) return void 0;
  const updated = { ...offer, status, updatedAt: /* @__PURE__ */ new Date() };
  demoOffersById.set(offerId, updated);
  return updated;
}
function resolveDemoOffersOnAccept(rideId, driverId) {
  for (const offer of getDemoOffersForRide(rideId)) {
    const status = offer.driverId === driverId && offer.status === "pending" ? "accepted" : offer.status === "pending" ? "superseded" : offer.status;
    updateDemoOfferStatus(offer.id, status);
  }
}
function getDemoOfferForDriver(rideId, driverId) {
  return getDemoValidPendingOffersForRide(rideId).find((o) => o.driverId === driverId);
}
function getDemoPreviouslyOfferedDriverIds(rideId) {
  return new Set(getDemoOffersForRide(rideId).map((o) => o.driverId));
}
function getDemoDriversBlockedFromReOffer(rideId) {
  const blocked = /* @__PURE__ */ new Set();
  for (const offer of getDemoOffersForRide(rideId)) {
    if (offer.status === "declined" || offer.status === "accepted" || isDemoOfferStillValid(offer)) {
      blocked.add(offer.driverId);
    }
  }
  return blocked;
}
function declineDemoRideOffer(rideId, driverId) {
  const offer = getDemoOffersForRide(rideId).find(
    (o) => o.driverId === driverId && isDemoOfferStillValid(o)
  );
  if (!offer) return void 0;
  return updateDemoOfferStatus(offer.id, "declined");
}
function countDemoDeclinedOffers(rideId) {
  return getDemoOffersForRide(rideId).filter((o) => o.status === "declined").length;
}
function getDemoMaxOfferRound(rideId) {
  const offers = getDemoOffersForRide(rideId);
  if (offers.length === 0) return 0;
  return Math.max(...offers.map((o) => o.offerRound));
}
function hydrateDemoRideOffers(offers) {
  for (const raw of offers) {
    const offer = parseOfferDates(raw);
    demoOffersById.set(offer.id, offer);
    if (offer.id >= nextDemoOfferId) {
      nextDemoOfferId = offer.id + 1;
    }
  }
  expireDemoStalePendingOffers();
}
function serializeDemoRideOffers() {
  return getAllDemoRideOffers();
}
function getAllDemoRideOffers() {
  return Array.from(demoOffersById.values());
}
function expireDemoStalePendingOffers(rideId) {
  const now = /* @__PURE__ */ new Date();
  let count = 0;
  for (const offer of Array.from(demoOffersById.values())) {
    if (rideId != null && offer.rideId !== rideId) continue;
    if (offer.status !== "pending") continue;
    if (offer.expiresAt.getTime() > now.getTime()) continue;
    updateDemoOfferStatus(offer.id, "expired");
    count++;
  }
  return count;
}
function expireDemoPendingOffersForRide(rideId) {
  let count = 0;
  for (const offer of getDemoOffersForRide(rideId)) {
    if (offer.status === "pending") {
      updateDemoOfferStatus(offer.id, "expired");
      count++;
    }
  }
  return count;
}
function getDemoNextOfferRound(rideId) {
  const max = getDemoMaxOfferRound(rideId);
  return max === 0 ? 1 : max + 1;
}

// server/_core/rideDispatcher.ts
init_rideDispatcher();

// shared/driverPremium.ts
var DEFAULT_DRIVER_SERVICE_FILTERS = {
  ride: true,
  delivery: true,
  moto: true,
  carro: true,
  van: true,
  utilitario: true
};
var DEFAULT_DAILY_GOAL_CENTS = 15e3;
var DEFAULT_DRIVER_PREMIUM_PREFERENCES = {
  dailyGoalCents: DEFAULT_DAILY_GOAL_CENTS,
  smartPause: false,
  serviceFilters: { ...DEFAULT_DRIVER_SERVICE_FILTERS }
};
function mergeDriverPreferences(patch) {
  return {
    dailyGoalCents: patch.dailyGoalCents ?? DEFAULT_DAILY_GOAL_CENTS,
    smartPause: patch.smartPause ?? false,
    serviceFilters: {
      ...DEFAULT_DRIVER_SERVICE_FILTERS,
      ...patch.serviceFilters
    }
  };
}

// server/_core/demoDriverPremium.ts
var prefsByDriverId = /* @__PURE__ */ new Map();
function getDemoDriverPremiumPrefs(driverId) {
  return prefsByDriverId.get(driverId) ?? { ...DEFAULT_DRIVER_PREMIUM_PREFERENCES };
}
function updateDemoDriverPremiumPrefs(driverId, patch) {
  const current = getDemoDriverPremiumPrefs(driverId);
  const next = mergeDriverPreferences({
    ...current,
    ...patch,
    serviceFilters: {
      ...current.serviceFilters,
      ...patch.serviceFilters
    }
  });
  prefsByDriverId.set(driverId, next);
  return next;
}
function hydrateDemoDriverPremiumPrefs(entries2) {
  for (const entry of entries2) {
    prefsByDriverId.set(entry.driverId, mergeDriverPreferences(entry.preferences));
  }
}

// server/_core/driverPrefsStore.ts
init_db();
var prodCache = /* @__PURE__ */ new Map();
function rowToPrefs(row) {
  return mergeDriverPreferences({
    dailyGoalCents: row.dailyGoalCents,
    smartPause: row.smartPause,
    serviceFilters: row.serviceFilters ? { ...DEFAULT_DRIVER_SERVICE_FILTERS, ...row.serviceFilters } : void 0
  });
}
async function loadDriverPremiumPreferences(driverId, user) {
  if (isDemoDriverProfileId(driverId) || user && isDemoPassenger(user)) {
    return getDemoDriverPremiumPrefs(driverId);
  }
  const cached = prodCache.get(driverId);
  if (cached) return cached;
  const dbInstance = await getDb();
  if (dbInstance) {
    const row = await getDriverPremiumPreferences(driverId);
    if (row) {
      const prefs = rowToPrefs(row);
      prodCache.set(driverId, prefs);
      return prefs;
    }
  }
  return { ...DEFAULT_DRIVER_PREMIUM_PREFERENCES };
}
function getDriverPremiumPreferencesSync(driverId) {
  if (isDemoDriverProfileId(driverId)) {
    return getDemoDriverPremiumPrefs(driverId);
  }
  return prodCache.get(driverId) ?? { ...DEFAULT_DRIVER_PREMIUM_PREFERENCES };
}
async function saveDriverPremiumPreferences(driverId, patch, user) {
  if (isDemoDriverProfileId(driverId) || user && isDemoPassenger(user)) {
    return updateDemoDriverPremiumPrefs(driverId, patch);
  }
  const current = await loadDriverPremiumPreferences(driverId, user);
  const next = mergeDriverPreferences({ ...current, ...patch, serviceFilters: {
    ...current.serviceFilters,
    ...patch.serviceFilters
  } });
  const dbInstance = await getDb();
  if (dbInstance) {
    await upsertDriverPremiumPreferences(driverId, next);
  }
  prodCache.set(driverId, next);
  return next;
}
function hydrateDriverPremiumPreferencesFromDemo(entries2) {
  hydrateDemoDriverPremiumPrefs(entries2);
}
function shouldDriverReceiveOffer(driverId, vehicleType, serviceType = "ride") {
  const prefs = getDriverPremiumPreferencesSync(driverId);
  if (prefs.smartPause) return false;
  if (serviceType === "ride" && !prefs.serviceFilters.ride) return false;
  if (serviceType === "delivery" && !prefs.serviceFilters.delivery) return false;
  const vt = vehicleType;
  if (["moto", "carro", "van", "utilitario"].includes(vt)) {
    return prefs.serviceFilters[vt];
  }
  return true;
}

// server/_core/driverDispatcherScore.ts
var MAX_DISTANCE_FOR_SCORE = 6e3;
var RECENT_ACCEPT_HOURS = 48;
function getRecentAcceptedOfferCount(driverId) {
  const cutoff = Date.now() - RECENT_ACCEPT_HOURS * 60 * 60 * 1e3;
  return getAllDemoRideOffers().filter(
    (o) => o.driverId === driverId && o.status === "accepted" && o.updatedAt.getTime() >= cutoff
  ).length;
}
function computeDriverDispatchScore(input) {
  let score = 0;
  if (input.isAvailable) score += 25;
  if (shouldDriverReceiveOffer(input.driverId, input.vehicleType, "ride")) score += 15;
  const proximity = input.distanceMeters <= 0 ? 35 : Math.max(0, 35 - input.distanceMeters / MAX_DISTANCE_FOR_SCORE * 35);
  score += proximity;
  const recentAccepts = getRecentAcceptedOfferCount(input.driverId);
  score += Math.min(25, recentAccepts * 10);
  return Math.round(Math.min(100, score));
}
function sortDriversByDispatchScore(drivers, vehicleType) {
  const profiles2 = getAllDemoDriverProfiles();
  const profileById = new Map(profiles2.map((p) => [p.id, p]));
  return [...drivers].sort((a, b) => {
    const profileA = profileById.get(a.driverId);
    const profileB = profileById.get(b.driverId);
    const scoreA = computeDriverDispatchScore({
      driverId: a.driverId,
      distanceMeters: a.distanceMeters,
      vehicleType,
      isAvailable: profileA?.isAvailable ?? false
    });
    const scoreB = computeDriverDispatchScore({
      driverId: b.driverId,
      distanceMeters: b.distanceMeters,
      vehicleType,
      isAvailable: profileB?.isAvailable ?? false
    });
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.distanceMeters - b.distanceMeters;
  });
}

// server/_core/rideDispatcher.ts
init_db();
var ITABAIANA_CENTER3 = { lat: -10.6833, lng: -37.425 };
function parseCoord(value) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}
function sortByDistance(drivers) {
  return [...drivers].sort((a, b) => a.distanceMeters - b.distanceMeters);
}
function sortEligibleDrivers(drivers, vehicleType) {
  if (drivers.length <= 1) return drivers;
  return sortDriversByDispatchScore(drivers, vehicleType);
}
function defaultDemoDriverCoords(driverId) {
  const base = ITABAIANA_CENTER3;
  const offset = driverId % 5 * 2e-3;
  return { lat: base.lat + offset, lng: base.lng - offset * 0.5 };
}
function findEligibleDemoDrivers(vehicleType, originLat, originLng) {
  const lat = parseCoord(originLat);
  const lng = parseCoord(originLng);
  if (lat == null || lng == null) return [];
  const origin = { lat, lng };
  const eligible = [];
  for (const profile of getAllDemoDriverProfiles()) {
    if (!profile.isAvailable || profile.status !== "approved") continue;
    if (!shouldDriverReceiveOffer(profile.id, vehicleType, "ride")) continue;
    const vehicles2 = getDemoVehiclesByDriverId(profile.id).filter(
      (v) => v.status === "active" && v.type === vehicleType
    );
    if (vehicles2.length === 0) continue;
    const coords = getDemoDriverLocationCoords(profile.id) ?? defaultDemoDriverCoords(profile.id);
    eligible.push({
      driverId: profile.id,
      lat: coords.lat,
      lng: coords.lng,
      distanceMeters: Math.round(haversineMeters(origin, coords))
    });
  }
  return sortEligibleDrivers(eligible, vehicleType);
}
function buildDemoEligibleWithFallback(vehicleType, originLat, originLng) {
  let eligible = findEligibleDemoDrivers(vehicleType, originLat, originLng);
  let usedFallback = false;
  if (eligible.length === 0) {
    usedFallback = true;
    const origin = { lat: parseCoord(originLat), lng: parseCoord(originLng) };
    const fallbackEligible = [];
    for (const profile of getAllDemoDriverProfiles()) {
      if (!profile.isAvailable || profile.status !== "approved") continue;
      if (!shouldDriverReceiveOffer(profile.id, vehicleType, "ride")) continue;
      const vehicles2 = getDemoVehiclesByDriverId(profile.id).filter(
        (v) => v.status === "active" && v.type === vehicleType
      );
      if (vehicles2.length === 0) continue;
      const coords = defaultDemoDriverCoords(profile.id);
      fallbackEligible.push({
        driverId: profile.id,
        lat: coords.lat,
        lng: coords.lng,
        distanceMeters: Math.round(haversineMeters(origin, coords))
      });
    }
    eligible = sortEligibleDrivers(fallbackEligible, vehicleType);
  }
  return { eligible, usedFallback };
}
function dispatchDemoRideOffers(rideId, vehicleType, originLat, originLng, options) {
  const requestedRound = options?.offerRound ?? 1;
  const { eligible, usedFallback } = buildDemoEligibleWithFallback(
    vehicleType,
    originLat,
    originLng
  );
  const excludeIds = options?.expandPool ? getDemoDriversBlockedFromReOffer(rideId) : getDemoPreviouslyOfferedDriverIds(rideId);
  const pool = eligible.filter((d) => !excludeIds.has(d.driverId));
  const selection = selectDriversForRound(pool, requestedRound, /* @__PURE__ */ new Set());
  let created = 0;
  for (const driver of selection.drivers) {
    if (driverHasDemoPendingOffer(rideId, driver.driverId)) continue;
    createDemoRideOffer({
      rideId,
      driverId: driver.driverId,
      distanceMeters: driver.distanceMeters,
      offerRound: selection.offerRound
    });
    created++;
  }
  return {
    offersCreated: created,
    eligibleCount: eligible.length,
    usedFallback,
    offerRound: selection.offerRound,
    expandedPool: selection.expandedPool
  };
}
function getDemoAvailableRidesForDriver(driverId) {
  const pendingOffers = getDemoPendingOffersForDriver(driverId);
  const rideIds = new Set(pendingOffers.map((o) => o.rideId));
  return getDemoRequestedRides().filter((ride) => rideIds.has(ride.id)).filter((ride) => shouldDriverReceiveOffer(driverId, ride.vehicleType, "ride")).map((ride) => {
    const offer = getDemoOfferForDriver(ride.id, driverId);
    return {
      ...ride,
      offerDistanceMeters: offer?.distanceMeters,
      offerRound: offer?.offerRound,
      offerExpiresAt: offer?.expiresAt.toISOString()
    };
  });
}
function validateDemoDriverCanAccept(rideId, driverId) {
  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "requested" || ride.driverId != null) return false;
  return driverHasDemoPendingOffer(rideId, driverId);
}
function acceptDemoRideOffers(rideId, driverId) {
  resolveDemoOffersOnAccept(rideId, driverId);
}
function declineDemoRideOfferForDriver(rideId, driverId) {
  return declineDemoRideOffer(rideId, driverId) != null;
}
async function declineProductionRideOfferForDriver(rideId, driverId) {
  return declineRideOffer(rideId, driverId);
}
async function findEligibleProductionDrivers(vehicleType, originLat, originLng) {
  const lat = parseCoord(originLat);
  const lng = parseCoord(originLng);
  if (lat == null || lng == null) return [];
  const origin = { lat, lng };
  const profiles2 = await getAvailableDrivers();
  const eligible = [];
  for (const profile of profiles2) {
    if (!shouldDriverReceiveOffer(profile.id, vehicleType, "ride")) continue;
    const vehicles2 = (await getVehiclesByDriverId(profile.id)).filter(
      (v) => v.status === "active" && v.type === vehicleType
    );
    if (vehicles2.length === 0) continue;
    const location = await getDriverLocation(profile.id);
    const coords = location ? { lat: parseCoord(location.lat), lng: parseCoord(location.lng) } : defaultDemoDriverCoords(profile.id);
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) continue;
    eligible.push({
      driverId: profile.id,
      lat: coords.lat,
      lng: coords.lng,
      distanceMeters: Math.round(haversineMeters(origin, coords))
    });
  }
  return sortByDistance(eligible);
}
async function dispatchProductionRideOffers(rideId, vehicleType, originLat, originLng, options) {
  const requestedRound = options?.offerRound ?? 1;
  let eligible = await findEligibleProductionDrivers(vehicleType, originLat, originLng);
  let usedFallback = false;
  if (eligible.length === 0) {
    usedFallback = true;
    eligible = await findEligibleProductionDrivers(vehicleType, originLat, originLng);
  }
  const excludeIds = options?.expandPool ? await getDriversBlockedFromReOffer(rideId) : await getPreviouslyOfferedDriverIdsForRide(rideId);
  const pool = eligible.filter((d) => !excludeIds.has(d.driverId));
  const selection = selectDriversForRound(pool, requestedRound, /* @__PURE__ */ new Set());
  const toCreate = [];
  for (const driver of selection.drivers) {
    const hasPending = await driverHasPendingRideOffer(rideId, driver.driverId);
    if (hasPending) continue;
    toCreate.push({
      rideId,
      driverId: driver.driverId,
      distanceMeters: driver.distanceMeters,
      offerRound: selection.offerRound
    });
  }
  if (toCreate.length > 0) {
    await createRideOffers(toCreate);
  }
  return {
    offersCreated: toCreate.length,
    eligibleCount: eligible.length,
    usedFallback,
    offerRound: selection.offerRound,
    expandedPool: selection.expandedPool
  };
}
async function getProductionAvailableRidesForDriver(driverId) {
  try {
    return await getRequestedRidesWithPendingOfferForDriver(driverId);
  } catch {
    const rides2 = await getRequestedRides();
    return rides2.filter((r) => r.driverId == null);
  }
}
async function validateProductionDriverCanAccept(rideId, driverId) {
  try {
    return await driverHasPendingRideOffer(rideId, driverId);
  } catch {
    return true;
  }
}
async function acceptProductionRideOffers(rideId, driverId) {
  try {
    await resolveRideOffersOnAccept(rideId, driverId);
  } catch (error) {
    console.warn("[Dispatcher] resolveRideOffersOnAccept failed:", error);
  }
}
function reportDemoDriverLocation(driverId, lat, lng) {
  updateDemoDriverLocation(driverId, lat, lng);
}

// server/_core/operationalIntelligence.ts
init_db();
var RECENT_POSITIONING_HOURS = 48;
var RECENT_PEAK_WINDOW_HOURS = 3;
var VEHICLE_LABELS2 = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilit\xE1rio"
};
function inferRideAreaLabel(address) {
  for (const place of DEMO_PLACES) {
    if (address.toLowerCase().includes(place.mainText.toLowerCase())) {
      return place.mainText;
    }
  }
  const parts = address.split(",");
  return parts[0]?.trim() || "Itabaiana";
}
function areaCenter(areaLabel) {
  const place = DEMO_PLACES.find((p) => p.mainText === areaLabel);
  if (place) return { lat: place.lat, lng: place.lng };
  return { lat: -10.6833, lng: -37.425 };
}
function isAnalyticsEligible(ride) {
  return ride.status !== "cancelled";
}
function isAcceptedOrBeyond(ride) {
  return ride.driverId != null && (ride.status === "accepted" || ride.status === "in_progress" || ride.status === "completed");
}
function resolvePeriodRange(period = DEFAULT_INTELLIGENCE_PERIOD) {
  const now = /* @__PURE__ */ new Date();
  if (period.preset === "custom" && period.from) {
    const start = new Date(period.from);
    const end = period.to ? new Date(period.to) : now;
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Per\xEDodo personalizado" };
  }
  switch (period.preset) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "Hoje" };
    }
    case "yesterday": {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "Ontem" };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "\xDAltimos 30 dias" };
    }
    case "7d":
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "\xDAltimos 7 dias" };
    }
  }
}
function filterRidesInRange(rides2, start, end) {
  return rides2.filter(
    (r) => r.createdAt.getTime() >= start.getTime() && r.createdAt.getTime() <= end.getTime()
  );
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function buildDemandZones(rides2) {
  const counts = /* @__PURE__ */ new Map();
  for (const ride of rides2) {
    const area = inferRideAreaLabel(ride.originAddress);
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  const total = rides2.length || 1;
  return Array.from(counts.entries()).map(([areaLabel, rideCount]) => {
    const center = areaCenter(areaLabel);
    return {
      areaLabel,
      rideCount,
      sharePercent: Math.round(rideCount / total * 1e3) / 10,
      lat: center.lat,
      lng: center.lng
    };
  }).sort((a, b) => b.rideCount - a.rideCount);
}
function intensityTier(intensity) {
  if (intensity >= 0.7) return "high";
  if (intensity >= 0.4) return "medium";
  return "low";
}
function buildHeatPoints(zones) {
  if (zones.length === 0) return [];
  const max = Math.max(...zones.map((z14) => z14.rideCount), 1);
  return zones.map((zone) => {
    const intensity = zone.rideCount / max;
    return {
      lat: zone.lat,
      lng: zone.lng,
      weight: zone.rideCount,
      intensity,
      areaLabel: zone.areaLabel,
      tier: intensityTier(intensity)
    };
  });
}
function buildPeakHours(rides2) {
  const counts = new Array(24).fill(0);
  for (const ride of rides2) {
    counts[ride.createdAt.getHours()]++;
  }
  const total = rides2.length || 1;
  return counts.map((rideCount, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}h`,
    rideCount,
    sharePercent: Math.round(rideCount / total * 1e3) / 10
  })).sort((a, b) => b.rideCount - a.rideCount);
}
function topVehicleType(rides2) {
  const counts = /* @__PURE__ */ new Map();
  for (const ride of rides2) {
    counts.set(ride.vehicleType, (counts.get(ride.vehicleType) ?? 0) + 1);
  }
  let top = null;
  let max = 0;
  for (const [type, count] of Array.from(counts.entries())) {
    if (count > max) {
      max = count;
      top = type;
    }
  }
  return top;
}
function computeAcceptRate(rides2) {
  if (rides2.length === 0) return null;
  const accepted = rides2.filter(isAcceptedOrBeyond).length;
  return Math.round(accepted / rides2.length * 1e3) / 10;
}
function buildComparisons(allEligible) {
  const now = /* @__PURE__ */ new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);
  const todayCount = filterRidesInRange(allEligible, todayStart, todayEnd).length;
  const yesterdayCount = filterRidesInRange(allEligible, yesterdayStart, yesterdayEnd).length;
  const dayChange = percentChange(todayCount, yesterdayCount);
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);
  const thisWeekCount = filterRidesInRange(allEligible, thisWeekStart, todayEnd).length;
  const lastWeekCount = filterRidesInRange(allEligible, lastWeekStart, lastWeekEnd).length;
  const weekChange = percentChange(thisWeekCount, lastWeekCount);
  return [
    {
      id: "today-vs-yesterday",
      label: "Hoje vs ontem",
      current: todayCount,
      previous: yesterdayCount,
      changePercent: dayChange,
      tone: dayChange == null || dayChange === 0 ? "neutral" : dayChange > 0 ? "up" : "down"
    },
    {
      id: "week-vs-week",
      label: "Semana atual vs anterior",
      current: thisWeekCount,
      previous: lastWeekCount,
      changePercent: weekChange,
      tone: weekChange == null || weekChange === 0 ? "neutral" : weekChange > 0 ? "up" : "down"
    }
  ];
}
function buildTrend(comparisons) {
  const week = comparisons.find((c) => c.id === "week-vs-week");
  const day = comparisons.find((c) => c.id === "today-vs-yesterday");
  const ref = week?.changePercent ?? day?.changePercent ?? null;
  if (ref == null || Math.abs(ref) < 5) {
    return {
      direction: "stable",
      label: "Demanda est\xE1vel",
      changePercent: ref,
      detail: "Varia\xE7\xE3o dentro da faixa normal no per\xEDodo"
    };
  }
  if (ref > 0) {
    return {
      direction: "up",
      label: "Tend\xEAncia de alta",
      changePercent: ref,
      detail: `Volume ${ref}% acima da semana anterior`
    };
  }
  return {
    direction: "down",
    label: "Tend\xEAncia de queda",
    changePercent: ref,
    detail: `Volume ${Math.abs(ref)}% abaixo da semana anterior`
  };
}
function countAvailableDrivers() {
  return getAllDemoDriverProfiles().filter(
    (p) => p.isAvailable && p.status === "approved"
  ).length;
}
function buildAlerts(zones, rides2, peakHours) {
  const alerts = [];
  const top = zones[0];
  const available = countAvailableDrivers();
  if (top && top.sharePercent >= 35 && top.rideCount >= 2) {
    alerts.push({
      id: "high-demand-concentration",
      severity: top.sharePercent >= 50 ? "critical" : "warning",
      title: "Alta concentra\xE7\xE3o de demanda",
      message: `${top.sharePercent}% das solicita\xE7\xF5es em ${top.areaLabel}`,
      areaLabel: top.areaLabel
    });
  }
  if (rides2.length >= 3 && available <= 1) {
    alerts.push({
      id: "low-supply",
      severity: "critical",
      title: "Baixa oferta de motoristas",
      message: `Apenas ${available} motorista(s) dispon\xEDvel(is) para ${rides2.length} solicita\xE7\xF5es no per\xEDodo`
    });
  }
  const recentCutoff = Date.now() - RECENT_PEAK_WINDOW_HOURS * 60 * 60 * 1e3;
  const recentRides = rides2.filter((r) => r.createdAt.getTime() >= recentCutoff);
  if (recentRides.length >= 3) {
    const area = inferRideAreaLabel(recentRides[0]?.originAddress ?? "");
    alerts.push({
      id: "recent-peak",
      severity: "info",
      title: "Pico recente detectado",
      message: `${recentRides.length} solicita\xE7\xF5es nas \xFAltimas ${RECENT_PEAK_WINDOW_HOURS}h \xB7 aten\xE7\xE3o em ${area}`,
      areaLabel: area
    });
  }
  const topHour = peakHours[0];
  if (topHour && topHour.rideCount >= 2) {
    alerts.push({
      id: "peak-hour",
      severity: "info",
      title: "Hor\xE1rio de pico",
      message: `Maior volume \xE0s ${topHour.label} (${topHour.rideCount} solicita\xE7\xF5es)`
    });
  }
  return alerts.slice(0, 5);
}
function buildInsights(zones, peakHours, vehicleType, acceptRate, total, periodLabel, trend) {
  const topZone = zones[0];
  const topHour = peakHours[0];
  return [
    {
      id: "top-zone",
      title: "Regi\xE3o mais quente",
      value: topZone?.areaLabel ?? "\u2014",
      detail: topZone ? `${topZone.rideCount} corridas \xB7 ${topZone.sharePercent}% do volume` : "Sem dados no per\xEDodo",
      tone: "brand"
    },
    {
      id: "peak-hour",
      title: "Hor\xE1rio de pico",
      value: topHour && topHour.rideCount > 0 ? topHour.label : "\u2014",
      detail: topHour && topHour.rideCount > 0 ? `${topHour.rideCount} solicita\xE7\xF5es \xB7 ${topHour.sharePercent}%` : "Sem picos identificados",
      tone: "info"
    },
    {
      id: "vehicle",
      title: "Modal mais solicitado",
      value: vehicleType ? VEHICLE_LABELS2[vehicleType] ?? vehicleType : "\u2014",
      detail: vehicleType ? "Tipo predominante no per\xEDodo" : "Sem amostra",
      tone: "warning"
    },
    {
      id: "trend",
      title: "Tend\xEAncia",
      value: trend.label,
      detail: trend.detail,
      tone: trend.direction === "up" ? "success" : trend.direction === "down" ? "warning" : "info"
    },
    {
      id: "accept-rate",
      title: "Taxa de aceite",
      value: acceptRate != null ? `${acceptRate}%` : "\u2014",
      detail: acceptRate != null ? "Corridas com motorista atribu\xEDdo" : "Dados insuficientes",
      tone: acceptRate != null && acceptRate >= 60 ? "success" : "info"
    },
    {
      id: "volume",
      title: "Volume analisado",
      value: String(total),
      detail: `${periodLabel} \xB7 origens v\xE1lidas`,
      tone: "info"
    }
  ];
}
function buildPositioning(rides2, zones) {
  const recentCutoff = Date.now() - RECENT_POSITIONING_HOURS * 60 * 60 * 1e3;
  const recentCounts = /* @__PURE__ */ new Map();
  for (const ride of rides2) {
    if (ride.createdAt.getTime() < recentCutoff) continue;
    const area = inferRideAreaLabel(ride.originAddress);
    recentCounts.set(area, (recentCounts.get(area) ?? 0) + 1);
  }
  const ranked = zones.map((zone) => ({
    ...zone,
    recentRideCount: recentCounts.get(zone.areaLabel) ?? 0
  })).sort((a, b) => b.recentRideCount - a.recentRideCount || b.rideCount - a.rideCount).slice(0, 3);
  return ranked.map((zone, index) => ({
    priority: index + 1,
    areaLabel: zone.areaLabel,
    lat: zone.lat,
    lng: zone.lng,
    recentRideCount: zone.recentRideCount,
    message: zone.recentRideCount > 0 ? `Melhor \xE1rea para posicionamento: ${zone.areaLabel} (${zone.recentRideCount} chamada(s) recentes)` : `Concentra\xE7\xE3o em ${zone.areaLabel} (${zone.rideCount} corridas no per\xEDodo)`
  }));
}
function buildOperationalIntelligenceReport(rides2, period = DEFAULT_INTELLIGENCE_PERIOD) {
  const range = resolvePeriodRange(period);
  const allEligible = rides2.filter(isAnalyticsEligible).filter((r) => parseCoord(r.originLat) != null && parseCoord(r.originLng) != null);
  const eligible = filterRidesInRange(allEligible, range.start, range.end);
  const zones = buildDemandZones(eligible);
  const peakHours = buildPeakHours(eligible);
  const vehicle = topVehicleType(eligible);
  const acceptRate = computeAcceptRate(eligible);
  const comparisons = buildComparisons(allEligible);
  const trend = buildTrend(comparisons);
  const alerts = buildAlerts(zones, eligible, peakHours);
  return {
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    periodLabel: range.label,
    period,
    totalRidesAnalyzed: eligible.length,
    demandPoints: buildHeatPoints(zones),
    demandZones: zones,
    peakHours,
    insights: buildInsights(zones, peakHours, vehicle, acceptRate, eligible.length, range.label, trend),
    positioning: buildPositioning(eligible, zones),
    acceptRatePercent: acceptRate,
    topVehicleType: vehicle,
    comparisons,
    alerts,
    trend
  };
}
function getDemoOperationalIntelligence(period = DEFAULT_INTELLIGENCE_PERIOD) {
  return buildOperationalIntelligenceReport(getAllDemoRides(), period);
}
async function getProductionOperationalIntelligence(period = DEFAULT_INTELLIGENCE_PERIOD) {
  try {
    const rides2 = await getAllRides();
    return buildOperationalIntelligenceReport(rides2, period);
  } catch {
    return buildOperationalIntelligenceReport([], period);
  }
}

// server/routers/driverPremium.ts
init_db();
var serviceFiltersSchema = z11.object({
  ride: z11.boolean().optional(),
  delivery: z11.boolean().optional(),
  moto: z11.boolean().optional(),
  carro: z11.boolean().optional(),
  van: z11.boolean().optional(),
  utilitario: z11.boolean().optional()
});
async function getDriverWorkHistory(ctx) {
  if (isDemoPassenger(ctx.user)) {
    return {
      rides: getDemoDriverRides(ctx.driverProfile.id, { includeCancelled: false }),
      deliveries: getDemoDeliveryOrdersByDriver(ctx.driverProfile.id)
    };
  }
  return {
    rides: await getDriverRides(ctx.driverProfile.id),
    deliveries: await getDeliveryOrdersByDriver(ctx.driverProfile.id)
  };
}
var VEHICLE_LABELS3 = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilit\xE1rio"
};
function buildDemandInsight(report) {
  const topZone = report.demandZones[0];
  const topPosition = report.positioning[0];
  const topHour = report.peakHours[0];
  const topAlert = report.alerts[0];
  return {
    topAreaLabel: topZone?.areaLabel ?? "Centro",
    topAreaRideCount: topZone?.rideCount ?? 0,
    positioningMessage: topPosition?.message ?? "Posicione-se pr\xF3ximo ao centro da cidade.",
    bestRegionLabel: topPosition?.areaLabel ?? topZone?.areaLabel ?? "Centro",
    bestRegionMessage: topPosition?.message ?? `Maior demanda recente em ${topZone?.areaLabel ?? "Centro"}.`,
    peakHourLabel: topHour && topHour.rideCount > 0 ? topHour.label : void 0,
    topVehicleLabel: report.topVehicleType ? VEHICLE_LABELS3[report.topVehicleType] ?? report.topVehicleType : void 0,
    trendLabel: report.trend.label,
    trendDetail: report.trend.detail,
    operationalTip: topAlert?.message,
    demandZones: report.demandZones.slice(0, 5).map((z14) => ({
      areaLabel: z14.areaLabel,
      rideCount: z14.rideCount,
      sharePercent: z14.sharePercent
    })),
    heatPoints: report.demandPoints.slice(0, 8).map((p) => ({
      lat: p.lat,
      lng: p.lng,
      intensity: p.intensity,
      areaLabel: p.areaLabel
    }))
  };
}
var driverPremiumRouter = router({
  hydrateDemoPreferences: driverProcedure.input(
    z11.object({
      preferences: z11.object({
        dailyGoalCents: z11.number().optional(),
        smartPause: z11.boolean().optional(),
        serviceFilters: serviceFiltersSchema.optional()
      })
    })
  ).mutation(({ ctx, input }) => {
    if (!isDemoPassenger(ctx.user)) return { success: false };
    hydrateDriverPremiumPreferencesFromDemo([
      {
        driverId: ctx.driverProfile.id,
        preferences: input.preferences
      }
    ]);
    return { success: true };
  }),
  getPreferences: driverProcedure.query(async ({ ctx }) => {
    return loadDriverPremiumPreferences(ctx.driverProfile.id, ctx.user);
  }),
  updatePreferences: driverProcedure.input(
    z11.object({
      dailyGoalCents: z11.number().min(1e3).max(1e6).optional(),
      smartPause: z11.boolean().optional(),
      serviceFilters: serviceFiltersSchema.optional()
    })
  ).mutation(async ({ ctx, input }) => {
    return saveDriverPremiumPreferences(
      ctx.driverProfile.id,
      input,
      ctx.user
    );
  }),
  getEarningsSummary: driverProcedure.query(async ({ ctx }) => {
    const { rides: rides2, deliveries } = await getDriverWorkHistory(ctx);
    const ledger = await getLedgerEntriesForDriver(ctx.driverProfile.id);
    if (ledger.length > 0) {
      const fromLedger = buildDriverEarningsFromLedger(ledger);
      return applyNetToLegacyEarnings(fromLedger, rides2, deliveries);
    }
    const gross = buildDriverEarningsSummary(rides2, deliveries);
    return applyNetToLegacyEarnings(
      {
        todayTotalCents: 0,
        todayGrossCents: 0,
        todayCommissionCents: 0,
        weekTotalCents: 0,
        weekGrossCents: 0,
        weekCommissionCents: 0,
        todayRideCount: gross.todayRideCount,
        weekRideCount: gross.weekRideCount,
        todayDeliveryCount: gross.todayDeliveryCount,
        weekDeliveryCount: gross.weekDeliveryCount,
        todayAvgTicketCents: 0,
        weekAvgTicketCents: 0
      },
      rides2,
      deliveries
    );
  }),
  getStatement: driverProcedure.query(async ({ ctx }) => {
    const { rides: rides2, deliveries } = await getDriverWorkHistory(ctx);
    const ledger = await getLedgerEntriesForDriver(ctx.driverProfile.id);
    if (ledger.length > 0) {
      return buildDriverStatementFromLedger(ledger, rides2, deliveries);
    }
    const config = getFinanceConfigSync();
    return buildDriverStatement(rides2, deliveries).map((item) => {
      const ride = rides2.find((r) => r.id === item.id);
      const serviceKey = item.type === "delivery" ? "delivery" : ride ? resolveServiceKeyForRide(ride.vehicleType) : "ride";
      const split = splitGrossRevenue(item.amountCents, serviceKey, config);
      return {
        ...item,
        grossCents: split.grossCents,
        commissionCents: split.commissionCents,
        amountCents: split.driverPayoutCents,
        couponCode: ride?.couponCode ?? void 0
      };
    });
  }),
  getDemandInsight: driverProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    const report = isDemoPassenger(ctx.user) || !dbInstance ? getDemoOperationalIntelligence({ preset: "7d" }) : await getProductionOperationalIntelligence({ preset: "7d" });
    return buildDemandInsight(report);
  })
});

// server/routers/adminFinance.ts
import { z as z12 } from "zod";
import { TRPCError as TRPCError11 } from "@trpc/server";
init_env();

// server/_core/adminFinanceReport.ts
init_db();
async function summarizeCompletedServices(rides2, deliveries, periodLabel) {
  const config = await loadFinanceConfig();
  let grossRevenueCents = 0;
  let platformCommissionCents = 0;
  let couponDiscountCents = 0;
  for (const ride of rides2) {
    const gross = ride.finalPrice ?? ride.estimatedPrice ?? 0;
    const serviceKey = resolveServiceKeyForRide(ride.vehicleType);
    const split = splitGrossRevenue(gross, serviceKey, config);
    grossRevenueCents += split.grossCents;
    platformCommissionCents += split.commissionCents;
    couponDiscountCents += ride.discountAmount ?? 0;
  }
  for (const order of deliveries) {
    const gross = order.finalPrice ?? order.estimatedPrice ?? 0;
    const split = splitGrossRevenue(gross, "delivery", config);
    grossRevenueCents += split.grossCents;
    platformCommissionCents += split.commissionCents;
  }
  return {
    grossRevenueCents,
    platformCommissionCents,
    estimatedDriverPayoutCents: grossRevenueCents - platformCommissionCents,
    completedRides: rides2.length,
    completedDeliveries: deliveries.length,
    couponDiscountCents,
    periodLabel
  };
}
async function buildLegacyFinancialSummary(user) {
  const isDemo = isDemoPassenger(user);
  const periodLabel = isDemo ? "Demo local \xB7 estimado (sem ledger)" : "Produ\xE7\xE3o \xB7 estimado (sem ledger)";
  if (isDemo) {
    const rides3 = getAllDemoRides().filter((r) => r.status === "completed");
    const deliveries2 = getAllDemoDeliveryOrders().filter((d) => d.status === "delivered");
    return await summarizeCompletedServices(rides3, deliveries2, periodLabel);
  }
  const dbInstance = await getDb();
  if (!dbInstance) {
    return await summarizeCompletedServices([], [], periodLabel);
  }
  const allRides = await getAllRides();
  const rides2 = allRides.filter((r) => r.status === "completed");
  const deliveries = await getAllDeliveryOrders();
  const completedDeliveries = deliveries.filter((d) => d.status === "delivered");
  return await summarizeCompletedServices(rides2, completedDeliveries, periodLabel);
}
async function getAdminFinancialSummary(user) {
  const entries2 = await getAllLedgerEntries();
  const periodLabel = isDemoPassenger(user) ? "Demo local \xB7 ledger" : "Produ\xE7\xE3o \xB7 ledger";
  if (entries2.length > 0) {
    const agg = aggregateLedgerSummary(entries2, periodLabel);
    return {
      grossRevenueCents: agg.grossRevenueCents,
      platformCommissionCents: agg.platformCommissionCents,
      estimatedDriverPayoutCents: agg.driverNetCents,
      completedRides: agg.completedRides,
      completedDeliveries: agg.completedDeliveries,
      couponDiscountCents: agg.couponDiscountCents,
      periodLabel
    };
  }
  return buildLegacyFinancialSummary(user);
}

// server/routers/adminFinance.ts
init_db();
function canAccessAdminFinance(ctx) {
  if (ctx.user.role === "admin") return true;
  return !ENV.isProduction && isDemoPassenger(ctx.user);
}
var financeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canAccessAdminFinance(ctx)) {
    throw new TRPCError11({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});
var serviceKeySchema = z12.enum([
  "ride",
  "delivery",
  "moto",
  "carro",
  "van",
  "utilitario"
]);
var financeConfigPatchSchema = z12.object({
  commission: z12.object({
    defaultPercent: z12.number().min(0).max(100).optional(),
    byService: z12.record(serviceKeySchema, z12.number().min(0).max(100)).optional()
  }).optional(),
  minimumPrices: z12.object({
    regionLabel: z12.string().min(1).optional(),
    byService: z12.record(serviceKeySchema, z12.number().min(0)).optional()
  }).optional()
});
var adminFinanceRouter = router({
  hydrateDemoState: financeProcedure.input(
    z12.object({
      config: financeConfigPatchSchema.optional(),
      cancellationAudit: z12.array(z12.any()).optional(),
      coupons: z12.array(z12.any()).optional(),
      pendingDrivers: z12.array(z12.any()).optional()
    })
  ).mutation(({ ctx, input }) => {
    if (!isDemoPassenger(ctx.user)) return { success: false };
    hydrateDemoFinanceState(input);
    return { success: true };
  }),
  getConfig: financeProcedure.query(async ({ ctx }) => {
    return loadFinanceConfig(ctx.user);
  }),
  updateConfig: financeProcedure.input(financeConfigPatchSchema).mutation(async ({ ctx, input }) => {
    return saveFinanceConfig(input, ctx.user);
  }),
  getFinancialSummary: financeProcedure.query(async ({ ctx }) => {
    return getAdminFinancialSummary(ctx.user);
  }),
  getCancellationAudit: financeProcedure.input(z12.object({ limit: z12.number().min(1).max(100).optional() }).optional()).query(({ input }) => {
    return getCancellationAuditLog(input?.limit ?? 50);
  }),
  getPendingDriverReviews: financeProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user) || !await getDb()) {
      return getDemoPendingDriverReviews();
    }
    const dbInstance = await getDb();
    if (!dbInstance) return [];
    const { driverProfiles: driverProfiles2, users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq3 } = await import("drizzle-orm");
    const rows = await dbInstance.select({ profile: driverProfiles2, user: users2 }).from(driverProfiles2).innerJoin(users2, eq3(driverProfiles2.userId, users2.id)).where(eq3(driverProfiles2.status, "pending"));
    return rows.map((row) => ({
      driverId: row.profile.id,
      userId: row.user.id,
      name: row.user.name ?? "\u2014",
      email: row.user.email ?? void 0,
      cpf: row.profile.cpf ?? void 0,
      cnh: row.profile.cnh ?? void 0,
      cnhImageUrl: row.profile.cnhImageUrl ?? void 0,
      submittedAt: row.profile.createdAt.toISOString()
    }));
  }),
  approveDriverReview: financeProcedure.input(z12.object({ driverId: z12.number(), notes: z12.string().optional() })).mutation(async ({ ctx, input }) => {
    if (isDemoPassenger(ctx.user) || !await getDb()) {
      const ok = approveDemoDriverReview(input.driverId);
      if (!ok) throw new TRPCError11({ code: "NOT_FOUND", message: "Motorista n\xE3o encontrado" });
      return { success: true };
    }
    await updateDriverProfile(input.driverId, { status: "approved" });
    return { success: true };
  }),
  rejectDriverReview: financeProcedure.input(
    z12.object({
      driverId: z12.number(),
      reason: z12.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (isDemoPassenger(ctx.user) || !await getDb()) {
      const ok = rejectDemoDriverReview(input.driverId);
      if (!ok) throw new TRPCError11({ code: "NOT_FOUND", message: "Motorista n\xE3o encontrado" });
      return { success: true };
    }
    await updateDriverProfile(input.driverId, { status: "rejected" });
    return { success: true };
  }),
  getCoupons: financeProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user) || !await getDb()) {
      return getDemoAdminCoupons();
    }
    const coupons2 = await getAllCoupons();
    return coupons2.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description ?? void 0,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxUses: c.maxUses ?? void 0,
      usedCount: c.usedCount,
      validFrom: c.validFrom.toISOString(),
      validUntil: c.validUntil.toISOString(),
      isActive: c.isActive === 1
    }));
  }),
  createCoupon: financeProcedure.input(
    z12.object({
      code: z12.string().min(2),
      description: z12.string().optional(),
      discountType: z12.enum(["percentage", "fixed"]),
      discountValue: z12.number().min(1),
      maxUses: z12.number().optional(),
      validFrom: z12.string(),
      validUntil: z12.string()
    })
  ).mutation(async ({ ctx, input }) => {
    if (isDemoPassenger(ctx.user) || !await getDb()) {
      return createDemoAdminCoupon({
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUses: input.maxUses,
        validFrom: input.validFrom,
        validUntil: input.validUntil
      });
    }
    await createCoupon({
      code: input.code.toUpperCase(),
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      maxUses: input.maxUses,
      usedCount: 0,
      maxUsesPerUser: 1,
      validFrom: new Date(input.validFrom),
      validUntil: new Date(input.validUntil),
      isActive: 1
    });
    return { success: true };
  }),
  toggleCoupon: financeProcedure.input(z12.object({ id: z12.number(), isActive: z12.boolean() })).mutation(async ({ ctx, input }) => {
    if (isDemoPassenger(ctx.user) || !await getDb()) {
      const updated = toggleDemoAdminCoupon(input.id, input.isActive);
      if (!updated) throw new TRPCError11({ code: "NOT_FOUND", message: "Cupom n\xE3o encontrado" });
      return updated;
    }
    await updateCoupon(input.id, { isActive: input.isActive ? 1 : 0 });
    return { success: true };
  }),
  getServiceKeys: financeProcedure.query(() => FINANCE_SERVICE_KEYS)
});

// server/routers.ts
init_db();
import Stripe from "stripe";

// server/stripe-products.ts
function getRidePaymentDescription(origin, destination, vehicleType) {
  return `Corrida de ${origin} para ${destination} (${vehicleType})`;
}

// server/routers.ts
init_env();

// server/_core/demoPricing.ts
init_env();
function demoRowToConfig(demo, id) {
  const now = /* @__PURE__ */ new Date();
  return {
    id,
    vehicleType: demo.vehicleType,
    basePrice: demo.basePrice,
    pricePerKm: demo.pricePerKm,
    pricePerMinute: demo.pricePerMinute,
    minimumPrice: demo.minimumPrice,
    createdAt: now,
    updatedAt: now
  };
}
function withDemoPricingFallback(rows) {
  if (ENV.isProduction) return rows;
  const byType = new Map(rows.map((r) => [r.vehicleType, r]));
  let demoId = -1;
  for (const demo of DEMO_PRICING) {
    if (!byType.has(demo.vehicleType)) {
      byType.set(demo.vehicleType, demoRowToConfig(demo, demoId--));
    }
  }
  return Array.from(byType.values());
}
function getPricingForVehicle(vehicleType, fromDb) {
  if (fromDb) return fromDb;
  if (ENV.isProduction) return void 0;
  const demo = getDemoPricingByVehicleType(vehicleType);
  return demo ? demoRowToConfig(demo, 0) : void 0;
}

// shared/adminOperational.ts
var ADMIN_MAP_DEFAULT_CENTER = { lat: -10.6833, lng: -37.425 };

// server/_core/adminOperational.ts
init_db();
var ITABAIANA_CENTER4 = ADMIN_MAP_DEFAULT_CENTER;
function inferAreaLabel(address) {
  for (const place of DEMO_PLACES) {
    if (address.toLowerCase().includes(place.mainText.toLowerCase())) {
      return place.mainText;
    }
  }
  const parts = address.split(",");
  return parts[0]?.trim() || "Itabaiana";
}
function defaultDriverCoords(driverId) {
  const place = DEMO_PLACES[driverId % DEMO_PLACES.length] ?? DEMO_PLACES[0];
  const offset = driverId % 7 * 15e-4;
  return { lat: place.lat + offset, lng: place.lng - offset * 0.5 };
}
function resolveDriverOperationalStatus(profile, hasActiveRide) {
  if (profile.status === "pending") return "pending";
  if (hasActiveRide) return "busy";
  if (profile.isAvailable) return "available";
  return "offline";
}
function rideToOperational(ride, driverName, passengerName) {
  const originLat = parseCoord(ride.originLat);
  const originLng = parseCoord(ride.originLng);
  const destinationLat = parseCoord(ride.destinationLat);
  const destinationLng = parseCoord(ride.destinationLng);
  if (originLat == null || originLng == null || destinationLat == null || destinationLng == null) {
    return null;
  }
  return {
    id: ride.id,
    status: ride.status,
    vehicleType: ride.vehicleType,
    originAddress: ride.originAddress,
    destinationAddress: ride.destinationAddress,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    driverId: ride.driverId ?? null,
    driverName,
    passengerName,
    estimatedPrice: ride.estimatedPrice ?? null,
    finalPrice: ride.finalPrice ?? null,
    createdAt: ride.createdAt.toISOString(),
    completedAt: ride.completedAt?.toISOString() ?? null,
    areaLabel: inferAreaLabel(ride.originAddress)
  };
}
function computeMetrics(rides2, drivers) {
  const today = (/* @__PURE__ */ new Date()).toDateString();
  const completedToday = rides2.filter(
    (r) => r.status === "completed" && r.completedAt && new Date(r.completedAt).toDateString() === today
  );
  return {
    pendingRides: rides2.filter((r) => r.status === "requested").length,
    acceptedRides: rides2.filter((r) => r.status === "accepted").length,
    inProgressRides: rides2.filter((r) => r.status === "in_progress").length,
    completedToday: completedToday.length,
    driversOnline: drivers.filter((d) => d.operationalStatus !== "offline" && d.operationalStatus !== "pending").length,
    driversAvailable: drivers.filter((d) => d.operationalStatus === "available").length,
    revenueTodayCents: completedToday.reduce((sum, r) => sum + (r.finalPrice ?? r.estimatedPrice ?? 0), 0)
  };
}
function ensureDemoOperationalSeed() {
  if (getAllDemoDriverProfiles().length > 0) return;
  const seeds = [
    { userId: 801001, name: "Carlos Demo", type: "carro", plate: "ITB1A23", place: DEMO_PLACES[0] },
    { userId: 801002, name: "Ana Demo", type: "moto", plate: "ITB2B45", place: DEMO_PLACES[1] },
    { userId: 801003, name: "Pedro Demo", type: "van", plate: "ITB3C67", place: DEMO_PLACES[2] }
  ];
  for (const seed of seeds) {
    const profile = createDemoDriverProfile({ userId: seed.userId });
    createDemoVehicle(profile.id, {
      type: seed.type,
      brand: "Demo",
      model: seed.type === "moto" ? "CG 160" : seed.type === "van" ? "Sprinter" : "Onix",
      plate: seed.plate,
      color: "Prata"
    });
    updateDemoDriverLocation(profile.id, String(seed.place.lat), String(seed.place.lng));
  }
}
function buildDemoDriverEntry(profile, name, activeRideDriverIds) {
  const coords = getDemoDriverLocationCoords(profile.id) ?? defaultDriverCoords(profile.id);
  const vehicle = getDemoVehiclesByDriverId(profile.id)[0];
  const areaPlace = DEMO_PLACES[profile.id % DEMO_PLACES.length];
  return {
    id: profile.id,
    name,
    lat: coords.lat,
    lng: coords.lng,
    isAvailable: profile.isAvailable ?? false,
    operationalStatus: resolveDriverOperationalStatus(profile, activeRideDriverIds.has(profile.id)),
    vehicleType: vehicle?.type ?? "carro",
    vehicleBrand: vehicle?.brand ?? "Demo",
    vehicleModel: vehicle?.model ?? "Sedan",
    vehiclePlate: vehicle?.plate ?? "DEM0A00",
    rating: (profile.rating ?? 480) / 100,
    totalRides: profile.totalRides ?? 0,
    totalEarningsCents: 0,
    areaLabel: areaPlace?.mainText ?? "Centro"
  };
}
function getDemoOperationalOverview() {
  ensureDemoOperationalSeed();
  ensureDemoSimulationDriver();
  const rawRides = getAllDemoRides();
  const activeDriverIds = new Set(
    rawRides.filter((r) => r.driverId && (r.status === "accepted" || r.status === "in_progress")).map((r) => r.driverId)
  );
  const rides2 = rawRides.map((ride) => {
    let driverName = null;
    if (ride.driverId === DEMO_SIMULATION_DRIVER_ID) {
      driverName = DEMO_SIMULATION_DRIVER_NAME;
    } else if (ride.driverId) {
      driverName = ride.driverId >= 800001 ? "Motorista Demo" : null;
    }
    return rideToOperational(ride, driverName, "Passageiro Demo");
  }).filter((r) => r != null).sort((a, b) => {
    const order = {
      requested: 0,
      in_progress: 1,
      accepted: 2,
      completed: 3,
      cancelled: 4
    };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const drivers = [];
  for (const profile of getAllDemoDriverProfiles()) {
    drivers.push(buildDemoDriverEntry(profile, "Motorista Demo", activeDriverIds));
  }
  const sim = ensureDemoSimulationDriver();
  const simCoords = getDemoDriverLocationCoords(DEMO_SIMULATION_DRIVER_ID) ?? defaultDriverCoords(DEMO_SIMULATION_DRIVER_ID);
  drivers.push({
    id: DEMO_SIMULATION_DRIVER_ID,
    name: DEMO_SIMULATION_DRIVER_NAME,
    lat: simCoords.lat,
    lng: simCoords.lng,
    isAvailable: sim.profile.isAvailable ?? true,
    operationalStatus: resolveDriverOperationalStatus(sim.profile, activeDriverIds.has(DEMO_SIMULATION_DRIVER_ID)),
    vehicleType: sim.vehicle.type,
    vehicleBrand: sim.vehicle.brand ?? "Demo",
    vehicleModel: sim.vehicle.model ?? "Sedan Simula\xE7\xE3o",
    vehiclePlate: sim.vehicle.plate ?? "SIM0A00",
    rating: (sim.profile.rating ?? 490) / 100,
    totalRides: sim.profile.totalRides ?? 0,
    totalEarningsCents: 0,
    areaLabel: "Centro"
  });
  return {
    metrics: computeMetrics(rides2, drivers),
    rides: rides2,
    drivers,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getProductionOperationalOverview() {
  const allRides = await getAllRides();
  const approvedDrivers = await getApprovedDriverProfiles();
  const activeDriverIds = new Set(
    allRides.filter((r) => r.driverId && (r.status === "accepted" || r.status === "in_progress")).map((r) => r.driverId)
  );
  const rides2 = [];
  for (const ride of allRides) {
    let driverName = null;
    if (ride.driverId) {
      const dp = await getDriverProfileById(ride.driverId);
      if (dp?.userId) {
        const user = await getUserById(dp.userId);
        driverName = user?.name ?? null;
      }
    }
    const passenger = await getUserById(ride.passengerId);
    const mapped = rideToOperational(ride, driverName, passenger?.name ?? null);
    if (mapped) rides2.push(mapped);
  }
  rides2.sort((a, b) => {
    const order = {
      requested: 0,
      in_progress: 1,
      accepted: 2,
      completed: 3,
      cancelled: 4
    };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const drivers = [];
  for (const profile of approvedDrivers) {
    const loc = await getDriverLocation(profile.id);
    const lat = parseCoord(loc?.lat) ?? ITABAIANA_CENTER4.lat;
    const lng = parseCoord(loc?.lng) ?? ITABAIANA_CENTER4.lng;
    const vehicles2 = await getVehiclesByDriverId(profile.id);
    const vehicle = vehicles2[0];
    const user = await getUserById(profile.userId);
    const driverRides = allRides.filter((r) => r.driverId === profile.id && r.status === "completed");
    const earnings = driverRides.reduce((sum, r) => sum + (r.finalPrice ?? 0), 0);
    drivers.push({
      id: profile.id,
      name: user?.name ?? `Motorista #${profile.id}`,
      lat,
      lng,
      isAvailable: profile.isAvailable ?? false,
      operationalStatus: resolveDriverOperationalStatus(profile, activeDriverIds.has(profile.id)),
      vehicleType: vehicle?.type ?? "carro",
      vehicleBrand: vehicle?.brand ?? "",
      vehicleModel: vehicle?.model ?? "",
      vehiclePlate: vehicle?.plate ?? "",
      rating: (profile.rating ?? 0) / 100,
      totalRides: profile.totalRides ?? 0,
      totalEarningsCents: earnings,
      areaLabel: inferAreaLabel(`${lat},${lng}`)
    });
  }
  return {
    metrics: computeMetrics(rides2, drivers),
    rides: rides2,
    drivers,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/_core/adminRideActions.ts
import { TRPCError as TRPCError12 } from "@trpc/server";

// server/_core/dispatchEngine.ts
init_rideDispatcher();
init_db();
function buildDemoDispatchMeta(rideId) {
  expireDemoStalePendingOffers(rideId);
  const ride = getDemoRide(rideId);
  const offers = getDemoOffersForRide(rideId);
  const pending = offers.filter((o) => o.status === "pending" && o.expiresAt.getTime() > Date.now());
  const rounds = new Set(offers.map((o) => o.offerRound));
  const maxRound = getDemoMaxOfferRound(rideId);
  const lastOffer = offers.reduce((latest, o) => {
    const iso = o.createdAt.toISOString();
    return !latest || iso > latest ? iso : latest;
  }, null);
  const scheduledWaiting = ride != null && !isRideReadyForDispatch(ride);
  return {
    currentRound: pending.length > 0 ? Math.max(...pending.map((o) => o.offerRound)) : maxRound || 1,
    dispatchAttempts: rounds.size || (offers.length > 0 ? 1 : 0),
    pendingOffers: pending.length,
    declinedOffers: countDemoDeclinedOffers(rideId),
    lastDispatchAt: lastOffer,
    isExpandedRound: maxRound >= DISPATCHER_MAX_ROUNDS && pending.some((o) => o.offerRound >= DISPATCHER_MAX_ROUNDS),
    isScheduledWaiting: scheduledWaiting,
    scheduledFor: ride?.scheduledFor ? new Date(ride.scheduledFor).toISOString() : null
  };
}
function attachDispatchMeta(ride) {
  if (ride.status !== "requested" || ride.driverId != null) {
    return ride;
  }
  if (isDemoRideId(ride.id)) {
    return { ...ride, dispatchMeta: buildDemoDispatchMeta(ride.id) };
  }
  return ride;
}
function processDispatchForDemoRide(rideId) {
  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "requested" || ride.driverId != null) {
    return false;
  }
  if (!isRideReadyForDispatch(ride)) {
    return false;
  }
  expireDemoStalePendingOffers(rideId);
  if (getDemoValidPendingOffersForRide(rideId).length > 0) {
    return false;
  }
  const maxRound = getDemoMaxOfferRound(rideId);
  const nextRound = maxRound === 0 ? 1 : maxRound + 1;
  const expandPool = nextRound >= DISPATCHER_MAX_ROUNDS;
  const offerRound = expandPool ? DISPATCHER_MAX_ROUNDS : nextRound;
  const result = dispatchDemoRideOffers(
    rideId,
    ride.vehicleType,
    ride.originLat,
    ride.originLng,
    { offerRound, expandPool }
  );
  if (result.offersCreated > 0) {
    console.log(
      `[Dispatcher] Auto-redispatch corrida demo #${rideId} \xB7 rodada ${result.offerRound}${result.expandedPool ? " (ampliada)" : ""} \xB7 ${result.offersCreated} oferta(s)`
    );
    return true;
  }
  return false;
}
async function processDispatchForProductionRide(rideId) {
  const ride = await getRideById(rideId);
  if (!ride || ride.status !== "requested" || ride.driverId != null) {
    return false;
  }
  if (!isRideReadyForDispatch(ride)) {
    return false;
  }
  await expireStalePendingRideOffers(rideId);
  const pendingCount = await countPendingRideOffers(rideId);
  if (pendingCount > 0) {
    return false;
  }
  const maxRound = await getMaxOfferRoundForRide(rideId);
  const nextRound = maxRound === 0 ? 1 : maxRound + 1;
  const expandPool = nextRound >= DISPATCHER_MAX_ROUNDS;
  const offerRound = expandPool ? DISPATCHER_MAX_ROUNDS : nextRound;
  const result = await dispatchProductionRideOffers(
    rideId,
    ride.vehicleType,
    ride.originLat,
    ride.originLng,
    { offerRound, expandPool }
  );
  return result.offersCreated > 0;
}
function redispatchDemoRideOffers(rideId) {
  const ride = getDemoRide(rideId);
  if (!ride) {
    throw new Error("Corrida n\xE3o encontrada");
  }
  expireDemoStalePendingOffers(rideId);
  const pending = getDemoValidPendingOffersForRide(rideId);
  if (pending.length > 0) {
    expireDemoPendingOffersForRide(rideId);
  }
  const offerRound = getDemoNextOfferRound(rideId);
  const expandPool = offerRound >= DISPATCHER_MAX_ROUNDS;
  return dispatchDemoRideOffers(rideId, ride.vehicleType, ride.originLat, ride.originLng, {
    offerRound,
    expandPool
  });
}
async function redispatchProductionRideOffers(rideId) {
  const ride = await getRideById(rideId);
  if (!ride) {
    throw new Error("Corrida n\xE3o encontrada");
  }
  await expirePendingRideOffersForRide(rideId);
  const offerRound = await getNextOfferRoundForRide(rideId);
  const expandPool = offerRound >= DISPATCHER_MAX_ROUNDS;
  return dispatchProductionRideOffers(
    rideId,
    ride.vehicleType,
    ride.originLat,
    ride.originLng,
    { offerRound, expandPool }
  );
}

// shared/routeAnimation.ts
var DEFAULT_STEP_METERS = 12;
var APPROACH_STEP_METERS = 12;
function cumulativePathDistances(path) {
  if (path.length === 0) return [];
  const cum = [0];
  for (let i = 1; i < path.length; i++) {
    cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
  }
  return cum;
}
function pathTotalMeters(path) {
  const cum = cumulativePathDistances(path);
  return cum[cum.length - 1] ?? 0;
}
function densifyPath(path, maxStepMeters = DEFAULT_STEP_METERS) {
  if (path.length < 2) return path.slice();
  const out = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const segM = haversineMeters(a, b);
    if (segM <= maxStepMeters) {
      out.push(b);
      continue;
    }
    const steps = Math.ceil(segM / maxStepMeters);
    for (let s = 1; s <= steps; s++) {
      const t2 = s / steps;
      out.push({
        lat: a.lat + (b.lat - a.lat) * t2,
        lng: a.lng + (b.lng - a.lng) * t2
      });
    }
  }
  return out;
}
function projectPointOnSegment(a, b, p) {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0) return a;
  let t2 = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / len2;
  t2 = Math.max(0, Math.min(1, t2));
  return { lat: a.lat + t2 * dy, lng: a.lng + t2 * dx };
}
function projectPointOnPath(path, point) {
  if (path.length === 0) {
    return { point, meters: 0, progress: 0 };
  }
  if (path.length === 1) {
    return { point: path[0], meters: 0, progress: 0 };
  }
  const cum = cumulativePathDistances(path);
  const total = cum[cum.length - 1] ?? 0;
  let bestDist = Infinity;
  let bestPoint = path[0];
  let bestMeters = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const proj = projectPointOnSegment(a, b, point);
    const d = haversineMeters(point, proj);
    if (d < bestDist) {
      bestDist = d;
      bestPoint = proj;
      const segStart = cum[i - 1];
      const segLen = Math.max(cum[i] - segStart, 1e-3);
      const alongSeg = haversineMeters(a, proj);
      bestMeters = segStart + Math.min(alongSeg, segLen);
    }
  }
  return {
    point: bestPoint,
    meters: bestMeters,
    progress: total > 0 ? bestMeters / total : 0
  };
}
function pointAtPathMeters(path, meters) {
  const total = pathTotalMeters(path);
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (total <= 0) return path[0];
  return pointAtPathProgress(path, Math.max(0, Math.min(1, meters / total)));
}
function pointAtPathProgress(path, progress) {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (path.length === 1 || progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];
  const total = pathTotalMeters(path);
  if (total <= 0) return path[0];
  const targetM = progress * total;
  const cum = cumulativePathDistances(path);
  for (let i = 1; i < path.length; i++) {
    const endM = cum[i];
    if (targetM <= endM) {
      const startM = cum[i - 1];
      const segM = endM - startM;
      const t2 = segM > 0 ? (targetM - startM) / segM : 0;
      const a = path[i - 1];
      const b = path[i];
      return {
        lat: a.lat + (b.lat - a.lat) * t2,
        lng: a.lng + (b.lng - a.lng) * t2
      };
    }
  }
  return path[path.length - 1];
}
function buildApproachAlongRoutePrefix(tripPath, offsetMeters) {
  const densified = densifyPath(tripPath, APPROACH_STEP_METERS);
  if (densified.length < 2) return densified;
  const cum = cumulativePathDistances(densified);
  const total = cum[cum.length - 1] ?? 0;
  const reach = Math.min(offsetMeters, total * 0.45);
  let endIdx = 0;
  for (let i = 0; i < cum.length; i++) {
    if (cum[i] <= reach) endIdx = i;
    else break;
  }
  const prefix = densified.slice(0, endIdx + 1);
  if (prefix.length < 2) return densified;
  const reversed = [...prefix].reverse();
  return densifyPath(reversed, APPROACH_STEP_METERS);
}
function buildDriverPhasePath(tripPath, phase, options) {
  const densified = densifyPath(tripPath, APPROACH_STEP_METERS);
  if (phase === "to_destination") {
    return densified;
  }
  const approach = buildApproachAlongRoutePrefix(
    densified,
    options?.pickupOffsetMeters ?? 900
  );
  if (options?.currentPosition && approach.length >= 2) {
    const { meters } = projectPointOnPath(approach, options.currentPosition);
    const startM = Math.max(0, meters - 30);
    const start = pointAtPathMeters(approach, startM);
    const { meters: startSnap } = projectPointOnPath(approach, start);
    return trimPathFromMeters(approach, startSnap);
  }
  return approach;
}
function trimPathFromMeters(path, fromMeters) {
  if (path.length < 2 || fromMeters <= 0) return path;
  const cum = cumulativePathDistances(path);
  const start = pointAtPathMeters(path, fromMeters);
  for (let i = 1; i < path.length; i++) {
    if (cum[i] >= fromMeters) {
      const tail = path.slice(i);
      if (haversineMeters(start, tail[0]) > 2) {
        return densifyPath([start, ...tail], APPROACH_STEP_METERS);
      }
      return densifyPath([start, ...tail.slice(1)], APPROACH_STEP_METERS);
    }
  }
  return densifyPath([start], APPROACH_STEP_METERS);
}
function buildFallbackTripPath(origin, destination) {
  return densifyPath([origin, destination], APPROACH_STEP_METERS);
}

// shared/driverTracking.ts
function parseCoord2(value) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}
function parseMapPoint(latValue, lngValue) {
  const lat = parseCoord2(latValue);
  const lng = parseCoord2(lngValue);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}
function estimateTravelMinutes(distanceMeters, speedKmh = 30) {
  if (distanceMeters <= 0) return 0;
  const hours = distanceMeters / 1e3 / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}
var DRIVER_ARRIVING_THRESHOLD_M = 180;

// server/_core/demoRoutePaths.ts
var routeCache = /* @__PURE__ */ new Map();
function clearDemoRoutePath(rideId) {
  routeCache.delete(rideId);
}
function cacheDemoRoutePath(rideId, path) {
  if (path.length >= 2) {
    routeCache.set(rideId, densifyPath(path));
  }
}
function prefetchDemoRoutePath(ride) {
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return;
  void calculateDrivingRouteWithOsrm(origin, destination).then((route) => {
    cacheDemoRoutePath(ride.id, route.routePath);
  });
}
function getDemoTripPath(ride) {
  const cached = routeCache.get(ride.id);
  if (cached && cached.length >= 2) return cached;
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return [];
  const fallback = buildFallbackTripPath(origin, destination);
  routeCache.set(ride.id, fallback);
  prefetchDemoRoutePath(ride);
  return fallback;
}

// server/_core/demoDriverTracking.ts
var tracks = /* @__PURE__ */ new Map();
var DEMO_SPEED_KMH = 32;
var MIN_SEGMENT_MS = 45e3;
var START_OFFSET_M = 900;
function clearDemoDriverTrack(rideId) {
  tracks.delete(rideId);
  clearDemoRoutePath(rideId);
}
function buildTrack(ride, phase) {
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  const tripPath = getDemoTripPath(ride);
  const current = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng);
  const path = buildDriverPhasePath(tripPath, phase, {
    pickupOffsetMeters: START_OFFSET_M,
    currentPosition: phase === "to_pickup" ? current : null
  });
  const target = phase === "to_pickup" ? origin : destination;
  const distanceM = Math.max(pathTotalMeters(path), 120);
  const durationMs = Math.max(
    MIN_SEGMENT_MS,
    distanceM / 1e3 / DEMO_SPEED_KMH * 3600 * 1e3
  );
  return {
    phase,
    path,
    target,
    startedAtMs: Date.now(),
    durationMs
  };
}
function initDemoDriverTrack(rideId, ride, phase = "to_pickup") {
  const track = buildTrack(ride, phase);
  tracks.set(rideId, track);
  const start = track.path[0] ?? track.target;
  return {
    driverCurrentLat: start.lat.toFixed(6),
    driverCurrentLng: start.lng.toFixed(6)
  };
}
function resetDemoDriverTrackPhase(rideId, ride, phase) {
  return initDemoDriverTrack(rideId, ride, phase);
}
function tickDemoDriverLocation(ride) {
  if (!ride.driverId) return null;
  if (ride.status !== "accepted" && ride.status !== "in_progress") {
    clearDemoDriverTrack(ride.id);
    return null;
  }
  const phase = ride.status === "in_progress" ? "to_destination" : "to_pickup";
  let track = tracks.get(ride.id);
  if (!track || track.phase !== phase) {
    track = buildTrack(ride, phase);
    tracks.set(ride.id, track);
  }
  const progress = Math.min(1, (Date.now() - track.startedAtMs) / track.durationMs);
  const pos = progress >= 1 ? track.target : pointAtPathProgress(track.path, progress);
  const { meters } = projectPointOnPath(track.path, pos);
  const remainingM = progress >= 1 ? 0 : Math.max(0, pathTotalMeters(track.path) - meters);
  const etaMinutes = estimateTravelMinutes(remainingM, DEMO_SPEED_KMH);
  const distanceToTargetM = haversineMeters(pos, track.target);
  const isArriving = ride.status === "accepted" && (distanceToTargetM <= DRIVER_ARRIVING_THRESHOLD_M || progress >= 1);
  return {
    driverCurrentLat: pos.lat.toFixed(6),
    driverCurrentLng: pos.lng.toFixed(6),
    etaMinutes: progress >= 1 ? 0 : Math.max(1, etaMinutes),
    isArriving
  };
}
function syncDemoDriverTracking(ride) {
  const tick = tickDemoDriverLocation(ride);
  if (!tick) return ride;
  const updated = updateDemoRide(ride.id, {
    driverCurrentLat: tick.driverCurrentLat,
    driverCurrentLng: tick.driverCurrentLng
  });
  return updated ?? ride;
}

// server/_core/demoRideSimulation.ts
var states = /* @__PURE__ */ new Map();
var SEGMENT_DURATION_MS = 25e3;
var START_OFFSET_M2 = 850;
function buildSegment(ride, phase, target) {
  const tripPath = getDemoTripPath(ride);
  const path = buildDriverPhasePath(tripPath, phase, {
    pickupOffsetMeters: START_OFFSET_M2
  });
  const distanceM = Math.max(pathTotalMeters(path), 100);
  const durationMs = Math.max(
    SEGMENT_DURATION_MS,
    Math.round(distanceM / 1e3 / 36 * 3600 * 1e3)
  );
  return { path, target, startedAtMs: Date.now(), durationMs };
}
function getSimulationPhase(rideId) {
  return states.get(rideId)?.phase ?? null;
}
function clearSimulationState(rideId) {
  states.delete(rideId);
  clearDemoDriverTrack(rideId);
}
function initSearching(rideId) {
  states.set(rideId, { phase: "searching", segment: null });
}
function registerDemoRideForSimulation(rideId) {
  if (!isDemoDriverSimulationEnabledServer() || !isDemoRideId(rideId)) return;
  initSearching(rideId);
}
function positionAlongSegment(segment) {
  const progress = Math.min(1, (Date.now() - segment.startedAtMs) / segment.durationMs);
  return progress >= 1 ? segment.target : pointAtPathProgress(segment.path, progress);
}
function segmentComplete(segment) {
  return Date.now() - segment.startedAtMs >= segment.durationMs;
}
function simulationAcceptRide(rideId) {
  if (!isDemoDriverSimulationEnabledServer()) return void 0;
  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "requested") return void 0;
  const { profile } = ensureDemoSimulationDriver();
  const vehicle = getDemoSimulationVehicle();
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  if (!origin || !destination) return void 0;
  const segment = buildSegment(ride, "to_pickup", origin);
  const start = segment.path[0] ?? origin;
  states.set(rideId, {
    phase: "driver_accepted",
    segment
  });
  let updated = updateDemoRide(rideId, {
    driverId: profile.id,
    vehicleId: vehicle.id,
    status: "accepted",
    paymentStatus: ride.paymentMethod === "cash" ? "paid" : "paid",
    driverCurrentLat: start.lat.toFixed(6),
    driverCurrentLng: start.lng.toFixed(6)
  });
  if (!updated) return void 0;
  states.set(rideId, { phase: "to_pickup", segment });
  return updated;
}
function simulationStartRide(rideId) {
  if (!isDemoDriverSimulationEnabledServer()) return void 0;
  const ride = getDemoRide(rideId);
  if (!ride || ride.status !== "accepted" || !isDemoSimulationDriverId(ride.driverId)) {
    return void 0;
  }
  const state = states.get(rideId);
  if (state?.phase !== "arrived_pickup") return void 0;
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  const segment = buildSegment(ride, "to_destination", destination);
  states.set(rideId, { phase: "in_trip", segment });
  return updateDemoRide(rideId, {
    status: "in_progress",
    driverCurrentLat: origin.lat.toFixed(6),
    driverCurrentLng: origin.lng.toFixed(6)
  });
}
function advanceDemoRideSimulation(ride) {
  if (!isDemoDriverSimulationEnabledServer() || !isDemoRideId(ride.id)) {
    return ride;
  }
  if (ride.status === "cancelled") {
    clearSimulationState(ride.id);
    return ride;
  }
  if (ride.status === "completed") {
    states.set(ride.id, { phase: "completed", segment: null });
    return ride;
  }
  let state = states.get(ride.id);
  if (!state && ride.status === "requested") {
    initSearching(ride.id);
    state = states.get(ride.id);
  }
  if (!state) return ride;
  if (state.phase === "searching" || state.phase === "driver_accepted") {
    return ride;
  }
  if (state.phase === "to_pickup" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated = updateDemoRide(ride.id, {
      driverCurrentLat: pos.lat.toFixed(6),
      driverCurrentLng: pos.lng.toFixed(6)
    }) ?? ride;
    if (segmentComplete(state.segment)) {
      states.set(ride.id, { phase: "arrived_pickup", segment: null });
      updated = updateDemoRide(ride.id, {
        driverCurrentLat: state.segment.target.lat.toFixed(6),
        driverCurrentLng: state.segment.target.lng.toFixed(6)
      }) ?? updated;
    }
    return updated;
  }
  if (state.phase === "arrived_pickup") {
    return ride;
  }
  if (state.phase === "in_trip" && state.segment) {
    const pos = positionAlongSegment(state.segment);
    let updated = updateDemoRide(ride.id, {
      driverCurrentLat: pos.lat.toFixed(6),
      driverCurrentLng: pos.lng.toFixed(6)
    }) ?? ride;
    if (segmentComplete(state.segment)) {
      states.set(ride.id, { phase: "completed", segment: null });
      updated = updateDemoRide(ride.id, {
        status: "completed",
        completedAt: /* @__PURE__ */ new Date(),
        finalPrice: ride.finalPrice ?? ride.estimatedPrice,
        driverCurrentLat: state.segment.target.lat.toFixed(6),
        driverCurrentLng: state.segment.target.lng.toFixed(6)
      }) ?? updated;
      clearSimulationState(ride.id);
    }
    return updated;
  }
  return ride;
}
function attachSimulationMeta(ride) {
  const phase = getSimulationPhase(ride.id) ?? (ride.status === "completed" ? "completed" : ride.status === "in_progress" ? "in_trip" : ride.status === "accepted" && ride.driverId ? "to_pickup" : "searching");
  return { ...ride, simulationPhase: phase };
}
function syncDemoRideState(ride) {
  if (isDemoDriverSimulationEnabledServer()) {
    return advanceDemoRideSimulation(ride);
  }
  return syncDemoDriverTracking(ride);
}

// server/_core/adminRideActions.ts
init_db();
function canAdminCancelRide(status) {
  return status !== "completed" && status !== "cancelled";
}
function canAdminRedispatchRide(status, driverId) {
  return status === "requested" && (driverId == null || driverId === 0);
}
async function adminCancelRide(rideId, cancelledByUserId, reason) {
  if (isDemoRideId(rideId)) {
    const ride2 = getDemoRide(rideId);
    if (!ride2) {
      throw new TRPCError12({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
    }
    if (!canAdminCancelRide(ride2.status)) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "Corrida n\xE3o pode ser cancelada" });
    }
    updateDemoRide(rideId, {
      status: "cancelled",
      cancelledAt: /* @__PURE__ */ new Date(),
      cancelledBy: cancelledByUserId,
      cancellationReason: reason ?? "Cancelada pela central operacional"
    });
    recordCancellationAudit({
      entityType: "ride",
      entityId: rideId,
      origin: "admin",
      reason: reason ?? "Cancelada pela central operacional",
      cancelledByUserId,
      cancelledByLabel: "Central operacional"
    });
    expireDemoPendingOffersForRide(rideId);
    clearDemoDriverTrack(rideId);
    clearSimulationState(rideId);
    return { success: true };
  }
  const ride = await getRideById(rideId);
  if (!ride) {
    throw new TRPCError12({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
  }
  if (!canAdminCancelRide(ride.status)) {
    throw new TRPCError12({ code: "BAD_REQUEST", message: "Corrida n\xE3o pode ser cancelada" });
  }
  await updateRide(rideId, {
    status: "cancelled",
    cancelledAt: /* @__PURE__ */ new Date(),
    cancelledBy: cancelledByUserId,
    cancellationReason: reason ?? "Cancelada pela central operacional"
  });
  recordCancellationAudit({
    entityType: "ride",
    entityId: rideId,
    origin: "admin",
    reason: reason ?? "Cancelada pela central operacional",
    cancelledByUserId,
    cancelledByLabel: "Central operacional"
  });
  await expirePendingRideOffersForRide(rideId);
  return { success: true };
}
async function adminRedispatchRide(rideId, isDemoContext) {
  if (isDemoRideId(rideId) || isDemoContext) {
    const ride2 = getDemoRide(rideId);
    if (!ride2) {
      throw new TRPCError12({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
    }
    if (!canAdminRedispatchRide(ride2.status, ride2.driverId)) {
      throw new TRPCError12({
        code: "BAD_REQUEST",
        message: "S\xF3 \xE9 poss\xEDvel reenfileirar corridas pendentes sem motorista"
      });
    }
    expireDemoPendingOffersForRide(rideId);
    const result2 = redispatchDemoRideOffers(rideId);
    return { ...result2, offerRound: result2.offerRound };
  }
  const ride = await getRideById(rideId);
  if (!ride) {
    throw new TRPCError12({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
  }
  if (!canAdminRedispatchRide(ride.status, ride.driverId)) {
    throw new TRPCError12({
      code: "BAD_REQUEST",
      message: "S\xF3 \xE9 poss\xEDvel reenfileirar corridas pendentes sem motorista"
    });
  }
  const result = await redispatchProductionRideOffers(rideId);
  return { ...result, offerRound: result.offerRound };
}

// server/routers.ts
init_rideDispatcher();

// server/_core/demoChat.ts
var demoChatByRide = /* @__PURE__ */ new Map();
var nextMessageId2 = 1;
function getDemoChatMessages(rideId) {
  return demoChatByRide.get(rideId) ?? [];
}
function addDemoChatMessage(rideId, senderId, message) {
  const entry = {
    id: nextMessageId2++,
    rideId,
    senderId,
    message,
    createdAt: /* @__PURE__ */ new Date()
  };
  const list = demoChatByRide.get(rideId) ?? [];
  list.push(entry);
  demoChatByRide.set(rideId, list);
  return entry;
}

// server/storage.ts
init_env();
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// shared/passengerPremium.ts
function buildPremiumMeta(input) {
  const meta = {};
  if (input.bookedFor?.name?.trim()) meta.bookedFor = input.bookedFor;
  if (input.intermediateStops?.length) meta.intermediateStops = input.intermediateStops;
  if (input.recurrenceRule) meta.recurrenceRule = input.recurrenceRule;
  if (input.recurringScheduleId) meta.recurringScheduleId = input.recurringScheduleId;
  return Object.keys(meta).length > 0 ? meta : null;
}

// server/_core/demoRecurringSchedules.ts
var schedules = /* @__PURE__ */ new Map();
var nextScheduleId = 1;
function createDemoRecurringSchedule(input) {
  const schedule = {
    id: nextScheduleId++,
    passengerId: input.passengerId,
    template: input.template,
    recurrenceRule: input.recurrenceRule,
    timeOfDay: input.timeOfDay,
    active: true,
    createdAt: /* @__PURE__ */ new Date()
  };
  schedules.set(schedule.id, schedule);
  return schedule;
}
function getDemoRecurringSchedulesForPassenger(passengerId) {
  return Array.from(schedules.values()).filter((s) => s.passengerId === passengerId && s.active).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function cancelDemoRecurringSchedule(id, passengerId) {
  const schedule = schedules.get(id);
  if (!schedule || schedule.passengerId !== passengerId) return false;
  schedule.active = false;
  schedules.set(id, schedule);
  return true;
}
function hydrateDemoRecurringSchedules(items) {
  for (const raw of items) {
    const schedule = {
      ...raw,
      createdAt: new Date(raw.createdAt)
    };
    const existing = schedules.get(schedule.id);
    if (existing && existing.createdAt.getTime() > schedule.createdAt.getTime()) {
      continue;
    }
    schedules.set(schedule.id, schedule);
    if (schedule.id >= nextScheduleId) {
      nextScheduleId = schedule.id + 1;
    }
  }
}

// server/routers.ts
import { nanoid as nanoid2 } from "nanoid";
var bookedForInputSchema = z13.object({
  name: z13.string().min(2),
  phone: z13.string().min(8),
  notes: z13.string().optional()
}).optional();
var intermediateStopsInputSchema = z13.array(
  z13.object({
    address: z13.string().min(2),
    lat: z13.string(),
    lng: z13.string(),
    placeId: z13.string().optional()
  })
).max(2).optional();
var recurrenceRuleInputSchema = z13.object({
  type: z13.enum(["daily", "weekly", "custom"]),
  daysOfWeek: z13.array(z13.number().min(0).max(6)).optional(),
  endDate: z13.string().optional()
}).optional();
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover"
});
var adminProcedure3 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError13({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
function canAccessAdminOperational(ctx) {
  if (ctx.user.role === "admin") return true;
  return canDemoPassengerUseAdminModules(ctx.user);
}
var appRouter = router({
  system: systemRouter,
  landing: landingRouter,
  notification: notificationRouter,
  maps: mapsRouter,
  favorites: favoritesRouter,
  referrals: referralsRouter,
  delivery: deliveryRouter,
  utilities: utilitiesRouter,
  utilityProvider: utilityProviderRouter,
  utilityChat: utilityChatRouter,
  driverPremium: driverPremiumRouter,
  adminFinance: adminFinanceRouter,
  user: router({
    updateProfile: protectedProcedure.input(z13.object({
      name: z13.string().optional(),
      phone: z13.string().optional(),
      avatarUrl: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        return { success: true };
      }
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
    uploadAvatar: protectedProcedure.input(z13.object({
      base64: z13.string(),
      mimeType: z13.string()
    })).mutation(async ({ ctx, input }) => {
      const ext = input.mimeType.split("/")[1] || "jpg";
      const fileKey = `avatars/${ctx.user.id}-${nanoid2(8)}.${ext}`;
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.length > 5 * 1024 * 1024) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Imagem muito grande. M\xE1ximo 5MB." });
      }
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      await updateUserProfile(ctx.user.id, { avatarUrl: url });
      return { url };
    }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStats(ctx.user.id);
    }),
    getRecentRides: protectedProcedure.input(z13.object({ limit: z13.number().min(1).max(10).optional() }).optional()).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5;
      if (isDemoPassenger(ctx.user)) {
        return getDemoPassengerRides(ctx.user.id).filter((r) => r.status !== "cancelled").slice(0, limit);
      }
      return await getRecentRides(ctx.user.id, limit);
    }),
    getUserRides: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoPassengerRides(ctx.user.id);
      }
      return await getPassengerRides(ctx.user.id);
    }),
    // Saved addresses
    getSavedAddresses: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return [];
      }
      return await getSavedAddressesByUser(ctx.user.id);
    }),
    saveFavoriteAddress: protectedProcedure.input(z13.object({
      label: z13.enum(["home", "work", "other"]),
      customLabel: z13.string().optional(),
      address: z13.string(),
      lat: z13.string(),
      lng: z13.string()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        return { success: true };
      }
      const existing = await getSavedAddressByLabel(ctx.user.id, input.label);
      if (existing) {
        await updateSavedAddress(existing.id, {
          address: input.address,
          lat: input.lat,
          lng: input.lng,
          customLabel: input.customLabel
        });
      } else {
        await createSavedAddress({
          userId: ctx.user.id,
          ...input
        });
      }
      return { success: true };
    }),
    deleteSavedAddress: protectedProcedure.input(z13.object({
      id: z13.number()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        return { success: true };
      }
      await deleteSavedAddress(input.id);
      return { success: true };
    }),
    // FCM Push Notifications
    registerFcmToken: protectedProcedure.input(z13.object({
      token: z13.string(),
      deviceInfo: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await saveFcmToken(ctx.user.id, input.token, input.deviceInfo);
      return { success: true };
    }),
    // Alias for registerFcmToken (for compatibility)
    saveFcmToken: protectedProcedure.input(z13.object({
      fcmToken: z13.string(),
      deviceInfo: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await saveFcmToken(ctx.user.id, input.fcmToken, input.deviceInfo);
      return { success: true };
    }),
    unregisterFcmToken: protectedProcedure.input(z13.object({
      token: z13.string()
    })).mutation(async ({ ctx, input }) => {
      await deleteFcmToken(input.token);
      return { success: true };
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ============= DRIVER PROFILE ROUTES =============
  driver: router({
    getProfile: publicProcedure.input(z13.object({
      driverId: z13.number()
    })).query(async ({ input }) => {
      return await getDriverProfileById(input.driverId);
    }),
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoDriverProfileByUserId(ctx.user.id) ?? null;
      }
      return await getDriverProfileByUserId(ctx.user.id);
    }),
    createProfile: protectedProcedure.input(z13.object({
      cpf: z13.string().optional(),
      cnh: z13.string().optional(),
      cnhImageUrl: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        const profile = createDemoDriverProfile({
          userId: ctx.user.id,
          cpf: input.cpf,
          cnh: input.cnh,
          cnhImageUrl: input.cnhImageUrl
        });
        return { success: true, profile };
      }
      const existing = await getDriverProfileByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Driver profile already exists" });
      }
      await createDriverProfile({
        userId: ctx.user.id,
        ...input
      });
      await updateUserRole(ctx.user.id, "driver");
      return { success: true };
    }),
    updateProfile: driverProcedure.input(z13.object({
      cpf: z13.string().optional(),
      cnh: z13.string().optional(),
      cnhImageUrl: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await updateDriverProfile(ctx.driverProfile.id, input);
      return { success: true };
    }),
    setAvailability: driverProcedure.input(z13.object({
      isAvailable: z13.boolean()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        updateDemoDriverAvailability(ctx.driverProfile.id, input.isAvailable);
        return { success: true };
      }
      await updateDriverAvailability(ctx.driverProfile.id, input.isAvailable);
      return { success: true };
    }),
    getStats: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return {
          totalRides: ctx.driverProfile.totalRides ?? 0,
          rating: (ctx.driverProfile.rating || 0) / 100,
          totalEarnings: 0,
          completedToday: 0
        };
      }
      const rides2 = await getDriverRides(ctx.driverProfile.id);
      const completedRides = rides2.filter((r) => r.status === "completed");
      const totalEarnings = completedRides.reduce((sum, r) => sum + (r.finalPrice || 0), 0);
      return {
        totalRides: ctx.driverProfile.totalRides,
        rating: (ctx.driverProfile.rating || 0) / 100,
        // Convert back to decimal
        totalEarnings,
        completedToday: completedRides.filter((r) => {
          const today = /* @__PURE__ */ new Date();
          const rideDate = r.completedAt ? new Date(r.completedAt) : null;
          return rideDate && rideDate.toDateString() === today.toDateString();
        }).length
      };
    }),
    updateLocation: driverProcedure.input(z13.object({
      lat: z13.string(),
      lng: z13.string(),
      heading: z13.number().optional()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        reportDemoDriverLocation(ctx.driverProfile.id, input.lat, input.lng);
        return { success: true };
      }
      await updateDriverLocation({
        driverId: ctx.driverProfile.id,
        ...input
      });
      return { success: true };
    })
  }),
  // ============= VEHICLE ROUTES =============
  vehicle: router({
    list: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoVehiclesByDriverId(ctx.driverProfile.id);
      }
      return await getVehiclesByDriverId(ctx.driverProfile.id);
    }),
    create: driverProcedure.input(z13.object({
      type: z13.enum(["moto", "carro", "van", "utilitario"]),
      brand: z13.string().optional(),
      model: z13.string().optional(),
      year: z13.number().optional(),
      plate: z13.string(),
      color: z13.string().optional(),
      photoUrl: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        createDemoVehicle(ctx.driverProfile.id, input);
        return { success: true };
      }
      await createVehicle({
        driverId: ctx.driverProfile.id,
        ...input
      });
      return { success: true };
    }),
    update: driverProcedure.input(z13.object({
      vehicleId: z13.number(),
      brand: z13.string().optional(),
      model: z13.string().optional(),
      year: z13.number().optional(),
      color: z13.string().optional(),
      photoUrl: z13.string().optional(),
      status: z13.enum(["active", "inactive", "maintenance"]).optional()
    })).mutation(async ({ ctx, input }) => {
      const { vehicleId, ...updates } = input;
      const vehicle = await getVehicleById(vehicleId);
      if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Vehicle not found or access denied" });
      }
      await updateVehicle(vehicleId, updates);
      return { success: true };
    })
  }),
  // ============= RIDE ROUTES =============
  ride: router({
    request: protectedProcedure.input(z13.object({
      vehicleType: z13.enum(["moto", "carro", "van", "utilitario"]),
      originAddress: z13.string(),
      originLat: z13.string(),
      originLng: z13.string(),
      destinationAddress: z13.string(),
      destinationLat: z13.string(),
      destinationLng: z13.string(),
      distance: z13.number(),
      duration: z13.number(),
      estimatedPrice: z13.number(),
      paymentMethod: z13.enum(["pix", "card", "cash"]),
      // Carpool fields
      isShared: z13.boolean().optional(),
      maxPassengers: z13.number().optional(),
      // Freight fields
      isFreight: z13.boolean().optional(),
      cargoWeight: z13.number().optional(),
      cargoType: z13.string().optional(),
      cargoDescription: z13.string().optional(),
      needsHelpers: z13.boolean().optional(),
      numberOfHelpers: z13.number().optional(),
      bookedFor: bookedForInputSchema,
      intermediateStops: intermediateStopsInputSchema
    })).mutation(async ({ ctx, input }) => {
      const { bookedFor, intermediateStops, ...rideInput } = input;
      const passengerPremiumMeta = buildPremiumMeta({ bookedFor, intermediateStops });
      if (isDemoPassenger(ctx.user)) {
        let finalEstimatedPrice2 = input.estimatedPrice;
        let pricePerPassenger2;
        if (input.isShared && input.maxPassengers && input.maxPassengers > 1) {
          pricePerPassenger2 = Math.floor(finalEstimatedPrice2 / input.maxPassengers);
        }
        const ride = createDemoRide({
          passengerId: ctx.user.id,
          ...rideInput,
          estimatedPrice: finalEstimatedPrice2,
          pricePerPassenger: pricePerPassenger2,
          currentPassengers: 1,
          shareToken: `demo-${Date.now()}`,
          paymentStatus: input.paymentMethod === "cash" ? "paid" : "pending",
          discountAmount: 0,
          passengerPremiumMeta
        });
        prefetchDemoRoutePath(ride);
        if (isDemoDriverSimulationEnabledServer()) {
          registerDemoRideForSimulation(ride.id);
          if (isDemoDriverSimulationAutoAcceptServer()) {
            simulationAcceptRide(ride.id);
          }
        } else if (isRideReadyForDispatch(ride)) {
          const dispatch = dispatchDemoRideOffers(
            ride.id,
            input.vehicleType,
            input.originLat,
            input.originLng
          );
          if (dispatch.offersCreated === 0) {
            console.log(
              `[Dispatcher] Nenhum motorista eleg\xEDvel para corrida demo #${ride.id} (tipo ${input.vehicleType})`
            );
          } else {
            console.log(
              `[Dispatcher] ${dispatch.offersCreated} oferta(s) rodada ${dispatch.offerRound} para corrida demo #${ride.id} (${dispatch.eligibleCount} eleg\xEDveis)`
            );
          }
        }
        return {
          success: true,
          rideId: ride.id,
          pricePerPassenger: pricePerPassenger2
        };
      }
      let finalEstimatedPrice = input.estimatedPrice;
      const user = isDemoPassenger(ctx.user) ? ctx.user : await getUserById(ctx.user.id);
      if (user && user.vipLevel) {
        const vipDiscount = getVipDiscount(user.vipLevel);
        if (vipDiscount > 0) {
          const discountAmount = Math.floor(input.estimatedPrice * vipDiscount / 100);
          finalEstimatedPrice = input.estimatedPrice - discountAmount;
        }
      }
      let pricePerPassenger = void 0;
      if (input.isShared && input.maxPassengers && input.maxPassengers > 1) {
        pricePerPassenger = Math.floor(finalEstimatedPrice / input.maxPassengers);
      }
      const result = await createRide({
        passengerId: ctx.user.id,
        ...rideInput,
        estimatedPrice: finalEstimatedPrice,
        pricePerPassenger,
        currentPassengers: 1,
        // Creator is the first passenger
        shareToken: generateShareToken(),
        // For live tracking
        passengerPremiumMeta
      });
      const rideId = Number(result[0]?.insertId || 0);
      if (rideId > 0) {
        try {
          await dispatchProductionRideOffers(
            rideId,
            input.vehicleType,
            input.originLat,
            input.originLng
          );
        } catch (error) {
          console.error("[Dispatcher] Falha ao criar ofertas de produ\xE7\xE3o:", error);
        }
      }
      if (input.isShared && rideId > 0) {
        await createRidePassenger({
          rideId,
          passengerId: ctx.user.id,
          status: "accepted",
          pickupAddress: input.originAddress,
          pickupLat: input.originLat,
          pickupLng: input.originLng,
          dropoffAddress: input.destinationAddress,
          dropoffLat: input.destinationLat,
          dropoffLng: input.destinationLng,
          individualPrice: pricePerPassenger || input.estimatedPrice,
          pickupOrder: 1,
          dropoffOrder: 1
        });
      }
      if (rideId > 0) {
        try {
          const availableDrivers = await getAvailableDrivers();
          const dbInstance = await getDb();
          if (dbInstance && availableDrivers.length > 0) {
            const passengerName = ctx.user.name || "Um passageiro";
            const vehicleLabel = {
              moto: "Moto",
              carro: "Carro",
              van: "Van",
              utilitario: "Utilit\xE1rio"
            };
            const priceFormatted = (finalEstimatedPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            await Promise.all(
              availableDrivers.map(
                (driver) => createNotificationWithPush(dbInstance, driver.userId, {
                  type: "ride",
                  title: "Nova Corrida Dispon\xEDvel!",
                  message: `${passengerName} solicita ${vehicleLabel[input.vehicleType] || input.vehicleType} \u2014 ${input.originAddress.split(",")[0]} \u2192 ${input.destinationAddress.split(",")[0]} (${priceFormatted})`,
                  actionUrl: `/driver-dashboard`,
                  actionLabel: "Ver corrida",
                  metadata: { rideId, event: "new_ride_available" }
                })
              )
            );
            console.log(`[Ride] Notified ${availableDrivers.length} driver(s) about ride #${rideId}`);
          } else {
            console.log(`[Ride] No available drivers to notify for ride #${rideId}`);
          }
        } catch (error) {
          console.error("Failed to notify drivers:", error);
        }
      }
      return { success: true, rideId, pricePerPassenger };
    }),
    accept: driverProcedure.input(z13.object({
      rideId: z13.number(),
      vehicleId: z13.number()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        const ride2 = getDemoRide(input.rideId);
        if (!ride2) {
          throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
        }
        if (ride2.status !== "requested") {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride already accepted or completed" });
        }
        if (!validateDemoDriverCanAccept(input.rideId, ctx.driverProfile.id)) {
          throw new TRPCError13({
            code: "FORBIDDEN",
            message: "Esta corrida n\xE3o est\xE1 dispon\xEDvel para voc\xEA"
          });
        }
        const vehicle2 = getDemoVehicleById(input.vehicleId);
        if (!vehicle2 || vehicle2.driverId !== ctx.driverProfile.id) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Vehicle not found or access denied" });
        }
        const startCoords = initDemoDriverTrack(input.rideId, ride2, "to_pickup");
        updateDemoRide(input.rideId, {
          driverId: ctx.driverProfile.id,
          vehicleId: input.vehicleId,
          status: "accepted",
          driverCurrentLat: startCoords.driverCurrentLat,
          driverCurrentLng: startCoords.driverCurrentLng
        });
        acceptDemoRideOffers(input.rideId, ctx.driverProfile.id);
        return { success: true };
      }
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      if (ride.status !== "requested") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride already accepted or completed" });
      }
      if (!await validateProductionDriverCanAccept(input.rideId, ctx.driverProfile.id)) {
        throw new TRPCError13({
          code: "FORBIDDEN",
          message: "Esta corrida n\xE3o est\xE1 dispon\xEDvel para voc\xEA"
        });
      }
      const vehicle = await getVehicleById(input.vehicleId);
      if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Vehicle not found or access denied" });
      }
      const driverLocation = await getDriverLocation(ctx.driverProfile.id);
      await updateRide(input.rideId, {
        driverId: ctx.driverProfile.id,
        vehicleId: input.vehicleId,
        status: "accepted",
        ...driverLocation ? {
          driverCurrentLat: driverLocation.lat,
          driverCurrentLng: driverLocation.lng
        } : {}
      });
      await acceptProductionRideOffers(input.rideId, ctx.driverProfile.id);
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          await createNotificationWithPush(dbInstance, ride.passengerId, {
            type: "ride",
            title: "Motorista Encontrado!",
            message: `${ctx.user.name || "Um motorista"} aceitou sua corrida. Prepare-se!`,
            actionUrl: `/ride/${input.rideId}`,
            actionLabel: "Ver corrida",
            metadata: { rideId: input.rideId, event: "ride_accepted" }
          });
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
      try {
        await notifyOwner({
          title: "Motorista Encontrado!",
          content: `Sua corrida #${input.rideId} foi aceita por ${ctx.user.name || "um motorista"}. O motorista est\xE1 a caminho!`
        });
      } catch (error) {
        console.error("Failed to send owner notification:", error);
      }
      return { success: true };
    }),
    start: driverProcedure.input(z13.object({
      rideId: z13.number()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        const ride2 = getDemoRide(input.rideId);
        if (!ride2 || ride2.driverId !== ctx.driverProfile.id) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Ride not found or access denied" });
        }
        if (ride2.status !== "accepted") {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride cannot be started in current status" });
        }
        const updated = updateDemoRide(input.rideId, { status: "in_progress" });
        if (updated) {
          resetDemoDriverTrackPhase(input.rideId, updated, "to_destination");
          syncDemoRideState(updated);
        }
        return { success: true };
      }
      const ride = await getRideById(input.rideId);
      if (!ride || ride.driverId !== ctx.driverProfile.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Ride not found or access denied" });
      }
      await updateRide(input.rideId, {
        status: "in_progress"
      });
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          await createNotificationWithPush(dbInstance, ride.passengerId, {
            type: "ride",
            title: "Corrida Iniciada!",
            message: "Seu motorista iniciou a corrida. Boa viagem!",
            actionUrl: `/ride/${input.rideId}`,
            actionLabel: "Acompanhar",
            metadata: { rideId: input.rideId, event: "ride_started" }
          });
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
      try {
        await notifyOwner({
          title: "Corrida Iniciada",
          content: `Sua corrida #${input.rideId} foi iniciada. Boa viagem!`
        });
      } catch (error) {
        console.error("Failed to send owner notification:", error);
      }
      return { success: true };
    }),
    complete: driverProcedure.input(z13.object({
      rideId: z13.number(),
      finalPrice: z13.number()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        const ride2 = getDemoRide(input.rideId);
        if (!ride2 || ride2.driverId !== ctx.driverProfile.id) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Ride not found or access denied" });
        }
        if (ride2.status !== "in_progress" && ride2.status !== "accepted") {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride cannot be completed in current status" });
        }
        const updated = updateDemoRide(input.rideId, {
          status: "completed",
          completedAt: /* @__PURE__ */ new Date(),
          finalPrice: input.finalPrice,
          paymentStatus: ride2.paymentMethod === "cash" || ride2.paymentStatus === "paid" ? "paid" : "pending"
        });
        if (!updated) {
          throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
        }
        clearSimulationState(input.rideId);
        try {
          await recordRideLedgerEntry(updated);
        } catch (err) {
          console.error("[Ledger] demo ride:", err);
        }
        return updated;
      }
      const ride = await getRideById(input.rideId);
      if (!ride || ride.driverId !== ctx.driverProfile.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Ride not found or access denied" });
      }
      await updateRide(input.rideId, {
        status: "completed",
        completedAt: /* @__PURE__ */ new Date(),
        finalPrice: input.finalPrice,
        paymentStatus: ride.paymentMethod === "cash" ? "paid" : "pending"
      });
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          await createNotificationWithPush(dbInstance, ride.passengerId, {
            type: "ride",
            title: "Corrida Conclu\xEDda!",
            message: `Valor final: R$ ${(input.finalPrice / 100).toFixed(2)}. Obrigado por usar o ${ENV.appName}!`,
            actionUrl: `/ride/${input.rideId}`,
            actionLabel: "Avaliar motorista",
            metadata: { rideId: input.rideId, event: "ride_completed", finalPrice: input.finalPrice }
          });
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
      try {
        await notifyOwner({
          title: "Corrida Conclu\xEDda",
          content: `Sua corrida #${input.rideId} foi conclu\xEDda.
Valor final: R$ ${(input.finalPrice / 100).toFixed(2)}

Obrigado por usar o ${ENV.appName}!`
        });
      } catch (error) {
        console.error("Failed to send owner notification:", error);
      }
      try {
        const pointsEarned = Math.floor(input.finalPrice / 100);
        await addLoyaltyPoints(
          ride.passengerId,
          pointsEarned,
          `Corrida #${input.rideId} conclu\xEDda`,
          input.rideId
        );
      } catch (error) {
        console.error("Failed to add loyalty points:", error);
      }
      try {
        const completed = await getRideById(input.rideId);
        if (completed) await recordRideLedgerEntry(completed);
        if (ride.couponId && completed) {
          await recordCouponUsage({
            couponId: ride.couponId,
            userId: ride.passengerId,
            rideId: input.rideId,
            discountAmount: ride.discountAmount ?? 0
          });
        }
      } catch (err) {
        console.error("[Ledger] production ride:", err);
      }
      return { success: true };
    }),
    cancel: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      reason: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        const ride2 = getDemoRide(input.rideId);
        if (!ride2) {
          throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
        }
        const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
        const canAccess = ride2.passengerId === ctx.user.id || driverProfile != null && ride2.driverId === driverProfile.id;
        if (!canAccess) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
        }
        const isPassenger = ride2.passengerId === ctx.user.id;
        updateDemoRide(input.rideId, {
          status: "cancelled",
          cancelledAt: /* @__PURE__ */ new Date(),
          cancelledBy: ctx.user.id,
          cancellationReason: input.reason ?? null
        });
        recordCancellationAudit({
          entityType: "ride",
          entityId: input.rideId,
          origin: isPassenger ? "passenger" : "driver",
          reason: input.reason ?? "Cancelamento pelo usu\xE1rio",
          cancelledByUserId: ctx.user.id
        });
        expireDemoPendingOffersForRide(input.rideId);
        clearDemoDriverTrack(input.rideId);
        clearSimulationState(input.rideId);
        return { success: true };
      }
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      const isPassengerCancelling = ride.passengerId === ctx.user.id;
      await updateRide(input.rideId, {
        status: "cancelled",
        cancelledAt: /* @__PURE__ */ new Date(),
        cancelledBy: ctx.user.id,
        cancellationReason: input.reason
      });
      recordCancellationAudit({
        entityType: "ride",
        entityId: input.rideId,
        origin: isPassengerCancelling ? "passenger" : "driver",
        reason: input.reason ?? "Cancelamento pelo usu\xE1rio",
        cancelledByUserId: ctx.user.id
      });
      await expirePendingRideOffersForRide(input.rideId);
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          const isPassengerCancelling2 = ride.passengerId === ctx.user.id;
          const targetUserId = isPassengerCancelling2 ? ride.driverId : ride.passengerId;
          if (targetUserId) {
            await createNotificationWithPush(dbInstance, targetUserId, {
              type: "ride",
              title: "Corrida Cancelada",
              message: isPassengerCancelling2 ? `O passageiro cancelou a corrida #${input.rideId}.${input.reason ? ` Motivo: ${input.reason}` : ""}` : `O motorista cancelou a corrida #${input.rideId}.${input.reason ? ` Motivo: ${input.reason}` : ""}`,
              actionUrl: `/rides`,
              actionLabel: "Ver hist\xF3rico",
              metadata: { rideId: input.rideId, event: "ride_cancelled" }
            });
          }
        }
      } catch (error) {
        console.error("Failed to send cancellation notification:", error);
      }
      return { success: true };
    }),
    declineOffer: driverProcedure.input(
      z13.object({
        rideId: z13.number(),
        reason: z13.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        const ride2 = getDemoRide(input.rideId);
        if (!ride2 || ride2.status !== "requested") {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Corrida indispon\xEDvel" });
        }
        if (!driverHasDemoPendingOffer(input.rideId, ctx.driverProfile.id)) {
          throw new TRPCError13({
            code: "FORBIDDEN",
            message: "Oferta expirada ou indispon\xEDvel"
          });
        }
        const declined2 = declineDemoRideOfferForDriver(
          input.rideId,
          ctx.driverProfile.id
        );
        if (!declined2) {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "N\xE3o foi poss\xEDvel recusar" });
        }
        processDispatchForDemoRide(input.rideId);
        return {
          success: true,
          offers: serializeDemoRideOffers()
        };
      }
      const ride = await getRideById(input.rideId);
      if (!ride || ride.status !== "requested") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Corrida indispon\xEDvel" });
      }
      const declined = await declineProductionRideOfferForDriver(
        input.rideId,
        ctx.driverProfile.id
      );
      if (!declined) {
        throw new TRPCError13({
          code: "FORBIDDEN",
          message: "Oferta expirada ou indispon\xEDvel"
        });
      }
      await processDispatchForProductionRide(input.rideId);
      return { success: true };
    }),
    getById: protectedProcedure.input(z13.object({
      rideId: z13.number()
    })).query(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        let ride2 = getDemoRide(input.rideId);
        if (!ride2) {
          throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
        }
        const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
        const canAccess = ride2.passengerId === ctx.user.id || driverProfile != null && ride2.driverId === driverProfile.id;
        if (!canAccess) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
        }
        processDispatchForDemoRide(input.rideId);
        ride2 = getDemoRide(input.rideId);
        ride2 = syncDemoRideState(ride2);
        const demoDriver = getDemoRideDriverDetails(ride2);
        const withMeta = attachSimulationMeta(ride2);
        const withDispatch = attachDispatchMeta(withMeta);
        return demoDriver ? { ...withDispatch, demoDriver } : withDispatch;
      }
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      return ride;
    }),
    /** Restaura corridas + ofertas demo do localStorage para memória do servidor. */
    hydrateDemoState: protectedProcedure.input(
      z13.object({
        rides: z13.array(z13.any()),
        offers: z13.array(z13.any()).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user)) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Demo only" });
      }
      hydrateDemoRides(input.rides);
      if (input.offers?.length) {
        hydrateDemoRideOffers(input.offers);
      }
      for (const ride of getDemoRequestedRides()) {
        if (isRideReadyForDispatch(ride)) {
          processDispatchForDemoRide(ride.id);
        }
      }
      return {
        success: true,
        count: getAllDemoRides().length,
        offers: serializeDemoRideOffers()
      };
    }),
    /** Snapshot de ofertas demo para persistência no cliente. */
    getDemoOffersSnapshot: protectedProcedure.query(async ({ ctx }) => {
      if (!isDemoPassenger(ctx.user)) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Demo only" });
      }
      return { offers: serializeDemoRideOffers() };
    }),
    /** Pagamento demo local (pix/cartão) sem Stripe. */
    confirmDemoPayment: protectedProcedure.input(z13.object({ rideId: z13.number() })).mutation(async ({ ctx, input }) => {
      if (!isDemoRideId(input.rideId)) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Not a demo ride" });
      }
      const ride = getDemoRide(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      if (ride.passengerId !== ctx.user.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      const updated = updateDemoRide(input.rideId, {
        paymentStatus: "paid",
        status: ride.driverId && ride.status !== "cancelled" && ride.status !== "completed" ? "accepted" : ride.status,
        ...ride.driverCurrentLat && ride.driverCurrentLng ? {
          driverCurrentLat: ride.driverCurrentLat,
          driverCurrentLng: ride.driverCurrentLng
        } : initDemoDriverTrack(input.rideId, ride, "to_pickup")
      });
      if (!updated) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      const synced = syncDemoRideState(updated);
      const demoDriver = getDemoRideDriverDetails(synced);
      const withMeta = attachSimulationMeta(synced);
      return demoDriver ? { ...withMeta, demoDriver } : withMeta;
    }),
    /** Modo simulação (DEV): aceita corrida com Motorista Demo. */
    simulationAccept: protectedProcedure.input(z13.object({ rideId: z13.number() })).mutation(async ({ ctx, input }) => {
      if (!isDemoDriverSimulationEnabledServer()) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Modo simula\xE7\xE3o desativado" });
      }
      if (!isDemoRideId(input.rideId)) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Not a demo ride" });
      }
      const ride = getDemoRide(input.rideId);
      if (!ride || ride.passengerId !== ctx.user.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      const accepted = simulationAcceptRide(input.rideId);
      if (!accepted) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "N\xE3o foi poss\xEDvel simular aceite" });
      }
      const synced = syncDemoRideState(accepted);
      const demoDriver = getDemoRideDriverDetails(synced);
      const withMeta = attachSimulationMeta(synced);
      return demoDriver ? { ...withMeta, demoDriver } : withMeta;
    }),
    /** Modo simulação (DEV): inicia corrida após motorista chegar. */
    simulationStart: protectedProcedure.input(z13.object({ rideId: z13.number() })).mutation(async ({ ctx, input }) => {
      if (!isDemoDriverSimulationEnabledServer()) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Modo simula\xE7\xE3o desativado" });
      }
      if (!isDemoRideId(input.rideId)) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Not a demo ride" });
      }
      const ride = getDemoRide(input.rideId);
      if (!ride || ride.passengerId !== ctx.user.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      const started = simulationStartRide(input.rideId);
      if (!started) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: "Motorista ainda n\xE3o chegou ao embarque"
        });
      }
      const synced = syncDemoRideState(started);
      const demoDriver = getDemoRideDriverDetails(synced);
      const withMeta = attachSimulationMeta(synced);
      return demoDriver ? { ...withMeta, demoDriver } : withMeta;
    }),
    myRides: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoPassengerRides(ctx.user.id);
      }
      return await getPassengerRides(ctx.user.id);
    }),
    myDrives: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoDriverRides(ctx.driverProfile.id);
      }
      return await getDriverRides(ctx.driverProfile.id);
    }),
    available: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        for (const ride of getDemoRequestedRides()) {
          processDispatchForDemoRide(ride.id);
        }
        return getDemoAvailableRidesForDriver(ctx.driverProfile.id);
      }
      return await getProductionAvailableRidesForDriver(ctx.driverProfile.id);
    }),
    active: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
        return getDemoActiveRidesForUser(ctx.user.id, driverProfile?.id).map(
          (ride) => attachSimulationMeta(syncDemoRideState(ride))
        );
      }
      const rides2 = await getActiveRides();
      return rides2.filter((r) => r.passengerId === ctx.user.id || r.driverId === ctx.user.id);
    }),
    updateDriverLocation: driverProcedure.input(z13.object({
      rideId: z13.number(),
      lat: z13.string(),
      lng: z13.string()
    })).mutation(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        const ride2 = getDemoRide(input.rideId);
        if (!ride2 || ride2.driverId !== ctx.driverProfile.id) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
        }
        if (ride2.status !== "accepted" && ride2.status !== "in_progress") {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Can only update location for active rides" });
        }
        updateDemoRide(input.rideId, {
          driverCurrentLat: input.lat,
          driverCurrentLng: input.lng
        });
        return { success: true };
      }
      const ride = await getRideById(input.rideId);
      if (!ride || ride.driverId !== ctx.driverProfile.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      if (ride.status !== "accepted" && ride.status !== "in_progress") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Can only update location for active rides" });
      }
      await updateRide(input.rideId, {
        driverCurrentLat: input.lat,
        driverCurrentLng: input.lng
      });
      return { success: true };
    }),
    // ============= CARPOOL ROUTES =============
    findSharedRides: protectedProcedure.input(z13.object({
      originLat: z13.string(),
      originLng: z13.string(),
      destinationLat: z13.string(),
      destinationLng: z13.string(),
      vehicleType: z13.enum(["moto", "carro", "van", "utilitario"]),
      maxDistanceKm: z13.number().optional(),
      timeWindowMinutes: z13.number().optional()
    })).query(async ({ input }) => {
      return await findMatchingSharedRides(input);
    }),
    joinSharedRide: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      pickupAddress: z13.string(),
      pickupLat: z13.string(),
      pickupLng: z13.string(),
      dropoffAddress: z13.string(),
      dropoffLat: z13.string(),
      dropoffLng: z13.string()
    })).mutation(async ({ ctx, input }) => {
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      if (!ride.isShared) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride is not shared" });
      }
      if (ride.currentPassengers >= ride.maxPassengers) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride is full" });
      }
      if (ride.status !== "requested") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride already started" });
      }
      const individualPrice = ride.pricePerPassenger || Math.floor((ride.estimatedPrice || 0) / ride.maxPassengers);
      const currentPassengers = await getRidePassengers(input.rideId);
      const pickupOrder = currentPassengers.length + 1;
      await createRidePassenger({
        rideId: input.rideId,
        passengerId: ctx.user.id,
        status: "pending",
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffAddress: input.dropoffAddress,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        individualPrice,
        pickupOrder,
        dropoffOrder: pickupOrder
        // Will be optimized later
      });
      await updateRide(input.rideId, {
        currentPassengers: ride.currentPassengers + 1
      });
      return { success: true, individualPrice };
    }),
    getSharedRidePassengers: protectedProcedure.input(z13.object({
      rideId: z13.number()
    })).query(async ({ input }) => {
      return await getRidePassengers(input.rideId);
    }),
    updatePassengerStatus: protectedProcedure.input(z13.object({
      passengerId: z13.number(),
      status: z13.enum(["pending", "accepted", "declined", "cancelled"])
    })).mutation(async ({ ctx, input }) => {
      await updateRidePassengerStatus(input.passengerId, input.status);
      if (input.status === "declined" || input.status === "cancelled") {
        const passengers = await getRidePassengers(input.passengerId);
        if (passengers.length > 0) {
          const ride = await getRideById(passengers[0].rideId);
          if (ride) {
            await updateRide(ride.id, {
              currentPassengers: Math.max(1, ride.currentPassengers - 1)
            });
          }
        }
      }
      return { success: true };
    }),
    getMySharedRides: protectedProcedure.query(async ({ ctx }) => {
      return await getPassengerSharedRides(ctx.user.id);
    })
  }),
  // ============= RATING ROUTES =============
  rating: router({
    create: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      toUserId: z13.number(),
      rating: z13.number().min(1).max(5),
      comment: z13.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
      }
      if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
      }
      const existing = await getRatingByRideId(input.rideId);
      if (existing) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Ride already rated" });
      }
      await createRating({
        rideId: input.rideId,
        fromUserId: ctx.user.id,
        toUserId: input.toUserId,
        rating: input.rating,
        comment: input.comment
      });
      return { success: true };
    }),
    getByUser: publicProcedure.input(z13.object({
      userId: z13.number()
    })).query(async ({ input }) => {
      return await getRatingsByUserId(input.userId);
    }),
    getByRideId: publicProcedure.input(z13.object({
      rideId: z13.number()
    })).query(async ({ input }) => {
      return await getRatingByRideId(input.rideId);
    })
  }),
  // ============= PRICING ROUTES =============
  pricing: router({
    getAll: publicProcedure.query(async () => {
      const rows = await getAllPricing();
      return withDemoPricingFallback(rows);
    }),
    calculate: publicProcedure.input(z13.object({
      vehicleType: z13.enum(["moto", "carro", "van", "utilitario"]),
      distance: z13.number(),
      // in meters
      duration: z13.number()
      // in seconds
    })).query(async ({ input }) => {
      const fromDb = await getPricingByVehicleType(input.vehicleType);
      const config = getPricingForVehicle(input.vehicleType, fromDb);
      if (!config) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Pricing config not found" });
      }
      const distanceKm = input.distance / 1e3;
      const durationMin = input.duration / 60;
      const calculatedPrice = config.basePrice + distanceKm * config.pricePerKm + durationMin * config.pricePerMinute;
      const afterTariff = Math.max(calculatedPrice, config.minimumPrice);
      const finalPrice = applyFinanceMinimumPrice(
        afterTariff,
        input.vehicleType,
        input.vehicleType
      );
      return {
        estimatedPrice: Math.round(finalPrice),
        breakdown: {
          basePrice: config.basePrice,
          distancePrice: Math.round(distanceKm * config.pricePerKm),
          durationPrice: Math.round(durationMin * config.pricePerMinute),
          minimumPrice: Math.round(finalPrice)
        }
      };
    }),
    update: adminProcedure3.input(z13.object({
      vehicleType: z13.enum(["moto", "carro", "van", "utilitario"]),
      basePrice: z13.number(),
      pricePerKm: z13.number(),
      pricePerMinute: z13.number(),
      minimumPrice: z13.number()
    })).mutation(async ({ input }) => {
      await upsertPricing(input);
      return { success: true };
    })
  }),
  // ============= RIDE NOTIFICATION ROUTES =============
  rideNotification: router({
    notifyNewRide: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      driverId: z13.number(),
      originAddress: z13.string(),
      destinationAddress: z13.string(),
      estimatedPrice: z13.number()
    })).mutation(async ({ input }) => {
      await notifyOwner({
        title: "Nova Corrida Dispon\xEDvel!",
        content: `Corrida #${input.rideId}
Origem: ${input.originAddress}
Destino: ${input.destinationAddress}
Valor estimado: R$ ${(input.estimatedPrice / 100).toFixed(2)}`
      });
      return { success: true };
    }),
    notifyRideAccepted: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      passengerId: z13.number(),
      driverName: z13.string().optional()
    })).mutation(async ({ input }) => {
      await notifyOwner({
        title: "Motorista Encontrado!",
        content: `Sua corrida #${input.rideId} foi aceita${input.driverName ? ` por ${input.driverName}` : ""}. O motorista est\xE1 a caminho!`
      });
      return { success: true };
    }),
    notifyRideStarted: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      passengerId: z13.number()
    })).mutation(async ({ input }) => {
      await notifyOwner({
        title: "Corrida Iniciada",
        content: `Sua corrida #${input.rideId} foi iniciada. Boa viagem!`
      });
      return { success: true };
    }),
    notifyRideCompleted: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      passengerId: z13.number(),
      finalPrice: z13.number()
    })).mutation(async ({ input }) => {
      await notifyOwner({
        title: "Corrida Conclu\xEDda",
        content: `Sua corrida #${input.rideId} foi conclu\xEDda.
Valor final: R$ ${(input.finalPrice / 100).toFixed(2)}

Obrigado por usar o ${ENV.appName}!`
      });
      return { success: true };
    })
  }),
  // ============= COUPON ROUTES =============
  upload: router({
    uploadDocument: protectedProcedure.input(
      z13.object({
        fileData: z13.string(),
        // base64 encoded
        fileName: z13.string(),
        fileType: z13.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "audio/webm", "audio/mp3", "audio/wav"];
      if (!allowedTypes.includes(input.fileType)) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: "Tipo de arquivo n\xE3o permitido."
        });
      }
      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.length > 5 * 1024 * 1024) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: "Arquivo muito grande. Tamanho m\xE1ximo: 5MB."
        });
      }
      const ext = input.fileName.split(".").pop() || "jpg";
      const fileKey = `documents/${ctx.user.id}/${nanoid2()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.fileType);
      return { url };
    })
  }),
  scheduling: router({
    scheduleRide: protectedProcedure.input(
      z13.object({
        vehicleType: z13.enum(["moto", "carro", "van", "utilitario"]),
        originAddress: z13.string(),
        originLat: z13.number(),
        originLng: z13.number(),
        destinationAddress: z13.string(),
        destinationLat: z13.number(),
        destinationLng: z13.number(),
        scheduledFor: z13.date(),
        paymentMethod: z13.enum(["pix", "card", "cash"]),
        couponCode: z13.string().optional(),
        /** Usados no modo demo para pular OSRM quando a rota já foi calculada na tela. */
        estimatedPrice: z13.number().optional(),
        distance: z13.number().optional(),
        duration: z13.number().optional(),
        bookedFor: bookedForInputSchema,
        intermediateStops: intermediateStopsInputSchema,
        recurrenceRule: recurrenceRuleInputSchema
      })
    ).mutation(async ({ ctx, input }) => {
      const { bookedFor, intermediateStops, recurrenceRule, ...scheduleInput } = input;
      const timeOfDay = `${input.scheduledFor.getHours().toString().padStart(2, "0")}:${input.scheduledFor.getMinutes().toString().padStart(2, "0")}`;
      if (isDemoPassenger(ctx.user)) {
        const finalPrice2 = input.estimatedPrice ?? 0;
        let recurringScheduleId;
        if (recurrenceRule) {
          const schedule = createDemoRecurringSchedule({
            passengerId: ctx.user.id,
            template: {
              vehicleType: input.vehicleType,
              originAddress: input.originAddress,
              originLat: input.originLat.toString(),
              originLng: input.originLng.toString(),
              destinationAddress: input.destinationAddress,
              destinationLat: input.destinationLat.toString(),
              destinationLng: input.destinationLng.toString(),
              paymentMethod: input.paymentMethod,
              estimatedPrice: finalPrice2,
              distance: input.distance,
              duration: input.duration,
              bookedFor,
              intermediateStops
            },
            recurrenceRule,
            timeOfDay
          });
          recurringScheduleId = schedule.id;
        }
        const passengerPremiumMeta2 = buildPremiumMeta({
          bookedFor,
          intermediateStops,
          recurrenceRule,
          recurringScheduleId
        });
        const ride = createDemoRide({
          passengerId: ctx.user.id,
          vehicleType: scheduleInput.vehicleType,
          originAddress: scheduleInput.originAddress,
          originLat: scheduleInput.originLat.toString(),
          originLng: scheduleInput.originLng.toString(),
          destinationAddress: scheduleInput.destinationAddress,
          destinationLat: scheduleInput.destinationLat.toString(),
          destinationLng: scheduleInput.destinationLng.toString(),
          distance: scheduleInput.distance ?? 0,
          duration: scheduleInput.duration ?? 0,
          estimatedPrice: finalPrice2,
          paymentMethod: scheduleInput.paymentMethod,
          status: "requested",
          scheduledFor: scheduleInput.scheduledFor,
          isScheduled: "yes",
          couponCode: scheduleInput.couponCode,
          paymentStatus: "pending",
          discountAmount: 0,
          shareToken: `demo-sched-${Date.now()}`,
          passengerPremiumMeta: passengerPremiumMeta2
        });
        prefetchDemoRoutePath(ride);
        if (isRideReadyForDispatch(ride)) {
          try {
            dispatchDemoRideOffers(
              ride.id,
              ride.vehicleType,
              ride.originLat,
              ride.originLng
            );
          } catch (error) {
            console.warn("[Dispatcher] Falha ao despachar corrida agendada demo:", error);
          }
        }
        return {
          rideId: ride.id,
          estimatedPrice: finalPrice2,
          recurringScheduleId
        };
      }
      const pricing = await getPricingByVehicleType(input.vehicleType);
      if (!pricing) {
        throw new TRPCError13({
          code: "NOT_FOUND",
          message: "Pre\xE7o n\xE3o configurado para este tipo de ve\xEDculo"
        });
      }
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${input.originLng},${input.originLat};${input.destinationLng},${input.destinationLat}?overview=false`;
      const osrmResponse = await fetch(osrmUrl);
      const osrmData = await osrmResponse.json();
      if (!osrmData.routes || !osrmData.routes[0]) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: "N\xE3o foi poss\xEDvel calcular a rota"
        });
      }
      const distance = osrmData.routes[0].distance || 0;
      const duration = osrmData.routes[0].duration || 0;
      const distanceKm = distance / 1e3;
      const estimatedPrice = Math.max(
        pricing.basePrice + Math.round(distanceKm * pricing.pricePerKm),
        pricing.minimumPrice
      );
      let finalPrice = estimatedPrice;
      let couponId = null;
      if (input.couponCode) {
        const coupon = await validateCoupon(
          input.couponCode,
          finalPrice,
          input.vehicleType
        );
        if (coupon) {
          const discount = coupon.discountType === "percentage" ? Math.round(finalPrice * coupon.discountValue / 100) : coupon.discountValue;
          finalPrice = Math.max(finalPrice - discount, 0);
          couponId = coupon.id;
        }
      }
      const passengerPremiumMeta = buildPremiumMeta({
        bookedFor,
        intermediateStops,
        recurrenceRule
      });
      const insertResult = await createRide({
        passengerId: ctx.user.id,
        vehicleType: input.vehicleType,
        originAddress: input.originAddress,
        originLat: input.originLat.toString(),
        originLng: input.originLng.toString(),
        destinationAddress: input.destinationAddress,
        destinationLat: input.destinationLat.toString(),
        destinationLng: input.destinationLng.toString(),
        distance,
        duration,
        estimatedPrice: finalPrice,
        paymentMethod: input.paymentMethod,
        status: "requested",
        scheduledFor: input.scheduledFor,
        isScheduled: "yes",
        couponId,
        couponCode: input.couponCode,
        passengerPremiumMeta
      });
      const rideId = Number(insertResult[0]?.insertId || 0);
      try {
        const nearbyDrivers = await getNearbyDrivers(
          String(input.originLat),
          String(input.originLng),
          10
          // 10km radius
        );
        const dbInstance = await getDb();
        if (dbInstance) {
          const { notifications: notificationsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          for (const driver of nearbyDrivers.slice(0, 10)) {
            await dbInstance.insert(notificationsTable).values({
              userId: driver.user.id,
              type: "ride",
              title: "Nova corrida agendada!",
              message: `Corrida de ${input.originAddress} para ${input.destinationAddress} agendada para ${input.scheduledFor.toLocaleDateString("pt-BR")} \xE0s ${input.scheduledFor.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
              actionUrl: `/driver-dashboard`,
              actionLabel: "Ver detalhes"
            });
          }
        }
        Promise.resolve().then(() => (init_fcm(), fcm_exports)).then(async ({ notifyUser: notifyUserFcm }) => {
          for (const driver of nearbyDrivers.slice(0, 5)) {
            await notifyUserFcm(driver.user.id, {
              title: "Nova corrida agendada!",
              body: `${input.originAddress} \u2192 ${input.destinationAddress}`,
              data: { type: "scheduled_ride", rideId: String(rideId) }
            }).catch(() => {
            });
          }
        }).catch(() => {
        });
      } catch (notifyError) {
        console.log("[Scheduling] Non-critical: failed to notify drivers", notifyError);
      }
      return { rideId, estimatedPrice: finalPrice };
    }),
    getScheduledRides: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoPassengerRides(ctx.user.id).filter(
          (ride) => ride.isScheduled === "yes" && ride.status !== "cancelled"
        );
      }
      return await getScheduledRidesByUser(ctx.user.id);
    }),
    getRecurringSchedules: protectedProcedure.query(async ({ ctx }) => {
      if (!isDemoPassenger(ctx.user)) {
        return [];
      }
      return getDemoRecurringSchedulesForPassenger(ctx.user.id);
    }),
    hydrateDemoRecurring: protectedProcedure.input(z13.object({ schedules: z13.array(z13.unknown()) })).mutation(({ input }) => {
      hydrateDemoRecurringSchedules(input.schedules);
      return { success: true, count: input.schedules.length };
    }),
    cancelScheduledRide: protectedProcedure.input(z13.object({ rideId: z13.number() })).mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user)) {
        const ride = getDemoRide(input.rideId);
        if (!ride || ride.passengerId !== ctx.user.id) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Corrida n\xE3o encontrada" });
        }
        updateDemoRide(input.rideId, {
          status: "cancelled",
          cancelledAt: /* @__PURE__ */ new Date(),
          cancelledBy: ctx.user.id,
          cancellationReason: "Cancelada pelo usu\xE1rio"
        });
        const scheduleId = ride.passengerPremiumMeta?.recurringScheduleId;
        if (scheduleId) {
          cancelDemoRecurringSchedule(scheduleId, ctx.user.id);
        }
        return { success: true };
      }
      await cancelRide(input.rideId, ctx.user.id, "Cancelada pelo usu\xE1rio");
      return { success: true };
    }),
    // Get pending scheduled rides for drivers to accept
    getPendingForDriver: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        const driverVehicles2 = getDemoVehiclesByDriverId(ctx.driverProfile.id);
        const driverVehicleTypes2 = driverVehicles2.filter((v) => v.status === "active").map((v) => v.type);
        const scheduledPending2 = getAllDemoRides().filter(
          (r) => r.isScheduled === "yes" && r.status === "requested" && r.scheduledFor && !isRideReadyForDispatch(r) && driverVehicleTypes2.includes(r.vehicleType)
        );
        return scheduledPending2.map((ride) => ({
          ...ride,
          passengerName: "Passageiro Demo",
          passengerAvatar: null
        }));
      }
      const allRequested = await getRequestedRides();
      const scheduledPending = allRequested.filter(
        (r) => r.isScheduled === "yes" && r.status === "requested" && r.scheduledFor
      );
      const driverVehicles = await getVehiclesByDriverId(ctx.driverProfile.id);
      const driverVehicleTypes = driverVehicles.filter((v) => v.status === "active").map((v) => v.type);
      const matchingRides = scheduledPending.filter(
        (r) => driverVehicleTypes.includes(r.vehicleType)
      );
      const ridesWithPassenger = await Promise.all(
        matchingRides.map(async (ride) => {
          const passenger = await getUserById(ride.passengerId);
          return {
            ...ride,
            passengerName: passenger?.name || "Passageiro",
            passengerAvatar: passenger?.avatarUrl
          };
        })
      );
      return ridesWithPassenger;
    }),
    // Driver accepts a scheduled ride
    acceptScheduledRide: driverProcedure.input(
      z13.object({
        rideId: z13.number(),
        vehicleId: z13.number()
      })
    ).mutation(async ({ ctx, input }) => {
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
      }
      if (ride.isScheduled !== "yes") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Esta n\xE3o \xE9 uma corrida agendada" });
      }
      if (ride.status !== "requested") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Esta corrida j\xE1 foi aceita ou cancelada" });
      }
      const vehicle = await getVehicleById(input.vehicleId);
      if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Ve\xEDculo n\xE3o encontrado ou sem permiss\xE3o" });
      }
      if (vehicle.type !== ride.vehicleType) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: `Ve\xEDculo incomp\xE1tivel. A corrida requer ${ride.vehicleType}, mas o ve\xEDculo selecionado \xE9 ${vehicle.type}`
        });
      }
      await updateRide(input.rideId, {
        driverId: ctx.driverProfile.id,
        vehicleId: input.vehicleId,
        status: "accepted"
      });
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          const { notifications: notificationsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const scheduledDate = ride.scheduledFor ? new Date(ride.scheduledFor).toLocaleDateString("pt-BR") : "";
          const scheduledTime = ride.scheduledFor ? new Date(ride.scheduledFor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
          await dbInstance.insert(notificationsTable).values({
            userId: ride.passengerId,
            type: "ride",
            title: "Motorista confirmado!",
            message: `${ctx.user.name || "Um motorista"} aceitou sua corrida agendada para ${scheduledDate} \xE0s ${scheduledTime}. Ve\xEDculo: ${vehicle.brand || ""} ${vehicle.model || ""} - ${vehicle.plate}`,
            actionUrl: `/scheduled-rides`,
            actionLabel: "Ver corridas agendadas"
          });
        }
      } catch (e) {
        console.log("[Scheduling] Non-critical: failed to create notification", e);
      }
      try {
        const { notifyUser: notifyUserFcm } = await Promise.resolve().then(() => (init_fcm(), fcm_exports));
        await notifyUserFcm(ride.passengerId, {
          title: "Motorista confirmado! \u{1F697}",
          body: `${ctx.user.name || "Um motorista"} aceitou sua corrida agendada. Ve\xEDculo: ${vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.plate})`,
          data: { type: "scheduled_ride_accepted", rideId: String(input.rideId) }
        });
      } catch (e) {
      }
      return { success: true };
    }),
    // Driver rejects a scheduled ride
    rejectScheduledRide: driverProcedure.input(
      z13.object({
        rideId: z13.number(),
        reason: z13.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const ride = await getRideById(input.rideId);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
      }
      if (ride.isScheduled !== "yes") {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Esta n\xE3o \xE9 uma corrida agendada" });
      }
      if (ride.driverId === ctx.driverProfile.id && ride.status === "accepted") {
        await updateRide(input.rideId, {
          driverId: null,
          vehicleId: null,
          status: "requested"
        });
        try {
          const dbInstance = await getDb();
          if (dbInstance) {
            const { notifications: notificationsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            await dbInstance.insert(notificationsTable).values({
              userId: ride.passengerId,
              type: "ride",
              title: "Motorista cancelou",
              message: `${ctx.user.name || "O motorista"} cancelou a aceita\xE7\xE3o da sua corrida agendada. Estamos buscando outro motorista.`,
              actionUrl: `/scheduled-rides`,
              actionLabel: "Ver corridas agendadas"
            });
          }
        } catch (e) {
          console.log("[Scheduling] Non-critical: failed to create notification", e);
        }
        try {
          const { notifyUser: notifyUserFcm } = await Promise.resolve().then(() => (init_fcm(), fcm_exports));
          await notifyUserFcm(ride.passengerId, {
            title: "Motorista cancelou \u274C",
            body: `${ctx.user.name || "O motorista"} cancelou sua corrida agendada. Buscando outro motorista...`,
            data: { type: "scheduled_ride_rejected", rideId: String(input.rideId) }
          });
        } catch (e) {
        }
      }
      return { success: true };
    })
  }),
  payment: router({
    createCheckout: protectedProcedure.input(
      z13.object({
        rideId: z13.number(),
        amount: z13.number(),
        // in cents
        origin: z13.string(),
        destination: z13.string(),
        vehicleType: z13.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.amount,
        currency: "brl",
        automatic_payment_methods: {
          enabled: true
        },
        description: getRidePaymentDescription(
          input.origin,
          input.destination,
          input.vehicleType
        ),
        metadata: {
          ride_id: input.rideId.toString(),
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || ""
        }
      });
      await updateRidePaymentStatus(
        input.rideId,
        "pending",
        paymentIntent.id
      );
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    })
  }),
  chat: router({
    send: protectedProcedure.input(
      z13.object({
        rideId: z13.number(),
        message: z13.string().optional(),
        audioUrl: z13.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!input.message && !input.audioUrl) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Message or audio required" });
      }
      if (isDemoRideId(input.rideId)) {
        const ride = getDemoRide(input.rideId);
        if (!ride) {
          throw new TRPCError13({ code: "NOT_FOUND", message: "Ride not found" });
        }
        const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
        const canAccess = ride.passengerId === ctx.user.id || driverProfile != null && ride.driverId === driverProfile.id;
        if (!canAccess) {
          throw new TRPCError13({ code: "FORBIDDEN", message: "Access denied" });
        }
        const entry = addDemoChatMessage(
          input.rideId,
          ctx.user.id,
          input.message ?? "(\xE1udio demo)"
        );
        return { messageId: entry.id, success: true };
      }
      const messageId = await createChatMessage({
        rideId: input.rideId,
        senderId: ctx.user.id,
        message: input.message,
        audioUrl: input.audioUrl
      });
      return { messageId, success: true };
    }),
    getMessages: protectedProcedure.input(z13.object({ rideId: z13.number() })).query(async ({ ctx, input }) => {
      if (isDemoRideId(input.rideId)) {
        return getDemoChatMessages(input.rideId).map((msg) => ({
          id: msg.id,
          rideId: msg.rideId,
          senderId: msg.senderId,
          message: msg.message,
          audioUrl: null,
          createdAt: msg.createdAt
        }));
      }
      return await getChatMessagesByRide(input.rideId);
    })
  }),
  coupon: router({
    validate: publicProcedure.input(z13.object({
      code: z13.string(),
      rideValue: z13.number(),
      vehicleType: z13.enum(["moto", "carro", "van", "utilitario"])
    })).query(async ({ input, ctx }) => {
      const coupon = await getCouponByCode(input.code);
      if (!coupon) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Cupom n\xE3o encontrado" });
      }
      if (coupon.isActive !== 1) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Cupom inativo" });
      }
      const now = /* @__PURE__ */ new Date();
      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Cupom expirado ou ainda n\xE3o v\xE1lido" });
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new TRPCError13({ code: "BAD_REQUEST", message: "Cupom esgotado" });
      }
      if (coupon.minRideValue && input.rideValue < coupon.minRideValue) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: `Valor m\xEDnimo da corrida: R$ ${(coupon.minRideValue / 100).toFixed(2)}`
        });
      }
      if (coupon.vehicleTypes) {
        const allowedTypes = JSON.parse(coupon.vehicleTypes);
        if (!allowedTypes.includes(input.vehicleType)) {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Cupom n\xE3o v\xE1lido para este tipo de ve\xEDculo" });
        }
      }
      if (ctx.user) {
        const userUsage = await getCouponUsageByUser(ctx.user.id, coupon.id);
        if (userUsage.length >= coupon.maxUsesPerUser) {
          throw new TRPCError13({ code: "BAD_REQUEST", message: "Voc\xEA j\xE1 usou este cupom o m\xE1ximo de vezes permitido" });
        }
      }
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round(input.rideValue * coupon.discountValue / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, input.rideValue);
      return {
        valid: true,
        coupon,
        discountAmount,
        finalPrice: input.rideValue - discountAmount
      };
    }),
    create: adminProcedure3.input(z13.object({
      code: z13.string(),
      description: z13.string().optional(),
      discountType: z13.enum(["percentage", "fixed"]),
      discountValue: z13.number(),
      maxUses: z13.number().optional(),
      maxUsesPerUser: z13.number().default(1),
      validFrom: z13.date(),
      validUntil: z13.date(),
      minRideValue: z13.number().optional(),
      vehicleTypes: z13.array(z13.enum(["moto", "carro", "van"])).optional()
    })).mutation(async ({ input }) => {
      await createCoupon({
        code: input.code.toUpperCase(),
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUses: input.maxUses,
        usedCount: 0,
        maxUsesPerUser: input.maxUsesPerUser,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        minRideValue: input.minRideValue,
        vehicleTypes: input.vehicleTypes ? JSON.stringify(input.vehicleTypes) : null,
        isActive: 1
      });
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          const { users: usersTable, notifications: notificationsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const allUsers = await dbInstance.select({ id: usersTable.id }).from(usersTable);
          const discountText = input.discountType === "percentage" ? `${input.discountValue}% de desconto` : `R$ ${(input.discountValue / 100).toFixed(2)} de desconto`;
          const notifValues = allUsers.map((u) => ({
            userId: u.id,
            type: "promotion",
            title: "Novo Cupom Dispon\xEDvel!",
            message: `Use o c\xF3digo ${input.code.toUpperCase()} e ganhe ${discountText} na sua pr\xF3xima corrida!`,
            actionUrl: "/request-ride",
            actionLabel: "Solicitar corrida"
          }));
          for (let i = 0; i < notifValues.length; i += 100) {
            await dbInstance.insert(notificationsTable).values(notifValues.slice(i, i + 100));
          }
        }
      } catch (error) {
        console.error("Failed to send coupon notifications:", error);
      }
      return { success: true };
    }),
    getAll: adminProcedure3.query(async () => {
      return await getAllCoupons();
    }),
    toggle: adminProcedure3.input(z13.object({
      id: z13.number(),
      isActive: z13.number()
    })).mutation(async ({ input }) => {
      await updateCoupon(input.id, { isActive: input.isActive });
      return { success: true };
    })
  }),
  // ============= LOYALTY PROGRAM ROUTES =============
  loyalty: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await getUserLoyaltyStats(ctx.user.id);
    }),
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getLoyaltyHistory(ctx.user.id);
    }),
    redeemPoints: protectedProcedure.input(z13.object({
      points: z13.number().min(1),
      description: z13.string()
    })).mutation(async ({ ctx, input }) => {
      const success = await redeemLoyaltyPoints(
        ctx.user.id,
        input.points,
        input.description
      );
      if (!success) {
        throw new TRPCError13({
          code: "BAD_REQUEST",
          message: "Pontos insuficientes"
        });
      }
      return { success: true };
    })
  }),
  // ============= SAFETY & SECURITY ROUTES =============
  safety: router({
    // Emergency Contacts
    getEmergencyContacts: protectedProcedure.query(async ({ ctx }) => {
      return await getEmergencyContacts(ctx.user.id);
    }),
    addEmergencyContact: protectedProcedure.input(z13.object({
      name: z13.string().min(1),
      phone: z13.string().min(1),
      relationship: z13.string().optional(),
      isPrimary: z13.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      await createEmergencyContact({
        userId: ctx.user.id,
        ...input
      });
      return { success: true };
    }),
    updateEmergencyContact: protectedProcedure.input(z13.object({
      contactId: z13.number(),
      name: z13.string().optional(),
      phone: z13.string().optional(),
      relationship: z13.string().optional(),
      isPrimary: z13.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const { contactId, ...updates } = input;
      await updateEmergencyContact(contactId, ctx.user.id, updates);
      return { success: true };
    }),
    deleteEmergencyContact: protectedProcedure.input(z13.object({
      contactId: z13.number()
    })).mutation(async ({ ctx, input }) => {
      await deleteEmergencyContact(input.contactId, ctx.user.id);
      return { success: true };
    }),
    // SOS Alert
    triggerSOS: protectedProcedure.input(z13.object({
      rideId: z13.number(),
      location: z13.string(),
      lat: z13.string(),
      lng: z13.string()
    })).mutation(async ({ ctx, input }) => {
      const result = await triggerSOS(
        input.rideId,
        ctx.user.id,
        input.location,
        input.lat,
        input.lng
      );
      if (result && result.contacts.length > 0) {
        try {
          const { notifyUser: notifyUser2 } = await Promise.resolve().then(() => (init_fcm(), fcm_exports));
          const ride = await getRideById(input.rideId);
          for (const contact of result.contacts) {
            console.log(`[SOS] Would notify ${contact.name} at ${contact.phone}`);
          }
          await notifyOwner({
            title: "\u26A0\uFE0F ALERTA SOS ATIVADO",
            content: `Usu\xE1rio ${ctx.user.name} ativou SOS na corrida #${input.rideId}
Localiza\xE7\xE3o: ${input.location}
Lat/Lng: ${input.lat}, ${input.lng}`
          });
        } catch (error) {
          console.error("Failed to send SOS notifications:", error);
        }
      }
      return { success: true, alertId: result?.alertId };
    }),
    // Public ride tracking (no auth required)
    getSharedRide: publicProcedure.input(z13.object({
      shareToken: z13.string()
    })).query(async ({ input }) => {
      const ride = await getRideByShareToken(input.shareToken);
      if (!ride) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Corrida n\xE3o encontrada" });
      }
      return {
        id: ride.id,
        status: ride.status,
        originAddress: ride.originAddress,
        destinationAddress: ride.destinationAddress,
        driverCurrentLat: ride.driverCurrentLat,
        driverCurrentLng: ride.driverCurrentLng,
        vehicleType: ride.vehicleType,
        estimatedPrice: ride.estimatedPrice,
        createdAt: ride.createdAt
      };
    })
  }),
  // ============= ADMIN ROUTES =============
  admin: router({
    getOperationalOverview: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessAdminOperational(ctx)) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const dbInstance = await getDb();
      if (isDemoPassenger(ctx.user) || !dbInstance) {
        return getDemoOperationalOverview();
      }
      return getProductionOperationalOverview();
    }),
    getOperationalIntelligence: protectedProcedure.input(
      z13.object({
        preset: z13.enum(["today", "yesterday", "7d", "30d", "custom"]).optional(),
        from: z13.string().optional(),
        to: z13.string().optional()
      }).optional()
    ).query(async ({ ctx, input }) => {
      if (!canAccessAdminOperational(ctx)) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const period = {
        preset: input?.preset ?? "7d",
        from: input?.from,
        to: input?.to
      };
      const dbInstance = await getDb();
      if (isDemoPassenger(ctx.user) || !dbInstance) {
        return getDemoOperationalIntelligence(period);
      }
      return getProductionOperationalIntelligence(period);
    }),
    cancelRide: protectedProcedure.input(
      z13.object({
        rideId: z13.number(),
        reason: z13.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!canAccessAdminOperational(ctx)) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return adminCancelRide(input.rideId, ctx.user.id, input.reason);
    }),
    redispatchRide: protectedProcedure.input(z13.object({ rideId: z13.number() })).mutation(async ({ ctx, input }) => {
      if (!canAccessAdminOperational(ctx)) {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return adminRedispatchRide(input.rideId, isDemoPassenger(ctx.user));
    }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError13({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const allRides = await getAllRides();
      const pendingDrivers = await getPendingDriverProfiles();
      const approvedDrivers = await getApprovedDriverProfiles();
      const totalRevenue = allRides.reduce((sum, ride) => {
        if (ride.status === "completed") {
          return sum + (ride.finalPrice || ride.estimatedPrice || 0);
        }
        return sum;
      }, 0);
      const completedRides = allRides.filter((r) => r.status === "completed").length;
      const cancelledRides = allRides.filter((r) => r.status === "cancelled").length;
      const activeRides = allRides.filter((r) => r.status === "accepted" || r.status === "in_progress").length;
      return {
        totalRides: allRides.length,
        completedRides,
        cancelledRides,
        activeRides,
        totalRevenue,
        totalDrivers: approvedDrivers.length,
        pendingDrivers: pendingDrivers.length
      };
    }),
    getPendingDrivers: adminProcedure3.query(async () => {
      const db_instance = await getDb();
      if (!db_instance) return [];
      const { driverProfiles: driverProfiles2, users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq3 } = await import("drizzle-orm");
      return await db_instance.select({
        profile: driverProfiles2,
        user: users2
      }).from(driverProfiles2).innerJoin(users2, eq3(driverProfiles2.userId, users2.id)).where(eq3(driverProfiles2.status, "pending"));
    }),
    approveDriver: adminProcedure3.input(z13.object({
      driverId: z13.number()
    })).mutation(async ({ input }) => {
      const driverProfile = await getDriverProfileById(input.driverId);
      await updateDriverProfile(input.driverId, { status: "approved" });
      if (driverProfile?.userId) {
        try {
          const dbInstance = await getDb();
          if (dbInstance) {
            await createNotificationWithPush(dbInstance, driverProfile.userId, {
              type: "driver",
              title: "Perfil Aprovado!",
              message: `Parab\xE9ns! Seu perfil de motorista foi aprovado. Voc\xEA j\xE1 pode come\xE7ar a aceitar corridas no ${ENV.appName}!`,
              actionUrl: "/driver-dashboard",
              actionLabel: "Ir para painel",
              metadata: { event: "driver_approved" }
            });
          }
        } catch (error) {
          console.error("Failed to send driver approval notification:", error);
        }
      }
      return { success: true };
    }),
    rejectDriver: adminProcedure3.input(z13.object({
      driverId: z13.number()
    })).mutation(async ({ input }) => {
      const driverProfile = await getDriverProfileById(input.driverId);
      await updateDriverProfile(input.driverId, { status: "rejected" });
      if (driverProfile?.userId) {
        try {
          const dbInstance = await getDb();
          if (dbInstance) {
            await createNotificationWithPush(dbInstance, driverProfile.userId, {
              type: "driver",
              title: "Perfil N\xE3o Aprovado",
              message: "Seu perfil de motorista n\xE3o foi aprovado. Verifique seus documentos e tente novamente.",
              actionUrl: "/become-driver",
              actionLabel: "Atualizar perfil",
              metadata: { event: "driver_rejected" }
            });
          }
        } catch (error) {
          console.error("Failed to send driver rejection notification:", error);
        }
      }
      return { success: true };
    }),
    getAllRides: adminProcedure3.query(async () => {
      return await getActiveRides();
    })
  })
});

// server/_core/context.ts
init_env();

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/context.ts
async function createContext(opts) {
  if (!ENV.isProduction) {
    return {
      req: opts.req,
      res: opts.res,
      user: getStaticDemoPassenger()
    };
  }
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  if (!user && ENV.betaDemo) {
    user = getStaticDemoPassenger();
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/trpcVercel.ts
var app = express();
app.use((req, _res, next) => {
  const raw = req.url ?? "";
  const pathOnly = raw.split("?")[0] ?? "";
  if (!pathOnly.startsWith("/api/") && pathOnly.startsWith("/trpc")) {
    req.url = `/api${raw}`;
  }
  next();
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
function handler(req, res) {
  return new Promise((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("close", () => resolve());
    app(req, res, (err) => {
      if (err) reject(err);
    });
  });
}
export {
  handler as default
};
