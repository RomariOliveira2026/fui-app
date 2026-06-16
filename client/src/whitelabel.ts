/**
 * White-label configuration
 * All values come from environment variables so each city/client
 * can have its own branding without changing any source code.
 *
 * To customize for a new city, just change the env vars in Settings → Secrets:
 *   VITE_APP_TITLE       → App name shown to users (e.g. "VaiAí", "MotoJá")
 *   VITE_APP_CITY        → City of operation (e.g. "Lagarto", "Estância")
 *   VITE_PRIMARY_COLOR   → Brand color in hex (e.g. "#2563EB" for blue)
 *   VITE_APP_LOGO        → URL to the logo image
 *   VITE_APP_ICON        → URL to the app icon/symbol (map marker)
 *   VITE_PLATFORM_FEE_PERCENT → Platform commission % (e.g. "15")
 *   VITE_SUPPORT_WHATSAPP    → Support WhatsApp number with area code
 */

export const FUI_DEFAULT_LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663097022226/kzfSj4x7eR8vE8AeXUkeWP/fui-logo-white-v3_0ddd2b89.png";

/** Ícone/símbolo da marca (sem texto) — usado no marcador do motorista no mapa. */
export const FUI_DEFAULT_ICON_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663097022226/kzfSj4x7eR8vE8AeXUkeWP/fui-icon-192-v4_389b0447.png";

export function getAppIconUrl(): string {
  return (import.meta.env.VITE_APP_ICON as string | undefined)?.trim() || FUI_DEFAULT_ICON_URL;
}

export const WL = {
  appName: import.meta.env.VITE_APP_TITLE || "Fui!",
  /** Cidade de branding (opcional). Vazio = app nacional, sem amarrar geocoding. */
  city: (import.meta.env.VITE_APP_CITY as string | undefined)?.trim() || "",
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "#D97706",
  logoUrl: (import.meta.env.VITE_APP_LOGO as string | undefined)?.trim() || FUI_DEFAULT_LOGO_URL,
  iconUrl: getAppIconUrl(),
  platformFeePercent: Number(import.meta.env.VITE_PLATFORM_FEE_PERCENT || "15"),
  supportWhatsApp: import.meta.env.VITE_SUPPORT_WHATSAPP || "",

  // Derived helpers
  get pageTitle() {
    return this.city
      ? `${this.appName} - Transporte e Mobilidade Urbana em ${this.city}`
      : `${this.appName} - Transporte e Mobilidade Urbana`;
  },
  get supportWhatsAppUrl() {
    if (!this.supportWhatsApp) return null;
    return `https://wa.me/55${this.supportWhatsApp.replace(/\D/g, "")}`;
  },
};
