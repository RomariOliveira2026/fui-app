import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

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
