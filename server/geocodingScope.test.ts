import { describe, expect, it } from "vitest";
import { formatAddressForGeocoding } from "@shared/addressGeocoding";
import { resolveGeocodingScope, resolveHintCity } from "@shared/geocodingScope";

describe("geocodingScope", () => {
  it("modo nacional sem cidade operacional", () => {
    const scope = resolveGeocodingScope("");
    expect(scope.isNationalScope).toBe(true);
    expect(scope.operationalCity).toBeUndefined();
    expect(scope.useRegionalViewbox).toBe(false);
  });

  it("modo local com whitelabel", () => {
    const scope = resolveGeocodingScope("Itabaiana");
    expect(scope.isNationalScope).toBe(false);
    expect(scope.operationalCity).toBe("Itabaiana");
    expect(scope.useRegionalViewbox).toBe(true);
  });

  it("não anexa Itabaiana em endereços de São Paulo no modo nacional", () => {
    const scope = resolveGeocodingScope(undefined);
    const formatted = formatAddressForGeocoding("Av. Paulista, 1000, São Paulo", undefined);
    expect(formatted.toLowerCase()).toContain("são paulo");
    expect(formatted.toLowerCase()).not.toContain("itabaiana");
    expect(resolveHintCity("Av. Paulista, São Paulo", scope)).toBe("São Paulo");
  });

  it("extrai Aracaju mesmo em modo nacional", () => {
    const scope = resolveGeocodingScope("");
    expect(resolveHintCity("Shopping Jardins, Aracaju/SE", scope)).toBe("Aracaju");
  });
});
