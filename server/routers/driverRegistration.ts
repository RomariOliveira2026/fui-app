import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  driverApplicationSubmitSchema,
  driverCnhSchema,
  driverPersonalSchema,
  driverSecuritySchema,
  driverTermsSchema,
  driverVehicleSchema,
} from "@shared/driverRegistration";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { isDemoPassenger } from "../_core/demoUser";
import {
  getDriverApplicationById,
  listDriverApplicationsForAdmin,
  loadDriverApplicationForUser,
  reviewDriverApplication,
  saveDriverApplicationDraft,
  seedDemoDriverApplications,
  submitDriverApplication,
} from "../_core/driverApplicationStore";

const draftSchema = z.object({
  personal: driverPersonalSchema.partial().optional(),
  cnh: driverCnhSchema.partial().optional(),
  vehicle: driverVehicleSchema.partial().optional(),
  security: driverSecuritySchema.partial().optional(),
  terms: z
    .object({
      termsAccepted: z.boolean().optional(),
      conductAccepted: z.boolean().optional(),
      privacyAccepted: z.boolean().optional(),
      documentReviewAck: z.boolean().optional(),
    })
    .optional(),
});

function canAccessDriverRegistrationAdmin(ctx: { user: { role: string } }): boolean {
  if (ctx.user.role === "admin") return true;
  return !ENV.isProduction && isDemoPassenger(ctx.user as never);
}

const adminRegProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canAccessDriverRegistrationAdmin(ctx)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

export const driverRegistrationRouter = router({
  getMyApplication: protectedProcedure.query(async ({ ctx }) => {
    return loadDriverApplicationForUser(ctx.user.id);
  }),

  saveDraft: protectedProcedure.input(draftSchema).mutation(async ({ ctx, input }) => {
    return saveDriverApplicationDraft(ctx.user.id, input);
  }),

  submit: protectedProcedure
    .input(driverApplicationSubmitSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadDriverApplicationForUser(ctx.user.id);
      if (
        existing &&
        ["enviado", "em_analise", "pendente", "aprovado"].includes(existing.status)
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você já possui um cadastro em análise ou aprovado.",
        });
      }

      return submitDriverApplication(ctx.user, {
        personal: input.personal,
        cnh: input.cnh,
        vehicle: input.vehicle,
        security: input.security,
        terms: input.terms,
      });
    }),

  listForAdmin: adminRegProcedure.query(async () => {
    if (!ENV.isProduction) seedDemoDriverApplications();
    return listDriverApplicationsForAdmin();
  }),

  getByIdForAdmin: adminRegProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const app = getDriverApplicationById(input.applicationId);
      if (app) return app;
      throw new TRPCError({ code: "NOT_FOUND", message: "Cadastro não encontrado" });
    }),

  setStatus: adminRegProcedure
    .input(
      z.object({
        applicationId: z.number(),
        action: z.enum(["em_analise", "pendente", "aprovado", "reprovado"]),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await reviewDriverApplication(
        input.applicationId,
        ctx.user.id,
        input.action,
        input.reviewNotes
      );
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cadastro não encontrado" });
      }
      return updated;
    }),
});
