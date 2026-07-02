export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { POST_AUTH_REDIRECT_COOKIE, sanitizePostAuthRedirect } from "@shared/driverLanding";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";

export function rememberLoginReturnTo(returnTo?: string) {
  const fallback =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : undefined;
  const safePath = sanitizePostAuthRedirect(returnTo ?? fallback);
  if (!safePath || typeof window === "undefined") return;

  setPostAuthRedirect(safePath);
  document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=${encodeURIComponent(safePath)}; path=/; max-age=600; SameSite=Lax`;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const buildLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/** @deprecated Prefer `buildLoginUrl()` for hrefs or `redirectToLogin()` for navigation. */
export const getLoginUrl = buildLoginUrl;

export function redirectToLogin(returnTo?: string) {
  rememberLoginReturnTo(returnTo);
  window.location.href = buildLoginUrl();
}
