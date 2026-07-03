import {
  buildCanonicalAppUrl,
  isVercelPreviewHostname,
} from "@shared/appUrl";

/**
 * Redireciona previews da Vercel para a URL de produção.
 * Evita testar deploys antigos/protegidos (ex.: *-projects.vercel.app).
 */
export function ensureCanonicalHost(): void {
  if (!import.meta.env.PROD) return;
  if (import.meta.env.VITE_ALLOW_PREVIEW_HOST === "true") return;

  const { hostname, pathname, search, hash } = window.location;
  if (!isVercelPreviewHostname(hostname, import.meta.env.VITE_APP_URL)) return;

  window.location.replace(
    buildCanonicalAppUrl(pathname, search, hash, import.meta.env.VITE_APP_URL)
  );
}
