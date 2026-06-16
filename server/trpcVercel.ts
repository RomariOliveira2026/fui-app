import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

// Vercel catch-all pode entregar /trpc/... sem prefixo /api.
app.use((req, _res, next) => {
  const raw = req.url ?? "";
  const pathOnly = raw.split("?")[0] ?? "";
  if (!pathOnly.startsWith("/api/") && pathOnly.startsWith("/trpc")) {
    req.url = `/api${raw}`;
  }
  next();
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

/** Wrapper explícito — Vercel ESM serverless não aceita Express cru em todos os runtimes. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("close", () => resolve());
    app(req as never, res as never, (err: unknown) => {
      if (err) reject(err);
    });
  });
}
