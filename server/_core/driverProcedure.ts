import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";
import { isDemoPassenger } from "./demoUser";
import { getDemoDriverProfileByUserId } from "./demoDriver";
import * as db from "../db";

export const driverProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (isDemoPassenger(ctx.user)) {
    const driverProfile = getDemoDriverProfileByUserId(ctx.user.id);
    if (!driverProfile) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Driver profile required" });
    }
    return next({ ctx: { ...ctx, driverProfile } });
  }

  const driverProfile = await db.getDriverProfileByUserId(ctx.user.id);
  if (!driverProfile) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Driver profile required" });
  }
  return next({ ctx: { ...ctx, driverProfile } });
});
