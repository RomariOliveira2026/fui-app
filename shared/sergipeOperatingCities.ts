/**
 * Cidades de operação do Fui! (Sergipe e expansão regional).
 * Configure VITE_APP_CITY com displayName ou alias para ativar defaults locais.
 */

import { stripAccents } from "./addressGeocoding";

export type SergipeCitySlug =
  | "aracaju"
  | "nossa-senhora-do-socorro"
  | "lagarto"
  | "nossa-senhora-da-gloria"
  | "estancia"
  | "propria"
  | "tobias-barreto"
  | "maceio"
  | "petrolina"
  | "itabaiana"
  | "itaporanga";

/** Ordem de expansão comercial acordada (após piloto Itabaiana). */
export const SERGIPE_EXPANSION_ORDER: SergipeCitySlug[] = [
  "aracaju",
  "nossa-senhora-do-socorro",
  "lagarto",
  "nossa-senhora-da-gloria",
  "estancia",
  "propria",
  "tobias-barreto",
  "maceio",
  "petrolina",
];

export type SergipeCityHome = {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
};

export type SergipeOperatingCity = {
  slug: SergipeCitySlug;
  displayName: string;
  state: "SE" | "AL" | "PE";
  center: { lat: number; lng: number };
  defaultHome: SergipeCityHome;
  /** Nomes aceitos em VITE_APP_CITY e endereços digitados. */
  aliases: string[];
};

function normCityKey(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/d\s*['']\s*ajuda/g, "d ajuda")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const ITABAIANA_HOME: SergipeCityHome = {
  address: "Rua Vera Cândida de Santana, nº 1.258 - Rotary Club, Itabaiana/SE",
  placeId: "sergipe:itabaiana:vera-candida-santana-1258",
  lat: -10.6891766,
  lng: -37.4364078,
};

export const SERGIPE_OPERATING_CITIES: SergipeOperatingCity[] = [
  {
    slug: "aracaju",
    displayName: "Aracaju",
    state: "SE",
    center: { lat: -10.9472, lng: -37.0731 },
    defaultHome: {
      address: "Terminal Rodoviário, Aracaju/SE",
      placeId: "sergipe:aracaju:rodoviaria",
      lat: -10.9103,
      lng: -37.0478,
    },
    aliases: ["aracaju", "aju"],
  },
  {
    slug: "nossa-senhora-do-socorro",
    displayName: "Nossa Senhora do Socorro",
    state: "SE",
    center: { lat: -10.855, lng: -37.126 },
    defaultHome: {
      address: "Centro, Nossa Senhora do Socorro/SE",
      placeId: "sergipe:nossa-senhora-do-socorro:centro",
      lat: -10.855,
      lng: -37.126,
    },
    aliases: [
      "nossa senhora do socorro",
      "socorro",
      "n s do socorro",
      "ns socorro",
    ],
  },
  {
    slug: "lagarto",
    displayName: "Lagarto",
    state: "SE",
    center: { lat: -10.9174, lng: -37.6509 },
    defaultHome: {
      address: "Centro, Lagarto/SE",
      placeId: "sergipe:lagarto:centro",
      lat: -10.9174,
      lng: -37.6509,
    },
    aliases: ["lagarto"],
  },
  {
    slug: "nossa-senhora-da-gloria",
    displayName: "Nossa Senhora da Glória",
    state: "SE",
    center: { lat: -10.2189, lng: -37.4189 },
    defaultHome: {
      address: "Centro, Nossa Senhora da Glória/SE",
      placeId: "sergipe:nossa-senhora-da-gloria:centro",
      lat: -10.2189,
      lng: -37.4189,
    },
    aliases: [
      "nossa senhora da gloria",
      "nossa senhora da glória",
      "gloria",
      "glória",
      "ns da gloria",
    ],
  },
  {
    slug: "estancia",
    displayName: "Estância",
    state: "SE",
    center: { lat: -11.2681, lng: -37.438 },
    defaultHome: {
      address: "Centro, Estância/SE",
      placeId: "sergipe:estancia:centro",
      lat: -11.2681,
      lng: -37.438,
    },
    aliases: ["estancia", "estância"],
  },
  {
    slug: "propria",
    displayName: "Propriá",
    state: "SE",
    center: { lat: -10.2118, lng: -36.8406 },
    defaultHome: {
      address: "Centro, Propriá/SE",
      placeId: "sergipe:propria:centro",
      lat: -10.2118,
      lng: -36.8406,
    },
    aliases: ["propria", "propriá"],
  },
  {
    slug: "tobias-barreto",
    displayName: "Tobias Barreto",
    state: "SE",
    center: { lat: -11.1838, lng: -37.9944 },
    defaultHome: {
      address: "Centro, Tobias Barreto/SE",
      placeId: "sergipe:tobias-barreto:centro",
      lat: -11.1838,
      lng: -37.9944,
    },
    aliases: ["tobias barreto", "tobias"],
  },
  {
    slug: "maceio",
    displayName: "Maceió",
    state: "AL",
    center: { lat: -9.6658, lng: -35.7353 },
    defaultHome: {
      address: "Terminal Rodoviário João Barreto, Maceió/AL",
      placeId: "sergipe:maceio:rodoviaria",
      lat: -9.6479,
      lng: -35.7223,
    },
    aliases: ["maceio", "maceió", "mcz"],
  },
  {
    slug: "petrolina",
    displayName: "Petrolina",
    state: "PE",
    center: { lat: -9.3891, lng: -40.503 },
    defaultHome: {
      address: "Centro, Petrolina/PE",
      placeId: "sergipe:petrolina:centro",
      lat: -9.3891,
      lng: -40.503,
    },
    aliases: ["petrolina", "petrolina pe"],
  },
  {
    slug: "itabaiana",
    displayName: "Itabaiana",
    state: "SE",
    center: { lat: -10.685, lng: -37.425 },
    defaultHome: ITABAIANA_HOME,
    aliases: ["itabaiana"],
  },
  {
    slug: "itaporanga",
    displayName: "Itaporanga D'Ajuda",
    state: "SE",
    center: { lat: -11.0645, lng: -37.7681 },
    defaultHome: {
      address: "Centro, Itaporanga D'Ajuda/SE",
      placeId: "sergipe:itaporanga:centro",
      lat: -11.0645,
      lng: -37.7681,
    },
    aliases: ["itaporanga", "itaporanga d ajuda", "itaporanga d'ajuda"],
  },
];

const cityBySlug = new Map(SERGIPE_OPERATING_CITIES.map((c) => [c.slug, c]));

const cityByAlias = new Map<string, SergipeOperatingCity>();
for (const city of SERGIPE_OPERATING_CITIES) {
  cityByAlias.set(normCityKey(city.displayName), city);
  for (const alias of city.aliases) {
    cityByAlias.set(normCityKey(alias), city);
  }
}

/** Resolve cidade operacional a partir de VITE_APP_CITY (ou texto equivalente). */
export function resolveOperatingCity(appCity?: string | null): SergipeOperatingCity | null {
  const trimmed = appCity?.trim();
  if (!trimmed) return null;
  return cityByAlias.get(normCityKey(trimmed)) ?? null;
}

/** Detecta cidade mencionada em um endereço digitado. */
export function resolveCitySlugFromAddress(address: string): SergipeCitySlug | null {
  const normalized = normCityKey(address);
  if (!normalized) return null;

  if (/\bitaporanga\b/.test(normalized)) return "itaporanga";
  if (/\bitabaiana\b/.test(normalized)) return "itabaiana";
  if (/\baracaju\b/.test(normalized)) return "aracaju";
  if (/\btobias barreto\b/.test(normalized) || /\btobias\b/.test(normalized)) {
    return "tobias-barreto";
  }
  if (/\bestancia\b/.test(normalized)) return "estancia";
  if (/\bpropria\b/.test(normalized)) return "propria";
  if (/\bgloria\b/.test(normalized)) return "nossa-senhora-da-gloria";
  if (/\bsocorro\b/.test(normalized)) return "nossa-senhora-do-socorro";
  if (/\blagarto\b/.test(normalized)) return "lagarto";
  if (/\bmaceio\b/.test(normalized)) return "maceio";
  if (/\bpetrolina\b/.test(normalized)) return "petrolina";

  for (const city of SERGIPE_OPERATING_CITIES) {
    const key = normCityKey(city.displayName);
    if (normalized.includes(key)) return city.slug;
  }
  return null;
}

export function getOperatingCityBySlug(slug: SergipeCitySlug): SergipeOperatingCity {
  return cityBySlug.get(slug)!;
}

export function getDefaultPassengerHomeForApp(appCity?: string | null): SergipeCityHome {
  return resolveOperatingCity(appCity)?.defaultHome ?? ITABAIANA_HOME;
}

export function getOperationCenterForApp(appCity?: string | null): { lat: number; lng: number } {
  return resolveOperatingCity(appCity)?.center ?? { lat: -10.685, lng: -37.425 };
}

export function getGeocodingCityForApp(appCity?: string | null): string {
  return resolveOperatingCity(appCity)?.displayName ?? "Itabaiana";
}
