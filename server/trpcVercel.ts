import type { IncomingMessage, ServerResponse } from "node:http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

app.use((req, _res, next) => {
  const raw = req.url ?? "";
  const pathOnly = raw.split("?")[0] ?? "";

  if (pathOnly.startsWith("/api/trpc")) {
    next();
    return;
  }
  if (pathOnly.startsWith("/trpc/") || pathOnly === "/trpc") {
    req.url = `/api${raw}`;
    next();
    return;
  }
  if (pathOnly.startsWith("/") && !pathOnly.startsWith("/api/")) {
    req.url = `/api/trpc${raw}`;
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

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("close", () => resolve());
    app(req as never, res as never, (err: unknown) => {
      if (err) reject(err);
    });
  });
}
