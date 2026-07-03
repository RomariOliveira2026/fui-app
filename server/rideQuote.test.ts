import { describe, expect, it } from "vitest";
import { buildCategoryQuotes } from "@shared/rideQuote";

describe("rideQuote", () => {
  it("gera preços distintos por categoria na mesma rota", () => {
    const quotes = buildCategoryQuotes(64_000, 3_900);
    expect(quotes).toHaveLength(4);
    const moto = quotes.find((q) => q.vehicleType === "moto")!;
    const carro = quotes.find((q) => q.vehicleType === "carro")!;
    expect(carro.estimatedPrice).toBeGreaterThan(moto.estimatedPrice);
    expect(quotes.every((q) => q.estimatedPrice > 0)).toBe(true);
  });
});
