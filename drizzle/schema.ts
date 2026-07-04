import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Driver profiles with additional information
 */
export const driverProfiles = mysqlTable("driver_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cpf: varchar("cpf", { length: 14 }),
  cnh: varchar("cnh", { length: 20 }),
  cnhImageUrl: text("cnhImageUrl"), // URL da foto da CNH
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
  rating: int("rating").default(0), // Stored as integer (e.g., 450 = 4.50 stars)
  totalRides: int("totalRides").default(0),
  isAvailable: boolean("isAvailable").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverProfile = typeof driverProfiles.$inferSelect;
export type InsertDriverProfile = typeof driverProfiles.$inferInsert;

/**
 * Vehicles registered by drivers
 */
export const vehicles = mysqlTable("vehicles", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Ride requests and tracking
 */
export const rides = mysqlTable("rides", {
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
  distance: int("distance"), // in meters
  duration: int("duration"), // in seconds
  estimatedPrice: int("estimatedPrice"), // in cents
  finalPrice: int("finalPrice"), // in cents
   paymentMethod: mysqlEnum("paymentMethod", ["pix", "card", "cash"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  
  // Coupon
  couponId: int("couponId"),
  couponCode: varchar("couponCode", { length: 50 }),
  discountAmount: int("discountAmount").default(0).notNull(),
  
  // Carpool/Shared ride fields
  isShared: boolean("isShared").default(false).notNull(),
  maxPassengers: int("maxPassengers").default(1).notNull(), // Total seats available
  currentPassengers: int("currentPassengers").default(1).notNull(), // Current number of passengers
  pricePerPassenger: int("pricePerPassenger"), // Price divided by passengers (in cents)
  
  // Freight-specific fields
  isFreight: boolean("isFreight").default(false).notNull(),
  cargoWeight: int("cargoWeight"), // in kg
  cargoType: varchar("cargoType", { length: 100 }), // mudança, entrega, materiais, etc
  cargoDescription: text("cargoDescription"),
  needsHelpers: boolean("needsHelpers").default(false),
  numberOfHelpers: int("numberOfHelpers").default(0),
  
  // Safety & Security fields
  shareToken: varchar("shareToken", { length: 64 }), // Token for public live tracking
  sosActivated: boolean("sosActivated").default(false).notNull(),
  sosActivatedAt: timestamp("sosActivatedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Operational stage timestamps (Rodada 3 — timeline operacional)
  acceptedAt: timestamp("acceptedAt"), // motorista aceitou a oferta
  arrivedAt: timestamp("arrivedAt"), // motorista chegou ao embarque
  startedAt: timestamp("startedAt"), // corrida iniciada (in_progress)
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  scheduledFor: timestamp("scheduledFor"), // For scheduled rides
  isScheduled: mysqlEnum("isScheduled", ["yes", "no"]).default("no").notNull(),
  
  // Cancellation
  cancelledBy: int("cancelledBy"), // userId who cancelled
  cancellationReason: text("cancellationReason"),

  /** Premium passageiro: terceiro, paradas, recorrência (JSON opcional). */
  passengerPremiumMeta: json("passengerPremiumMeta").$type<import("../shared/passengerPremium").PassengerPremiumMeta | null>(),
});

export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;

/**
 * Ratings and reviews
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Coupons and promotions
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(), // percentage (0-100) or fixed amount in cents
  
  // Usage limits
  maxUses: int("maxUses"), // null = unlimited
  usedCount: int("usedCount").default(0).notNull(),
  maxUsesPerUser: int("maxUsesPerUser").default(1).notNull(),
  
  // Validity
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  
  // Restrictions
  minRideValue: int("minRideValue"), // minimum ride value in cents to apply coupon
  vehicleTypes: text("vehicleTypes"), // JSON array of allowed vehicle types
  
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Coupon usage tracking
 */
export const couponUsage = mysqlTable("coupon_usage", {
  id: int("id").autoincrement().primaryKey(),
  couponId: int("couponId").notNull(),
  userId: int("userId").notNull(),
  rideId: int("rideId").notNull(),
  discountAmount: int("discountAmount").notNull(), // actual discount applied in cents
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

export type CouponUsage = typeof couponUsage.$inferSelect;
export type InsertCouponUsage = typeof couponUsage.$inferInsert;

/**
 * Chat messages table for real-time communication between drivers and passengers
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull(),
  senderId: int("senderId").notNull(),
  message: text("message"),
  audioUrl: text("audioUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Pricing configuration by vehicle type
 */
export const pricingConfig = mysqlTable("pricing_config", {
  id: int("id").autoincrement().primaryKey(),
  vehicleType: mysqlEnum("vehicleType", ["moto", "carro", "van", "utilitario"]).notNull().unique(),
  basePrice: int("basePrice").notNull(), // in cents
  pricePerKm: int("pricePerKm").notNull(), // in cents
  pricePerMinute: int("pricePerMinute").notNull(), // in cents
  minimumPrice: int("minimumPrice").notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingConfig = typeof pricingConfig.$inferSelect;
export type InsertPricingConfig = typeof pricingConfig.$inferInsert;

/**
 * Driver location tracking (for real-time updates)
 */
export const driverLocations = mysqlTable("driver_locations", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().unique(),
  lat: varchar("lat", { length: 20 }).notNull(),
  lng: varchar("lng", { length: 20 }).notNull(),
  heading: int("heading"), // direction in degrees
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverLocation = typeof driverLocations.$inferSelect;
export type InsertDriverLocation = typeof driverLocations.$inferInsert;

/**
 * Ofertas de corrida enviadas pelo dispatcher inteligente (Módulo 5).
 * Registra quais motoristas receberam a oferta e a distância até a origem.
 */
export const rideOffers = mysqlTable("ride_offers", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull(),
  driverId: int("driverId").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "accepted",
    "declined",
    "expired",
    "superseded",
  ])
    .default("pending")
    .notNull(),
  distanceMeters: int("distanceMeters").notNull(),
  /** Round de oferta — base para oferta sequencial futura. */
  offerRound: int("offerRound").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RideOffer = typeof rideOffers.$inferSelect;
export type InsertRideOffer = typeof rideOffers.$inferInsert;

/**
 * Saved addresses for quick access (home, work, etc.)
 */
export const savedAddresses = mysqlTable("saved_addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: mysqlEnum("label", ["home", "work", "other"]).notNull(),
  customLabel: varchar("customLabel", { length: 50 }), // For "other" type
  address: text("address").notNull(),
  lat: varchar("lat", { length: 20 }).notNull(),
  lng: varchar("lng", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedAddress = typeof savedAddresses.$inferSelect;
export type InsertSavedAddress = typeof savedAddresses.$inferInsert;

/**
 * FCM tokens for push notifications
 */
export const fcmTokens = mysqlTable("fcm_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: text("token").notNull(),
  deviceInfo: text("deviceInfo"), // Browser/device information
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FcmToken = typeof fcmTokens.$inferSelect;
export type InsertFcmToken = typeof fcmTokens.$inferInsert;

/**
 * Passengers in shared/carpool rides
 */
export const ridePassengers = mysqlTable("ride_passengers", {
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
  individualPrice: int("individualPrice").notNull(), // Price this passenger pays (in cents)
  
  // Pickup order
  pickupOrder: int("pickupOrder").default(1).notNull(), // Order in which passenger is picked up
  dropoffOrder: int("dropoffOrder").default(1).notNull(), // Order in which passenger is dropped off
  
  // Timestamps
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  pickedUpAt: timestamp("pickedUpAt"),
  droppedOffAt: timestamp("droppedOffAt"),
});

export type RidePassenger = typeof ridePassengers.$inferSelect;
export type InsertRidePassenger = typeof ridePassengers.$inferInsert;

/**
 * Loyalty points history (earnings and redemptions)
 */
export const loyaltyHistory = mysqlTable("loyalty_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["earned", "redeemed", "expired"]).notNull(),
  points: int("points").notNull(), // Positive for earned, negative for redeemed
  description: text("description").notNull(),
  rideId: int("rideId"), // Optional: link to ride if points earned from ride
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyHistory = typeof loyaltyHistory.$inferSelect;
export type InsertLoyaltyHistory = typeof loyaltyHistory.$inferInsert;

/**
 * Emergency contacts for safety features
 */
export const emergencyContacts = mysqlTable("emergency_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  relationship: varchar("relationship", { length: 100 }), // mãe, pai, cônjuge, amigo, etc
  isPrimary: boolean("isPrimary").default(false).notNull(), // Primary contact gets notified first
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = typeof emergencyContacts.$inferInsert;

/**
 * SOS alerts history
 */
export const sosAlerts = mysqlTable("sos_alerts", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull(),
  userId: int("userId").notNull(), // Who triggered the SOS
  location: text("location"), // Address or coordinates at time of alert
  lat: varchar("lat", { length: 20 }),
  lng: varchar("lng", { length: 20 }),
  status: mysqlEnum("status", ["active", "resolved", "false_alarm"]).default("active").notNull(),
  notes: text("notes"), // Admin notes or resolution details
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"), // Admin user ID who resolved
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SosAlert = typeof sosAlerts.$inferSelect;
export type InsertSosAlert = typeof sosAlerts.$inferInsert;

/**
 * In-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["ride", "payment", "promotion", "system", "driver", "safety"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: text("actionUrl"), // Optional: URL to navigate when clicked
  actionLabel: varchar("actionLabel", { length: 100 }), // Optional: Button label (e.g., "Ver Corrida")
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata"), // Additional data (rideId, amount, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Favorite drivers - passengers can save preferred drivers
 */
export const favoriteDrivers = mysqlTable("favorite_drivers", {
  id: int("id").autoincrement().primaryKey(),
  passengerId: int("passengerId").notNull(),
  driverId: int("driverId").notNull(), // driver_profiles.id
  nickname: varchar("nickname", { length: 100 }), // Optional custom name
  note: text("note"), // Optional note about the driver
  ridesCompleted: int("ridesCompleted").default(0).notNull(), // How many rides with this driver
  lastRideAt: timestamp("lastRideAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoriteDriver = typeof favoriteDrivers.$inferSelect;
export type InsertFavoriteDriver = typeof favoriteDrivers.$inferInsert;

/**
 * Referral program - invite friends and earn credits
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // User who invited
  referredId: int("referredId"), // User who signed up (null until they register)
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "registered", "completed", "expired"]).default("pending").notNull(),
  // "pending" = code created, no one used yet
  // "registered" = referred user signed up
  // "completed" = referred user completed first ride, both get reward
  // "expired" = code expired
  referrerRewardCents: int("referrerRewardCents").default(500).notNull(), // R$ 5.00 default
  referredRewardCents: int("referredRewardCents").default(500).notNull(), // R$ 5.00 default
  referrerPaid: boolean("referrerPaid").default(false).notNull(),
  referredPaid: boolean("referredPaid").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Delivery orders - send packages without riding along
 */
export const deliveryOrders = mysqlTable("delivery_orders", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(), // User who sends the package
  driverId: int("driverId"), // Assigned driver
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
  estimatedWeight: int("estimatedWeight"), // in grams
  isFragile: boolean("isFragile").default(false).notNull(),
  requiresSignature: boolean("requiresSignature").default(false).notNull(),
  
  // Pricing
  distance: int("distance"), // in meters
  duration: int("duration"), // in seconds
  estimatedPrice: int("estimatedPrice"), // in cents
  finalPrice: int("finalPrice"), // in cents
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "card", "cash"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
  
  // Tracking
  trackingCode: varchar("trackingCode", { length: 20 }),
  proofOfDeliveryUrl: text("proofOfDeliveryUrl"), // Photo of delivered package

  /** Premium entregas: código confirmação, histórico, assinatura (JSON opcional). */
  deliveryPremiumMeta: json("deliveryPremiumMeta").$type<
    import("../shared/deliveryPremium").DeliveryPremiumMeta | null
  >(),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  pickedUpAt: timestamp("pickedUpAt"),
  deliveredAt: timestamp("deliveredAt"),
  cancelledAt: timestamp("cancelledAt"),
});

export type DeliveryOrder = typeof deliveryOrders.$inferSelect;
export type InsertDeliveryOrder = typeof deliveryOrders.$inferInsert;

/**
 * Preferências premium do motorista (meta, pausa, filtros).
 */
export const driverPremiumPreferences = mysqlTable("driver_premium_preferences", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().unique(),
  dailyGoalCents: int("dailyGoalCents").default(15_000).notNull(),
  smartPause: boolean("smartPause").default(false).notNull(),
  serviceFilters: json("serviceFilters").$type<Record<string, boolean>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverPremiumPreferencesRow = typeof driverPremiumPreferences.$inferSelect;
export type InsertDriverPremiumPreferencesRow = typeof driverPremiumPreferences.$inferInsert;

/**
 * Configuração financeira da plataforma (comissões, preços mínimos).
 */
export const platformFinanceSettings = mysqlTable("platform_finance_settings", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 64 }).notNull().unique(),
  configJson: json("configJson").$type<import("../shared/adminFinance").PlatformFinanceConfig>().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformFinanceSettingsRow = typeof platformFinanceSettings.$inferSelect;

/**
 * Ledger financeiro — registro por serviço concluído.
 */
export const financialLedger = mysqlTable("financial_ledger", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialLedgerRow = typeof financialLedger.$inferSelect;
export type InsertFinancialLedgerRow = typeof financialLedger.$inferInsert;

/**
 * Pré-cadastro de motorista — formulário em etapas + documentos.
 */
export const driverApplications = mysqlTable("driver_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  status: mysqlEnum("status", [
    "rascunho",
    "enviado",
    "em_analise",
    "pendente",
    "aprovado",
    "reprovado",
  ])
    .default("rascunho")
    .notNull(),
  personalData: json("personalData").$type<import("../shared/driverRegistration").DriverPersonalData>(),
  cnhData: json("cnhData").$type<import("../shared/driverRegistration").DriverCnhData>(),
  vehicleData: json("vehicleData").$type<import("../shared/driverRegistration").DriverVehicleData>(),
  securityData: json("securityData").$type<import("../shared/driverRegistration").DriverSecurityData>(),
  termsData: json("termsData").$type<import("../shared/driverRegistration").DriverTermsData>(),
  reviewNotes: text("reviewNotes"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverApplicationRow = typeof driverApplications.$inferSelect;
export type InsertDriverApplicationRow = typeof driverApplications.$inferInsert;
