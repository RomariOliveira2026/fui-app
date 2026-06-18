const DEFAULT_GEOCODING_CITY = "Itabaiana";

function appendCountryToAddress(address: string, country = "Brasil"): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.includes("brasil") || lower.includes("brazil")) return trimmed;
  return `${trimmed}, ${country}`;
}

export const SERGIPE_CITIES = [
  "Aracaju",
  "Itabaiana",
  "Estância",
  "Lagarto",
  "Propriá",
  "Nossa Senhora do Socorro",
  "São Cristóvão",
  "Barra dos Coqueiros",
  "Laranjeiras",
  "Simão Dias",
  "Tobias Barreto",
  "Capela",
  "Boquim",
  "Glória",
  "Porto da Folha",
] as const;

export type BrazilianAddressComponents = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

/** Remove acentos para variantes de busca. */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Corrige grafias comuns divergentes do OSM local. */
export function fixCommonSergipeStreetTypos(address: string): string {
  return address
    .replace(/\bMacah\b/gi, "Machado")
    .replace(/\bPaulo\s+Henrique\s+Macah\s+Pimentel\b/gi, "Paulo Henrique Machado Pimentel")
    .replace(/\bEduardo\s+Paixão\s+Rocha\b/gi, "Eduardo da Paixão Rocha");
}

/** Normaliza UF, cidade e separadores antes do geocoding. */
export function normalizeBrazilianAddressText(address: string): string {
  let s = address.trim();
  s = fixCommonSergipeStreetTypos(s);
  s = s.replace(/\bAv\.?\s+/gi, "Avenida ");
  s = s.replace(/\bR\.?\s+/gi, "Rua ");

  for (const city of SERGIPE_CITIES) {
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`\\b${escaped}\\s*\\/\\s*SE\\b`, "gi"), `${city}, Sergipe`);
    s = s.replace(new RegExp(`\\b${escaped}\\s*-\\s*SE\\b`, "gi"), `${city}, Sergipe`);
  }

  s = s.replace(/\b([A-Za-zÀ-ú][A-Za-zÀ-ú\s]*?)\s*\/\s*SE\b/gi, "$1, Sergipe");

  s = s.replace(/,\s*(\d{1,6})\s*-\s*/g, ", $1, ");
  s = s.replace(/\s+-\s+(?=[A-Za-zÀ-ú])/g, ", ");

  return s.replace(/\s+/g, " ").replace(/,\s*,/g, ",").trim();
}

/** Extrai cidade do texto (Aracaju/SE, Aracaju, Sergipe, etc.). */
export function extractCityFromAddress(address: string): string | null {
  const normalized = normalizeBrazilianAddressText(address);
  const lower = stripAccents(normalized).toLowerCase();

  for (const city of SERGIPE_CITIES) {
    if (lower.includes(stripAccents(city).toLowerCase())) {
      return city;
    }
  }

  const match = normalized.match(
    /\b([A-Za-zÀ-ú][A-Za-zÀ-ú\s]{2,40}?)\s*,\s*(?:Sergipe|SE)\b/i
  );
  return match?.[1]?.trim() ?? null;
}

export function extractStreetNumber(text: string): string | null {
  const commaMatch = text.match(/,\s*(\d{1,6})\s*(?:,|$)/);
  if (commaMatch) return commaMatch[1] ?? null;
  const hyphenMatch = text.match(/\b(\d{1,6})\s*,/);
  return hyphenMatch?.[1] ?? null;
}

/** Decompõe endereço brasileiro em componentes para variantes de busca. */
export function parseBrazilianAddressComponents(address: string): BrazilianAddressComponents {
  const normalized = normalizeBrazilianAddressText(address);
  const city = extractCityFromAddress(normalized) ?? undefined;
  const state = /\b(sergipe|\/se\b|, se\b)/i.test(normalized) ? "Sergipe" : undefined;

  let working = normalized;
  if (city) {
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    working = working
      .replace(new RegExp(`\\b${escaped}\\s*,\\s*Sergipe\\b`, "i"), "")
      .replace(new RegExp(`\\b${escaped}\\b`, "i"), "")
      .trim();
    working = working.replace(/,\s*Sergipe\b/gi, "").replace(/,\s*SE\b/gi, "").trim();
  }

  const parts = working
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const street = parts[0];
  const number = extractStreetNumber(normalized) ?? undefined;
  const neighborhood =
    parts.length > 1
      ? parts.slice(1).find((p) => !/^\d{1,6}$/.test(p) && p.length > 2)
      : undefined;

  return { street, number, neighborhood, city, state };
}

/**
 * Monta endereço para geocoding sem forçar cidade operacional quando o texto já tem outra cidade.
 */
export function formatAddressForGeocoding(address: string, defaultCity?: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;

  const extractedCity = extractCityFromAddress(trimmed);
  if (extractedCity) {
    return appendCountryToAddress(trimmed);
  }

  const defaultCityTrimmed = defaultCity?.trim();
  if (defaultCityTrimmed) {
    const lower = trimmed.toLowerCase();
    if (lower.includes(defaultCityTrimmed.toLowerCase())) {
      return appendCountryToAddress(trimmed);
    }
    return `${trimmed}, ${defaultCityTrimmed}, Brasil`;
  }

  return appendCountryToAddress(trimmed);
}

/** Pontuação de relevância — favorece cidade mencionada no endereço original. */
export function scoreAddressLocality(
  text: string,
  hintCity?: string,
  originalAddress?: string
): number {
  const lower = text.toLowerCase();
  const hintLower = hintCity?.trim().toLowerCase();
  let score = 0;

  if (hintLower && lower.includes(hintLower)) score += 120;

  const originalCity = originalAddress ? extractCityFromAddress(originalAddress) : null;
  if (originalCity) {
    const oc = stripAccents(originalCity).toLowerCase();
    if (lower.includes(oc)) score += 150;
    else if (!lower.includes("sergipe") && !lower.includes(" - se")) score -= 90;
  }

  for (const city of SERGIPE_CITIES) {
    if (lower.includes(city.toLowerCase())) score += 70;
  }

  if (lower.includes("itabaiana")) score += 40;
  if (lower.includes("aracaju")) score += 40;
  if (lower.includes("sergipe") || lower.includes(" - se")) score += 50;

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
  ];
  for (const marker of distantMarkers) {
    if (lower.includes(marker)) score -= 80;
  }

  return score;
}

/** Remove bairro imediatamente antes da cidade (variante de busca). */
export function stripNeighborhoodBeforeCity(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return address;

  const cityIdx = parts.findIndex((p) =>
    SERGIPE_CITIES.some((c) => p.toLowerCase().includes(c.toLowerCase()))
  );
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
 * Gera variantes progressivas de busca — da mais específica à mais ampla.
 */
export function buildGeocodingQueryVariants(address: string, defaultCity?: string): string[] {
  const operationalCity = defaultCity?.trim() || undefined;
  const normalized = normalizeBrazilianAddressText(address);
  const fixed = fixCommonSergipeStreetTypos(normalized);
  const components = parseBrazilianAddressComponents(fixed);
  const targetCity = components.city ?? operationalCity;
  const state = components.state ?? (operationalCity ? "Sergipe" : undefined);
  const variants: string[] = [];

  const push = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    variants.push(trimmed);
    variants.push(appendCountryToAddress(trimmed));
    const ascii = stripAccents(trimmed);
    if (ascii !== trimmed) {
      variants.push(appendCountryToAddress(ascii));
    }
  };

  push(fixed);
  push(formatAddressForGeocoding(fixed, operationalCity));

  if (targetCity) {
    const stateSuffix = state ? `, ${state}` : ", Brasil";
    if (components.street && components.number && components.neighborhood) {
      push(
        `${components.street}, ${components.number}, ${components.neighborhood}, ${targetCity}${stateSuffix}`
      );
    }
    if (components.street && components.number) {
      push(`${components.street}, ${components.number}, ${targetCity}${stateSuffix}`);
      push(`${components.street}, ${components.number}, ${targetCity}`);
    }
    if (components.street && components.neighborhood) {
      push(`${components.street}, ${components.neighborhood}, ${targetCity}${stateSuffix}`);
    }
    if (components.street) {
      push(`${components.street}, ${targetCity}${stateSuffix}`);
      push(`${components.street}, ${targetCity}`);
    }
    if (components.neighborhood) {
      push(`${components.neighborhood}, ${targetCity}${stateSuffix}`);
    }

    if (operationalCity && targetCity !== operationalCity) {
      push(`${fixed}, ${targetCity}${stateSuffix}`);
    }
  }

  push(stripNeighborhoodBeforeCity(fixed));
  push(fixCommonSergipeStreetTypos(stripNeighborhoodBeforeCity(fixed)));

  return Array.from(new Set(variants));
}
