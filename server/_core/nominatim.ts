const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "FuiApp/1.0 (passenger-route; contact@contentfy.com.br)";
const TIMEOUT_MS = 12_000;

export type NominatimGeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  placeId: string;
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

function normalizeQuery(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.includes("brasil") || lower.includes("brazil")) {
    return trimmed;
  }
  return `${trimmed}, Brasil`;
}

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
};

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
  limit = 5
): Promise<NominatimGeocodeResult[]> {
  const query = normalizeQuery(address);
  if (query.length < 2) return [];

  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: String(Math.min(Math.max(limit, 1), 8)),
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
    addressdetails: "0",
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
    return rowToGeocodeResult(data);
  } catch (error) {
    console.warn("[nominatim] reverse failed:", lat, lng, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Geocodifica texto de endereço/cidade via Nominatim (OpenStreetMap). */
export async function geocodeAddressWithNominatim(
  address: string
): Promise<NominatimGeocodeResult | null> {
  const query = normalizeQuery(address);
  if (query.length < 2) return null;

  const rows = await fetchNominatimSearch(query);
  const first = rows[0];
  if (!first) return null;

  return rowToGeocodeResult(first);
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
