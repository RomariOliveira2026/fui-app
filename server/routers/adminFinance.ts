import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { isDemoPassenger } from "../_core/demoUser";
import {
  approveDemoDriverReview,
  createDemoAdminCoupon,
  getCancellationAuditLog,
  getDemoAdminCoupons,
  getDemoPendingDriverReviews,
  hydrateDemoFinanceState,
  rejectDemoDriverReview,
  toggleDemoAdminCoupon,
} from "../_core/demoAdminFinance";
import { getAdminFinancialSummary } from "../_core/adminFinanceReport";
import { loadFinanceConfig, saveFinanceConfig } from "../_core/financeConfigStore";
import {
  FINANCE_SERVICE_KEYS,
  type PlatformFinanceConfig,
} from "@shared/adminFinance";
import * as db from "../db";

function canAccessAdminFinance(ctx: { user: { role: string; openId: string } }): boolean {
  if (ctx.user.role === "admin") return true;
  return !ENV.isProduction && isDemoPassenger(ctx.user);
}

const financeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canAccessAdminFinance(ctx)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

const serviceKeySchema = z.enum([
  "ride",
  "delivery",
  "moto",
  "carro",
  "van",
  "utilitario",
]);

const financeConfigPatchSchema = z.object({
  commission: z
    .object({
      defaultPercent: z.number().min(0).max(100).optional(),
      byService: z.record(serviceKeySchema, z.number().min(0).max(100)).optional(),
    })
    .optional(),
  minimumPrices: z
    .object({
      regionLabel: z.string().min(1).optional(),
      byService: z.record(serviceKeySchema, z.number().min(0)).optional(),
    })
    .optional(),
});

export const adminFinanceRouter = router({
  hydrateDemoState: financeProcedure
    .input(
      z.object({
        config: financeConfigPatchSchema.optional(),
        cancellationAudit: z.array(z.any()).optional(),
        coupons: z.array(z.any()).optional(),
        pendingDrivers: z.array(z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user)) return { success: false };
      hydrateDemoFinanceState(input as never);
      return { success: true };
    }),

  getConfig: financeProcedure.query(async ({ ctx }) => {
    return loadFinanceConfig(ctx.user);
  }),

  updateConfig: financeProcedure
    .input(financeConfigPatchSchema)
    .mutation(async ({ ctx, input }) => {
      return saveFinanceConfig(input as Partial<PlatformFinanceConfig>, ctx.user);
    }),

  getFinancialSummary: financeProcedure.query(async ({ ctx }) => {
    return getAdminFinancialSummary(ctx.user);
  }),

  getCancellationAudit: financeProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
    .query(({ input }) => {
      return getCancellationAuditLog(input?.limit ?? 50);
    }),

  getPendingDriverReviews: financeProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user) || !(await db.getDb())) {
      return getDemoPendingDriverReviews();
    }

    const dbInstance = await db.getDb();
    if (!dbInstance) return [];

    const { driverProfiles, users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await dbInstance
      .select({ profile: driverProfiles, user: users })
      .from(driverProfiles)
      .innerJoin(users, eq(driverProfiles.userId, users.id))
      .where(eq(driverProfiles.status, "pending"));

    return rows.map((row) => ({
      driverId: row.profile.id,
      userId: row.user.id,
      name: row.user.name ?? "—",
      email: row.user.email ?? undefined,
      cpf: row.profile.cpf ?? undefined,
      cnh: row.profile.cnh ?? undefined,
      cnhImageUrl: row.profile.cnhImageUrl ?? undefined,
      submittedAt: row.profile.createdAt.toISOString(),
    }));
  }),

  approveDriverReview: financeProcedure
    .input(z.object({ driverId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user) || !(await db.getDb())) {
        const ok = approveDemoDriverReview(input.driverId);
        if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Motorista não encontrado" });
        return { success: true };
      }
      await db.updateDriverProfile(input.driverId, { status: "approved" });
      return { success: true };
    }),

  rejectDriverReview: financeProcedure
    .input(
      z.object({
        driverId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user) || !(await db.getDb())) {
        const ok = rejectDemoDriverReview(input.driverId);
        if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Motorista não encontrado" });
        return { success: true };
      }
      await db.updateDriverProfile(input.driverId, { status: "rejected" });
      return { success: true };
    }),

  getCoupons: financeProcedure.query(async ({ ctx }) => {
    if (isDemoPassenger(ctx.user) || !(await db.getDb())) {
      return getDemoAdminCoupons();
    }
    const coupons = await db.getAllCoupons();
    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description ?? undefined,
      discountType: c.discountType as "percentage" | "fixed",
      discountValue: c.discountValue,
      maxUses: c.maxUses ?? undefined,
      usedCount: c.usedCount,
      validFrom: c.validFrom.toISOString(),
      validUntil: c.validUntil.toISOString(),
      isActive: c.isActive === 1,
    }));
  }),

  createCoupon: financeProcedure
    .input(
      z.object({
        code: z.string().min(2),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number().min(1),
        maxUses: z.number().optional(),
        validFrom: z.string(),
        validUntil: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user) || !(await db.getDb())) {
        return createDemoAdminCoupon({
          code: input.code,
          description: input.description,
          discountType: input.discountType,
          discountValue: input.discountValue,
          maxUses: input.maxUses,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
        });
      }

      await db.createCoupon({
        code: input.code.toUpperCase(),
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUses: input.maxUses,
        usedCount: 0,
        maxUsesPerUser: 1,
        validFrom: new Date(input.validFrom),
        validUntil: new Date(input.validUntil),
        isActive: 1,
      });
      return { success: true };
    }),

  toggleCoupon: financeProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (isDemoPassenger(ctx.user) || !(await db.getDb())) {
        const updated = toggleDemoAdminCoupon(input.id, input.isActive);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Cupom não encontrado" });
        return updated;
      }
      await db.updateCoupon(input.id, { isActive: input.isActive ? 1 : 0 });
      return { success: true };
    }),

  getServiceKeys: financeProcedure.query(() => FINANCE_SERVICE_KEYS),
});
