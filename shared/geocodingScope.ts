/**
 * Escopo de geocoding: nacional (Brasil inteiro) vs. operação local (whitelabel com cidade).
 * Sem VITE_APP_CITY / ENV.appCity → nacional, sem viés de Itabaiana/Sergipe.
 */

export type GeocodingScope = {
  /** true quando não há cidade operacional configurada */
  isNationalScope: boolean;
  /** Cidade do whitelabel (ex.: Itabaiana), se houver */
  operationalCity?: string;
  /** Viewbox regional (Sergipe) só em operação local */
  useRegionalViewbox: boolean;
};

export function resolveGeocodingScope(appCity?: string | null): GeocodingScope {
  const operationalCity = appCity?.trim() || undefined;
  return {
    isNationalScope: !operationalCity,
    operationalCity,
    useRegionalViewbox: Boolean(operationalCity),
  };
}

/** Cidade usada como dica de busca — nunca inventa Itabaiana em modo nacional. */
export function resolveHintCity(address: string, scope: GeocodingScope): string | undefined {
  const fromAddress = extractCityHintFromAddress(address);
  if (fromAddress) return fromAddress;
  return scope.operationalCity;
}

/** Extrai cidade do texto (Sergipe + padrões comuns /UF). */
function extractCityHintFromAddress(address: string): string | undefined {
  const normalized = address.trim();
  if (!normalized) return undefined;

  const lower = normalized.toLowerCase();

  if (/\bitaporanga\s+d['']?\s*ajuda\b/i.test(normalized)) {
    return "Itaporanga D'Ajuda";
  }

  const sergipeMatch = normalized.match(
    /\b(Aracaju|Itabaiana|Itaporanga\s+D['']?\s*Ajuda|Estância|Estancia|Lagarto|Propriá|Propria|Nossa Senhora do Socorro|São Cristóvão|Sao Cristovao|Barra dos Coqueiros|Laranjeiras|Simão Dias|Simao Dias|Tobias Barreto|Capela|Boquim|Glória|Gloria|Porto da Folha)\b/i
  );
  if (sergipeMatch?.[1]) {
    if (/itaporanga/i.test(sergipeMatch[1])) return "Itaporanga D'Ajuda";
    return sergipeMatch[1];
  }

  const cityStateMatch = normalized.match(
    /\b([A-Za-zÀ-ú][A-Za-zÀ-ú\s]{2,40}?)\s*[,/]\s*([A-Z]{2})\b/
  );
  if (cityStateMatch?.[1]) {
    const city = cityStateMatch[1].trim();
    if (!/^(rua|avenida|av|travessa|alameda|rodovia|br|shopping)$/i.test(city)) {
      return city;
    }
  }

  const majorCities = [
    "são paulo",
    "sao paulo",
    "rio de janeiro",
    "belo horizonte",
    "brasília",
    "brasilia",
    "salvador",
    "fortaleza",
    "recife",
    "curitiba",
    "porto alegre",
    "manaus",
    "belém",
    "belem",
    "goiânia",
    "goiania",
    "campinas",
    "florianópolis",
    "florianopolis",
  ];
  for (const city of majorCities) {
    if (lower.includes(city)) {
      return city
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
        .replace("Sao Paulo", "São Paulo")
        .replace("Sao Cristovao", "São Cristóvão");
    }
  }

  return undefined;
}
