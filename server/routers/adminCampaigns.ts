import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { canDemoPassengerUseAdminModules, isDemoPassenger } from "../_core/demoUser";
import {
  campaignInputSchema,
  CAMPAIGN_STATUSES,
  partnerInputSchema,
} from "@shared/adminCampaigns";
import {
  createMediaCampaign,
  createMediaPartner,
  getCampaignAnalyticsSummary,
  getDomainReadinessForAdmin,
  listMediaCampaigns,
  listMediaPartners,
  patchMediaCampaign,
  patchMediaPartner,
  setMediaCampaignStatus,
} from "../_core/campaignService";
import { hydrateDemoCampaignState } from "../_core/demoAdminCampaigns";
import { getDemoCommercialLeads } from "../_core/demoCommercialLeads";

function canAccessAdminCampaigns(ctx: { user: { role: string; openId: string } }): boolean {
  if (ctx.user.role === "admin") return true;
  return canDemoPassengerUseAdminModules(ctx.user);
}

const campaignsProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canAccessAdminCampaigns(ctx)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

export const adminCampaignsRouter = router({
  hydrateDemoState: campaignsProcedure
    .input(
      z.object({
        partners: z.array(z.any()).optional(),
        campaigns: z.array(z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user)) return { success: false };
      hydrateDemoCampaignState(input as never);
      return { success: true };
    }),

  listPartners: campaignsProcedure.query(async ({ ctx }) => {
    return listMediaPartners(ctx.user);
  }),

  createPartner: campaignsProcedure
    .input(partnerInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createMediaPartner(input, ctx.user);
    }),

  updatePartner: campaignsProcedure
    .input(z.object({ id: z.number(), patch: partnerInputSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await patchMediaPartner(input.id, input.patch, ctx.user);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Parceiro não encontrado" });
      return updated;
    }),

  listCampaigns: campaignsProcedure.query(async ({ ctx }) => {
    return listMediaCampaigns(ctx.user);
  }),

  createCampaign: campaignsProcedure
    .input(campaignInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createMediaCampaign(input, ctx.user);
    }),

  updateCampaign: campaignsProcedure
    .input(
      z.object({
        id: z.number(),
        patch: campaignInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await patchMediaCampaign(input.id, input.patch, ctx.user);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });
      return updated;
    }),

  setCampaignStatus: campaignsProcedure
    .input(z.object({ id: z.number(), status: z.enum(CAMPAIGN_STATUSES) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await setMediaCampaignStatus(input.id, input.status, ctx.user);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });
      return updated;
    }),

  getAnalytics: campaignsProcedure.query(async ({ ctx }) => {
    return getCampaignAnalyticsSummary(ctx.user);
  }),

  listCommercialLeads: campaignsProcedure.query(() => {
    return getDemoCommercialLeads();
  }),

  getDomainReadiness: campaignsProcedure.query(() => {
    return getDomainReadinessForAdmin();
  }),
});
