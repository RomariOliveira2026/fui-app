import { isLocalDemoDev } from "@/lib/demoMode";

type AuthUserLike = { role?: string } | null | undefined;

/** Admin real ou demo local (DEV) — Central Operacional acessível sem MySQL. */
export function canAccessAdminPanel(user: AuthUserLike): boolean {
  if (user?.role === "admin") return true;
  return isLocalDemoDev();
}
