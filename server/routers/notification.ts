import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eq, desc, and, inArray, ne, sql } from "drizzle-orm";
import { notifications, users, fcmTokens } from "../../drizzle/schema";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { canDemoPassengerUseAdminModules } from "../_core/demoUser";
import { ENV } from "../_core/env";

// Helper: create in-app notification + push for a single user
async function createNotificationWithPush(
  db: any,
  userId: number,
  data: {
    type: "ride" | "payment" | "promotion" | "system" | "driver" | "safety";
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: any;
  }
) {
  // Create in-app notification
  if (db) {
    await db.insert(notifications).values({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      metadata: data.metadata,
    });
  }

  // Send push notification (non-blocking)
  try {
    const { notifyUser } = await import("../_core/fcm");
    const metadata = data.metadata as
      | { rideId?: number; event?: string; expiresAt?: string; offerRound?: number }
      | undefined;
    const fcmData: Record<string, string> = {};
    if (data.actionUrl) fcmData.url = data.actionUrl;
    if (metadata?.event) fcmData.event = metadata.event;
    if (metadata?.rideId != null) fcmData.rideId = String(metadata.rideId);
    if (metadata?.expiresAt) fcmData.expiresAt = metadata.expiresAt;
    if (metadata?.offerRound != null) fcmData.offerRound = String(metadata.offerRound);

    await notifyUser(userId, {
      title: data.title,
      body: data.message,
      data: Object.keys(fcmData).length > 0 ? fcmData : undefined,
    });
  } catch (e) {
    console.log(`[Notification] Push failed for user ${userId}:`, e);
  }
}

// Admin guard — alinhado com módulos operacionais (beta demo em produção).
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role === "admin") return next({ ctx });
  if (canDemoPassengerUseAdminModules(ctx.user)) return next({ ctx });
  throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
});

const DEMO_ADMIN_STATS = {
  total: 0,
  unread: 0,
  today: 0,
  byType: [] as Array<{ type: string; count: number }>,
};

function canUseDemoAdminData(user: { role: string; openId: string }): boolean {
  return canDemoPassengerUseAdminModules(user) || ENV.betaDemo;
}

export const notificationRouter = router({
  /**
   * List all notifications for the current user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        onlyUnread: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(notifications.userId, ctx.user.id)];
      
      if (input.onlyUnread) {
        conditions.push(eq(notifications.isRead, false));
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return result;
    }),

  /**
   * Get count of unread notifications
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { count: result.length };
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Create a notification (for testing or admin use)
   */
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["ride", "payment", "promotion", "system", "driver", "safety"]),
        title: z.string(),
        message: z.string(),
        actionUrl: z.string().optional(),
        actionLabel: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: ctx.user.id,
          type: input.type,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          actionLabel: input.actionLabel,
          metadata: input.metadata,
        })
        .$returningId();

      return notification;
    }),

  // ============= ADMIN NOTIFICATION PROCEDURES =============

  /**
   * Admin: Send notification to all users or a specific segment
   */
  adminSendBroadcast: adminProcedure
    .input(
      z.object({
        type: z.enum(["promotion", "system"]),
        title: z.string().min(1).max(255),
        message: z.string().min(1).max(1000),
        actionUrl: z.string().optional(),
        actionLabel: z.string().optional(),
        segment: z.enum(["all", "passengers", "drivers", "active_last_30d"]).default("all"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        if (canUseDemoAdminData(ctx.user)) {
          return { success: true, sentCount: 0 };
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Build user query based on segment
      let targetUsers: { id: number }[];
      
      switch (input.segment) {
        case "passengers":
          targetUsers = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.role, "passenger"));
          break;
        case "drivers":
          targetUsers = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.role, "driver"));
          break;
        case "active_last_30d":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          targetUsers = await db
            .select({ id: users.id })
            .from(users)
            .where(sql`${users.lastSignedIn} >= ${thirtyDaysAgo}`);
          break;
        default: // "all"
          targetUsers = await db.select({ id: users.id }).from(users);
          break;
      }

      if (targetUsers.length === 0) {
        return { success: true, sentCount: 0 };
      }

      // Batch insert in-app notifications
      const notificationValues = targetUsers.map((u) => ({
        userId: u.id,
        type: input.type as "promotion" | "system",
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
      }));

      // Insert in batches of 100
      for (let i = 0; i < notificationValues.length; i += 100) {
        const batch = notificationValues.slice(i, i + 100);
        await db.insert(notifications).values(batch);
      }

      // Send push notifications (non-blocking, best effort)
      const userIds = targetUsers.map((u) => u.id);
      import("../_core/fcm").then(async ({ notifyUser }) => {
        for (const userId of userIds.slice(0, 50)) { // Limit push to 50 at a time
          try {
            await notifyUser(userId, {
              title: input.title,
              body: input.message,
              data: input.actionUrl ? { url: input.actionUrl } : undefined,
            });
          } catch (e) {
            // Non-blocking, continue
          }
        }
      }).catch(() => {});

      return { success: true, sentCount: targetUsers.length };
    }),

  /**
   * Admin: Send notification to a specific user
   */
  adminSendToUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["ride", "payment", "promotion", "system", "driver", "safety"]),
        title: z.string().min(1).max(255),
        message: z.string().min(1).max(1000),
        actionUrl: z.string().optional(),
        actionLabel: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        if (canUseDemoAdminData(ctx.user)) {
          return { success: true };
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await createNotificationWithPush(db, input.userId, {
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
      });

      return { success: true };
    }),

  /**
   * Admin: Get notification stats
   */
  adminGetStats: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      if (canUseDemoAdminData(ctx.user)) {
        return DEMO_ADMIN_STATS;
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications);

    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, false));

    const [todayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(sql`DATE(${notifications.createdAt}) = CURDATE()`);

    // Count by type
    const typeStats = await db
      .select({
        type: notifications.type,
        count: sql<number>`count(*)`,
      })
      .from(notifications)
      .groupBy(notifications.type);

    return {
      total: totalResult?.count || 0,
      unread: unreadResult?.count || 0,
      today: todayResult?.count || 0,
      byType: typeStats,
    };
  }),

  /**
   * Admin: List all users for targeting notifications
   */
  adminListUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["all", "passenger", "driver", "admin"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        if (canUseDemoAdminData(ctx.user)) {
          return [];
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const conditions: any[] = [];
      
      if (input.role !== "all") {
        conditions.push(eq(users.role, input.role));
      }

      if (input.search) {
        conditions.push(
          sql`(${users.name} LIKE ${`%${input.search}%`} OR ${users.email} LIKE ${`%${input.search}%`})`
        );
      }

      const result = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.lastSignedIn))
        .limit(input.limit);

      return result;
    }),

  /**
   * Admin: Get recent broadcast history
   */
  adminGetBroadcastHistory: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        if (canUseDemoAdminData(ctx.user)) {
          return [];
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get distinct recent notifications by title+message (broadcasts)
      const result = await db
        .select({
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          createdAt: notifications.createdAt,
          recipientCount: sql<number>`count(DISTINCT ${notifications.userId})`,
        })
        .from(notifications)
        .where(
          inArray(notifications.type, ["promotion", "system"])
        )
        .groupBy(notifications.title, notifications.message, notifications.type, notifications.createdAt)
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return result;
    }),
});

// Export the helper for use in other routers
export { createNotificationWithPush };
