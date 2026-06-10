import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notificationRouter, createNotificationWithPush } from "./routers/notification";
import { mapsRouter } from "./routers/maps";
import { favoritesRouter } from "./routers/favorites";
import { referralsRouter } from "./routers/referrals";
import { deliveryRouter } from "./routers/delivery";
import { utilitiesRouter } from "./routers/utilities";
import { utilityProviderRouter } from "./routers/utilityProvider";
import { utilityChatRouter } from "./routers/utilityChat";
import { driverPremiumRouter } from "./routers/driverPremium";
import { adminFinanceRouter } from "./routers/adminFinance";
import { recordCancellationAudit } from "./_core/demoAdminFinance";
import { applyFinanceMinimumPrice } from "./_core/platformFinance";
import { recordRideLedgerEntry } from "./_core/financialLedger";
import { driverProcedure } from "./_core/driverProcedure";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import Stripe from "stripe";
import { getRidePaymentDescription } from "./stripe-products";
import { ENV } from "./_core/env";
import { getPricingForVehicle, withDemoPricingFallback } from "./_core/demoPricing";
import { isDemoPassenger } from "./_core/demoUser";
import {
  getDemoOperationalOverview,
  getProductionOperationalOverview,
} from "./_core/adminOperational";
import {
  getDemoOperationalIntelligence,
  getProductionOperationalIntelligence,
} from "./_core/operationalIntelligence";
import { adminCancelRide, adminRedispatchRide } from "./_core/adminRideActions";
import {
  attachDispatchMeta,
  processDispatchForDemoRide,
  processDispatchForProductionRide,
} from "./_core/dispatchEngine";
import {
  expireDemoPendingOffersForRide,
  hydrateDemoRideOffers,
  serializeDemoRideOffers,
} from "./_core/demoRideOffers";
import { isRideReadyForDispatch } from "@shared/rideDispatcher";
import { createDemoRide, getDemoRide, getDemoRequestedRides, getDemoActiveRidesForUser, getAllDemoRides, getDemoPassengerRides, getDemoDriverRides, hydrateDemoRides, isDemoRideId, updateDemoRide } from "./_core/demoRide";
import { prefetchDemoRoutePath } from "./_core/demoRoutePaths";
import {
  clearDemoDriverTrack,
  initDemoDriverTrack,
  resetDemoDriverTrackPhase,
} from "./_core/demoDriverTracking";
import {
  advanceDemoRideSimulation,
  attachSimulationMeta,
  clearSimulationState,
  registerDemoRideForSimulation,
  simulationAcceptRide,
  simulationStartRide,
  syncDemoRideState,
} from "./_core/demoRideSimulation";
import { isDemoDriverSimulationAutoAcceptServer, isDemoDriverSimulationEnabledServer } from "@shared/demoSimulation";
import {
  createDemoDriverProfile,
  createDemoVehicle,
  getDemoDriverProfileByUserId,
  getDemoRideDriverDetails,
  getDemoVehicleById,
  getDemoVehiclesByDriverId,
  updateDemoDriverAvailability,
} from "./_core/demoDriver";
import { addDemoChatMessage, getDemoChatMessages } from "./_core/demoChat";
import {
  acceptDemoRideOffers,
  declineDemoRideOfferForDriver,
  declineProductionRideOfferForDriver,
  dispatchDemoRideOffers,
  dispatchProductionRideOffers,
  getDemoAvailableRidesForDriver,
  getProductionAvailableRidesForDriver,
  acceptProductionRideOffers,
  reportDemoDriverLocation,
  validateDemoDriverCanAccept,
  validateProductionDriverCanAccept,
} from "./_core/rideDispatcher";
import { driverHasDemoPendingOffer } from "./_core/demoRideOffers";
import { storagePut } from "./storage";
import { buildPremiumMeta } from "@shared/passengerPremium";
import {
  cancelDemoRecurringSchedule,
  createDemoRecurringSchedule,
  getDemoRecurringSchedulesForPassenger,
  hydrateDemoRecurringSchedules,
} from "./_core/demoRecurringSchedules";

const bookedForInputSchema = z
  .object({
    name: z.string().min(2),
    phone: z.string().min(8),
    notes: z.string().optional(),
  })
  .optional();

const intermediateStopsInputSchema = z
  .array(
    z.object({
      address: z.string().min(2),
      lat: z.string(),
      lng: z.string(),
      placeId: z.string().optional(),
    })
  )
  .max(2)
  .optional();

const recurrenceRuleInputSchema = z
  .object({
    type: z.enum(["daily", "weekly", "custom"]),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().optional(),
  })
  .optional();
import { nanoid } from "nanoid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

// Helper procedure for driver-only access — re-exported from _core/driverProcedure.ts

// Helper procedure for admin-only access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: "Admin access required" });
  }
  return next({ ctx });
});

/** Admin real ou passageiro demo em dev local (Central Operacional). */
function canAccessAdminOperational(ctx: { user: { role: string; openId: string } }): boolean {
  if (ctx.user.role === "admin") return true;
  return !ENV.isProduction && isDemoPassenger(ctx.user);
}

export const appRouter = router({
  system: systemRouter,
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
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          return { success: true };
        }
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ext = input.mimeType.split("/")[1] || "jpg";
        const fileKey = `avatars/${ctx.user.id}-${nanoid(8)}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Imagem muito grande. Máximo 5MB." });
        }
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await db.updateUserProfile(ctx.user.id, { avatarUrl: url });
        return { url };
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),

    getRecentRides: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(10).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 5;
        if (isDemoPassenger(ctx.user)) {
          return getDemoPassengerRides(ctx.user.id)
            .filter((r) => r.status !== "cancelled")
            .slice(0, limit);
        }
        return await db.getRecentRides(ctx.user.id, limit);
      }),
    
    getUserRides: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoPassengerRides(ctx.user.id);
      }
      return await db.getPassengerRides(ctx.user.id);
    }),

    // Saved addresses
    getSavedAddresses: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return [];
      }
      return await db.getSavedAddressesByUser(ctx.user.id);
    }),

    saveFavoriteAddress: protectedProcedure
      .input(z.object({
        label: z.enum(["home", "work", "other"]),
        customLabel: z.string().optional(),
        address: z.string(),
        lat: z.string(),
        lng: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          return { success: true };
        }
        // Check if address with this label already exists
        const existing = await db.getSavedAddressByLabel(ctx.user.id, input.label);
        
        if (existing) {
          // Update existing
          await db.updateSavedAddress(existing.id, {
            address: input.address,
            lat: input.lat,
            lng: input.lng,
            customLabel: input.customLabel,
          });
        } else {
          // Create new
          await db.createSavedAddress({
            userId: ctx.user.id,
            ...input,
          });
        }
        
        return { success: true };
      }),

    deleteSavedAddress: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          return { success: true };
        }
        await db.deleteSavedAddress(input.id);
        return { success: true };
      }),

    // FCM Push Notifications
    registerFcmToken: protectedProcedure
      .input(z.object({
        token: z.string(),
        deviceInfo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveFcmToken(ctx.user.id, input.token, input.deviceInfo);
        return { success: true };
      }),

    // Alias for registerFcmToken (for compatibility)
    saveFcmToken: protectedProcedure
      .input(z.object({
        fcmToken: z.string(),
        deviceInfo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveFcmToken(ctx.user.id, input.fcmToken, input.deviceInfo);
        return { success: true };
      }),

    unregisterFcmToken: protectedProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFcmToken(input.token);
        return { success: true };
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= DRIVER PROFILE ROUTES =============
  driver: router({
    getProfile: publicProcedure
      .input(z.object({
        driverId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getDriverProfileById(input.driverId);
      }),

    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoDriverProfileByUserId(ctx.user.id) ?? null;
      }
      return await db.getDriverProfileByUserId(ctx.user.id);
    }),

    createProfile: protectedProcedure
      .input(z.object({
        cpf: z.string().optional(),
        cnh: z.string().optional(),
        cnhImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          const profile = createDemoDriverProfile({
            userId: ctx.user.id,
            cpf: input.cpf,
            cnh: input.cnh,
            cnhImageUrl: input.cnhImageUrl,
          });
          return { success: true, profile };
        }

        const existing = await db.getDriverProfileByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Driver profile already exists" });
        }

        await db.createDriverProfile({
          userId: ctx.user.id,
          ...input,
        });

        await db.updateUserRole(ctx.user.id, "driver");

        return { success: true };
      }),

    updateProfile: driverProcedure
      .input(z.object({
        cpf: z.string().optional(),
        cnh: z.string().optional(),
        cnhImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateDriverProfile(ctx.driverProfile.id, input);
        return { success: true };
      }),

    setAvailability: driverProcedure
      .input(z.object({
        isAvailable: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          updateDemoDriverAvailability(ctx.driverProfile.id, input.isAvailable);
          return { success: true };
        }
        await db.updateDriverAvailability(ctx.driverProfile.id, input.isAvailable);
        return { success: true };
      }),

    getStats: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return {
          totalRides: ctx.driverProfile.totalRides ?? 0,
          rating: (ctx.driverProfile.rating || 0) / 100,
          totalEarnings: 0,
          completedToday: 0,
        };
      }

      const rides = await db.getDriverRides(ctx.driverProfile.id);
      const completedRides = rides.filter(r => r.status === "completed");
      const totalEarnings = completedRides.reduce((sum, r) => sum + (r.finalPrice || 0), 0);

      return {
        totalRides: ctx.driverProfile.totalRides,
        rating: (ctx.driverProfile.rating || 0) / 100, // Convert back to decimal
        totalEarnings,
        completedToday: completedRides.filter(r => {
          const today = new Date();
          const rideDate = r.completedAt ? new Date(r.completedAt) : null;
          return rideDate && rideDate.toDateString() === today.toDateString();
        }).length,
      };
    }),

    updateLocation: driverProcedure
      .input(z.object({
        lat: z.string(),
        lng: z.string(),
        heading: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          reportDemoDriverLocation(ctx.driverProfile.id, input.lat, input.lng);
          return { success: true };
        }

        await db.updateDriverLocation({
          driverId: ctx.driverProfile.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // ============= VEHICLE ROUTES =============
  vehicle: router({
    list: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoVehiclesByDriverId(ctx.driverProfile.id);
      }
      return await db.getVehiclesByDriverId(ctx.driverProfile.id);
    }),

    create: driverProcedure
      .input(z.object({
        type: z.enum(["moto", "carro", "van", "utilitario"]),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        plate: z.string(),
        color: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          createDemoVehicle(ctx.driverProfile.id, input);
          return { success: true };
        }

        await db.createVehicle({
          driverId: ctx.driverProfile.id,
          ...input,
        });
        return { success: true };
      }),

    update: driverProcedure
      .input(z.object({
        vehicleId: z.number(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        color: z.string().optional(),
        photoUrl: z.string().optional(),
        status: z.enum(["active", "inactive", "maintenance"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { vehicleId, ...updates } = input;
        
        // Verify ownership
        const vehicle = await db.getVehicleById(vehicleId);
        if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Vehicle not found or access denied" });
        }

        await db.updateVehicle(vehicleId, updates);
        return { success: true };
      }),
  }),

  // ============= RIDE ROUTES =============
  ride: router({
    request: protectedProcedure
      .input(z.object({
        vehicleType: z.enum(["moto", "carro", "van", "utilitario"]),
        originAddress: z.string(),
        originLat: z.string(),
        originLng: z.string(),
        destinationAddress: z.string(),
        destinationLat: z.string(),
        destinationLng: z.string(),
        distance: z.number(),
        duration: z.number(),
        estimatedPrice: z.number(),
        paymentMethod: z.enum(["pix", "card", "cash"]),
        // Carpool fields
        isShared: z.boolean().optional(),
        maxPassengers: z.number().optional(),
        // Freight fields
        isFreight: z.boolean().optional(),
        cargoWeight: z.number().optional(),
        cargoType: z.string().optional(),
        cargoDescription: z.string().optional(),
        needsHelpers: z.boolean().optional(),
        numberOfHelpers: z.number().optional(),
        bookedFor: bookedForInputSchema,
        intermediateStops: intermediateStopsInputSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const { bookedFor, intermediateStops, ...rideInput } = input;
        const passengerPremiumMeta = buildPremiumMeta({ bookedFor, intermediateStops });

        // Demo local: corrida em memória — evita insert com passengerId=0 no MySQL
        if (isDemoPassenger(ctx.user)) {
          let finalEstimatedPrice = input.estimatedPrice;
          let pricePerPassenger: number | undefined;

          if (input.isShared && input.maxPassengers && input.maxPassengers > 1) {
            pricePerPassenger = Math.floor(finalEstimatedPrice / input.maxPassengers);
          }

          const ride = createDemoRide({
            passengerId: ctx.user.id,
            ...rideInput,
            estimatedPrice: finalEstimatedPrice,
            pricePerPassenger,
            currentPassengers: 1,
            shareToken: `demo-${Date.now()}`,
            paymentStatus: input.paymentMethod === "cash" ? "paid" : "pending",
            discountAmount: 0,
            passengerPremiumMeta,
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
                `[Dispatcher] Nenhum motorista elegível para corrida demo #${ride.id} (tipo ${input.vehicleType})`
              );
            } else {
              console.log(
                `[Dispatcher] ${dispatch.offersCreated} oferta(s) rodada ${dispatch.offerRound} para corrida demo #${ride.id} (${dispatch.eligibleCount} elegíveis)`
              );
            }
          }

          return {
            success: true,
            rideId: ride.id,
            pricePerPassenger,
          };
        }

        // Apply VIP discount
        let finalEstimatedPrice = input.estimatedPrice;
        const user = isDemoPassenger(ctx.user)
          ? ctx.user
          : await db.getUserById(ctx.user.id);
        if (user && user.vipLevel) {
          const vipDiscount = db.getVipDiscount(user.vipLevel);
          if (vipDiscount > 0) {
            const discountAmount = Math.floor((input.estimatedPrice * vipDiscount) / 100);
            finalEstimatedPrice = input.estimatedPrice - discountAmount;
          }
        }

        // Calculate price per passenger for shared rides
        let pricePerPassenger = undefined;
        if (input.isShared && input.maxPassengers && input.maxPassengers > 1) {
          pricePerPassenger = Math.floor(finalEstimatedPrice / input.maxPassengers);
        }

        const result = await db.createRide({
          passengerId: ctx.user.id,
          ...rideInput,
          estimatedPrice: finalEstimatedPrice,
          pricePerPassenger,
          currentPassengers: 1, // Creator is the first passenger
          shareToken: db.generateShareToken(), // For live tracking
          passengerPremiumMeta,
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
            console.error("[Dispatcher] Falha ao criar ofertas de produção:", error);
          }
        }
        
        // If shared ride, create entry in ride_passengers for the creator
        if (input.isShared && rideId > 0) {
          await db.createRidePassenger({
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
            dropoffOrder: 1,
          });
        }
        
        // Notify all available/approved drivers about the new ride
        if (rideId > 0) {
          try {
            const availableDrivers = await db.getAvailableDrivers();
            const dbInstance = await db.getDb();
            if (dbInstance && availableDrivers.length > 0) {
              const passengerName = ctx.user.name || 'Um passageiro';
              const vehicleLabel: Record<string, string> = {
                moto: 'Moto', carro: 'Carro', van: 'Van', utilitario: 'Utilitário'
              };
              const priceFormatted = (finalEstimatedPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              await Promise.all(
                availableDrivers.map((driver) =>
                  createNotificationWithPush(dbInstance, driver.userId, {
                    type: "ride",
                    title: "Nova Corrida Disponível!",
                    message: `${passengerName} solicita ${vehicleLabel[input.vehicleType] || input.vehicleType} — ${input.originAddress.split(',')[0]} → ${input.destinationAddress.split(',')[0]} (${priceFormatted})`,
                    actionUrl: `/driver-dashboard`,
                    actionLabel: "Ver corrida",
                    metadata: { rideId, event: "new_ride_available" },
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

    accept: driverProcedure
      .input(z.object({
        rideId: z.number(),
        vehicleId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
          }
          if (ride.status !== "requested") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Ride already accepted or completed" });
          }

          if (!validateDemoDriverCanAccept(input.rideId, ctx.driverProfile.id)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Esta corrida não está disponível para você",
            });
          }

          const vehicle = getDemoVehicleById(input.vehicleId);
          if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Vehicle not found or access denied" });
          }

          const startCoords = initDemoDriverTrack(input.rideId, ride, "to_pickup");

          updateDemoRide(input.rideId, {
            driverId: ctx.driverProfile.id,
            vehicleId: input.vehicleId,
            status: "accepted",
            driverCurrentLat: startCoords.driverCurrentLat,
            driverCurrentLng: startCoords.driverCurrentLng,
          });

          acceptDemoRideOffers(input.rideId, ctx.driverProfile.id);

          return { success: true };
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }

        if (ride.status !== "requested") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ride already accepted or completed" });
        }

        if (!(await validateProductionDriverCanAccept(input.rideId, ctx.driverProfile.id))) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Esta corrida não está disponível para você",
          });
        }

        // Verify vehicle ownership
        const vehicle = await db.getVehicleById(input.vehicleId);
        if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Vehicle not found or access denied" });
        }

        const driverLocation = await db.getDriverLocation(ctx.driverProfile.id);

        await db.updateRide(input.rideId, {
          driverId: ctx.driverProfile.id,
          vehicleId: input.vehicleId,
          status: "accepted",
          ...(driverLocation
            ? {
                driverCurrentLat: driverLocation.lat,
                driverCurrentLng: driverLocation.lng,
              }
            : {}),
        });

        await acceptProductionRideOffers(input.rideId, ctx.driverProfile.id);

        // Send in-app + push notification to passenger
        try {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            await createNotificationWithPush(dbInstance, ride.passengerId, {
              type: "ride",
              title: "Motorista Encontrado!",
              message: `${ctx.user.name || 'Um motorista'} aceitou sua corrida. Prepare-se!`,
              actionUrl: `/ride/${input.rideId}`,
              actionLabel: "Ver corrida",
              metadata: { rideId: input.rideId, event: "ride_accepted" },
            });
          }
        } catch (error) {
          console.error("Failed to send notification:", error);
        }

        // Also notify owner
        try {
          await notifyOwner({
            title: "Motorista Encontrado!",
            content: `Sua corrida #${input.rideId} foi aceita por ${ctx.user.name || 'um motorista'}. O motorista está a caminho!`,
          });
        } catch (error) {
          console.error("Failed to send owner notification:", error);
        }

        return { success: true };
      }),

    start: driverProcedure
      .input(z.object({
        rideId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride || ride.driverId !== ctx.driverProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Ride not found or access denied" });
          }
          if (ride.status !== "accepted") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Ride cannot be started in current status" });
          }

          const updated = updateDemoRide(input.rideId, { status: "in_progress" });
          if (updated) {
            resetDemoDriverTrackPhase(input.rideId, updated, "to_destination");
            syncDemoRideState(updated);
          }
          return { success: true };
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride || ride.driverId !== ctx.driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Ride not found or access denied" });
        }

        await db.updateRide(input.rideId, {
          status: "in_progress",
        });

        // Send in-app + push notification to passenger
        try {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            await createNotificationWithPush(dbInstance, ride.passengerId, {
              type: "ride",
              title: "Corrida Iniciada!",
              message: "Seu motorista iniciou a corrida. Boa viagem!",
              actionUrl: `/ride/${input.rideId}`,
              actionLabel: "Acompanhar",
              metadata: { rideId: input.rideId, event: "ride_started" },
            });
          }
        } catch (error) {
          console.error("Failed to send notification:", error);
        }

        // Also notify owner
        try {
          await notifyOwner({
            title: "Corrida Iniciada",
            content: `Sua corrida #${input.rideId} foi iniciada. Boa viagem!`,
          });
        } catch (error) {
          console.error("Failed to send owner notification:", error);
        }

        return { success: true };
      }),

    complete: driverProcedure
      .input(z.object({
        rideId: z.number(),
        finalPrice: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride || ride.driverId !== ctx.driverProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Ride not found or access denied" });
          }
          if (ride.status !== "in_progress" && ride.status !== "accepted") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Ride cannot be completed in current status" });
          }

          const updated = updateDemoRide(input.rideId, {
            status: "completed",
            completedAt: new Date(),
            finalPrice: input.finalPrice,
            paymentStatus:
              ride.paymentMethod === "cash" || ride.paymentStatus === "paid" ? "paid" : "pending",
          });

          if (!updated) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
          }

          clearSimulationState(input.rideId);
          try {
            await recordRideLedgerEntry(updated);
          } catch (err) {
            console.error("[Ledger] demo ride:", err);
          }
          return updated;
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride || ride.driverId !== ctx.driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Ride not found or access denied" });
        }

        await db.updateRide(input.rideId, {
          status: "completed",
          completedAt: new Date(),
          finalPrice: input.finalPrice,
          paymentStatus: ride.paymentMethod === "cash" ? "paid" : "pending",
        });

        // Send in-app + push notification to passenger
        try {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            await createNotificationWithPush(dbInstance, ride.passengerId, {
              type: "ride",
              title: "Corrida Concluída!",
              message: `Valor final: R$ ${(input.finalPrice / 100).toFixed(2)}. Obrigado por usar o ${ENV.appName}!`,
              actionUrl: `/ride/${input.rideId}`,
              actionLabel: "Avaliar motorista",
              metadata: { rideId: input.rideId, event: "ride_completed", finalPrice: input.finalPrice },
            });
          }
        } catch (error) {
          console.error("Failed to send notification:", error);
        }

        // Also notify owner
        try {
          await notifyOwner({
            title: "Corrida Concluída",
            content: `Sua corrida #${input.rideId} foi concluída.\nValor final: R$ ${(input.finalPrice / 100).toFixed(2)}\n\nObrigado por usar o ${ENV.appName}!`,
          });
        } catch (error) {
          console.error("Failed to send owner notification:", error);
        }

        // Add loyalty points (1 point per R$ 1 spent)
        try {
          const pointsEarned = Math.floor(input.finalPrice / 100); // Convert cents to reais
          await db.addLoyaltyPoints(
            ride.passengerId,
            pointsEarned,
            `Corrida #${input.rideId} concluída`,
            input.rideId
          );
        } catch (error) {
          console.error("Failed to add loyalty points:", error);
        }

        try {
          const completed = await db.getRideById(input.rideId);
          if (completed) await recordRideLedgerEntry(completed);
          if (ride.couponId && completed) {
            await db.recordCouponUsage({
              couponId: ride.couponId,
              userId: ride.passengerId,
              rideId: input.rideId,
              discountAmount: ride.discountAmount ?? 0,
            });
          }
        } catch (err) {
          console.error("[Ledger] production ride:", err);
        }

        return { success: true };
      }),

    cancel: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
          }
          const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
          const canAccess =
            ride.passengerId === ctx.user.id ||
            (driverProfile != null && ride.driverId === driverProfile.id);
          if (!canAccess) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }

          const isPassenger = ride.passengerId === ctx.user.id;
          updateDemoRide(input.rideId, {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: ctx.user.id,
            cancellationReason: input.reason ?? null,
          });
          recordCancellationAudit({
            entityType: "ride",
            entityId: input.rideId,
            origin: isPassenger ? "passenger" : "driver",
            reason: input.reason ?? "Cancelamento pelo usuário",
            cancelledByUserId: ctx.user.id,
          });
          expireDemoPendingOffersForRide(input.rideId);
          clearDemoDriverTrack(input.rideId);
          clearSimulationState(input.rideId);
          return { success: true };
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }

        // Verify user is passenger or driver
        if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const isPassengerCancelling = ride.passengerId === ctx.user.id;
        await db.updateRide(input.rideId, {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: ctx.user.id,
          cancellationReason: input.reason,
        });
        recordCancellationAudit({
          entityType: "ride",
          entityId: input.rideId,
          origin: isPassengerCancelling ? "passenger" : "driver",
          reason: input.reason ?? "Cancelamento pelo usuário",
          cancelledByUserId: ctx.user.id,
        });
        await db.expirePendingRideOffersForRide(input.rideId);

        // Send in-app + push notification to the other party
        try {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            const isPassengerCancelling = ride.passengerId === ctx.user.id;
            const targetUserId = isPassengerCancelling ? ride.driverId : ride.passengerId;
            if (targetUserId) {
              await createNotificationWithPush(dbInstance, targetUserId, {
                type: "ride",
                title: "Corrida Cancelada",
                message: isPassengerCancelling
                  ? `O passageiro cancelou a corrida #${input.rideId}.${input.reason ? ` Motivo: ${input.reason}` : ''}`
                  : `O motorista cancelou a corrida #${input.rideId}.${input.reason ? ` Motivo: ${input.reason}` : ''}`,
                actionUrl: `/rides`,
                actionLabel: "Ver hist\u00f3rico",
                metadata: { rideId: input.rideId, event: "ride_cancelled" },
              });
            }
          }
        } catch (error) {
          console.error("Failed to send cancellation notification:", error);
        }

        return { success: true };
      }),

    declineOffer: driverProcedure
      .input(
        z.object({
          rideId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride || ride.status !== "requested") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida indisponível" });
          }
          if (!driverHasDemoPendingOffer(input.rideId, ctx.driverProfile.id)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Oferta expirada ou indisponível",
            });
          }

          const declined = declineDemoRideOfferForDriver(
            input.rideId,
            ctx.driverProfile.id
          );
          if (!declined) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível recusar" });
          }

          processDispatchForDemoRide(input.rideId);

          return {
            success: true,
            offers: serializeDemoRideOffers(),
          };
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride || ride.status !== "requested") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida indisponível" });
        }

        const declined = await declineProductionRideOfferForDriver(
          input.rideId,
          ctx.driverProfile.id
        );
        if (!declined) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Oferta expirada ou indisponível",
          });
        }

        await processDispatchForProductionRide(input.rideId);

        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({
        rideId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          let ride = getDemoRide(input.rideId);
          if (!ride) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
          }
          const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
          const canAccess =
            ride.passengerId === ctx.user.id ||
            (driverProfile != null && ride.driverId === driverProfile.id);
          if (!canAccess) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
          processDispatchForDemoRide(input.rideId);
          ride = getDemoRide(input.rideId)!;
          ride = syncDemoRideState(ride);
          const demoDriver = getDemoRideDriverDetails(ride);
          const withMeta = attachSimulationMeta(ride);
          const withDispatch = attachDispatchMeta(withMeta);
          return demoDriver ? { ...withDispatch, demoDriver } : withDispatch;
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }

        // Verify access
        if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return ride;
      }),

    /** Restaura corridas + ofertas demo do localStorage para memória do servidor. */
    hydrateDemoState: protectedProcedure
      .input(
        z.object({
          rides: z.array(z.any()),
          offers: z.array(z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isDemoPassenger(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Demo only" });
        }
        hydrateDemoRides(input.rides as never);
        if (input.offers?.length) {
          hydrateDemoRideOffers(input.offers as never);
        }
        for (const ride of getDemoRequestedRides()) {
          if (isRideReadyForDispatch(ride)) {
            processDispatchForDemoRide(ride.id);
          }
        }
        return {
          success: true,
          count: getAllDemoRides().length,
          offers: serializeDemoRideOffers(),
        };
      }),

    /** Snapshot de ofertas demo para persistência no cliente. */
    getDemoOffersSnapshot: protectedProcedure.query(async ({ ctx }) => {
      if (!isDemoPassenger(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Demo only" });
      }
      return { offers: serializeDemoRideOffers() };
    }),

    /** Pagamento demo local (pix/cartão) sem Stripe. */
    confirmDemoPayment: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!isDemoRideId(input.rideId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not a demo ride" });
        }
        const ride = getDemoRide(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }
        if (ride.passengerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const updated = updateDemoRide(input.rideId, {
          paymentStatus: "paid",
          status:
            ride.driverId && ride.status !== "cancelled" && ride.status !== "completed"
              ? "accepted"
              : ride.status,
          ...(ride.driverCurrentLat && ride.driverCurrentLng
            ? {
                driverCurrentLat: ride.driverCurrentLat,
                driverCurrentLng: ride.driverCurrentLng,
              }
            : initDemoDriverTrack(input.rideId, ride, "to_pickup")),
        });

        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }

        const synced = syncDemoRideState(updated);
        const demoDriver = getDemoRideDriverDetails(synced);
        const withMeta = attachSimulationMeta(synced);
        return demoDriver ? { ...withMeta, demoDriver } : withMeta;
      }),

    /** Modo simulação (DEV): aceita corrida com Motorista Demo. */
    simulationAccept: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!isDemoDriverSimulationEnabledServer()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Modo simulação desativado" });
        }
        if (!isDemoRideId(input.rideId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not a demo ride" });
        }
        const ride = getDemoRide(input.rideId);
        if (!ride || ride.passengerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const accepted = simulationAcceptRide(input.rideId);
        if (!accepted) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível simular aceite" });
        }
        const synced = syncDemoRideState(accepted);
        const demoDriver = getDemoRideDriverDetails(synced);
        const withMeta = attachSimulationMeta(synced);
        return demoDriver ? { ...withMeta, demoDriver } : withMeta;
      }),

    /** Modo simulação (DEV): inicia corrida após motorista chegar. */
    simulationStart: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!isDemoDriverSimulationEnabledServer()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Modo simulação desativado" });
        }
        if (!isDemoRideId(input.rideId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not a demo ride" });
        }
        const ride = getDemoRide(input.rideId);
        if (!ride || ride.passengerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const started = simulationStartRide(input.rideId);
        if (!started) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Motorista ainda não chegou ao embarque",
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
      return await db.getPassengerRides(ctx.user.id);
    }),

    myDrives: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        return getDemoDriverRides(ctx.driverProfile.id);
      }
      return await db.getDriverRides(ctx.driverProfile.id);
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
        return getDemoActiveRidesForUser(ctx.user.id, driverProfile?.id).map((ride) =>
          attachSimulationMeta(syncDemoRideState(ride))
        );
      }

      const rides = await db.getActiveRides();
      return rides.filter(r => r.passengerId === ctx.user.id || r.driverId === ctx.user.id);
    }),

    updateDriverLocation: driverProcedure
      .input(z.object({
        rideId: z.number(),
        lat: z.string(),
        lng: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride || ride.driverId !== ctx.driverProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
          if (ride.status !== "accepted" && ride.status !== "in_progress") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Can only update location for active rides" });
          }
          updateDemoRide(input.rideId, {
            driverCurrentLat: input.lat,
            driverCurrentLng: input.lng,
          });
          return { success: true };
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride || ride.driverId !== ctx.driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        if (ride.status !== "accepted" && ride.status !== "in_progress") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Can only update location for active rides" });
        }

        await db.updateRide(input.rideId, {
          driverCurrentLat: input.lat,
          driverCurrentLng: input.lng,
        });

        return { success: true };
      }),

    // ============= CARPOOL ROUTES =============
    findSharedRides: protectedProcedure
      .input(z.object({
        originLat: z.string(),
        originLng: z.string(),
        destinationLat: z.string(),
        destinationLng: z.string(),
        vehicleType: z.enum(["moto", "carro", "van", "utilitario"]),
        maxDistanceKm: z.number().optional(),
        timeWindowMinutes: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.findMatchingSharedRides(input);
      }),

    joinSharedRide: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        pickupAddress: z.string(),
        pickupLat: z.string(),
        pickupLng: z.string(),
        dropoffAddress: z.string(),
        dropoffLat: z.string(),
        dropoffLng: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }

        if (!ride.isShared) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ride is not shared" });
        }

        if (ride.currentPassengers >= ride.maxPassengers) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ride is full" });
        }

        if (ride.status !== "requested") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ride already started" });
        }

        // Calculate individual price (total price divided by max passengers)
        const individualPrice = ride.pricePerPassenger || Math.floor((ride.estimatedPrice || 0) / ride.maxPassengers);

        // Get current number of passengers to determine pickup order
        const currentPassengers = await db.getRidePassengers(input.rideId);
        const pickupOrder = currentPassengers.length + 1;

        // Create ride passenger entry
        await db.createRidePassenger({
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
          dropoffOrder: pickupOrder, // Will be optimized later
        });

        // Update ride current passengers count
        await db.updateRide(input.rideId, {
          currentPassengers: ride.currentPassengers + 1,
        });

        // Notify original passenger
        // TODO: Send notification to ride creator

        return { success: true, individualPrice };
      }),

    getSharedRidePassengers: protectedProcedure
      .input(z.object({
        rideId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getRidePassengers(input.rideId);
      }),

    updatePassengerStatus: protectedProcedure
      .input(z.object({
        passengerId: z.number(),
        status: z.enum(["pending", "accepted", "declined", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateRidePassengerStatus(input.passengerId, input.status);

        // If declined, decrease current passengers count
        if (input.status === "declined" || input.status === "cancelled") {
          // Get passenger info to find ride
          const passengers = await db.getRidePassengers(input.passengerId);
          if (passengers.length > 0) {
            const ride = await db.getRideById(passengers[0].rideId);
            if (ride) {
              await db.updateRide(ride.id, {
                currentPassengers: Math.max(1, ride.currentPassengers - 1),
              });
            }
          }
        }

        return { success: true };
      }),

    getMySharedRides: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPassengerSharedRides(ctx.user.id);
    }),
  }),

  // ============= RATING ROUTES =============
  rating: router({
    create: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        toUserId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ride exists and user participated
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
        }

        if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        // Check if already rated
        const existing = await db.getRatingByRideId(input.rideId);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ride already rated" });
        }

        await db.createRating({
          rideId: input.rideId,
          fromUserId: ctx.user.id,
          toUserId: input.toUserId,
          rating: input.rating,
          comment: input.comment,
        });

        return { success: true };
      }),

    getByUser: publicProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getRatingsByUserId(input.userId);
      }),

    getByRideId: publicProcedure
      .input(z.object({
        rideId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getRatingByRideId(input.rideId);
      }),
  }),

  // ============= PRICING ROUTES =============
  pricing: router({
    getAll: publicProcedure.query(async () => {
      const rows = await db.getAllPricing();
      return withDemoPricingFallback(rows);
    }),

    calculate: publicProcedure
      .input(z.object({
        vehicleType: z.enum(["moto", "carro", "van", "utilitario"]),
        distance: z.number(), // in meters
        duration: z.number(), // in seconds
      }))
      .query(async ({ input }) => {
        const fromDb = await db.getPricingByVehicleType(input.vehicleType);
        const config = getPricingForVehicle(input.vehicleType, fromDb);
        if (!config) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pricing config not found" });
        }

        const distanceKm = input.distance / 1000;
        const durationMin = input.duration / 60;

        const calculatedPrice = 
          config.basePrice + 
          (distanceKm * config.pricePerKm) + 
          (durationMin * config.pricePerMinute);

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
            minimumPrice: Math.round(finalPrice),
          }
        };
      }),

    update: adminProcedure
      .input(z.object({
        vehicleType: z.enum(["moto", "carro", "van", "utilitario"]),
        basePrice: z.number(),
        pricePerKm: z.number(),
        pricePerMinute: z.number(),
        minimumPrice: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertPricing(input);
        return { success: true };
      }),
  }),

  // ============= RIDE NOTIFICATION ROUTES =============
  rideNotification: router({
    notifyNewRide: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        driverId: z.number(),
        originAddress: z.string(),
        destinationAddress: z.string(),
        estimatedPrice: z.number(),
      }))
      .mutation(async ({ input }) => {
        await notifyOwner({
          title: "Nova Corrida Disponível!",
          content: `Corrida #${input.rideId}\nOrigem: ${input.originAddress}\nDestino: ${input.destinationAddress}\nValor estimado: R$ ${(input.estimatedPrice / 100).toFixed(2)}`,
        });
        return { success: true };
      }),
    
    notifyRideAccepted: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        passengerId: z.number(),
        driverName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await notifyOwner({
          title: "Motorista Encontrado!",
          content: `Sua corrida #${input.rideId} foi aceita${input.driverName ? ` por ${input.driverName}` : ''}. O motorista está a caminho!`,
        });
        return { success: true };
      }),
    
    notifyRideStarted: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        passengerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await notifyOwner({
          title: "Corrida Iniciada",
          content: `Sua corrida #${input.rideId} foi iniciada. Boa viagem!`,
        });
        return { success: true };
      }),
    
    notifyRideCompleted: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        passengerId: z.number(),
        finalPrice: z.number(),
      }))
      .mutation(async ({ input }) => {
        await notifyOwner({
          title: "Corrida Concluída",
          content: `Sua corrida #${input.rideId} foi concluída.\nValor final: R$ ${(input.finalPrice / 100).toFixed(2)}\n\nObrigado por usar o ${ENV.appName}!`,
        });
        return { success: true };
      }),
  }),

  // ============= COUPON ROUTES =============
  upload: router({
    uploadDocument: protectedProcedure
      .input(
        z.object({
          fileData: z.string(), // base64 encoded
          fileName: z.string(),
          fileType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "audio/webm", "audio/mp3", "audio/wav"];
        if (!allowedTypes.includes(input.fileType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tipo de arquivo não permitido.",
          });
        }

        // Convert base64 to buffer
        const base64Data = input.fileData.split(",")[1] || input.fileData;
        const buffer = Buffer.from(base64Data, "base64");

        // Validate file size (max 5MB)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Arquivo muito grande. Tamanho máximo: 5MB.",
          });
        }

        // Generate unique file key
        const ext = input.fileName.split(".").pop() || "jpg";
        const fileKey = `documents/${ctx.user.id}/${nanoid()}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        return { url };
      }),
  }),

  scheduling: router({
    scheduleRide: protectedProcedure
      .input(
        z.object({
          vehicleType: z.enum(["moto", "carro", "van", "utilitario"]),
          originAddress: z.string(),
          originLat: z.number(),
          originLng: z.number(),
          destinationAddress: z.string(),
          destinationLat: z.number(),
          destinationLng: z.number(),
          scheduledFor: z.date(),
          paymentMethod: z.enum(["pix", "card", "cash"]),
          couponCode: z.string().optional(),
          /** Usados no modo demo para pular OSRM quando a rota já foi calculada na tela. */
          estimatedPrice: z.number().optional(),
          distance: z.number().optional(),
          duration: z.number().optional(),
          bookedFor: bookedForInputSchema,
          intermediateStops: intermediateStopsInputSchema,
          recurrenceRule: recurrenceRuleInputSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { bookedFor, intermediateStops, recurrenceRule, ...scheduleInput } = input;
        const timeOfDay = `${input.scheduledFor.getHours().toString().padStart(2, "0")}:${input.scheduledFor.getMinutes().toString().padStart(2, "0")}`;

        if (isDemoPassenger(ctx.user)) {
          const finalPrice = input.estimatedPrice ?? 0;
          let recurringScheduleId: number | undefined;

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
                estimatedPrice: finalPrice,
                distance: input.distance,
                duration: input.duration,
                bookedFor,
                intermediateStops,
              },
              recurrenceRule,
              timeOfDay,
            });
            recurringScheduleId = schedule.id;
          }

          const passengerPremiumMeta = buildPremiumMeta({
            bookedFor,
            intermediateStops,
            recurrenceRule,
            recurringScheduleId,
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
            estimatedPrice: finalPrice,
            paymentMethod: scheduleInput.paymentMethod,
            status: "requested",
            scheduledFor: scheduleInput.scheduledFor,
            isScheduled: "yes",
            couponCode: scheduleInput.couponCode,
            paymentStatus: "pending",
            discountAmount: 0,
            shareToken: `demo-sched-${Date.now()}`,
            passengerPremiumMeta,
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
            estimatedPrice: finalPrice,
            recurringScheduleId,
          };
        }

        // Calculate price
        const pricing = await db.getPricingByVehicleType(input.vehicleType);
        if (!pricing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Preço não configurado para este tipo de veículo",
          });
        }

        // Calculate distance using OSRM (OpenStreetMap)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${input.originLng},${input.originLat};${input.destinationLng},${input.destinationLat}?overview=false`;
        const osrmResponse = await fetch(osrmUrl);
        const osrmData = await osrmResponse.json();

        if (!osrmData.routes || !osrmData.routes[0]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não foi possível calcular a rota",
          });
        }

        const distance = osrmData.routes[0].distance || 0; // meters
        const duration = osrmData.routes[0].duration || 0; // seconds

        const distanceKm = distance / 1000;
        const estimatedPrice = Math.max(
          pricing.basePrice + Math.round(distanceKm * pricing.pricePerKm),
          pricing.minimumPrice
        );

        // Apply coupon if provided
        let finalPrice = estimatedPrice;
        let couponId = null;
        if (input.couponCode) {
          const coupon = await db.validateCoupon(
            input.couponCode,
            finalPrice,
            input.vehicleType
          );
          if (coupon) {
            const discount =
              coupon.discountType === "percentage"
                ? Math.round((finalPrice * coupon.discountValue) / 100)
                : coupon.discountValue;
            finalPrice = Math.max(finalPrice - discount, 0);
            couponId = coupon.id;
          }
        }

        const passengerPremiumMeta = buildPremiumMeta({
          bookedFor,
          intermediateStops,
          recurrenceRule,
        });

        // Create scheduled ride
        const insertResult = await db.createRide({
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
          passengerPremiumMeta,
        });

        const rideId = Number(insertResult[0]?.insertId || 0);

        // Notify nearby drivers about the scheduled ride
        try {
          const nearbyDrivers = await db.getNearbyDrivers(
            String(input.originLat),
            String(input.originLng),
            10 // 10km radius
          );

          // Create in-app notifications for nearby drivers
          const dbInstance = await db.getDb();
          if (dbInstance) {
            const { notifications: notificationsTable } = await import("../drizzle/schema");
            for (const driver of nearbyDrivers.slice(0, 10)) {
              await dbInstance.insert(notificationsTable).values({
                userId: driver.user.id,
                type: "ride",
                title: "Nova corrida agendada!",
                message: `Corrida de ${input.originAddress} para ${input.destinationAddress} agendada para ${input.scheduledFor.toLocaleDateString("pt-BR")} às ${input.scheduledFor.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
                actionUrl: `/driver-dashboard`,
                actionLabel: "Ver detalhes",
              });
            }
          }

          // Try to send push notifications (non-blocking)
          import("./_core/fcm").then(async ({ notifyUser: notifyUserFcm }) => {
            for (const driver of nearbyDrivers.slice(0, 5)) {
              await notifyUserFcm(driver.user.id, {
                title: "Nova corrida agendada!",
                body: `${input.originAddress} → ${input.destinationAddress}`,
                data: { type: "scheduled_ride", rideId: String(rideId) },
              }).catch(() => {}); // Ignore FCM errors
            }
          }).catch(() => {}); // Ignore if FCM not configured
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
      return await db.getScheduledRidesByUser(ctx.user.id);
    }),

    getRecurringSchedules: protectedProcedure.query(async ({ ctx }) => {
      if (!isDemoPassenger(ctx.user)) {
        return [];
      }
      return getDemoRecurringSchedulesForPassenger(ctx.user.id);
    }),

    hydrateDemoRecurring: protectedProcedure
      .input(z.object({ schedules: z.array(z.unknown()) }))
      .mutation(({ input }) => {
        hydrateDemoRecurringSchedules(input.schedules as never);
        return { success: true, count: input.schedules.length };
      }),

    cancelScheduledRide: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (isDemoPassenger(ctx.user)) {
          const ride = getDemoRide(input.rideId);
          if (!ride || ride.passengerId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Corrida não encontrada" });
          }
          updateDemoRide(input.rideId, {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: ctx.user.id,
            cancellationReason: "Cancelada pelo usuário",
          });
          const scheduleId = ride.passengerPremiumMeta?.recurringScheduleId;
          if (scheduleId) {
            cancelDemoRecurringSchedule(scheduleId, ctx.user.id);
          }
          return { success: true };
        }

        await db.cancelRide(input.rideId, ctx.user.id, "Cancelada pelo usuário");
        return { success: true };
      }),

    // Get pending scheduled rides for drivers to accept
    getPendingForDriver: driverProcedure.query(async ({ ctx }) => {
      if (isDemoPassenger(ctx.user)) {
        const driverVehicles = getDemoVehiclesByDriverId(ctx.driverProfile.id);
        const driverVehicleTypes = driverVehicles
          .filter((v) => v.status === "active")
          .map((v) => v.type);

        const scheduledPending = getAllDemoRides().filter(
          (r) =>
            r.isScheduled === "yes" &&
            r.status === "requested" &&
            r.scheduledFor &&
            !isRideReadyForDispatch(r) &&
            driverVehicleTypes.includes(r.vehicleType)
        );

        return scheduledPending.map((ride) => ({
          ...ride,
          passengerName: "Passageiro Demo",
          passengerAvatar: null,
        }));
      }

      const allRequested = await db.getRequestedRides();
      // Filter to only scheduled rides that haven't been accepted yet
      const scheduledPending = allRequested.filter(
        (r) => r.isScheduled === "yes" && r.status === "requested" && r.scheduledFor
      );

      // Get driver's vehicles to match vehicle types
      const driverVehicles = await db.getVehiclesByDriverId(ctx.driverProfile.id);
      const driverVehicleTypes = driverVehicles
        .filter((v) => v.status === "active")
        .map((v) => v.type);

      // Filter rides that match driver's vehicle types
      const matchingRides = scheduledPending.filter((r) =>
        driverVehicleTypes.includes(r.vehicleType)
      );

      // Get passenger info for each ride
      const ridesWithPassenger = await Promise.all(
        matchingRides.map(async (ride) => {
          const passenger = await db.getUserById(ride.passengerId);
          return {
            ...ride,
            passengerName: passenger?.name || "Passageiro",
            passengerAvatar: passenger?.avatarUrl,
          };
        })
      );

      return ridesWithPassenger;
    }),

    // Driver accepts a scheduled ride
    acceptScheduledRide: driverProcedure
      .input(
        z.object({
          rideId: z.number(),
          vehicleId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }

        if (ride.isScheduled !== "yes") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta não é uma corrida agendada" });
        }

        if (ride.status !== "requested") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta corrida já foi aceita ou cancelada" });
        }

        // Verify vehicle ownership and type match
        const vehicle = await db.getVehicleById(input.vehicleId);
        if (!vehicle || vehicle.driverId !== ctx.driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Veículo não encontrado ou sem permissão" });
        }

        if (vehicle.type !== ride.vehicleType) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Veículo incompátivel. A corrida requer ${ride.vehicleType}, mas o veículo selecionado é ${vehicle.type}`,
          });
        }

        // Accept the ride
        await db.updateRide(input.rideId, {
          driverId: ctx.driverProfile.id,
          vehicleId: input.vehicleId,
          status: "accepted",
        });

        // Notify passenger via in-app notification
        try {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            const { notifications: notificationsTable } = await import("../drizzle/schema");
            const scheduledDate = ride.scheduledFor
              ? new Date(ride.scheduledFor).toLocaleDateString("pt-BR")
              : "";
            const scheduledTime = ride.scheduledFor
              ? new Date(ride.scheduledFor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "";

            await dbInstance.insert(notificationsTable).values({
              userId: ride.passengerId,
              type: "ride",
              title: "Motorista confirmado!",
              message: `${ctx.user.name || "Um motorista"} aceitou sua corrida agendada para ${scheduledDate} às ${scheduledTime}. Veículo: ${vehicle.brand || ""} ${vehicle.model || ""} - ${vehicle.plate}`,
              actionUrl: `/scheduled-rides`,
              actionLabel: "Ver corridas agendadas",
            });
          }
        } catch (e) {
          console.log("[Scheduling] Non-critical: failed to create notification", e);
        }

        // Send push notification to passenger
        try {
          const { notifyUser: notifyUserFcm } = await import("./_core/fcm");
          await notifyUserFcm(ride.passengerId, {
            title: "Motorista confirmado! \ud83d\ude97",
            body: `${ctx.user.name || "Um motorista"} aceitou sua corrida agendada. Veículo: ${vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.plate})`,
            data: { type: "scheduled_ride_accepted", rideId: String(input.rideId) },
          });
        } catch (e) {
          // FCM not configured, ignore
        }

        return { success: true };
      }),

    // Driver rejects a scheduled ride
    rejectScheduledRide: driverProcedure
      .input(
        z.object({
          rideId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }

        if (ride.isScheduled !== "yes") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta não é uma corrida agendada" });
        }

        // If this driver had already accepted, cancel their acceptance
        if (ride.driverId === ctx.driverProfile.id && ride.status === "accepted") {
          await db.updateRide(input.rideId, {
            driverId: null,
            vehicleId: null,
            status: "requested",
          });

          // Notify passenger that driver cancelled
          try {
            const dbInstance = await db.getDb();
            if (dbInstance) {
              const { notifications: notificationsTable } = await import("../drizzle/schema");
              await dbInstance.insert(notificationsTable).values({
                userId: ride.passengerId,
                type: "ride",
                title: "Motorista cancelou",
                message: `${ctx.user.name || "O motorista"} cancelou a aceitação da sua corrida agendada. Estamos buscando outro motorista.`,
                actionUrl: `/scheduled-rides`,
                actionLabel: "Ver corridas agendadas",
              });
            }
          } catch (e) {
            console.log("[Scheduling] Non-critical: failed to create notification", e);
          }

          // Push notification
          try {
            const { notifyUser: notifyUserFcm } = await import("./_core/fcm");
            await notifyUserFcm(ride.passengerId, {
              title: "Motorista cancelou \u274c",
              body: `${ctx.user.name || "O motorista"} cancelou sua corrida agendada. Buscando outro motorista...`,
              data: { type: "scheduled_ride_rejected", rideId: String(input.rideId) },
            });
          } catch (e) {
            // FCM not configured, ignore
          }
        }

        // Note: If the driver hasn't accepted yet, they're just "passing" on this ride
        // The ride stays as "requested" for other drivers to pick up

        return { success: true };
      }),
  }),

  payment: router({
    createCheckout: protectedProcedure
      .input(
        z.object({
          rideId: z.number(),
          amount: z.number(), // in cents
          origin: z.string(),
          destination: z.string(),
          vehicleType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: input.amount,
          currency: "brl",
          automatic_payment_methods: {
            enabled: true,
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
            customer_name: ctx.user.name || "",
          },
        });

        // Update ride with payment intent ID
        await db.updateRidePaymentStatus(
          input.rideId,
          "pending",
          paymentIntent.id
        );

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };
      }),
  }),

  chat: router({
    send: protectedProcedure
      .input(
        z.object({
          rideId: z.number(),
          message: z.string().optional(),
          audioUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!input.message && !input.audioUrl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Message or audio required" });
        }

        if (isDemoRideId(input.rideId)) {
          const ride = getDemoRide(input.rideId);
          if (!ride) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found" });
          }
          const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
          const canAccess =
            ride.passengerId === ctx.user.id ||
            (driverProfile != null && ride.driverId === driverProfile.id);
          if (!canAccess) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }

          const entry = addDemoChatMessage(
            input.rideId,
            ctx.user.id,
            input.message ?? "(áudio demo)"
          );
          return { messageId: entry.id, success: true };
        }

        const messageId = await db.createChatMessage({
          rideId: input.rideId,
          senderId: ctx.user.id,
          message: input.message,
          audioUrl: input.audioUrl,
        });

        return { messageId, success: true };
      }),

    getMessages: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (isDemoRideId(input.rideId)) {
          return getDemoChatMessages(input.rideId).map((msg) => ({
            id: msg.id,
            rideId: msg.rideId,
            senderId: msg.senderId,
            message: msg.message,
            audioUrl: null,
            createdAt: msg.createdAt,
          }));
        }
        return await db.getChatMessagesByRide(input.rideId);
      }),
  }),

  coupon: router({
    validate: publicProcedure
      .input(z.object({
        code: z.string(),
        rideValue: z.number(),
        vehicleType: z.enum(["moto", "carro", "van", "utilitario"]),
      }))
      .query(async ({ input, ctx }) => {
        const coupon = await db.getCouponByCode(input.code);
        if (!coupon) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cupom não encontrado" });
        }

        // Check if active
        if (coupon.isActive !== 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom inativo" });
        }

        // Check validity dates
        const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom expirado ou ainda não válido" });
        }

        // Check max uses
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom esgotado" });
        }

        // Check min ride value
        if (coupon.minRideValue && input.rideValue < coupon.minRideValue) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `Valor mínimo da corrida: R$ ${(coupon.minRideValue / 100).toFixed(2)}` 
          });
        }

        // Check vehicle types
        if (coupon.vehicleTypes) {
          const allowedTypes = JSON.parse(coupon.vehicleTypes);
          if (!allowedTypes.includes(input.vehicleType)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom não válido para este tipo de veículo" });
          }
        }

        // Check user usage limit
        if (ctx.user) {
          const userUsage = await db.getCouponUsageByUser(ctx.user.id, coupon.id);
          if (userUsage.length >= coupon.maxUsesPerUser) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Você já usou este cupom o máximo de vezes permitido" });
          }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
          discountAmount = Math.round((input.rideValue * coupon.discountValue) / 100);
        } else {
          discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed ride value
        discountAmount = Math.min(discountAmount, input.rideValue);

        return {
          valid: true,
          coupon,
          discountAmount,
          finalPrice: input.rideValue - discountAmount,
        };
      }),

    create: adminProcedure
      .input(z.object({
        code: z.string(),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number(),
        maxUses: z.number().optional(),
        maxUsesPerUser: z.number().default(1),
        validFrom: z.date(),
        validUntil: z.date(),
        minRideValue: z.number().optional(),
        vehicleTypes: z.array(z.enum(["moto", "carro", "van"])).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createCoupon({
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
          isActive: 1,
        });

        // Auto-notify all users about new coupon (non-blocking)
        try {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            const { users: usersTable, notifications: notificationsTable } = await import("../drizzle/schema");
            const allUsers = await dbInstance.select({ id: usersTable.id }).from(usersTable);
            const discountText = input.discountType === "percentage"
              ? `${input.discountValue}% de desconto`
              : `R$ ${(input.discountValue / 100).toFixed(2)} de desconto`;
            const notifValues = allUsers.map((u) => ({
              userId: u.id,
              type: "promotion" as const,
              title: "Novo Cupom Dispon\u00edvel!",
              message: `Use o c\u00f3digo ${input.code.toUpperCase()} e ganhe ${discountText} na sua pr\u00f3xima corrida!`,
              actionUrl: "/request-ride",
              actionLabel: "Solicitar corrida",
            }));
            // Insert in batches of 100
            for (let i = 0; i < notifValues.length; i += 100) {
              await dbInstance.insert(notificationsTable).values(notifValues.slice(i, i + 100));
            }
          }
        } catch (error) {
          console.error("Failed to send coupon notifications:", error);
        }

        return { success: true };
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllCoupons();
    }),

    toggle: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCoupon(input.id, { isActive: input.isActive });
        return { success: true };
      }),
  }),

  // ============= LOYALTY PROGRAM ROUTES =============
  loyalty: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserLoyaltyStats(ctx.user.id);
    }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLoyaltyHistory(ctx.user.id);
    }),

    redeemPoints: protectedProcedure
      .input(z.object({
        points: z.number().min(1),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.redeemLoyaltyPoints(
          ctx.user.id,
          input.points,
          input.description
        );
        
        if (!success) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Pontos insuficientes" 
          });
        }
        
        return { success: true };
      }),
  }),

  // ============= SAFETY & SECURITY ROUTES =============
  safety: router({
    // Emergency Contacts
    getEmergencyContacts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getEmergencyContacts(ctx.user.id);
    }),

    addEmergencyContact: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        relationship: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createEmergencyContact({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    updateEmergencyContact: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        relationship: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { contactId, ...updates } = input;
        await db.updateEmergencyContact(contactId, ctx.user.id, updates);
        return { success: true };
      }),

    deleteEmergencyContact: protectedProcedure
      .input(z.object({
        contactId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEmergencyContact(input.contactId, ctx.user.id);
        return { success: true };
      }),

    // SOS Alert
    triggerSOS: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        location: z.string(),
        lat: z.string(),
        lng: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.triggerSOS(
          input.rideId,
          ctx.user.id,
          input.location,
          input.lat,
          input.lng
        );

        // Send notifications to emergency contacts
        if (result && result.contacts.length > 0) {
          try {
            const { notifyUser } = await import("./_core/fcm");
            const ride = await db.getRideById(input.rideId);
            
            for (const contact of result.contacts) {
              // In production, send SMS/WhatsApp to contact.phone
              console.log(`[SOS] Would notify ${contact.name} at ${contact.phone}`);
            }

            // Notify owner
            await notifyOwner({
              title: "⚠️ ALERTA SOS ATIVADO",
              content: `Usuário ${ctx.user.name} ativou SOS na corrida #${input.rideId}\nLocalização: ${input.location}\nLat/Lng: ${input.lat}, ${input.lng}`,
            });
          } catch (error) {
            console.error("Failed to send SOS notifications:", error);
          }
        }

        return { success: true, alertId: result?.alertId };
      }),

    // Public ride tracking (no auth required)
    getSharedRide: publicProcedure
      .input(z.object({
        shareToken: z.string(),
      }))
      .query(async ({ input }) => {
        const ride = await db.getRideByShareToken(input.shareToken);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }

        // Return only safe data for public tracking
        return {
          id: ride.id,
          status: ride.status,
          originAddress: ride.originAddress,
          destinationAddress: ride.destinationAddress,
          driverCurrentLat: ride.driverCurrentLat,
          driverCurrentLng: ride.driverCurrentLng,
          vehicleType: ride.vehicleType,
          estimatedPrice: ride.estimatedPrice,
          createdAt: ride.createdAt,
        };
      }),
  }),

  // ============= ADMIN ROUTES =============
  admin: router({
    getOperationalOverview: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessAdminOperational(ctx)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const dbInstance = await db.getDb();
      if (isDemoPassenger(ctx.user) || !dbInstance) {
        return getDemoOperationalOverview();
      }

      return getProductionOperationalOverview();
    }),

    getOperationalIntelligence: protectedProcedure
      .input(
        z
          .object({
            preset: z.enum(["today", "yesterday", "7d", "30d", "custom"]).optional(),
            from: z.string().optional(),
            to: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        if (!canAccessAdminOperational(ctx)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const period = {
          preset: input?.preset ?? "7d",
          from: input?.from,
          to: input?.to,
        } as const;

        const dbInstance = await db.getDb();
        if (isDemoPassenger(ctx.user) || !dbInstance) {
          return getDemoOperationalIntelligence(period);
        }

        return getProductionOperationalIntelligence(period);
      }),

    cancelRide: protectedProcedure
      .input(
        z.object({
          rideId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!canAccessAdminOperational(ctx)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return adminCancelRide(input.rideId, ctx.user.id, input.reason);
      }),

    redispatchRide: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!canAccessAdminOperational(ctx)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return adminRedispatchRide(input.rideId, isDemoPassenger(ctx.user));
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const allRides = await db.getAllRides();
      const pendingDrivers = await db.getPendingDriverProfiles();
      const approvedDrivers = await db.getApprovedDriverProfiles();

      const totalRevenue = allRides.reduce((sum: number, ride: any) => {
        if (ride.status === "completed") {
          return sum + (ride.finalPrice || ride.estimatedPrice || 0);
        }
        return sum;
      }, 0);

      const completedRides = allRides.filter((r: any) => r.status === "completed").length;
      const cancelledRides = allRides.filter((r: any) => r.status === "cancelled").length;
      const activeRides = allRides.filter((r: any) => r.status === "accepted" || r.status === "in_progress").length;

      return {
        totalRides: allRides.length,
        completedRides,
        cancelledRides,
        activeRides,
        totalRevenue,
        totalDrivers: approvedDrivers.length,
        pendingDrivers: pendingDrivers.length,
      };
    }),

    getPendingDrivers: adminProcedure.query(async () => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      
      const { driverProfiles, users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      return await db_instance
        .select({
          profile: driverProfiles,
          user: users,
        })
        .from(driverProfiles)
        .innerJoin(users, eq(driverProfiles.userId, users.id))
        .where(eq(driverProfiles.status, "pending"));
    }),

    approveDriver: adminProcedure
      .input(z.object({
        driverId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Get driver profile to find user
        const driverProfile = await db.getDriverProfileById(input.driverId);
        await db.updateDriverProfile(input.driverId, { status: "approved" });

        // Send notification to driver about approval
        if (driverProfile?.userId) {
          try {
            const dbInstance = await db.getDb();
            if (dbInstance) {
              await createNotificationWithPush(dbInstance, driverProfile.userId, {
                type: "driver",
                title: "Perfil Aprovado!",
                message: `Parabéns! Seu perfil de motorista foi aprovado. Você já pode começar a aceitar corridas no ${ENV.appName}!`,
                actionUrl: "/driver-dashboard",
                actionLabel: "Ir para painel",
                metadata: { event: "driver_approved" },
              });
            }
          } catch (error) {
            console.error("Failed to send driver approval notification:", error);
          }
        }

        return { success: true };
      }),

    rejectDriver: adminProcedure
      .input(z.object({
        driverId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Get driver profile to find user
        const driverProfile = await db.getDriverProfileById(input.driverId);
        await db.updateDriverProfile(input.driverId, { status: "rejected" });

        // Send notification to driver about rejection
        if (driverProfile?.userId) {
          try {
            const dbInstance = await db.getDb();
            if (dbInstance) {
              await createNotificationWithPush(dbInstance, driverProfile.userId, {
                type: "driver",
                title: "Perfil N\u00e3o Aprovado",
                message: "Seu perfil de motorista n\u00e3o foi aprovado. Verifique seus documentos e tente novamente.",
                actionUrl: "/become-driver",
                actionLabel: "Atualizar perfil",
                metadata: { event: "driver_rejected" },
              });
            }
          } catch (error) {
            console.error("Failed to send driver rejection notification:", error);
          }
        }

        return { success: true };
      }),

    getAllRides: adminProcedure.query(async () => {
      return await db.getActiveRides();
    }),
  }),
});

export type AppRouter = typeof appRouter;
