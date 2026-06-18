import { describe, expect, it } from "vitest";
import {
  buildGeocodingQueryVariants,
  extractCityFromAddress,
  fixCommonSergipeStreetTypos,
  formatAddressForGeocoding,
  normalizeBrazilianAddressText,
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
});
