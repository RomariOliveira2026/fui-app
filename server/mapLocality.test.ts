import { describe, expect, it } from "vitest";
import {
  buildGeocodingQueryVariants,
  fixCommonSergipeStreetTypos,
  normalizeBrazilianAddressText,
  rankByLocality,
} from "@shared/mapDefaults";

describe("rankByLocality", () => {
  it("prioriza Itabaiana sobre outras cidades", () => {
    const items = [
      {
        description: "Magazine Luiza, São Paulo - SP, Brasil",
        structured_formatting: { secondary_text: "São Paulo - SP" },
      },
      {
        description: "Magazine Luiza, Itabaiana - SE, Brasil",
        structured_formatting: { secondary_text: "Itabaiana - SE" },
      },
    ];

    const ranked = rankByLocality(items, "Itabaiana");
    expect(ranked[0]?.description).toContain("Itabaiana");
  });
});

describe("normalizeBrazilianAddressText", () => {
  it("normaliza Itabaiana/SE e preserva bairro para geocoding", () => {
    const input = "Avenida Eduardo Paixão Rocha, 800 - Queimada, Itabaiana/SE";
    expect(normalizeBrazilianAddressText(input)).toBe(
      "Avenida Eduardo da Paixão Rocha, 800, Queimada, Itabaiana, Sergipe"
    );
  });

  it("normaliza Aracaju/SE e corrige Macah para Machado", () => {
    const input =
      "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE";
    const normalized = normalizeBrazilianAddressText(input);
    expect(normalized).toContain("Machado");
    expect(normalized).toContain("Aracaju");
    expect(normalized).toContain("Inácio Barbosa");
  });

  it("corrige artigo da em Eduardo Paixão Rocha", () => {
    expect(fixCommonSergipeStreetTypos("Avenida Eduardo Paixão Rocha, 800")).toContain(
      "Eduardo da Paixão Rocha"
    );
  });

  it("gera variante geocodificável para endereço real de Itabaiana", () => {
    const variants = buildGeocodingQueryVariants(
      "Avenida Eduardo Paixão Rocha, 800 - Queimada, Itabaiana/SE"
    );
    expect(
      variants.some((v) => v.includes("Eduardo da Paixão Rocha") && v.includes("800"))
    ).toBe(true);
    expect(variants.some((v) => v.toLowerCase().includes("itabaiana"))).toBe(true);
    expect(variants.some((v) => v.toLowerCase().includes("aracaju"))).toBe(false);
  });

  it("não anexa Itabaiana a endereços de Aracaju nas variantes", () => {
    const variants = buildGeocodingQueryVariants(
      "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE",
      "Itabaiana"
    );
    expect(variants.some((v) => v.toLowerCase().includes("aracaju"))).toBe(true);
    expect(
      variants.every(
        (v) => !/\bitabaiana\b/i.test(v) || v.toLowerCase().includes("aracaju")
      )
    ).toBe(true);
  });
});
