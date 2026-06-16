/** Centro geográfico aproximado do Brasil — fallback do mapa até o GPS do usuário. */
export const BRAZIL_MAP_CENTER = {
  lat: -14.235004,
  lng: -51.92528,
} as const;

export const BRAZIL_MAP_OVERVIEW_ZOOM = 4;
export const STREET_LEVEL_MAP_ZOOM = 15;

/** Anexa país à query de geocoding quando ausente. */
export function appendCountryToAddress(address: string, country = "Brasil"): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.includes("brasil") || lower.includes("brazil")) return trimmed;
  return `${trimmed}, ${country}`;
}

/**
 * Monta endereço para geocoding: texto do usuário + país.
 * Se `city` estiver definida (whitelabel), inclui a cidade sem restringir outras regiões.
 */
export function formatAddressForGeocoding(address: string, city?: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;

  const trimmedCity = city?.trim();
  if (trimmedCity) {
    const lower = trimmed.toLowerCase();
    if (lower.includes(trimmedCity.toLowerCase())) {
      return appendCountryToAddress(trimmed);
    }
    return `${trimmed}, ${trimmedCity}, Brasil`;
  }

  return appendCountryToAddress(trimmed);
}
