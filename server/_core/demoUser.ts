import { DEMO_PASSENGER_OPEN_ID } from "@shared/const";
import type { User } from "../../drizzle/schema";

export { DEMO_PASSENGER_OPEN_ID };

export function isDemoPassenger(user: Pick<User, "openId"> | null | undefined): boolean {
  return user?.openId === DEMO_PASSENGER_OPEN_ID;
}

/** Demo passageiro pode usar módulos admin fora de dev quando BETA_DEMO=true. */
export function canDemoPassengerUseAdminModules(
  user: Pick<User, "openId"> | null | undefined
): boolean {
  if (!isDemoPassenger(user)) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.BETA_DEMO === "true";
}

/** Passageiro demo em memória — sem consulta ao banco em dev local. */
export function getStaticDemoPassenger(): User {
  const now = new Date();
  return {
    id: 0,
    openId: DEMO_PASSENGER_OPEN_ID,
    name: "Passageiro Demo",
    email: "demo.passageiro@local.dev",
    phone: null,
    loginMethod: "demo",
    role: "passenger",
    loyaltyPoints: 0,
    vipLevel: "bronze",
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

/** @deprecated Use getStaticDemoPassenger em dev. Mantido para compatibilidade. */
export async function getOrCreateDemoPassenger(): Promise<User> {
  return getStaticDemoPassenger();
}
