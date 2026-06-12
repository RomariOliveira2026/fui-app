import { commercialLeadSchema } from "@shared/commercialLead";
import { publicProcedure, router } from "../_core/trpc";
import {
  formatCommercialLeadNotification,
  saveDemoCommercialLead,
} from "../_core/demoCommercialLeads";
import { notifyOwner } from "../_core/notification";

export const landingRouter = router({
  submitCommercialLead: publicProcedure
    .input(commercialLeadSchema)
    .mutation(async ({ input }) => {
      const lead = saveDemoCommercialLead(input);

      let notified = false;
      try {
        notified = await notifyOwner(formatCommercialLeadNotification(input));
      } catch {
        // Notificação opcional — lead permanece salvo em demo store
      }

      return {
        success: true,
        id: lead.id,
        notified,
      } as const;
    }),
});
