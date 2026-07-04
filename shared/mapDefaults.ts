/** Centro geográfico aproximado do Brasil — fallback do mapa até o GPS do usuário. */
import { getGeocodingCityForApp, getOperationCenterForApp } from "./sergipeOperatingCities";

export const BRAZIL_MAP_CENTER = {
  lat: -14.235004,
  lng: -51.92528,
} as const;


function resolveBuildTimeAppCity(): string | undefined {
  if (typeof process !== "undefined" && process.env.VITE_APP_CITY?.trim()) {
    return process.env.VITE_APP_CITY.trim();
  }
  try {
    const viteCity = (import.meta as ImportMeta & { env?: { VITE_APP_CITY?: string } })
      .env?.VITE_APP_CITY;
    return viteCity?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Centro operacional para viés de mapa/autocomplete. */
export function getDefaultOperationCenter(appCity?: string | null): { lat: number; lng: number } {
  return getOperationCenterForApp(appCity ?? resolveBuildTimeAppCity());
}

/** Centro operacional padrão (build-time ou Itabaiana). */
export const DEFAULT_OPERATION_CENTER = getDefaultOperationCenter();

/**
 * Cidade padrão legada (operação local Sergipe).
 * Em modo nacional (sem VITE_APP_CITY) o geocoding não usa este fallback.
 */
export const DEFAULT_GEOCODING_CITY = getGeocodingCityForApp();

export { resolveGeocodingScope, resolveHintCity, type GeocodingScope } from "./geocodingScope";

/** Distância em metros até o centro operacional padrão. */
export function distanceToOperationalCenterMeters(
  lat: number,
  lng: number,
  center = DEFAULT_OPERATION_CENTER
): number {
  const dLat = (lat - center.lat) * 111_320;
  const dLng =
    (lng - center.lng) * 111_320 * Math.cos((center.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

export function isNearOperationalCenter(
  lat: number,
  lng: number,
  radiusMeters = 450,
  center = DEFAULT_OPERATION_CENTER
): boolean {
  return distanceToOperationalCenterMeters(lat, lng, center) <= radiusMeters;
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
