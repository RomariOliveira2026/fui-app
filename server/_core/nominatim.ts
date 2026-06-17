import {
  buildGeocodingQueryVariants,
  DEFAULT_GEOCODING_CITY,
  extractBrazilianPostalCode,
  extractStreetNumber,
  fixCommonStreetNameArticles,
  formatAddressForGeocoding,
  scoreAddressLocality,
  SERGIPE_VIEWBOX,
} from "@shared/mapDefaults";
import {
  formatNominatimAddress,
  isCoarseNominatimAddress,
  type NominatimAddressParts,
} from "@shared/formatNominatimAddress";
import { lookupViaCep } from "./viacep";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "FuiApp/1.0 (passenger-route; contact@contentfy.com.br)";
const TIMEOUT_MS = 12_000;

export type NominatimGeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  placeId: string;
  /** Sem logradouro — centroide ou localização imprecisa. */
  isCoarse?: boolean;
};

type NominatimSearchRow = {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
  osm_type?: string;
  osm_id?: number;
};

function buildPlaceId(row: NominatimSearchRow): string {
  if (row.osm_type && row.osm_id != null) {
    return `osm:${row.osm_type}:${row.osm_id}`;
  }
  return `nominatim:${row.place_id}`;
}

function normalizeQuery(address: string, city?: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  if (city?.trim()) {
    return formatAddressForGeocoding(trimmed, city);
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("brasil") || lower.includes("brazil")) {
    return trimmed;
  }
  return `${trimmed}, Brasil`;
}

export type NominatimSearchOptions = {
  city?: string;
  useViewbox?: boolean;
};

async function fetchNominatimSearch(query: string): Promise<NominatimSearchRow[]> {
  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "1",
    countrycodes: "br",
    addressdetails: "0",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      console.warn("[nominatim] HTTP error:", response.status, query);
      return [];
    }

    const data = (await response.json()) as NominatimSearchRow[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[nominatim] search failed:", query, error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

type NominatimReverseRow = {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  address?: NominatimAddressParts;
};

function rowToReverseGeocodeResult(row: NominatimReverseRow): NominatimGeocodeResult | null {
  const lat = Number.parseFloat(row.lat);
  const lng = Number.parseFloat(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const formatted = formatNominatimAddress(row.address, row.display_name);
  const coarse = isCoarseNominatimAddress(row.address);

  return {
    lat,
    lng,
    displayName: formatted || row.display_name,
    placeId: buildPlaceId(row),
    isCoarse: coarse,
  };
}

function rowToGeocodeResult(row: NominatimSearchRow | NominatimReverseRow): NominatimGeocodeResult | null {
  const lat = Number.parseFloat(row.lat);
  const lng = Number.parseFloat(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    displayName: row.display_name,
    placeId: buildPlaceId(row),
  };
}

/** Busca múltiplos endereços (autocomplete sem Google Maps). */
export async function searchPlacesWithNominatim(
  address: string,
  limit = 5,
  options?: NominatimSearchOptions
): Promise<NominatimGeocodeResult[]> {
  const city = options?.city?.trim();
  const query = normalizeQuery(address, city);
  if (query.length < 2) return [];

  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: String(Math.min(Math.max(limit, 1), 10)),
    countrycodes: "br",
    addressdetails: "0",
  });

  if (options?.useViewbox) {
    const { west, south, east, north } = SERGIPE_VIEWBOX;
    params.set("viewbox", `${west},${north},${east},${south}`);
    params.set("bounded", "0");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as NominatimSearchRow[];
    if (!Array.isArray(data)) return [];

    return data
      .map((row) => rowToGeocodeResult(row))
      .filter((row): row is NominatimGeocodeResult => row !== null);
  } catch (error) {
    console.warn("[nominatim] search places failed:", query, error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Converte coordenadas em endereço legível via Nominatim (reverse geocode). */
export async function reverseGeocodeWithNominatim(
  lat: number,
  lng: number
): Promise<NominatimGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lng),
    zoom: "18",
    addressdetails: "1",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimReverseRow;
    const result = rowToReverseGeocodeResult(data);
    if (result) {
      console.info("[nominatim:reverse]", {
        lat,
        lng,
        displayName: result.displayName,
        isCoarse: result.isCoarse,
        raw: data.display_name,
      });
    }
    return result;
  } catch (error) {
    console.warn("[nominatim] reverse failed:", lat, lng, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Geocodifica texto de endereço/cidade via Nominatim (OpenStreetMap). */
function pickBestGeocodeResult(
  places: NominatimGeocodeResult[],
  city: string
): NominatimGeocodeResult | null {
  if (!places.length) return null;

  const ranked = [...places].sort(
    (a, b) => scoreAddressLocality(b.displayName, city) - scoreAddressLocality(a.displayName, city)
  );
  const best = ranked[0]!;
  if (scoreAddressLocality(best.displayName, city) < -40) return null;
  return best;
}

async function buildViaCepGeocodingQueries(address: string): Promise<string[]> {
  const cep = extractBrazilianPostalCode(address);
  if (!cep) return [];

  const via = await lookupViaCep(cep);
  if (!via?.localidade) return [];

  const number = extractStreetNumber(address);
  const street = fixCommonStreetNameArticles(via.logradouro);
  const queries: string[] = [];

  if (number) {
    queries.push(`${street}, ${number}, ${via.localidade}, Sergipe, Brasil`);
    queries.push(`${street}, ${number}, ${via.localidade}, ${via.uf}, Brasil`);
  }
  queries.push(`${street}, ${via.localidade}, Sergipe, Brasil`);

  return queries;
}

export async function geocodeAddressWithNominatim(
  address: string,
  city?: string
): Promise<NominatimGeocodeResult | null> {
  const geoCity = city?.trim() || DEFAULT_GEOCODING_CITY;
  const queries = [...buildGeocodingQueryVariants(address, geoCity)];

  const viaCepQueries = await buildViaCepGeocodingQueries(address);
  for (const q of viaCepQueries) {
    if (!queries.includes(q)) queries.push(q);
  }

  const uniqueQueries = Array.from(new Set(queries));

  for (let i = 0; i < uniqueQueries.length; i++) {
    if (i > 0) await sleepMs(1100);

    const places = await searchPlacesWithNominatim(uniqueQueries[i]!, 5, {
      city: geoCity,
      useViewbox: true,
    });
    const best = pickBestGeocodeResult(places, geoCity);
    if (best) return best;
  }

  return null;
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
