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

/** Cidade padrão para geocoding quando o whitelabel não define VITE_APP_CITY. */
export const DEFAULT_GEOCODING_CITY = "Itabaiana";

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

/** Extrai CEP brasileiro (8 dígitos) de um texto de endereço. */
export function extractBrazilianPostalCode(text: string): string | null {
  const match = text.match(/\b(\d{5})[-.\s]?(\d{3})\b/);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
}

/** Extrai número do imóvel quando presente após logradouro. */
export function extractStreetNumber(text: string): string | null {
  const match = text.match(/,\s*(\d{1,6})\s*(?:-|,|$)/);
  return match?.[1] ?? null;
}

/** Normaliza texto de endereço brasileiro antes do geocoding. */
export function normalizeBrazilianAddressText(address: string): string {
  let s = address.trim();
  s = s.replace(/\bItabaiana\s*\/\s*SE\b/gi, "Itabaiana, Sergipe");
  s = s.replace(/\b([A-Za-zÀ-ú][A-Za-zÀ-ú\s]*?)\s*\/\s*SE\b/gi, "$1, Sergipe");
  s = s.replace(/\bAv\.?\s+/gi, "Avenida ");
  s = s.replace(/\bR\.?\s+/gi, "Rua ");
  // "800 - Queimada," → "800," (bairro após hífen quebra o Nominatim)
  s = s.replace(/,\s*(\d{1,6})\s*-\s*[^,]+,/gi, ", $1,");
  return s.replace(/\s+/g, " ").replace(/,\s*,/g, ",").trim();
}

/** Corrige artigos omitidos em logradouros conhecidos no OSM local. */
export function fixCommonStreetNameArticles(address: string): string {
  return address.replace(/\bEduardo\s+Paixão\s+Rocha\b/gi, "Eduardo da Paixão Rocha");
}

/** Remove segmento de bairro imediatamente antes da cidade na lista separada por vírgulas. */
export function stripNeighborhoodBeforeCity(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return address;

  const cityIdx = parts.findIndex((p) => /\bitabaiana\b/i.test(p));
  if (cityIdx > 1) {
    const beforeCity = parts[cityIdx - 1]!;
    if (!/^\d{1,6}$/.test(beforeCity) && !/\bsergipe\b/i.test(beforeCity)) {
      const next = [...parts];
      next.splice(cityIdx - 1, 1);
      return next.join(", ");
    }
  }
  return address;
}

/**
 * Gera variantes de busca para geocoding — ordem importa (mais provável primeiro).
 */
export function buildGeocodingQueryVariants(address: string, city?: string): string[] {
  const geoCity = city?.trim() || DEFAULT_GEOCODING_CITY;
  const normalized = normalizeBrazilianAddressText(address);
  const variants: string[] = [];

  const push = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    variants.push(trimmed);
    variants.push(formatAddressForGeocoding(trimmed, geoCity));
    variants.push(appendCountryToAddress(trimmed));
  };

  push(normalized);
  push(fixCommonStreetNameArticles(normalized));
  push(stripNeighborhoodBeforeCity(normalized));
  push(fixCommonStreetNameArticles(stripNeighborhoodBeforeCity(normalized)));

  const parts = normalized.split(",").map((p) => p.trim()).filter(Boolean);
  const number = extractStreetNumber(normalized);
  const street = parts[0];
  if (street && number) {
    push(`${fixCommonStreetNameArticles(street)}, ${number}, ${geoCity}, Sergipe`);
    push(`${fixCommonStreetNameArticles(street)}, ${number}, ${geoCity}`);
  }

  return Array.from(new Set(variants));
}
