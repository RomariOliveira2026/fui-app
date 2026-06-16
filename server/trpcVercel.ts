import type { IncomingMessage, ServerResponse } from "node:http";

import type { Express } from "express";

let appPromise: Promise<Express> | null = null;

function loadApp() {
  if (!appPromise) {
    appPromise = import("./_app.js").then((mod) => mod.createTrpcApp());
  }
  return appPromise;
}

/** Entry leve — carrega o bundle tRPC só no primeiro request (evita crash no cold start). */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await loadApp();
    const { handleTrpcRequest } = await import("./_app.js");
    await handleTrpcRequest(req, res, app);
  } catch (err) {
    console.error("[tRPC Vercel]", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: "tRPC handler failed",
          message: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }
}
