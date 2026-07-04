/** Endereços conhecidos de Sergipe — fallback quando Nominatim não resolve. */

import { stripAccents } from "./addressGeocoding";
import { resolveCitySlugFromAddress, type SergipeCitySlug } from "./sergipeOperatingCities";

export type SergipeKnownPlace = {
  /** Substrings para match (minúsculas, sem acento). */
  matchTerms: string[];
  lat: number;
  lng: number;
  displayName: string;
  placeId: string;
};

export const SERGIPE_KNOWN_PLACES: SergipeKnownPlace[] = [
  {
    matchTerms: [
      "paulo henrique machado pimentel",
      "paulo henrique macah pimentel",
      "paulo henrique machado pimentel, 170",
      "inacio barbosa",
      "170 inacio barbosa aracaju",
    ],
    lat: -10.9522564,
    lng: -37.0731675,
    displayName:
      "Rua Paulo Henrique Machado Pimentel, 170 - Inácio Barbosa, Aracaju/SE",
    placeId: "sergipe:aracaju:paulo-henrique-machado-pimentel-170",
  },
  {
    matchTerms: [
      "assembleia legislativa de sergipe",
      "assembleia legislativa sergipe",
      "assembléia legislativa de sergipe",
      "assembléia legislativa sergipe",
      "ales aracaju",
      "ales sergipe",
    ],
    lat: -10.946654,
    lng: -37.072935,
    displayName: "Assembleia Legislativa de Sergipe, Aracaju/SE",
    placeId: "sergipe:aracaju:assembleia-legislativa",
  },
  {
    matchTerms: [
      "shopping jardins",
      "shopping jardins aracaju",
      "shopping center jardins",
    ],
    lat: -10.90089,
    lng: -37.07189,
    displayName: "Shopping Jardins, Aracaju/SE",
    placeId: "sergipe:aracaju:shopping-jardins",
  },
  {
    matchTerms: [
      "shopping riomar aracaju",
      "riomar aracaju",
      "shopping riomar",
    ],
    lat: -10.90028,
    lng: -37.05192,
    displayName: "Shopping Riomar, Aracaju/SE",
    placeId: "sergipe:aracaju:shopping-riomar",
  },
  {
    matchTerms: [
      "shopping premium aracaju",
      "premium aracaju",
      "shopping premium",
    ],
    lat: -10.9095,
    lng: -37.0678,
    displayName: "Shopping Premium, Aracaju/SE",
    placeId: "sergipe:aracaju:shopping-premium",
  },
  {
    matchTerms: [
      "shopping praca aracaju",
      "shopping praça aracaju",
      "praca por do sol",
      "praça por do sol",
    ],
    lat: -10.925,
    lng: -37.048,
    displayName: "Shopping da Praça, Aracaju/SE",
    placeId: "sergipe:aracaju:shopping-praca",
  },
  {
    matchTerms: [
      "aeroporto de aracaju",
      "aeroporto aracaju",
      "aeroporto internacional de aracaju",
      "aeroporto santa maria",
    ],
    lat: -10.984,
    lng: -37.0703,
    displayName: "Aeroporto Internacional de Aracaju - Santa Maria/SE",
    placeId: "sergipe:aracaju:aeroporto",
  },
  {
    matchTerms: [
      "rodoviaria de aracaju",
      "rodoviária de aracaju",
      "rodoviaria aracaju",
      "terminal rodoviario aracaju",
    ],
    lat: -10.9103,
    lng: -37.0478,
    displayName: "Terminal Rodoviário, Aracaju/SE",
    placeId: "sergipe:aracaju:rodoviaria",
  },
  {
    matchTerms: [
      "orla de atalaia",
      "atalaia aracaju",
      "farol da barra",
      "praia de atalaia",
    ],
    lat: -10.991,
    lng: -37.038,
    displayName: "Orla de Atalaia, Aracaju/SE",
    placeId: "sergipe:aracaju:atalaia",
  },
  {
    matchTerms: [
      "universidade federal de sergipe",
      "ufs aracaju",
      "campus santo antonio ufs",
    ],
    lat: -10.9462,
    lng: -37.0739,
    displayName: "UFS - Campus Santo Antônio, Aracaju/SE",
    placeId: "sergipe:aracaju:ufs",
  },
  {
    matchTerms: [
      "mercado municipal de aracaju",
      "mercado municipal aracaju",
      "mercado 13 de julho",
    ],
    lat: -10.907,
    lng: -37.047,
    displayName: "Mercado Municipal, Aracaju/SE",
    placeId: "sergipe:aracaju:mercado-municipal",
  },
  {
    matchTerms: [
      "hospital de urgencia de sergipe",
      "hospital de urgência de sergipe",
      "huse aracaju",
    ],
    lat: -10.9475,
    lng: -37.0712,
    displayName: "Hospital de Urgência de Sergipe (HUSE), Aracaju/SE",
    placeId: "sergipe:aracaju:huse",
  },
  {
    matchTerms: [
      "estadio lourival batista",
      "estádio lourival batista",
      "estadio da batatao",
      "estádio da batatão",
      "batatao aracaju",
    ],
    lat: -10.905,
    lng: -37.049,
    displayName: "Estádio Lourival Batista (Batatão), Aracaju/SE",
    placeId: "sergipe:aracaju:estadio-batatao",
  },
  {
    matchTerms: [
      "eduardo da paixao rocha",
      "eduardo paixao rocha",
      "eduardo da paixão rocha",
      "queimada itabaiana",
      "queimadas itabaiana",
    ],
    lat: -10.682228,
    lng: -37.441134,
    displayName: "Avenida Eduardo da Paixão Rocha, 800 - Queimadas, Itabaiana/SE",
    placeId: "sergipe:itabaiana:eduardo-paixao-rocha-800",
  },
  {
    matchTerms: [
      "vera candida de santana",
      "vera candida santana",
      "vera candida costa de santana",
      "rua vera candida",
      "1258 rotary",
      "rotary club itabaiana",
    ],
    lat: -10.6891766,
    lng: -37.4364078,
    displayName: "Rua Vera Cândida de Santana, nº 1.258 - Rotary Club, Itabaiana/SE",
    placeId: "sergipe:itabaiana:vera-candida-santana-1258",
  },
  {
    matchTerms: ["rodoviaria itabaiana", "rodoviária itabaiana"],
    lat: -10.682,
    lng: -37.428,
    displayName: "Rodoviária, Itabaiana - SE",
    placeId: "demo-rodoviaria",
  },
  {
    matchTerms: ["centro itabaiana"],
    lat: -10.685,
    lng: -37.425,
    displayName: "Centro, Itabaiana - SE",
    placeId: "demo-centro",
  },
  {
    matchTerms: ["centro aracaju", "aracaju centro"],
    lat: -10.9472,
    lng: -37.0731,
    displayName: "Centro, Aracaju - SE",
    placeId: "sergipe:aracaju:centro",
  },
  {
    matchTerms: [
      "banese itaporanga",
      "banese itaporanga d ajuda",
      "banese itaporanga d'ajuda",
      "banco do estado de sergipe itaporanga",
      "agencia banese itaporanga",
      "agência banese itaporanga",
      "banese, itaporanga",
    ],
    lat: -11.0642,
    lng: -37.7678,
    displayName: "Banese — Agência Itaporanga D'Ajuda/SE",
    placeId: "sergipe:itaporanga:banese",
  },
  {
    matchTerms: [
      "centro itaporanga d ajuda",
      "centro itaporanga d'ajuda",
      "centro itaporanga",
      "itaporanga d ajuda centro",
      "praça vinte e cinco de janeiro itaporanga",
      "praca 25 de janeiro itaporanga",
    ],
    lat: -11.0645,
    lng: -37.7681,
    displayName: "Centro, Itaporanga D'Ajuda/SE",
    placeId: "sergipe:itaporanga:centro",
  },
  {
    matchTerms: [
      "rodoviaria itaporanga",
      "rodoviária itaporanga",
      "rodoviaria itaporanga d ajuda",
    ],
    lat: -11.0618,
    lng: -37.7712,
    displayName: "Rodoviária, Itaporanga D'Ajuda/SE",
    placeId: "sergipe:itaporanga:rodoviaria",
  },
  // ── Nossa Senhora do Socorro ─────────────────────────────────────────────
  {
    matchTerms: ["centro nossa senhora do socorro", "centro socorro", "socorro centro"],
    lat: -10.855,
    lng: -37.126,
    displayName: "Centro, Nossa Senhora do Socorro/SE",
    placeId: "sergipe:nossa-senhora-do-socorro:centro",
  },
  {
    matchTerms: [
      "rodoviaria nossa senhora do socorro",
      "rodoviária socorro",
      "terminal rodoviario socorro",
    ],
    lat: -10.8486,
    lng: -37.132,
    displayName: "Terminal Rodoviário, Nossa Senhora do Socorro/SE",
    placeId: "sergipe:nossa-senhora-do-socorro:rodoviaria",
  },
  {
    matchTerms: ["hospital eugenio maia socorro", "hospital socorro"],
    lat: -10.8578,
    lng: -37.1245,
    displayName: "Hospital Eugênio Maia, Nossa Senhora do Socorro/SE",
    placeId: "sergipe:nossa-senhora-do-socorro:hospital-eugenio-maia",
  },
  // ── Lagarto ───────────────────────────────────────────────────────────────
  {
    matchTerms: ["centro lagarto", "lagarto centro"],
    lat: -10.9174,
    lng: -37.6509,
    displayName: "Centro, Lagarto/SE",
    placeId: "sergipe:lagarto:centro",
  },
  {
    matchTerms: ["rodoviaria lagarto", "rodoviária lagarto", "terminal rodoviario lagarto"],
    lat: -10.9142,
    lng: -37.6548,
    displayName: "Terminal Rodoviário, Lagarto/SE",
    placeId: "sergipe:lagarto:rodoviaria",
  },
  {
    matchTerms: ["hospital de lagarto", "hospital lagarto"],
    lat: -10.9165,
    lng: -37.6482,
    displayName: "Hospital de Lagarto/SE",
    placeId: "sergipe:lagarto:hospital",
  },
  // ── Nossa Senhora da Glória ───────────────────────────────────────────────
  {
    matchTerms: ["centro nossa senhora da gloria", "centro gloria", "gloria centro"],
    lat: -10.2189,
    lng: -37.4189,
    displayName: "Centro, Nossa Senhora da Glória/SE",
    placeId: "sergipe:nossa-senhora-da-gloria:centro",
  },
  {
    matchTerms: [
      "rodoviaria nossa senhora da gloria",
      "rodoviária gloria",
      "terminal rodoviario gloria",
    ],
    lat: -10.2156,
    lng: -37.4221,
    displayName: "Terminal Rodoviário, Nossa Senhora da Glória/SE",
    placeId: "sergipe:nossa-senhora-da-gloria:rodoviaria",
  },
  // ── Estância ──────────────────────────────────────────────────────────────
  {
    matchTerms: ["centro estancia", "centro estância", "estancia centro"],
    lat: -11.2681,
    lng: -37.438,
    displayName: "Centro, Estância/SE",
    placeId: "sergipe:estancia:centro",
  },
  {
    matchTerms: ["rodoviaria estancia", "rodoviária estância"],
    lat: -11.2654,
    lng: -37.4412,
    displayName: "Terminal Rodoviário, Estância/SE",
    placeId: "sergipe:estancia:rodoviaria",
  },
  {
    matchTerms: ["praia do sauipe", "sauipe estancia", "costa dos coqueiros"],
    lat: -11.195,
    lng: -37.365,
    displayName: "Praia do Sauípe, Estância/SE",
    placeId: "sergipe:estancia:praia-sauipe",
  },
  // ── Propriá ───────────────────────────────────────────────────────────────
  {
    matchTerms: ["centro propria", "centro propriá", "propria centro"],
    lat: -10.2118,
    lng: -36.8406,
    displayName: "Centro, Propriá/SE",
    placeId: "sergipe:propria:centro",
  },
  {
    matchTerms: ["rodoviaria propria", "rodoviária propriá"],
    lat: -10.2095,
    lng: -36.8442,
    displayName: "Terminal Rodoviário, Propriá/SE",
    placeId: "sergipe:propria:rodoviaria",
  },
  // ── Tobias Barreto ────────────────────────────────────────────────────────
  {
    matchTerms: ["centro tobias barreto", "tobias barreto centro"],
    lat: -11.1838,
    lng: -37.9944,
    displayName: "Centro, Tobias Barreto/SE",
    placeId: "sergipe:tobias-barreto:centro",
  },
  {
    matchTerms: ["rodoviaria tobias barreto", "rodoviária tobias barreto"],
    lat: -11.1812,
    lng: -37.9981,
    displayName: "Terminal Rodoviário, Tobias Barreto/SE",
    placeId: "sergipe:tobias-barreto:rodoviaria",
  },
  // ── Maceió (AL) ───────────────────────────────────────────────────────────
  {
    matchTerms: ["centro maceio", "centro maceió", "maceio centro"],
    lat: -9.6658,
    lng: -35.7353,
    displayName: "Centro, Maceió/AL",
    placeId: "sergipe:maceio:centro",
  },
  {
    matchTerms: [
      "rodoviaria maceio",
      "rodoviária maceió",
      "terminal rodoviario maceio",
      "terminal joao barreto maceio",
    ],
    lat: -9.6479,
    lng: -35.7223,
    displayName: "Terminal Rodoviário João Barreto, Maceió/AL",
    placeId: "sergipe:maceio:rodoviaria",
  },
  {
    matchTerms: [
      "parque shopping maceio",
      "parque shopping maceió",
      "shopping maceio",
    ],
    lat: -9.6362,
    lng: -35.7038,
    displayName: "Parque Shopping Maceió, Maceió/AL",
    placeId: "sergipe:maceio:parque-shopping",
  },
  {
    matchTerms: [
      "aeroporto maceio",
      "aeroporto maceió",
      "aeroporto zumbi dos palmares",
      "zumbi dos palmares maceio",
    ],
    lat: -9.5108,
    lng: -35.7917,
    displayName: "Aeroporto Zumbi dos Palmares, Maceió/AL",
    placeId: "sergipe:maceio:aeroporto",
  },
  {
    matchTerms: ["hospital universitario maceio", "hu maceio", "hospital maceio"],
    lat: -9.6572,
    lng: -35.7358,
    displayName: "Hospital Universitário, Maceió/AL",
    placeId: "sergipe:maceio:hospital-universitario",
  },
  // ── Petrolina (PE) ────────────────────────────────────────────────────────
  {
    matchTerms: ["centro petrolina", "petrolina centro"],
    lat: -9.3891,
    lng: -40.503,
    displayName: "Centro, Petrolina/PE",
    placeId: "sergipe:petrolina:centro",
  },
  {
    matchTerms: [
      "rodoviaria petrolina",
      "rodoviária petrolina",
      "terminal rodoviario petrolina",
    ],
    lat: -9.396,
    lng: -40.5015,
    displayName: "Terminal Rodoviário, Petrolina/PE",
    placeId: "sergipe:petrolina:rodoviaria",
  },
  {
    matchTerms: [
      "orla petrolina",
      "beira rio petrolina",
      "beira rio sao francisco petrolina",
    ],
    lat: -9.3915,
    lng: -40.4982,
    displayName: "Orla da Beira Rio, Petrolina/PE",
    placeId: "sergipe:petrolina:orla-beira-rio",
  },
  {
    matchTerms: ["hospital agamenon magalhaes petrolina", "ham petrolina"],
    lat: -9.3834,
    lng: -40.5098,
    displayName: "Hospital Agamenon Magalhães, Petrolina/PE",
    placeId: "sergipe:petrolina:hospital-agamenon",
  },
];

const GENERIC_MATCH_TOKENS = new Set([
  "de",
  "do",
  "da",
  "dos",
  "das",
  "se",
  "sergipe",
  "brasil",
  "brazil",
  "aracaju",
  "itabaiana",
  "shopping",
  "centro",
  "hospital",
  "terminal",
  "rodoviaria",
  "rodoviário",
  "banese",
  "banco",
  "estado",
  "lagarto",
  "socorro",
  "gloria",
  "estancia",
  "propria",
  "tobias",
  "maceio",
  "petrolina",
]);

function normalizeForMatch(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .replace(/d\s*['']\s*ajuda/g, "d ajuda")
    .replace(/\s+/g, " ")
    .trim();
}

function getSergipePlaceCity(place: SergipeKnownPlace): SergipeCitySlug | null {
  if (place.placeId.startsWith("demo-")) return "itabaiana";
  const idMatch = place.placeId.match(/^sergipe:([^:]+):/);
  if (idMatch?.[1]) return idMatch[1] as SergipeCitySlug;
  return resolveCitySlugFromAddress(place.displayName);
}

function getQueryCityHint(query: string): SergipeCitySlug | null {
  return resolveCitySlugFromAddress(query);
}

function tokenizeForMatch(text: string): string[] {
  return normalizeForMatch(text)
    .split(/[,\s/\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !GENERIC_MATCH_TOKENS.has(t));
}

function scorePlaceMatch(normalizedQuery: string, term: string): number {
  const termNorm = normalizeForMatch(term);
  if (termNorm.length < 3) return 0;
  if (normalizedQuery.includes(termNorm)) return termNorm.length + 100;
  if (termNorm.includes(normalizedQuery) && normalizedQuery.length >= 4) {
    return normalizedQuery.length + 50;
  }
  return 0;
}

/** Pontua correspondência entre texto digitado e lugar do catálogo. */
export function scoreSergipePlaceMatch(
  place: SergipeKnownPlace,
  query: string
): number {
  const normalized = normalizeForMatch(query);
  if (normalized.length < 3) return 0;

  const queryCity = getQueryCityHint(query);
  const placeCity = getSergipePlaceCity(place);
  if (queryCity && placeCity && queryCity !== placeCity) {
    return 0;
  }

  if (place.placeId === "sergipe:aracaju:aeroporto") {
    const mentionsAirport =
      normalized.includes("aeroporto") || normalized.includes("airport");
    if (!mentionsAirport && queryCity !== "aracaju") {
      return 0;
    }
  }

  if (place.placeId.startsWith("sergipe:itaporanga:")) {
    if (!normalized.includes("itaporanga") && queryCity !== "itaporanga") {
      return 0;
    }
  }

  if (
    place.placeId.includes(":itabaiana:") ||
    place.placeId.startsWith("demo-")
  ) {
    if (normalized.includes("itaporanga") && queryCity === "itaporanga") {
      return 0;
    }
  }

  let score = 0;

  for (const term of place.matchTerms) {
    score = Math.max(score, scorePlaceMatch(normalized, term));
  }

  const displayNorm = normalizeForMatch(place.displayName);
  if (normalized.includes(displayNorm)) {
    score = Math.max(score, displayNorm.length + 120);
  }
  if (displayNorm.includes(normalized) && normalized.length >= 5) {
    score = Math.max(score, normalized.length + 90);
  }

  const queryTokens = tokenizeForMatch(normalized);
  const displayTokens = tokenizeForMatch(displayNorm);
  if (queryTokens.length > 0 && displayTokens.length > 0) {
    const matched = queryTokens.filter((q) =>
      displayTokens.some((d) => d.includes(q) || q.includes(d))
    );
    if (matched.length === queryTokens.length) {
      score = Math.max(score, matched.length * 55 + 80);
    } else if (matched.length >= 2) {
      score = Math.max(score, matched.length * 40 + 40);
    } else if (matched.length === 1 && matched[0]!.length >= 5) {
      score = Math.max(score, matched[0]!.length + 60);
    }
  }

  return score;
}

const MIN_SERGIPE_MATCH_SCORE = 55;

/** Busca endereço conhecido em Sergipe por correspondência parcial. */
export function findSergipeKnownPlace(address: string): SergipeKnownPlace | null {
  const normalized = normalizeForMatch(address);
  if (normalized.length < 4) return null;

  let best: SergipeKnownPlace | null = null;
  let bestScore = 0;

  for (const place of SERGIPE_KNOWN_PLACES) {
    const score = scoreSergipePlaceMatch(place, address);
    if (score > bestScore) {
      bestScore = score;
      best = place;
    }
  }

  return bestScore >= MIN_SERGIPE_MATCH_SCORE ? best : null;
}

/** Resolve lugar pelo placeId do catálogo Sergipe. */
export function findSergipeKnownPlaceByPlaceId(placeId: string): SergipeKnownPlace | null {
  const trimmed = placeId.trim();
  if (!trimmed.startsWith("sergipe:")) return null;
  return SERGIPE_KNOWN_PLACES.find((p) => p.placeId === trimmed) ?? null;
}

/** Sugestões do catálogo Sergipe para autocomplete (sem Google Maps). */
export function searchSergipeKnownPlaces(query: string, limit = 8): SergipeKnownPlace[] {
  const normalized = normalizeForMatch(query);
  if (normalized.length < 2) return [];

  const scored = SERGIPE_KNOWN_PLACES.map((place) => ({
    place,
    score: scoreSergipePlaceMatch(place, query),
  }))
    .filter((item) => item.score >= MIN_SERGIPE_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.place);
}
