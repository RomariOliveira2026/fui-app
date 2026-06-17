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

/** Pontuação de relevância local para ordenar sugestões de endereço. */
export function scoreAddressLocality(text: string, city?: string): number {
  const lower = text.toLowerCase();
  const cityLower = city?.trim().toLowerCase();
  let score = 0;

  if (cityLower && lower.includes(cityLower)) score += 120;
  if (lower.includes("itabaiana")) score += 100;
  if (lower.includes("sergipe") || lower.includes(" - se")) score += 60;

  const distantMarkers = [
    "são paulo",
    "sao paulo",
    " - sp",
    "rio de janeiro",
    " - rj",
    "minas gerais",
    " - mg",
    "bahia",
    " - ba",
    "pernambuco",
    " - pe",
    "ceará",
    " - ce",
    "paraná",
    " - pr",
  ];
  for (const marker of distantMarkers) {
    if (lower.includes(marker)) score -= 70;
  }

  return score;
}

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
