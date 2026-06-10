import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { isDemoPassenger } from "../_core/demoUser";
import {
  createDemoDeliveryOrder,
  getDemoDeliveryOrder,
  getDemoDeliveryOrderByTrackingCode,
  getDemoDeliveryOrdersBySender,
  hydrateDemoDeliveryOrders,
  isDemoDeliveryId,
  toDeliveryTrackingDetails,
  toPublicDeliveryTrackInfo,
  updateDemoDeliveryOrder,
  updateDemoDeliveryStatus,
} from "../_core/demoDelivery";
import type { DeliveryOrder } from "../../drizzle/schema";
import { recordCancellationAudit } from "../_core/demoAdminFinance";
import { recordDeliveryLedgerEntry } from "../_core/financialLedger";
import {
  appendDeliveryStatusEvent,
  createInitialDeliveryPremiumMeta,
  getDemoProofPlaceholder,
  getNextDemoDeliveryStatus,
  type DeliveryPremiumMeta,
  type DeliveryStatus,
} from "@shared/deliveryPremium";

const createInputSchema = z.object({
  pickupAddress: z.string().min(1),
  pickupLat: z.string(),
  pickupLng: z.string(),
  pickupContactName: z.string().optional(),
  pickupContactPhone: z.string().optional(),
  deliveryAddress: z.string().min(1),
  deliveryLat: z.string(),
  deliveryLng: z.string(),
  recipientName: z.string().min(1),
  recipientPhone: z.string().min(1),
  packageType: z.enum([
    "documento",
    "pacote_pequeno",
    "pacote_medio",
    "pacote_grande",
    "alimento",
    "outro",
  ]),
  packageDescription: z.string().optional(),
  estimatedWeight: z.number().optional(),
  isFragile: z.boolean().optional(),
  requiresSignature: z.boolean().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
  estimatedPrice: z.number(),
  paymentMethod: z.enum(["pix", "card", "cash"]),
});

export const deliveryRouter = router({
  /**
   * Restaura entregas demo do localStorage do cliente para memória do servidor.
   */
  hydrateDemoState: protectedProcedure
    .input(z.object({ orders: z.array(z.unknown()) }))
    .mutation(({ input }) => {
      hydrateDemoDeliveryOrders(input.orders as DeliveryOrder[]);
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
        deliveryPremiumMeta: createInitialDeliveryPremiumMeta("requested"),
      });

      return {
        success: true,
        orderId: order.id,
        trackingCode: order.trackingCode!,
        confirmationCode: order.deliveryPremiumMeta?.confirmationCode,
      };
    }

    const premiumMeta = createInitialDeliveryPremiumMeta("requested");
    const result = await db.createDeliveryOrder({
      senderId: ctx.user.id,
      ...input,
      isFragile: input.isFragile ?? false,
      requiresSignature: input.requiresSignature ?? false,
      deliveryPremiumMeta: premiumMeta,
    });

    return {
      success: true,
      orderId: result.insertId,
      trackingCode: result.trackingCode,
      confirmationCode: premiumMeta.confirmationCode,
    };
  }),

  /**
   * Detalhes completos para rastreamento (remetente)
   */
  getTrackingDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (isDemoDeliveryId(input.id)) {
        const order = getDemoDeliveryOrder(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        if (order.senderId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return toDeliveryTrackingDetails(order);
      }

      const order = await db.getDeliveryOrderById(input.id);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      if (order.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return toDeliveryTrackingDetails(order);
    }),

  /**
   * Avançar status em demo (simulação motorista)
   */
  advanceDemoStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Disponível apenas em demo local" });
      }
      const order = getDemoDeliveryOrder(input.id);
      if (!order || order.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      if (order.status === "delivered" || order.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Entrega já finalizada" });
      }

      const next = getNextDemoDeliveryStatus(order.status as DeliveryStatus);
      if (!next) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use concluir entrega para finalizar",
        });
      }

      const updated = updateDemoDeliveryStatus(input.id, next);
      return { success: true, status: updated?.status };
    }),

  /**
   * Concluir entrega com código de confirmação, prova e assinatura
   */
  completeDelivery: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        confirmationCode: z.string().min(4),
        proofOfDeliveryUrl: z.string().optional(),
        useDemoProofPlaceholder: z.boolean().optional(),
        signatureConfirmed: z.boolean().optional(),
        signatureName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const finishOrder = (
        order: DeliveryOrder,
        applyUpdate: (id: number, patch: Partial<DeliveryOrder>) => Promise<void> | void
      ) => {
        const meta = order.deliveryPremiumMeta as DeliveryPremiumMeta | null;
        const expected = meta?.confirmationCode;
        if (!expected || input.confirmationCode.trim() !== expected) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Código de confirmação inválido",
          });
        }

        if (order.requiresSignature && !input.signatureConfirmed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Esta entrega exige confirmação de assinatura",
          });
        }

        if (!["accepted", "picked_up", "in_transit"].includes(order.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Entrega não pode ser concluída neste status",
          });
        }

        const proofUrl =
          input.proofOfDeliveryUrl ??
          (input.useDemoProofPlaceholder ? getDemoProofPlaceholder(order.id) : undefined);

        const nextMeta: DeliveryPremiumMeta = {
          ...(meta ?? createInitialDeliveryPremiumMeta("requested")),
          signatureConfirmed: input.signatureConfirmed ?? false,
          signatureName: input.signatureName?.trim() || undefined,
        };
        const withHistory = appendDeliveryStatusEvent(nextMeta, "delivered");

        return applyUpdate(order.id, {
          status: "delivered",
          deliveredAt: new Date(),
          finalPrice: order.finalPrice ?? order.estimatedPrice,
          proofOfDeliveryUrl: proofUrl ?? order.proofOfDeliveryUrl,
          deliveryPremiumMeta: withHistory,
        });
      };

      if (isDemoDeliveryId(input.id)) {
        const order = getDemoDeliveryOrder(input.id);
        if (!order || order.senderId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        finishOrder(order, (id, patch) => {
          updateDemoDeliveryOrder(id, patch);
        });
        const delivered = getDemoDeliveryOrder(input.id);
        if (delivered) {
          try {
            await recordDeliveryLedgerEntry(delivered);
          } catch (err) {
            console.error("[Ledger] demo delivery:", err);
          }
        }
        return { success: true };
      }

      const order = await db.getDeliveryOrderById(input.id);
      if (!order || order.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      await finishOrder(order, async (id, patch) => {
        await db.updateDeliveryOrder(id, patch);
      });
      const delivered = await db.getDeliveryOrderById(input.id);
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
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (isDemoDeliveryId(input.id)) {
        const order = getDemoDeliveryOrder(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        if (order.senderId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return toDeliveryTrackingDetails(order);
      }

      const order = await db.getDeliveryOrderById(input.id);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      if (order.senderId !== ctx.user.id) {
        const driverProfile = await db.getDriverProfileByUserId(ctx.user.id);
        if (!driverProfile || order.driverId !== driverProfile.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
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
    return await db.getDeliveryOrdersByUser(ctx.user.id);
  }),

  /**
   * Cancel a delivery order
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (isDemoDeliveryId(input.id)) {
        const order = getDemoDeliveryOrder(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        if (order.senderId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        if (!["requested", "accepted"].includes(order.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível cancelar este pedido no status atual",
          });
        }

        updateDemoDeliveryOrder(input.id, {
          status: "cancelled",
          cancelledAt: new Date(),
          deliveryPremiumMeta: appendDeliveryStatusEvent(
            order.deliveryPremiumMeta as DeliveryPremiumMeta | null,
            "cancelled"
          ),
        });
        recordCancellationAudit({
          entityType: "delivery",
          entityId: input.id,
          origin: "passenger",
          reason: "Cancelamento pelo remetente",
          cancelledByUserId: ctx.user.id,
        });

        return { success: true };
      }

      const order = await db.getDeliveryOrderById(input.id);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      if (order.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      if (!["requested", "accepted"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar este pedido no status atual",
        });
      }

      await db.updateDeliveryOrder(input.id, {
        status: "cancelled",
        cancelledAt: new Date(),
      });
      recordCancellationAudit({
        entityType: "delivery",
        entityId: input.id,
        origin: "passenger",
        reason: "Cancelamento pelo remetente",
        cancelledByUserId: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Track delivery by tracking code (public)
   */
  track: publicProcedure
    .input(z.object({ trackingCode: z.string().min(1) }))
    .query(async ({ input }) => {
      const demoOrder = getDemoDeliveryOrderByTrackingCode(input.trackingCode);
      if (demoOrder) {
        return toPublicDeliveryTrackInfo(demoOrder);
      }

      const order = await db.getDeliveryOrderByTrackingCode(input.trackingCode);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Código de rastreio não encontrado" });
      }

      return toPublicDeliveryTrackInfo(order);
    }),

  /**
   * Calculate delivery price
   */
  calculatePrice: publicProcedure
    .input(
      z.object({
        distance: z.number(),
        packageType: z.enum([
          "documento",
          "pacote_pequeno",
          "pacote_medio",
          "pacote_grande",
          "alimento",
          "outro",
        ]),
        isFragile: z.boolean().optional(),
        requiresSignature: z.boolean().optional(),
      })
    )
    .query(({ input }) => {
      const distanceKm = input.distance / 1000;

      const BASE_PRICE = 500;
      const PRICE_PER_KM = 200;
      const MIN_PRICE = 800;

      const typeMultipliers: Record<string, number> = {
        documento: 1.0,
        pacote_pequeno: 1.0,
        pacote_medio: 1.2,
        pacote_grande: 1.5,
        alimento: 1.1,
        outro: 1.2,
      };

      const multiplier = typeMultipliers[input.packageType] || 1.0;
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
          fragileSurcharge: input.isFragile ? Math.round((price * 0.15) / 1.15) : 0,
          signatureSurcharge: input.requiresSignature ? 200 : 0,
        },
      };
    }),
});
