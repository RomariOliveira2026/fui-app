import { describe, expect, it } from "vitest";
import { isRealGeocodePlaceId } from "@shared/geocodePlaceId";

describe("isRealGeocodePlaceId", () => {
  it("identifica place ids reais de geocoding", () => {
    expect(isRealGeocodePlaceId("osm:way:1192235532")).toBe(true);
    expect(isRealGeocodePlaceId("nominatim:12345")).toBe(true);
    expect(isRealGeocodePlaceId("coord:-10.68,-37.44")).toBe(true);
    expect(isRealGeocodePlaceId("ChIJabcd")).toBe(true);
  });

  it("rejeita catálogo demo", () => {
    expect(isRealGeocodePlaceId("demo-centro")).toBe(false);
    expect(isRealGeocodePlaceId(undefined)).toBe(false);
  });
});
