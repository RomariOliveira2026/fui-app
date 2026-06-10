import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { isDemoPassenger } from "../_core/demoUser";
import {
  demoReferralErrorMessage,
  exportDemoReferralsSnapshot,
  getDemoReferralByCode,
  getDemoReferralCode,
  getDemoReferralStats,
  getDemoUserReferrals,
  hydrateDemoReferrals,
  registerDemoReferral,
} from "../_core/demoReferrals";
import type { DemoReferralsSnapshot } from "@shared/demoReferrals";
import * as db from "../db";

async function useDemoReferrals(user: { openId: string }): Promise<boolean> {
  if (isDemoPassenger(user)) return true;
  return !(await db.getDb());
}

export const referralsRouter = router({
  hydrateDemoState: protectedProcedure
    .input(
      z.object({
        referrals: z.array(z.any()).optional(),
        nextId: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user)) return { success: false };
      hydrateDemoReferrals(input as DemoReferralsSnapshot);
      return { success: true, demoSnapshot: exportDemoReferralsSnapshot() };
    }),

  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      return {
        code: getDemoReferralCode(ctx.user.id),
        demoSnapshot: exportDemoReferralsSnapshot(),
      };
    }

    let code = await db.getUserActiveReferralCode(ctx.user.id);
    if (!code) {
      code = await db.createReferralCode(ctx.user.id);
    }
    return { code };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      return getDemoReferralStats(ctx.user.id);
    }
    return await db.getReferralStats(ctx.user.id);
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      const rows = getDemoUserReferrals(ctx.user.id);
      return rows.filter((r) => r.referredId != null);
    }
    const rows = await db.getUserReferrals(ctx.user.id);
    return rows.filter((r) => r.referredId != null);
  }),

  validate: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        const referral = getDemoReferralByCode(input.code);
        if (!referral) {
          return { valid: false, message: "Código de indicação inválido" };
        }
        if (referral.status !== "pending" || referral.referredId != null) {
          return { valid: false, message: "Este código já foi utilizado" };
        }
        return {
          valid: true,
          message:
            "Código válido! Você receberá R$ 5,00 em créditos após sua primeira corrida.",
        };
      }

      const referral = await db.getReferralByCode(input.code);
      if (!referral) {
        return { valid: false, message: "Código de indicação inválido" };
      }
      if (referral.status !== "pending") {
        return { valid: false, message: "Este código já foi utilizado" };
      }
      return {
        valid: true,
        message:
          "Código válido! Você receberá R$ 5,00 em créditos após sua primeira corrida.",
      };
    }),

  redeemCode: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const normalized = input.code.trim().toUpperCase();
      if (!normalized) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Digite um código de indicação",
        });
      }

      if (await useDemoReferrals(ctx.user)) {
        const result = registerDemoReferral(normalized, ctx.user.id, {
          name: ctx.user.name ?? undefined,
          email: ctx.user.email ?? undefined,
        });
        if (!result.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: demoReferralErrorMessage(result.reason),
          });
        }
        return {
          success: true,
          message:
            "Código aplicado! Complete sua primeira corrida para receber R$ 5,00 em créditos.",
          demoSnapshot: exportDemoReferralsSnapshot(),
        };
      }

      const existing = await db.getReferralByReferredUser(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você já utilizou um código de indicação",
        });
      }

      const referral = await db.getReferralByCode(normalized);
      if (!referral) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Código de indicação inválido",
        });
      }

      if (referral.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este código já foi utilizado",
        });
      }

      if (referral.referrerId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode usar seu próprio código de indicação",
        });
      }

      const success = await db.registerReferral(normalized, ctx.user.id);
      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao aplicar código de indicação",
        });
      }

      return {
        success: true,
        message:
          "Código aplicado! Complete sua primeira corrida para receber R$ 5,00 em créditos.",
      };
    }),

  generateCode: protectedProcedure.mutation(async ({ ctx }) => {
    if (await useDemoReferrals(ctx.user)) {
      const code = getDemoReferralCode(ctx.user.id);
      return { code, demoSnapshot: exportDemoReferralsSnapshot() };
    }
    const code = await db.createReferralCode(ctx.user.id);
    return { code };
  }),
});
