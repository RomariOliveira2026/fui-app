import { describe, expect, it } from "vitest";
import {
  formatNominatimAddress,
  isCoarseNominatimAddress,
  isGenericCityCentroidLabel,
} from "@shared/formatNominatimAddress";

describe("formatNominatimAddress", () => {
  it("formata endereço com logradouro, bairro e CEP", () => {
    const formatted = formatNominatimAddress(
      {
        road: "Avenida Eduardo da Paixão Rocha",
        suburb: "Queimadas",
        city: "Itabaiana",
        state: "Sergipe",
        postcode: "49511390",
      },
      "fallback"
    );
    expect(formatted).toContain("Avenida Eduardo da Paixão Rocha");
    expect(formatted).toContain("Queimadas");
    expect(formatted).toContain("Itabaiana/SE");
    expect(formatted).toContain("CEP 49511-390");
  });

  it("marca endereço só com bairro/cidade como coarse", () => {
    expect(
      isCoarseNominatimAddress({
        suburb: "Centro",
        city: "Itabaiana",
        state: "Sergipe",
      })
    ).toBe(true);
    expect(
      isCoarseNominatimAddress({
        road: "Avenida Eduardo da Paixão Rocha",
        city: "Itabaiana",
      })
    ).toBe(false);
  });

  it("detecta rótulo genérico de centro sem logradouro", () => {
    expect(isGenericCityCentroidLabel("Centro, Itabaiana/SE, CEP 49500-335")).toBe(true);
    expect(
      isGenericCityCentroidLabel(
        "Avenida Eduardo da Paixão Rocha, 800 - Queimadas, Itabaiana/SE, CEP 49511-390"
      )
    ).toBe(false);
  });
});
