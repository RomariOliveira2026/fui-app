import { createApp } from "../server/_core/createApp";

/**
 * Handler serverless Vercel — API (tRPC, OAuth, Stripe).
 * Assets estáticos e SPA fallback vêm de dist/public via vercel.json.
 */
const app = createApp({ enableStatic: false });

export default app;
