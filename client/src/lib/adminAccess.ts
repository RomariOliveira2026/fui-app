import { isDemoLocalUser, isLocalDemoDev } from "@/lib/demoMode";

type AuthUserLike = { role?: string; openId?: string | null } | null | undefined;

/** Admin real, demo local ou passageiro demo via beta demo (runtime / build). */
export function canAccessAdminPanel(user: AuthUserLike): boolean {
  if (user?.role === "admin") return true;
  if (isDemoLocalUser(user)) return true;
  return isLocalDemoDev();
}
