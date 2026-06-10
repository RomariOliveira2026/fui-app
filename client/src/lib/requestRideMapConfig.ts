/** Provedor de mapa usado em /request-ride. */
export type RequestRideMapProvider = "leaflet" | "google";

/**
 * Escolhe Leaflet (OSM, demo local) ou Google Maps.
 * Defina no .env: VITE_REQUEST_RIDE_MAP_PROVIDER=google | leaflet
 * Padrão: leaflet (sem chave/billing Google).
 */
export function getRequestRideMapProvider(): RequestRideMapProvider {
  const value = (import.meta.env.VITE_REQUEST_RIDE_MAP_PROVIDER as string | undefined)
    ?.trim()
    .toLowerCase();

  if (value === "google") return "google";
  return "leaflet";
}
