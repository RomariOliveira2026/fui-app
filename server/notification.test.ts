import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" | "driver" | "passenger" = "passenger"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    phone: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminContext(userId: number = 1): TrpcContext {
  return createAuthContext(userId, "admin");
}

describe("Notification System", () => {
  // ============= USER NOTIFICATION PROCEDURES =============

  it("should list notifications for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list only unread notifications when filter is set", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.list({ limit: 10, onlyUnread: true });
    expect(Array.isArray(result)).toBe(true);
    // All returned should be unread
    for (const notif of result) {
      expect(notif.isRead).toBe(false);
    }
  });

  it("should get unread count for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.getUnreadCount();
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("should create a notification for the current user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.create({
      type: "system",
      title: "Teste de Notificação",
      message: "Esta é uma notificação de teste criada pelo vitest",
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should create a notification with all optional fields", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.create({
      type: "promotion",
      title: "Promoção Especial",
      message: "Use o cupom TESTE50 e ganhe 50% de desconto!",
      actionUrl: "/request-ride",
      actionLabel: "Solicitar corrida",
      metadata: { couponCode: "TESTE50" },
    });

    expect(result).toBeDefined();
  });

  it("should mark a notification as read", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // First create a notification
    const created = await caller.notification.create({
      type: "system",
      title: "Para marcar como lida",
      message: "Teste de marcar como lida",
    });

    // Then mark it as read
    const result = await caller.notification.markAsRead({
      notificationId: created.id,
    });

    expect(result.success).toBe(true);
  });

  it("should mark all notifications as read", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.markAllAsRead();
    expect(result.success).toBe(true);

    // Verify all are read
    const unread = await caller.notification.getUnreadCount();
    expect(unread.count).toBe(0);
  });

  it("should delete a notification", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create a notification first
    const created = await caller.notification.create({
      type: "system",
      title: "Para deletar",
      message: "Teste de deletar",
    });

    // Delete it
    const result = await caller.notification.delete({
      notificationId: created.id,
    });

    expect(result.success).toBe(true);
  });

  it("should support all notification types", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const types = ["ride", "payment", "promotion", "system", "driver", "safety"] as const;

    for (const type of types) {
      const result = await caller.notification.create({
        type,
        title: `Teste tipo ${type}`,
        message: `Notificação de teste para tipo ${type}`,
      });
      expect(result).toBeDefined();
    }
  });

  // ============= ADMIN NOTIFICATION PROCEDURES =============

  it("should reject non-admin from sending broadcast", async () => {
    const ctx = createAuthContext(1, "passenger");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.notification.adminSendBroadcast({
        type: "system",
        title: "Teste",
        message: "Teste",
        segment: "all",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should allow admin to send broadcast notification", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminSendBroadcast({
      type: "promotion",
      title: "Promoção de Teste Admin",
      message: "Teste de envio em massa pelo admin",
      segment: "all",
    });

    expect(result.success).toBe(true);
    expect(typeof result.sentCount).toBe("number");
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
  });

  it("should allow admin to send broadcast to specific segment", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminSendBroadcast({
      type: "system",
      title: "Aviso para Motoristas",
      message: "Teste de segmentação para motoristas",
      segment: "drivers",
    });

    expect(result.success).toBe(true);
  });

  it("should allow admin to send notification to specific user", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminSendToUser({
      userId: 1,
      type: "system",
      title: "Notificação Individual",
      message: "Teste de envio individual pelo admin",
    });

    expect(result.success).toBe(true);
  });

  it("should allow admin to get notification stats", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminGetStats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("unread");
    expect(result).toHaveProperty("today");
    expect(result).toHaveProperty("byType");
    expect(typeof result.total).toBe("number");
    expect(typeof result.unread).toBe("number");
    expect(typeof result.today).toBe("number");
    expect(Array.isArray(result.byType)).toBe(true);
  });

  it("should allow admin to list users for targeting", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminListUsers({
      role: "all",
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("role");
    }
  });

  it("should allow admin to search users by name", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminListUsers({
      search: "test",
      role: "all",
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow admin to get broadcast history", async () => {
    const ctx = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.adminGetBroadcastHistory({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("type");
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("message");
      expect(result[0]).toHaveProperty("createdAt");
      expect(result[0]).toHaveProperty("recipientCount");
    }
  });

  it("should reject non-admin from accessing admin stats", async () => {
    const ctx = createAuthContext(1, "passenger");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.notification.adminGetStats();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should reject non-admin from listing users", async () => {
    const ctx = createAuthContext(1, "passenger");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.notification.adminListUsers({ role: "all", limit: 10 });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
