/** URL pública do app em produção (Vercel ou domínio customizado). */
export const DEFAULT_PRODUCTION_APP_URL = "https://fui-app.vercel.app";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeAppUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_PRODUCTION_APP_URL;
  return trimmed.replace(/\/+$/, "");
}

/** URL configurada via VITE_APP_URL ou padrão Vercel de produção. */
export function getConfiguredAppUrl(envUrl?: string | null): string {
  const fromEnv = envUrl?.trim();
  return normalizeAppUrl(fromEnv || DEFAULT_PRODUCTION_APP_URL);
}

export function getAppOrigin(envUrl?: string | null): string {
  return getConfiguredAppUrl(envUrl);
}

export function getCanonicalAppHostname(envUrl?: string | null): string {
  return new URL(getConfiguredAppUrl(envUrl)).hostname;
}

/** Preview da Vercel (hash-*.vercel.app), exceto o host de produção. */
export function isVercelPreviewHostname(hostname: string, envUrl?: string | null): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host || LOCAL_HOSTS.has(host)) return false;
  if (host === getCanonicalAppHostname(envUrl).toLowerCase()) return false;
  if (host === "fuiapp.com.br" || host === "www.fuiapp.com.br") return false;
  return host.endsWith(".vercel.app");
}

export function buildCanonicalAppUrl(
  pathname: string,
  search = "",
  hash = "",
  envUrl?: string | null
): string {
  const base = getConfiguredAppUrl(envUrl);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}${search}${hash}`;
}
