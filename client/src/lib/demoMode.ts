import { DEMO_PASSENGER_OPEN_ID } from "@shared/const";

export type AuthUserLike = { openId?: string | null; id?: number } | null | undefined;

/** Beta demo na Vercel — habilita app operacional sem OAuth (build-time). */
export function isBetaDemoRuntime(): boolean {
  const value = import.meta.env.VITE_BETA_DEMO;
  return value === "true" || value === true;
}

/** Dev local ou beta demo na Vercel — passageiro demo e stores in-memory. */
export function isLocalDemoDev(): boolean {
  return import.meta.env.DEV || isBetaDemoRuntime();
}

/** Usuário demo injetado no cliente (espelha getStaticDemoPassenger no servidor). */
export const DEMO_PASSENGER_USER = {
  id: 0,
  openId: DEMO_PASSENGER_OPEN_ID,
  name: "Passageiro Demo",
  email: "demo.passageiro@local.dev",
  phone: null,
  loginMethod: "demo",
  role: "passenger" as const,
  loyaltyPoints: 0,
  vipLevel: "bronze" as const,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

/** Usuário fictício de demo local (não usar APIs privadas de perfil/endereços/notificações). */
export function isDemoLocalUser(user: AuthUserLike): boolean {
  return user?.openId === DEMO_PASSENGER_OPEN_ID;
}

/** Sessão real: usuário autenticado que não é o passageiro demo de dev. */
export function canUsePrivateUserApi(user: AuthUserLike): boolean {
  return !!user && !isDemoLocalUser(user);
}
