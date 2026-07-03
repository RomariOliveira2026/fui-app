import { describe, expect, it } from "vitest";
import {
  buildGeocodingQueryVariants,
  extractCityFromAddress,
  fixCommonSergipeStreetTypos,
  formatAddressForGeocoding,
  isLikelyUnwantedAddressRelabel,
  normalizeBrazilianAddressText,
  pickResolvedAddressLabel,
} from "@shared/addressGeocoding";
import { findSergipeKnownPlace } from "@shared/sergipeKnownPlaces";

describe("addressGeocoding", () => {
  it("não anexa Itabaiana a endereços de Aracaju", () => {
    const dest = "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE";
    const formatted = formatAddressForGeocoding(dest, "Itabaiana");
    expect(formatted.toLowerCase()).toContain("aracaju");
    expect(formatted.toLowerCase()).not.toContain("itabaiana");
  });

  it("corrige Macah para Machado e normaliza hífens", () => {
    const raw = "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE";
    const normalized = normalizeBrazilianAddressText(raw);
    expect(normalized).toContain("Machado");
    expect(normalized).toContain("Aracaju");
    expect(normalized).toContain("170");
  });

  it("extrai Aracaju como cidade do destino", () => {
    expect(
      extractCityFromAddress("Rua X, 170 - Bairro - Aracaju/SE")
    ).toBe("Aracaju");
  });

  it("gera variantes progressivas com cidade correta", () => {
    const variants = buildGeocodingQueryVariants(
      "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE",
      "Itabaiana"
    );
    expect(variants.some((v) => v.includes("Aracaju") && v.includes("Machado"))).toBe(
      true
    );
    expect(variants.some((v) => v.includes("Itabaiana"))).toBe(false);
  });

  it("resolve endereço conhecido de Aracaju no catálogo Sergipe", () => {
    const place = findSergipeKnownPlace(
      "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE"
    );
    expect(place).not.toBeNull();
    expect(place!.displayName).toContain("Aracaju");
    expect(fixCommonSergipeStreetTypos("Macah")).toContain("Machado");
  });

  it("resolve Assembleia Legislativa de Sergipe no catálogo", () => {
    const place = findSergipeKnownPlace("Assembléia Legislativa de Sergipe, Aracaju/Se");
    expect(place).not.toBeNull();
    expect(place!.displayName).toContain("Assembleia");
    expect(place!.displayName).toContain("Aracaju");
  });

  it("resolve Shopping Jardins em Aracaju no catálogo", () => {
    const place = findSergipeKnownPlace("Shopping Jardins, Aracaju/Se");
    expect(place).not.toBeNull();
    expect(place!.displayName).toContain("Shopping Jardins");
    expect(place!.displayName).toContain("Aracaju");
  });

  it("não confunde endereço de Itabaiana com aeroporto de Aracaju", () => {
    const place = findSergipeKnownPlace("Rua João Pessoa, Centro, Itabaiana/SE");
    expect(place?.placeId ?? null).not.toBe("sergipe:aracaju:aeroporto");
  });

  it("não confunde bairro Santa Maria em Itabaiana com aeroporto", () => {
    const place = findSergipeKnownPlace("Rua das Flores, Santa Maria, Itabaiana/SE");
    expect(place?.placeId ?? null).not.toBe("sergipe:aracaju:aeroporto");
  });

  it("não confunde endereço residencial sem cidade com aeroporto", () => {
    const place = findSergipeKnownPlace("Rua José Alves, 145, Santa Maria");
    expect(place?.placeId ?? null).not.toBe("sergipe:aracaju:aeroporto");
  });

  it("preserva endereço digitado quando o rótulo resolvido é de outra cidade", () => {
    expect(
      pickResolvedAddressLabel(
        "Avenida Getúlio Vargas, Centro, Itabaiana/SE",
        "Aeroporto Internacional de Aracaju - Santa Maria/SE"
      )
    ).toContain("Itabaiana");
  });

  it("preserva endereço residencial digitado sem menção ao aeroporto", () => {
    expect(
      isLikelyUnwantedAddressRelabel(
        "Rua José Alves, 145, Bairro Centro",
        "Aeroporto Internacional de Aracaju - Santa Maria/SE"
      )
    ).toBe(true);
    expect(
      pickResolvedAddressLabel(
        "Rua José Alves, 145, Bairro Centro",
        "Aeroporto Internacional de Aracaju - Santa Maria/SE"
      )
    ).toBe("Rua José Alves, 145, Bairro Centro");
  });
});
