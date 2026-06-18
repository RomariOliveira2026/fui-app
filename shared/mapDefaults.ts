/** Centro geográfico aproximado do Brasil — fallback do mapa até o GPS do usuário. */
export const BRAZIL_MAP_CENTER = {
  lat: -14.235004,
  lng: -51.92528,
} as const;

/** Centro operacional padrão (Itabaiana/SE) — viés de autocomplete quando não há GPS. */
export const DEFAULT_OPERATION_CENTER = {
  lat: -10.685,
  lng: -37.425,
} as const;

/**
 * Cidade padrão legada (operação local Sergipe).
 * Em modo nacional (sem VITE_APP_CITY) o geocoding não usa este fallback.
 */
export const DEFAULT_GEOCODING_CITY = "Itabaiana";

export { resolveGeocodingScope, resolveHintCity, type GeocodingScope } from "./geocodingScope";

/** Distância em metros até o centro operacional padrão. */
export function distanceToOperationalCenterMeters(lat: number, lng: number): number {
  const dLat = (lat - DEFAULT_OPERATION_CENTER.lat) * 111_320;
  const dLng =
    (lng - DEFAULT_OPERATION_CENTER.lng) *
    111_320 *
    Math.cos((DEFAULT_OPERATION_CENTER.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

export function isNearOperationalCenter(
  lat: number,
  lng: number,
  radiusMeters = 450
): boolean {
  return distanceToOperationalCenterMeters(lat, lng) <= radiusMeters;
}

/** Viewbox aproximado de Sergipe para viés regional no Nominatim. */
export const SERGIPE_VIEWBOX = {
  west: -38.0,
  south: -11.2,
  east: -36.8,
  north: -9.8,
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

import {
  buildGeocodingQueryVariants,
  extractCityFromAddress,
  extractStreetNumber,
  fixCommonSergipeStreetTypos,
  formatAddressForGeocoding,
  normalizeBrazilianAddressText,
  scoreAddressLocality,
  stripNeighborhoodBeforeCity,
} from "./addressGeocoding";

export {
  buildGeocodingQueryVariants,
  extractCityFromAddress,
  extractStreetNumber,
  fixCommonSergipeStreetTypos,
  formatAddressForGeocoding,
  normalizeBrazilianAddressText,
  scoreAddressLocality,
  stripNeighborhoodBeforeCity,
};

export function rankByLocality<
  T extends {
    description: string;
    structured_formatting?: { secondary_text?: string };
  },
>(items: T[], city?: string): T[] {
  return [...items].sort((a, b) => {
    const textA = `${a.description} ${a.structured_formatting?.secondary_text ?? ""}`;
    const textB = `${b.description} ${b.structured_formatting?.secondary_text ?? ""}`;
    return scoreAddressLocality(textB, city) - scoreAddressLocality(textA, city);
  });
}

/** Extrai CEP brasileiro (8 dígitos) de um texto de endereço. */
export function extractBrazilianPostalCode(text: string): string | null {
  const match = text.match(/\b(\d{5})[-.\s]?(\d{3})\b/);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
}

/** @deprecated Use fixCommonSergipeStreetTypos from addressGeocoding */
export function fixCommonStreetNameArticles(address: string): string {
  return fixCommonSergipeStreetTypos(address);
}
