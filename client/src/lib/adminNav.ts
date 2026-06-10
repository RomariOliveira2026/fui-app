/** Rotas e estado ativo da navegação hub da Central Operacional. */

export type AdminNavId = "finance" | "manage" | "analytics" | "notifications" | "coupons";

export const ADMIN_NAV_ROUTES: Record<AdminNavId, string> = {
  finance: "/admin/finance",
  manage: "/admin/manage",
  analytics: "/admin?view=intelligence",
  notifications: "/admin/notifications",
  coupons: "/admin/finance?tab=coupons",
};

export function resolveAdminNavActive(
  pathname: string,
  search: string = typeof window !== "undefined" ? window.location.search : ""
): AdminNavId | null {
  const params = new URLSearchParams(search);

  if (pathname === "/admin/finance") {
    return params.get("tab") === "coupons" ? "coupons" : "finance";
  }
  if (pathname === "/admin/manage") return "manage";
  if (pathname === "/admin/notifications") return "notifications";
  if (pathname === "/admin") {
    return params.get("view") === "intelligence" ? "analytics" : null;
  }
  return null;
}
