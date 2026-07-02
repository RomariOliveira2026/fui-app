import { DRIVER_REGISTER_PATH } from "@shared/driverLanding";

const POST_AUTH_REDIRECT_KEY = "fui-post-auth-redirect";
const DRIVER_SIGNUP_INTENT_KEY = "fui-driver-signup-intent";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function setPostAuthRedirect(path: string): void {
  if (!canUseStorage() || !path.startsWith("/")) return;
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

export function peekPostAuthRedirect(): string | null {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
}

export function consumePostAuthRedirect(): string | null {
  if (!canUseStorage()) return null;
  const path = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  if (path) sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return path;
}

export function setDriverSignupIntent(): void {
  if (!canUseStorage()) return;
  localStorage.setItem(DRIVER_SIGNUP_INTENT_KEY, "1");
}

export function hasDriverSignupIntent(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(DRIVER_SIGNUP_INTENT_KEY) === "1";
}

export function clearDriverSignupIntent(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(DRIVER_SIGNUP_INTENT_KEY);
}

export function startDriverRegistrationFlow(
  navigate: (path: string) => void,
  path: string = DRIVER_REGISTER_PATH
): void {
  setDriverSignupIntent();
  navigate(path);
}
