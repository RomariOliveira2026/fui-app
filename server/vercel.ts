import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./_core/createApp";

const app = createApp({ enableStatic: false });

/** Handler serverless Vercel — Express não pode ser exportado cru. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("close", () => resolve());
    app(req, res, (err: unknown) => {
      if (err) reject(err);
    });
  });
}
