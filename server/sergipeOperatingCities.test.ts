import { describe, expect, it } from "vitest";
import { getDefaultPassengerHome } from "@shared/defaultHomeAddress";
import { findSergipeKnownPlace, searchSergipeKnownPlaces } from "@shared/sergipeKnownPlaces";
import {
  resolveCitySlugFromAddress,
  resolveOperatingCity,
  SERGIPE_EXPANSION_ORDER,
} from "@shared/sergipeOperatingCities";

describe("sergipeOperatingCities", () => {
  it("segue ordem de expansão acordada", () => {
    expect(SERGIPE_EXPANSION_ORDER).toEqual([
      "aracaju",
      "nossa-senhora-do-socorro",
      "lagarto",
      "nossa-senhora-da-gloria",
      "estancia",
      "propria",
      "tobias-barreto",
    ]);
  });

  it("resolve Aracaju por VITE_APP_CITY", () => {
    const city = resolveOperatingCity("Aracaju");
    expect(city?.slug).toBe("aracaju");
    expect(getDefaultPassengerHome("Aracaju").placeId).toBe("sergipe:aracaju:rodoviaria");
  });

  it("resolve Lagarto e Tobias Barreto", () => {
    expect(resolveOperatingCity("Lagarto")?.slug).toBe("lagarto");
    expect(resolveOperatingCity("Tobias Barreto")?.slug).toBe("tobias-barreto");
  });

  it("detecta cidade no endereço digitado", () => {
    expect(resolveCitySlugFromAddress("Centro, Estância/SE")).toBe("estancia");
    expect(resolveCitySlugFromAddress("Rodoviária Propriá")).toBe("propria");
  });
});

describe("sergipeKnownPlaces — cidades expandidas", () => {
  it("resolve centro de Lagarto", () => {
    const place = findSergipeKnownPlace("centro lagarto");
    expect(place?.placeId).toBe("sergipe:lagarto:centro");
  });

  it("não confunde Lagarto com Aracaju", () => {
    const place = findSergipeKnownPlace("rodoviaria lagarto");
    expect(place?.displayName.toLowerCase()).toContain("lagarto");
    expect(place?.displayName.toLowerCase()).not.toContain("aracaju");
  });

  it("autocomplete lista POIs de Socorro", () => {
    const results = searchSergipeKnownPlaces("hospital socorro", 3);
    expect(results.some((p) => p.placeId.includes("nossa-senhora-do-socorro"))).toBe(true);
  });
});
