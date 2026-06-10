import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../_core/trpc";
import { driverProcedure } from "../_core/driverProcedure";
import { isDemoPassenger } from "../_core/demoUser";
import {
  acceptDemoUtilityOrder,
  advanceDemoUtilityStatusForDriver,
  getDemoUtilityOrder,
  getDemoUtilityOrdersByDriver,
  hydrateDemoUtilityOrders,
} from "../_core/demoUtilities";
import {
  declineDemoUtilityOffer,
  hydrateDemoUtilityOffers,
} from "../_core/demoUtilityOffers";
import {
  exportDemoUtilityProviderProfiles,
  getDemoUtilityProviderProfile,
  hydrateDemoUtilityProviderProfiles,
  updateDemoUtilityProviderProfile,
} from "../_core/demoUtilityProvider";
import {
  buildUtilityProviderEarnings,
  buildUtilityProviderStatement,
} from "../_core/utilityProviderOps";
import {
  ensureUtilityOffersForWaitingOrders,
  exportUtilityDispatcherSnapshot,
  getAvailableUtilityOrdersForProvider,
  hydrateDemoUtilityDispatcherState,
  isOrderCompatibleWithProvider,
} from "../_core/utilityDispatcher";
import { withLiveUtilityTracking } from "../_core/demoUtilityTracking";
import type { UtilityProviderProfile } from "@shared/utilityProvider";
import type { UtilityOrder } from "@shared/utilities";
import type { UtilityOffer } from "@shared/utilityDispatcher";
import * as db from "../db";

const vehicleTypeSchema = z.enum([
  "light_utility",
  "pickup",
  "van",
  "small_truck",
  "medium_truck",
]);

const profilePatchSchema = z.object({
  vehicleType: vehicleTypeSchema.optional(),
  maxWeightKg: z.number().min(1).max(5000).optional(),
  maxVolumeM3: z.number().min(0.1).max(50).optional(),
  acceptsFreight: z.boolean().optional(),
  acceptsSmallMove: z.boolean().optional(),
  acceptsStorePickup: z.boolean().optional(),
  acceptsBulkyCargo: z.boolean().optional(),
  acceptsCommercial: z.boolean().optional(),
  worksWithHelper: z.boolean().optional(),
  availableHelpers: z.number().min(0).max(4).optional(),
  serviceRadiusKm: z.number().min(1).max(100).optional(),
  minimumOrderCents: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function useDemoProvider(): Promise<boolean> {
  return !(await db.getDb());
}

function demoSnapshot() {
  return exportUtilityDispatcherSnapshot();
}

export const utilityProviderRouter = router({
  hydrateDemoState: driverProcedure
    .input(
      z.object({
        orders: z.array(z.unknown()).optional(),
        profiles: z.array(z.unknown()).optional(),
        offers: z.array(z.unknown()).optional(),
      })
    )
    .mutation(({ input }) => {
      if (input.orders?.length) hydrateDemoUtilityOrders(input.orders as UtilityOrder[]);
      if (input.profiles?.length) {
        hydrateDemoUtilityProviderProfiles(input.profiles as UtilityProviderProfile[]);
      }
      hydrateDemoUtilityDispatcherState({
        offers: input.offers as UtilityOffer[] | undefined,
      });
      ensureUtilityOffersForWaitingOrders();
      return { success: true, ...demoSnapshot() };
    }),

  getProfile: driverProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user) || (await useDemoProvider())) {
      return getDemoUtilityProviderProfile(ctx.driverProfile.id);
    }
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
  }),

  updateProfile: driverProcedure
    .input(profilePatchSchema)
    .mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user) || (await useDemoProvider())) {
        const updated = updateDemoUtilityProviderProfile(ctx.driverProfile.id, input);
        ensureUtilityOffersForWaitingOrders();
        return { profile: updated, demoSnapshot: demoSnapshot() };
      }
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
    }),

  getAvailableOrders: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || (await useDemoProvider()))) return [];
    const profile = getDemoUtilityProviderProfile(ctx.driverProfile.id);
    return getAvailableUtilityOrdersForProvider(ctx.driverProfile.id, profile);
  }),

  getActiveOrders: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || (await useDemoProvider()))) return [];
    return getDemoUtilityOrdersByDriver(ctx.driverProfile.id).filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    );
  }),

  getOrderById: driverProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const order = getDemoUtilityOrder(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      const isMine = order.driverId === ctx.driverProfile.id;
      const isAvailable = !order.driverId && ["waiting_driver", "requested"].includes(order.status);
      if (!isMine && !isAvailable) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return withLiveUtilityTracking(order);
    }),

  acceptOrder: driverProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!(isDemoPassenger(ctx.user) || (await useDemoProvider()))) {
        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
      }
      const profile = getDemoUtilityProviderProfile(ctx.driverProfile.id);
      if (!profile.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ative seu perfil de utilitário" });
      }
      const order = getDemoUtilityOrder(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      if (!isOrderCompatibleWithProvider(order, profile, ctx.driverProfile.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não compatível com seu perfil" });
      }
      const accepted = acceptDemoUtilityOrder(input.orderId, ctx.driverProfile.id);
      if (!accepted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido já foi aceito" });
      }
      return { success: true, order: accepted, demoSnapshot: demoSnapshot() };
    }),

  declineOrder: driverProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      declineDemoUtilityOffer(input.orderId, ctx.driverProfile.id);
      return { success: true, demoSnapshot: demoSnapshot() };
    }),

  advanceOrderStatus: driverProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const updated = advanceDemoUtilityStatusForDriver(input.orderId, ctx.driverProfile.id);
      if (!updated) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível avançar o status" });
      }
      return { success: true, order: updated, demoSnapshot: demoSnapshot() };
    }),

  getEarningsSummary: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || (await useDemoProvider()))) {
      return {
        todayNetCents: 0,
        weekNetCents: 0,
        todayCount: 0,
        weekCount: 0,
        todayAvgTicketCents: 0,
        weekAvgTicketCents: 0,
      };
    }
    return buildUtilityProviderEarnings(ctx.driverProfile.id);
  }),

  getStatement: driverProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || (await useDemoProvider()))) return [];
    return buildUtilityProviderStatement(ctx.driverProfile.id);
  }),
});
