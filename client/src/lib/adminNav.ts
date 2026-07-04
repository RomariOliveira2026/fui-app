/** Rotas e estado ativo da navegação hub da Central Operacional. */

export type AdminNavId =
  | "finance"
  | "manage"
  | "analytics"
  | "notifications"
  | "coupons"
  | "campaigns";

export const ADMIN_NAV_ROUTES: Record<AdminNavId, string> = {
  finance: "/admin/finance",
  manage: "/admin/manage",
  analytics: "/admin?view=intelligence",
  notifications: "/admin/notifications",
  coupons: "/admin/finance?tab=coupons",
  campaigns: "/admin/campaigns",
};

/** Navega para um módulo admin — preserva ?view= na Central (wouter ignora query string). */
export function navigateAdminNav(
  id: AdminNavId,
  setLocation: (path: string) => void
) {
  if (id === "analytics") {
    window.history.pushState(window.history.state, "", "/admin?view=intelligence");
    window.dispatchEvent(new PopStateEvent("popstate"));
    setLocation("/admin");
    return;
  }
  const href = ADMIN_NAV_ROUTES[id];
  const path = href.split("?")[0] || href;
  setLocation(path);
  if (href.includes("?")) {
    const query = href.slice(href.indexOf("?"));
    window.history.replaceState(window.history.state, "", `${path}${query}`);
  }
}

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
  if (pathname === "/admin/campaigns") return "campaigns";
  if (pathname === "/admin") {
    return params.get("view") === "intelligence" ? "analytics" : null;
  }
  return null;
}
