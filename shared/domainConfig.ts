import {
  buildCanonicalAppUrl,
  getCanonicalAppHostname,
  getConfiguredAppUrl,
  isVercelPreviewHostname,
} from "./appUrl";

export const DEFAULT_OWN_DOMAIN = "fuiapp.com.br";

export type DomainReadinessCheck = {
  id: string;
  label: string;
  ready: boolean;
  hint?: string;
};

export type DomainReadinessReport = {
  configuredUrl: string;
  canonicalHostname: string;
  targetOwnDomain: string;
  isOwnDomainActive: boolean;
  isPreviewHost: boolean;
  checks: DomainReadinessCheck[];
  readyForOwnDomain: boolean;
};

export function isOwnDomainHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return host === DEFAULT_OWN_DOMAIN || host === `www.${DEFAULT_OWN_DOMAIN}`;
}

/** Relatório de prontidão para migrar do preview Vercel para domínio próprio. */
export function buildDomainReadinessReport(options?: {
  envUrl?: string | null;
  currentHostname?: string | null;
  allowPreviewHost?: boolean;
  hasDatabase?: boolean;
  hasOAuth?: boolean;
  hasStripe?: boolean;
}): DomainReadinessReport {
  const configuredUrl = getConfiguredAppUrl(options?.envUrl);
  const canonicalHostname = getCanonicalAppHostname(options?.envUrl);
  const currentHostname = options?.currentHostname?.trim().toLowerCase() ?? "";
  const isOwnDomainActive = isOwnDomainHostname(canonicalHostname);
  const isPreviewHost =
    !!currentHostname &&
    isVercelPreviewHostname(currentHostname, options?.envUrl);

  const checks: DomainReadinessCheck[] = [
    {
      id: "app_url",
      label: "VITE_APP_URL aponta para domínio de produção",
      ready: isOwnDomainActive || canonicalHostname.endsWith(".vercel.app"),
      hint: isOwnDomainActive
        ? undefined
        : `Defina VITE_APP_URL=https://${DEFAULT_OWN_DOMAIN} antes do go-live`,
    },
    {
      id: "canonical_redirect",
      label: "Redirect de previews Vercel para URL canônica",
      ready: options?.allowPreviewHost !== true,
      hint: "Mantenha VITE_ALLOW_PREVIEW_HOST desligado em produção",
    },
    {
      id: "oauth_callback",
      label: "OAuth callback registrado no domínio final",
      ready: !!options?.hasOAuth,
      hint: "Cadastre https://SEU-DOMINIO/api/oauth/callback no portal OAuth",
    },
    {
      id: "database",
      label: "MySQL operacional em produção",
      ready: !!options?.hasDatabase,
      hint: "Configure DATABASE_URL e rode migrations antes do domínio próprio",
    },
    {
      id: "payments",
      label: "Stripe / pagamentos (opcional)",
      ready: options?.hasStripe !== false,
      hint: "Recomendado para monetização completa pós-domínio",
    },
  ];

  const readyForOwnDomain =
    isOwnDomainActive &&
    checks.filter((c) => c.id !== "payments").every((c) => c.ready);

  return {
    configuredUrl,
    canonicalHostname,
    targetOwnDomain: DEFAULT_OWN_DOMAIN,
    isOwnDomainActive,
    isPreviewHost,
    checks,
    readyForOwnDomain,
  };
}

export function buildShareUrl(pathname: string, envUrl?: string | null): string {
  return buildCanonicalAppUrl(pathname, "", "", envUrl);
}
