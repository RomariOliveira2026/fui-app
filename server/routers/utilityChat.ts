import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { isDemoPassenger } from "../_core/demoUser";
import { getDemoDriverProfileByUserId } from "../_core/demoDriver";
import { getDemoUtilityOrder, isDemoUtilityId } from "../_core/demoUtilities";
import {
  addDemoUtilityChatMessage,
  exportDemoUtilityChatMessages,
  getDemoUtilityChatMessages,
  hydrateDemoUtilityChatMessages,
} from "../_core/demoUtilityChat";
import type { DemoUtilityChatMessage } from "../_core/demoUtilityChat";
import * as db from "../db";

async function useDemoUtilityChat(): Promise<boolean> {
  return !(await db.getDb());
}

function assertChatAccess(
  order: NonNullable<ReturnType<typeof getDemoUtilityOrder>>,
  userId: number,
  driverProfileId?: number
): void {
  const isSender = order.senderId === userId;
  const isDriver = driverProfileId != null && order.driverId === driverProfileId;
  if (!isSender && !isDriver) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado ao chat" });
  }
  if (order.status === "cancelled") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Chat indisponível para pedido cancelado" });
  }
  if (!order.driverId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Chat disponível após aceite do prestador",
    });
  }
}

export const utilityChatRouter = router({
  hydrateDemoState: protectedProcedure
    .input(z.object({ messages: z.array(z.unknown()) }))
    .mutation(({ input }) => {
      hydrateDemoUtilityChatMessages(input.messages as DemoUtilityChatMessage[]);
      return { success: true, count: input.messages.length };
    }),

  getMessages: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!(isDemoUtilityId(input.orderId) || (await useDemoUtilityChat()))) {
        return [];
      }
      const order = getDemoUtilityOrder(input.orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
      assertChatAccess(order, ctx.user.id, driverProfile?.id);
      return getDemoUtilityChatMessages(input.orderId);
    }),

  send: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        message: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!(isDemoUtilityId(input.orderId) || (await useDemoUtilityChat()))) {
        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Use demo local" });
      }
      const order = getDemoUtilityOrder(input.orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }
      const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
      assertChatAccess(order, ctx.user.id, driverProfile?.id);

      const entry = addDemoUtilityChatMessage(input.orderId, ctx.user.id, input.message.trim());
      return {
        success: true,
        messageId: entry.id,
        demoSnapshot: { messages: exportDemoUtilityChatMessages() },
      };
    }),

  exportDemoSnapshot: protectedProcedure.query(async ({ ctx }) => {
    if (!(isDemoPassenger(ctx.user) || (await useDemoUtilityChat()))) {
      return { messages: [] };
    }
    return { messages: exportDemoUtilityChatMessages() };
  }),
});
