import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { isDemoPassenger } from "../_core/demoUser";
import {
  advanceDemoUtilityStatus,
  cancelDemoUtilityOrder,
  createDemoUtilityOrder,
  exportDemoUtilityOrders,
  getDemoUtilityOrder,
  getDemoUtilityOrdersBySender,
  hydrateDemoUtilityOrders,
  isDemoUtilityId,
} from "../_core/demoUtilities";
import { exportDemoUtilityOffers, hydrateDemoUtilityOffers } from "../_core/demoUtilityOffers";
import { createUtilityOffers, exportUtilityDispatcherSnapshot } from "../_core/utilityDispatcher";
import { withLiveUtilityTracking } from "../_core/demoUtilityTracking";
import { getDemoDriverProfileByUserId } from "../_core/demoDriver";
import { calculateUtilityQuote, suggestVehicleForUtility } from "../_core/utilityPricing";
import type { UtilityOrder } from "@shared/utilities";
import type { UtilityOffer } from "@shared/utilityDispatcher";
import { createInitialUtilityMeta } from "@shared/utilities";
import * as db from "../db";

const serviceTypeSchema = z.enum([
  "freight_fast",
  "small_move",
  "store_pickup",
  "bulky_cargo",
  "commercial_transport",
]);

const vehicleTypeSchema = z.enum([
  "light_utility",
  "pickup",
  "van",
  "small_truck",
  "medium_truck",
]);

const cargoSchema = z.object({
  itemType: z.string().optional(),
  description: z.string().optional(),
  estimatedWeightKg: z.number().optional(),
  estimatedVolumeM3: z.number().optional(),
  packageCount: z.number().optional(),
  fragility: z.enum(["normal", "fragile", "very_fragile"]).optional(),
  photoUrls: z.array(z.string()).optional(),
  roomCount: z.number().optional(),
  itemSummary: z.string().optional(),
  storeName: z.string().optional(),
  storePhone: z.string().optional(),
  companyName: z.string().optional(),
  frequency: z.string().optional(),
  timeWindow: z.string().optional(),
  recurrence: z.string().optional(),
});

const extrasSchema = z.object({
  needsHelper: z.boolean().optional(),
  helperCount: z.number().optional(),
  needsDisassembly: z.boolean().optional(),
  needsAssembly: z.boolean().optional(),
  hasStairs: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  isScheduled: z.boolean().optional(),
  scheduledFor: z.string().optional(),
  notes: z.string().optional(),
});

const createInputSchema = z.object({
  serviceType: serviceTypeSchema,
  originAddress: z.string().min(1),
  originLat: z.string(),
  originLng: z.string(),
  destinationAddress: z.string().min(1),
  destinationLat: z.string(),
  destinationLng: z.string(),
  intermediateStops: z.array(z.string()).optional(),
  cargo: cargoSchema,
  extras: extrasSchema,
  vehicleType: vehicleTypeSchema,
  vehicleAutoSuggested: z.boolean().optional(),
  paymentMethod: z.enum(["pix", "cash", "card"]),
  distance: z.number(),
  duration: z.number(),
  quote: z.object({
    baseFeeCents: z.number(),
    distanceCents: z.number(),
    vehicleCents: z.number(),
    helpersCents: z.number(),
    urgencyCents: z.number(),
    fragilityCents: z.number(),
    stairsCents: z.number(),
    disassemblyCents: z.number(),
    assemblyCents: z.number(),
    schedulingCents: z.number(),
    weightCents: z.number(),
    totalCents: z.number(),
    distanceMeters: z.number(),
    durationSeconds: z.number(),
    suggestedVehicle: vehicleTypeSchema,
  }),
});

async function useDemoUtilities(user: { openId: string }): Promise<boolean> {
  if (isDemoPassenger(user)) return true;
  return !(await db.getDb());
}

export const utilitiesRouter = router({
  hydrateDemoState: protectedProcedure
    .input(
      z.object({
        orders: z.array(z.unknown()),
        offers: z.array(z.unknown()).optional(),
      })
    )
    .mutation(({ input }) => {
      hydrateDemoUtilityOrders(input.orders as UtilityOrder[]);
      if (input.offers?.length) {
        hydrateDemoUtilityOffers(input.offers as UtilityOffer[]);
      }
      return { success: true, count: input.orders.length };
    }),

  suggestVehicle: publicProcedure
    .input(
      z.object({
        serviceType: serviceTypeSchema,
        estimatedWeightKg: z.number().optional(),
        estimatedVolumeM3: z.number().optional(),
        packageCount: z.number().optional(),
        needsHelper: z.boolean().optional(),
      })
    )
    .query(({ input }) => ({
      vehicle: suggestVehicleForUtility(input),
    })),

  calculateQuote: publicProcedure
    .input(
      z.object({
        serviceType: serviceTypeSchema,
        vehicleType: vehicleTypeSchema,
        distanceMeters: z.number().min(1),
        durationSeconds: z.number().min(1),
        cargo: cargoSchema.optional(),
        extras: extrasSchema.optional(),
      })
    )
    .query(({ input }) => calculateUtilityQuote(input)),

  create: protectedProcedure.input(createInputSchema).mutation(async ({ ctx, input }) => {
    const estimatedPrice = input.quote.totalCents;
    const initialStatus = input.extras.isScheduled ? "requested" : "waiting_driver";
    const utilityMeta = createInitialUtilityMeta("requested");
    if (initialStatus === "waiting_driver") {
      utilityMeta.statusHistory.push({
        status: "waiting_driver",
        label: "Aguardando utilitário",
        at: new Date().toISOString(),
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
        cancelledAt: null,
      });
      if (initialStatus === "waiting_driver") {
        createUtilityOffers(order);
      }
      return {
        success: true,
        orderId: order.id,
        trackingCode: order.utilityMeta.trackingCode,
        demoSnapshot: exportUtilityDispatcherSnapshot(),
      };
    }

    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "Persistência real de utilitários em breve. Use o modo demo local.",
    });
  }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoUtilities(ctx.user)) {
      return getDemoUtilityOrdersBySender(ctx.user.id);
    }
    return [];
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (isDemoUtilityId(input.id) || (await useDemoUtilities(ctx.user))) {
        let order = getDemoUtilityOrder(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
        const isSender = order.senderId === ctx.user.id;
        const isDriver = driverProfile != null && order.driverId === driverProfile.id;
        if (!isSender && !isDriver) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        order = withLiveUtilityTracking(order);
        return order;
      }
      throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isDemoUtilityId(input.id) && !(await useDemoUtilities(ctx.user))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      const existing = getDemoUtilityOrder(input.id);
      if (!existing || existing.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      const updated = cancelDemoUtilityOrder(input.id);
      if (!updated) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível cancelar este pedido" });
      }
      return { success: true };
    }),

  advanceDemoStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user) && (await db.getDb())) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas demo local" });
      }
      const order = getDemoUtilityOrder(input.id);
      if (!order || order.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      const updated = advanceDemoUtilityStatus(input.id);
      return { success: true, status: updated?.status };
    }),

  exportDemoSnapshot: protectedProcedure.query(async ({ ctx }) => {
    if (!(await useDemoUtilities(ctx.user))) return { orders: [] };
    return { orders: exportDemoUtilityOrders().filter((o) => o.senderId === ctx.user.id) };
  }),
});
