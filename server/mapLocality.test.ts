import { describe, expect, it } from "vitest";
import { rankByLocality } from "@shared/mapDefaults";

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
