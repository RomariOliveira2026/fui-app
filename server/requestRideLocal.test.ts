import { describe, expect, it } from "vitest";
import { resolveLocalPlaceId } from "../client/src/lib/requestRideLocal";

describe("resolveLocalPlaceId", () => {
  it("preserva place id real do GPS/reverse geocode", () => {
    const gpsPlaceId = "osm:way:1192235532";
    expect(
      resolveLocalPlaceId("Centro, Itabaiana - SE", gpsPlaceId)
    ).toBe(gpsPlaceId);
  });

  it("usa catálogo demo só quando não há place id real", () => {
    expect(resolveLocalPlaceId("Centro, Itabaiana - SE")).toBe("demo-centro");
  });
});
