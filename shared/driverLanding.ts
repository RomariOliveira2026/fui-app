import type { DriverApplicationStatus } from "./driverRegistration";

export const DRIVER_REGISTER_PATH = "/driver/register";
export const DRIVER_DASHBOARD_PATH = "/driver-dashboard";
export const POST_AUTH_REDIRECT_COOKIE = "fui_post_auth_redirect";

export type DriverProfileSnapshot = {
  status: "pending" | "approved" | "rejected" | "suspended";
};

export type DriverApplicationSnapshot = {
  status: DriverApplicationStatus;
};

export type DriverLandingContext = {
  role?: string | null;
  driverProfile?: DriverProfileSnapshot | null;
  application?: DriverApplicationSnapshot | null;
  hasDriverSignupIntent?: boolean;
  postAuthRedirect?: string | null;
};

function isSafeInternalPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

/**
 * Resolves where an authenticated user should land instead of the passenger home.
 * Returns null when the user should remain on the passenger dashboard.
 */
export function resolveDriverLandingPath(ctx: DriverLandingContext): string | null {
  if (isSafeInternalPath(ctx.postAuthRedirect) && ctx.postAuthRedirect !== "/") {
    return ctx.postAuthRedirect;
  }

  const isExplicitDriverIntent = Boolean(ctx.hasDriverSignupIntent);
  const isDriverRole = ctx.role === "driver";
  const hasProfile = Boolean(ctx.driverProfile);
  const hasApplication = Boolean(ctx.application);

  if (!isExplicitDriverIntent && !isDriverRole && !hasProfile && !hasApplication) {
    return null;
  }

  if (ctx.role === "admin" && !isExplicitDriverIntent && !hasProfile && !hasApplication) {
    return null;
  }

  if (ctx.driverProfile?.status === "approved") {
    return DRIVER_DASHBOARD_PATH;
  }

  return DRIVER_REGISTER_PATH;
}

export function sanitizePostAuthRedirect(path: string | null | undefined): string | null {
  if (!isSafeInternalPath(path) || path === "/") return null;
  return path;
}
