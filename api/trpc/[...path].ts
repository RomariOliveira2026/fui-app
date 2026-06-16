import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

const app = express();

/** Vercel catch-all pode entregar /trpc/... ou só o nome da procedure. */
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

export default app;
