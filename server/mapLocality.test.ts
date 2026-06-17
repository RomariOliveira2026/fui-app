import { describe, expect, it } from "vitest";
import {
  buildGeocodingQueryVariants,
  fixCommonStreetNameArticles,
  normalizeBrazilianAddressText,
  rankByLocality,
  stripNeighborhoodBeforeCity,
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
  it("normaliza Itabaiana/SE e remove bairro após hífen no número", () => {
    const input = "Avenida Eduardo Paixão Rocha, 800 - Queimada, Itabaiana/SE";
    expect(normalizeBrazilianAddressText(input)).toBe(
      "Avenida Eduardo Paixão Rocha, 800, Itabaiana, Sergipe"
    );
  });

  it("corrige artigo da em Eduardo Paixão Rocha", () => {
    expect(fixCommonStreetNameArticles("Avenida Eduardo Paixão Rocha, 800")).toContain(
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
    expect(variants.some((v) => v.includes("Queimada"))).toBe(false);
  });
});
