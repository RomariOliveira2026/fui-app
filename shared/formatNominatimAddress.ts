export type NominatimAddressParts = {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
};

function formatCep(postcode: string): string {
  const digits = postcode.replace(/\D/g, "");
  if (digits.length !== 8) return postcode;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCityState(parts: NominatimAddressParts): string | null {
  const city = parts.city || parts.town || parts.municipality;
  if (!city) return null;
  const state = parts.state?.trim();
  if (state?.toLowerCase() === "sergipe") return `${city}/SE`;
  if (state) return `${city}, ${state}`;
  return city;
}

/** Monta endereço brasileiro legível a partir dos componentes do Nominatim. */
export function formatNominatimAddress(
  parts: NominatimAddressParts | null | undefined,
  displayName?: string
): string {
  if (!parts) return displayName?.trim() ?? "";

  const road = parts.road || parts.pedestrian;
  const bairro = parts.suburb || parts.neighbourhood || parts.quarter;
  const cityState = formatCityState(parts);
  const segments: string[] = [];

  if (road) {
    const street = parts.house_number ? `${road}, ${parts.house_number}` : road;
    segments.push(bairro ? `${street} - ${bairro}` : street);
  } else if (bairro) {
    segments.push(bairro);
  }

  if (cityState) segments.push(cityState);
  if (parts.postcode) segments.push(`CEP ${formatCep(parts.postcode)}`);

  const formatted = segments.join(", ").trim();
  return formatted || displayName?.trim() || "";
}

/** Resultado sem logradouro — típico de centroide / localização imprecisa. */
export function isCoarseNominatimAddress(parts: NominatimAddressParts | null | undefined): boolean {
  if (!parts) return true;
  return !(parts.road || parts.pedestrian || parts.house_number);
}

/** Rótulo genérico de centro/bairro sem logradouro (ex.: "Centro, Itabaiana/SE"). */
export function isGenericCityCentroidLabel(formattedAddress: string | null | undefined): boolean {
  const text = formattedAddress?.trim() ?? "";
  if (!text) return true;
  if (/\b(avenida|av\.|rua|r\.|rodovia|travessa|alameda)\b/i.test(text)) return false;
  return /^centro\b/i.test(text) || /^centro,/i.test(text);
}
