/** Frontend Google Maps credentials (Vite public env). */

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().trim().length > 0;
}

export function hasForgeMapsCredentials(): boolean {
  const baseUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL ?? "";
  const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY ?? "";
  return Boolean(baseUrl.trim() && apiKey.trim());
}

/** True when the JS Maps API can be loaded (direct key or Forge proxy). */
export function hasGoogleMapsJsSupport(): boolean {
  return hasGoogleMapsApiKey() || hasForgeMapsCredentials();
}

/** Client-side hint for REST/maps availability (same .env as server in dev). */
export function hasGoogleMapsRestSupport(): boolean {
  return hasGoogleMapsJsSupport();
}

/** Demo SVG map when no credentials are available (dev only). */
export function shouldUseDemoMapFallback(): boolean {
  if (hasGoogleMapsJsSupport()) return false;
  return import.meta.env.DEV;
}
