import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { CAMPAIGN_CATEGORIES, MEDIA_PLACEMENTS } from "@shared/adminCampaigns";
import { getHomeMediaSlots, trackCampaignEvent } from "../_core/campaignService";
import { ENV } from "../_core/env";

export const campaignsRouter = router({
  /** Mídia ativa para home e outros placements (público — visitantes também veem faixa comercial). */
  getHomeMedia: publicProcedure
    .input(
      z
        .object({
          city: z.string().optional(),
          category: z.enum(CAMPAIGN_CATEGORIES).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const city = input?.city?.trim() || ENV.appCity.trim() || "Brasil";
      return getHomeMediaSlots({ city, category: input?.category });
    }),

  trackImpression: publicProcedure
    .input(
      z.object({
        campaignId: z.number(),
        creativeId: z.number(),
        partnerId: z.number(),
        placement: z.enum(MEDIA_PLACEMENTS),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackCampaignEvent({
        ...input,
        eventType: "impression",
        city: input.city ?? (ENV.appCity.trim() || undefined),
        userId: ctx.user?.id,
      });
      return { success: true };
    }),

  trackClick: publicProcedure
    .input(
      z.object({
        campaignId: z.number(),
        creativeId: z.number(),
        partnerId: z.number(),
        placement: z.enum(MEDIA_PLACEMENTS),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackCampaignEvent({
        ...input,
        eventType: "click",
        city: input.city ?? (ENV.appCity.trim() || undefined),
        userId: ctx.user?.id ?? undefined,
      });
      return { success: true };
    }),
});
