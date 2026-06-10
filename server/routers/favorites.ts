import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const favoritesRouter = router({
  /**
   * List all favorite drivers for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getFavoriteDrivers(ctx.user.id);
  }),

  /**
   * Add a driver to favorites
   */
  add: protectedProcedure
    .input(
      z.object({
        driverId: z.number(),
        nickname: z.string().max(100).optional(),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.addFavoriteDriver({
          passengerId: ctx.user.id,
          driverId: input.driverId,
          nickname: input.nickname,
          note: input.note,
        });
        return { success: true };
      } catch (error: any) {
        if (error.message === "Driver already in favorites") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este motorista já está nos seus favoritos",
          });
        }
        throw error;
      }
    }),

  /**
   * Remove a driver from favorites
   */
  remove: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeFavoriteDriver(ctx.user.id, input.driverId);
      return { success: true };
    }),

  /**
   * Check if a driver is favorited
   */
  isFavorite: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.isFavoriteDriver(ctx.user.id, input.driverId);
    }),

  /**
   * Update favorite driver info (nickname, note)
   */
  update: protectedProcedure
    .input(
      z.object({
        driverId: z.number(),
        nickname: z.string().max(100).optional(),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { driverId, ...updates } = input;
      await db.updateFavoriteDriver(ctx.user.id, driverId, updates);
      return { success: true };
    }),
});
