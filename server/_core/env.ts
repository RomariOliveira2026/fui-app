export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Server-side Google Maps REST (prefer GOOGLE_MAPS_API_KEY; VITE_ for local dev parity). */
  googleMapsApiKey:
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  // White-label configuration
  appName: process.env.VITE_APP_TITLE ?? "Fui!",
  appCity: process.env.VITE_APP_CITY ?? "Itabaiana",
  platformFeePercent: Number(process.env.VITE_PLATFORM_FEE_PERCENT ?? "15"),
  supportWhatsApp: process.env.VITE_SUPPORT_WHATSAPP ?? "",
};
