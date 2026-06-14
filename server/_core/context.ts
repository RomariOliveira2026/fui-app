import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getStaticDemoPassenger } from "./demoUser";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Demo local: passageiro fictício em memória — sem OAuth nem query em users.
  if (!ENV.isProduction) {
    return {
      req: opts.req,
      res: opts.res,
      user: getStaticDemoPassenger(),
    };
  }

  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  // Beta demo (Vercel): fallback para passageiro demo sem sessão real.
  if (!user && ENV.betaDemo) {
    user = getStaticDemoPassenger();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
