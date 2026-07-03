import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./_core/nominatim", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./_core/nominatim")>();
  return {
    ...actual,
    sleepMs: async () => undefined,
  };
});

import * as nominatim from "./_core/nominatim";
import { calculatePassengerRoute } from "./_core/passengerRoute";

const ORIGIN = "Avenida Eduardo Paixão Rocha, 800 - Queimada, Itabaiana/SE";
const DESTINATION =
  "Rua Paulo Henrique Macah Pimentel, 170 - Inácio Barbosa - Aracaju/SE";
const ITABAIANA_NOMINATIM_ROW = [
  {
    lat: "-10.682228",
    lon: "-37.441134",
    display_name: "Avenida Eduardo da Paixão Rocha, Queimadas, Itabaiana, Sergipe, Brasil",
    place_id: 1,
    osm_type: "way",
    osm_id: 100,
  },
];

describe("calculatePassengerRoute Itabaiana → Aracaju", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("localiza origem e destino em Sergipe e calcula rota intermunicipal", async () => {
    const nominatimResponses: Record<string, { lat: string; lon: string; display_name: string; place_id: number; osm_type: string; osm_id: number }[]> = {
      itabaiana: [
        {
          lat: "-10.682228",
          lon: "-37.441134",
          display_name: "Avenida Eduardo da Paixão Rocha, Queimadas, Itabaiana, Sergipe, Brasil",
          place_id: 1,
          osm_type: "way",
          osm_id: 100,
        },
      ],
      aracaju: [
        {
          lat: "-10.9522564",
          lon: "-37.0731675",
          display_name:
            "Rua Paulo Henrique Machado Pimentel, 170, Inácio Barbosa, Aracaju, Sergipe, Brasil",
          place_id: 2,
          osm_type: "way",
          osm_id: 200,
        },
      ],
    };

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("nominatim.openstreetmap.org/search")) {
        const decoded = decodeURIComponent(url);
        if (decoded.toLowerCase().includes("aracaju") || decoded.toLowerCase().includes("machado")) {
          return new Response(JSON.stringify(nominatimResponses.aracaju), { status: 200 });
        }
        return new Response(JSON.stringify(nominatimResponses.itabaiana), { status: 200 });
      }

      if (url.includes("router.project-osrm.org/route")) {
        return new Response(
          JSON.stringify({
            code: "Ok",
            routes: [
              {
                distance: 92000,
                duration: 5400,
                geometry: {
                  coordinates: [
                    [-37.441134, -10.682228],
                    [-37.0731675, -10.9522564],
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response("not found", { status: 404 });
    });

    const result = await calculatePassengerRoute({
      originAddress: ORIGIN,
      destinationAddress: DESTINATION,
      vehicleType: "carro",
      allowDemoFallback: false,
    });

    expect(result.origin.displayName.toLowerCase()).toContain("itabaiana");
    expect(result.destination.displayName.toLowerCase()).toContain("aracaju");
    expect(result.distance).toBeGreaterThan(50_000);
    expect(result.estimatedPrice).toBeGreaterThan(30_000);
    expect(result.usedHaversineFallback).toBe(false);
  });

  it("usa catálogo Sergipe quando Nominatim não retorna resultados", async () => {
    vi.spyOn(nominatim, "geocodeAddressWithNominatim").mockResolvedValue(null);

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("nominatim.openstreetmap.org/search")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes("router.project-osrm.org/route")) {
        return new Response(
          JSON.stringify({
            code: "Ok",
            routes: [
              {
                distance: 92000,
                duration: 5400,
                geometry: {
                  coordinates: [
                    [-37.441134, -10.682228],
                    [-37.0731675, -10.9522564],
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response("not found", { status: 404 });
    });

    const result = await calculatePassengerRoute({
      originAddress: ORIGIN,
      destinationAddress: DESTINATION,
      vehicleType: "carro",
      allowDemoFallback: false,
    });

    expect(result.destination.source).toBe("sergipe_catalog");
    expect(result.destination.displayName).toContain("Aracaju");
    expect(result.distance).toBeGreaterThan(50_000);
  });

  it("localiza destino em Aracaju via placeId OSM do autocomplete", async () => {
    vi.spyOn(nominatim, "geocodeAddressWithNominatim").mockResolvedValue(null);

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("nominatim.openstreetmap.org/lookup")) {
        return new Response(
          JSON.stringify([
            {
              lat: "-10.946654",
              lon: "-37.072935",
              display_name: "Assembleia Legislativa de Sergipe, Aracaju, Sergipe, Brasil",
              place_id: 99,
              osm_type: "way",
              osm_id: 999,
            },
          ]),
          { status: 200 }
        );
      }

      if (url.includes("nominatim.openstreetmap.org/search")) {
        return new Response(JSON.stringify(ITABAIANA_NOMINATIM_ROW), { status: 200 });
      }

      if (url.includes("router.project-osrm.org/route")) {
        return new Response(
          JSON.stringify({
            code: "Ok",
            routes: [
              {
                distance: 92000,
                duration: 5400,
                geometry: {
                  coordinates: [
                    [-37.441134, -10.682228],
                    [-37.072935, -10.946654],
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response("not found", { status: 404 });
    });

    const result = await calculatePassengerRoute({
      originAddress: ORIGIN,
      destinationAddress: "Assembleia Legislativa de Sergipe, Aracaju/SE",
      destinationPlaceId: "osm:way:999",
      vehicleType: "carro",
      allowDemoFallback: false,
    });

    expect(result.destination.source).toBe("nominatim");
    expect(result.destination.displayName.toLowerCase()).toContain("assembleia");
    expect(result.distance).toBeGreaterThan(50_000);
  });

  it("localiza Assembleia Legislativa via catálogo Sergipe", async () => {
    vi.spyOn(nominatim, "geocodeAddressWithNominatim").mockResolvedValue(null);

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("nominatim.openstreetmap.org/search")) {
        return new Response(JSON.stringify(ITABAIANA_NOMINATIM_ROW), { status: 200 });
      }
      if (url.includes("router.project-osrm.org/route")) {
        return new Response(
          JSON.stringify({
            code: "Ok",
            routes: [
              {
                distance: 92000,
                duration: 5400,
                geometry: {
                  coordinates: [
                    [-37.441134, -10.682228],
                    [-37.072935, -10.946654],
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response("not found", { status: 404 });
    });

    const result = await calculatePassengerRoute({
      originAddress: ORIGIN,
      destinationAddress: "Assembléia Legislativa de Sergipe, Aracaju/Se",
      vehicleType: "carro",
      allowDemoFallback: false,
    });

    expect(result.destination.source).toBe("sergipe_catalog");
    expect(result.destination.displayName).toContain("Assembleia");
    expect(result.distance).toBeGreaterThan(50_000);
  });

  it("localiza Shopping Jardins em Aracaju via catálogo Sergipe", async () => {
    vi.spyOn(nominatim, "geocodeAddressWithNominatim").mockResolvedValue(null);

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("router.project-osrm.org/route")) {
        return new Response(
          JSON.stringify({
            code: "Ok",
            routes: [
              {
                distance: 92000,
                duration: 5400,
                geometry: {
                  coordinates: [
                    [-37.441134, -10.682228],
                    [-37.07189, -10.90089],
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response("not found", { status: 404 });
    });

    const result = await calculatePassengerRoute({
      originAddress: ORIGIN,
      destinationAddress: "Shopping Jardins, Aracaju/Se",
      vehicleType: "carro",
      allowDemoFallback: false,
    });

    expect(result.destination.source).toBe("sergipe_catalog");
    expect(result.destination.displayName).toContain("Shopping Jardins");
    expect(result.distance).toBeGreaterThan(50_000);
  });
});
