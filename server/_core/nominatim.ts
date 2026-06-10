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

/** Geocodifica texto de endereço/cidade via Nominatim (OpenStreetMap). */
export async function geocodeAddressWithNominatim(
  address: string
): Promise<NominatimGeocodeResult | null> {
  const query = normalizeQuery(address);
  if (query.length < 2) return null;

  const rows = await fetchNominatimSearch(query);
  const first = rows[0];
  if (!first) return null;

  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    displayName: first.display_name,
    placeId: buildPlaceId(first),
  };
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
