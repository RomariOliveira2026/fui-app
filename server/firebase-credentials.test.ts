import { describe, it, expect } from "vitest";

describe("Firebase Credentials", () => {
  it("should have FIREBASE_CLIENT_EMAIL configured", () => {
    const email = process.env.FIREBASE_CLIENT_EMAIL;
    expect(email).toBeDefined();
    expect(email).not.toBe("");
    expect(email).toContain("@");
    expect(email).toContain("fui-app-4c062");
  });

  it("should have FIREBASE_PRIVATE_KEY configured", () => {
    const key = process.env.FIREBASE_PRIVATE_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key).toContain("PRIVATE KEY");
  });

  it("should have FIREBASE_PROJECT_ID configured", () => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    expect(projectId).toBeDefined();
    expect(projectId).toBe("fui-app-4c062");
  });

  it("should be able to initialize Firebase Admin SDK", async () => {
    const { initializeApp, cert, getApps, deleteApp } = await import("firebase-admin/app");
    
    // Clean up any existing apps first
    const existingApps = getApps();
    for (const app of existingApps) {
      await deleteApp(app);
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || "fui-app-4c062",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };

    // Should not throw
    const app = initializeApp({
      credential: cert(serviceAccount),
    }, "test-firebase-credentials");

    expect(app).toBeDefined();
    expect(app.name).toBe("test-firebase-credentials");

    // Clean up
    await deleteApp(app);
  });
});
