import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "../stripe-webhook";
import { serveStatic } from "./vite";

export type CreateAppOptions = {
  /** Serve Vite build from dist/public (Node/Railway). Desligado na função serverless Vercel. */
  enableStatic?: boolean;
};

/** Monta Express com API (tRPC, OAuth, Stripe). */
export function createApp(options: CreateAppOptions = {}): Express {
  const { enableStatic = false } = options;
  const app = express();

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (enableStatic) {
    serveStatic(app);
  }

  return app;
}

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}
