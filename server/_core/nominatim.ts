import {
  buildGeocodingQueryVariants,
  extractBrazilianPostalCode,
  extractCityFromAddress,
  extractStreetNumber,
  fixCommonSergipeStreetTypos,
  formatAddressForGeocoding,
  normalizeBrazilianAddressText,
  resolveGeocodingScope,
  resolveHintCity,
  scoreAddressLocality,
  SERGIPE_VIEWBOX,
} from "@shared/mapDefaults";
import { stripAccents } from "@shared/addressGeocoding";
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
  originalAddress: string,
  defaultCity: string
): NominatimGeocodeResult | null {
  if (!places.length) return null;

  const hintCity = extractCityFromAddress(originalAddress) ?? (defaultCity || undefined);
  const ranked = [...places].sort(
    (a, b) =>
      scoreAddressLocality(b.displayName, hintCity, originalAddress) -
      scoreAddressLocality(a.displayName, hintCity, originalAddress)
  );
  const best = ranked[0]!;
  const bestScore = scoreAddressLocality(best.displayName, hintCity, originalAddress);

  if (!hintCity && places.length > 0) {
    const inBrazil = ranked.find((p) => {
      const l = p.displayName.toLowerCase();
      return l.includes("brasil") || l.includes("brazil");
    });
    return inBrazil ?? best;
  }

  if (bestScore >= -40) return best;

  const lower = best.displayName.toLowerCase();
  const originalCity = extractCityFromAddress(originalAddress);
  const inSergipe =
    lower.includes("sergipe") ||
    lower.includes("aracaju") ||
    lower.includes("itabaiana") ||
    lower.includes("itaporanga") ||
    lower.includes("estancia") ||
    lower.includes("estância") ||
    lower.includes("lagarto") ||
    lower.includes("socorro");

  if (originalCity && inSergipe) {
    const cityNorm = stripAccents(originalCity).toLowerCase();
    if (lower.includes(cityNorm)) return best;
  }

  // Destino intermunicipal: aceita melhor resultado em Sergipe se o texto cita a cidade.
  if (originalCity) {
    const cityNorm = stripAccents(originalCity).toLowerCase();
    const inCity = ranked.find((p) =>
      stripAccents(p.displayName).toLowerCase().includes(cityNorm)
    );
    if (inCity) return inCity;
  }

  if (inSergipe && !originalCity) return best;

  // Último recurso: qualquer resultado dentro do viewbox de Sergipe.
  if (places.length > 0 && originalCity) return best;

  return null;
}

const OSM_TYPE_PREFIX: Record<string, string> = {
  node: "N",
  way: "W",
  relation: "R",
};

function parseOsmPlaceIdParam(placeId: string): string | null {
  const match = placeId.match(/^osm:(node|way|relation):(\d+)$/i);
  if (!match) return null;
  const prefix = OSM_TYPE_PREFIX[match[1]!.toLowerCase()];
  if (!prefix) return null;
  return `${prefix}${match[2]}`;
}

/** Resolve placeId OSM/Nominatim diretamente (autocomplete → rota). */
export async function lookupPlaceIdWithNominatim(
  placeId: string
): Promise<NominatimGeocodeResult | null> {
  const trimmed = placeId.trim();
  if (!trimmed) return null;

  let lookupParam: { key: "osm_ids" | "place_ids"; value: string } | null = null;

  const osmIds = parseOsmPlaceIdParam(trimmed);
  if (osmIds) {
    lookupParam = { key: "osm_ids", value: osmIds };
  } else if (trimmed.startsWith("nominatim:")) {
    const id = trimmed.slice("nominatim:".length).trim();
    if (/^\d+$/.test(id)) {
      lookupParam = { key: "place_ids", value: id };
    }
  }

  if (!lookupParam) return null;

  const params = new URLSearchParams({
    format: "json",
    [lookupParam.key]: lookupParam.value,
    addressdetails: "0",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_BASE}/lookup?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimSearchRow[];
    if (!Array.isArray(data) || data.length === 0) return null;

    return rowToGeocodeResult(data[0]!);
  } catch (error) {
    console.warn("[nominatim] lookup place_id failed:", trimmed, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function buildViaCepGeocodingQueries(address: string): Promise<string[]> {
  const cep = extractBrazilianPostalCode(address);
  if (!cep) return [];

  const via = await lookupViaCep(cep);
  if (!via?.localidade) return [];

  const number = extractStreetNumber(address);
  const street = fixCommonSergipeStreetTypos(via.logradouro);
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
  const scope = resolveGeocodingScope(city);
  const operationalCity = scope.operationalCity;
  const hintCity = resolveHintCity(address, scope) ?? extractCityFromAddress(address) ?? undefined;
  const normalized = normalizeBrazilianAddressText(address);
  const primaryQuery = formatAddressForGeocoding(normalized, operationalCity);

  const primaryPlaces = await searchPlacesWithNominatim(primaryQuery, 8, {
    city: hintCity,
    useViewbox: scope.useRegionalViewbox,
  });
  const primaryBest = pickBestGeocodeResult(
    primaryPlaces,
    address,
    operationalCity ?? ""
  );
  if (primaryBest) {
    console.info("[geocode:nominatim] ok", {
      original: address,
      query: primaryQuery,
      hintCity,
      result: primaryBest.displayName,
      lat: primaryBest.lat,
      lng: primaryBest.lng,
    });
    return primaryBest;
  }

  const queries = [...buildGeocodingQueryVariants(address, operationalCity)];
  const viaCepQueries = await buildViaCepGeocodingQueries(address);
  for (const q of viaCepQueries) {
    if (!queries.includes(q)) queries.push(q);
  }

  const uniqueQueries = Array.from(new Set(queries)).filter((q) => q !== primaryQuery);
  const maxExtraAttempts = 5;

  for (let i = 0; i < Math.min(maxExtraAttempts, uniqueQueries.length); i++) {
    if (i > 0) await sleepMs(400);

    const query = uniqueQueries[i]!;
    const places = await searchPlacesWithNominatim(query, 5, {
      city: hintCity,
      useViewbox: scope.useRegionalViewbox,
    });
    const best = pickBestGeocodeResult(places, address, operationalCity ?? "");

    if (best) {
      console.info("[geocode:nominatim] ok", {
        original: address,
        query,
        hintCity,
        result: best.displayName,
        lat: best.lat,
        lng: best.lng,
      });
      return best;
    }

    console.info("[geocode:nominatim] miss", {
      original: address,
      query,
      hintCity,
      results: places.length,
      top: places[0]?.displayName ?? null,
    });
  }

  console.warn("[geocode:nominatim] failed", {
    original: address,
    normalized: formatAddressForGeocoding(address, operationalCity),
    queriesTried: 1 + Math.min(maxExtraAttempts, uniqueQueries.length),
    hintCity,
    nationalScope: scope.isNationalScope,
    provider: "nominatim",
  });

  return null;
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
