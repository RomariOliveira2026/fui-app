import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculatePassengerRoute } from "./_core/passengerRoute";

describe("calculatePassengerRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses real geocoding and OSRM distance for long trips", async () => {
    const nominatimResponses = [
      [
        {
          lat: "-10.6850",
          lon: "-37.4250",
          display_name: "Centro, Itabaiana, Sergipe, Brasil",
          place_id: 1,
          osm_type: "node",
          osm_id: 100,
        },
      ],
      [
        {
          lat: "-11.2687",
          lon: "-37.4485",
          display_name: "Estância, Sergipe, Brasil",
          place_id: 2,
          osm_type: "relation",
          osm_id: 200,
        },
      ],
    ];

    let nominatimCall = 0;
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("nominatim.openstreetmap.org/search")) {
        const body = nominatimResponses[nominatimCall] ?? [];
        nominatimCall += 1;
        return new Response(JSON.stringify(body), { status: 200 });
      }

      if (url.includes("router.project-osrm.org/route")) {
        return new Response(
          JSON.stringify({
            code: "Ok",
            routes: [
              {
                distance: 78500,
                duration: 4200,
                geometry: {
                  coordinates: [
                    [-37.425, -10.685],
                    [-37.4485, -11.2687],
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
      originAddress: "Centro, Itabaiana, SE",
      destinationAddress: "Estância, SE",
      vehicleType: "carro",
      allowDemoFallback: false,
    });

    expect(result.origin.displayName).toContain("Itabaiana");
    expect(result.destination.displayName).toContain("Estância");
    expect(result.distance).toBeGreaterThan(50_000);
    expect(result.estimatedPrice).toBeGreaterThan(1200);
    expect(result.usedHaversineFallback).toBe(false);
    expect(result.usedDemoLocationFallback).toBe(false);
  });

  it("falls back to haversine when OSRM fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return new Response(
          JSON.stringify([
            {
              lat: "-10.6850",
              lon: "-37.4250",
              display_name: "Centro, Itabaiana, Sergipe, Brasil",
              place_id: 1,
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes("osrm")) {
        return new Response(JSON.stringify({ code: "NoRoute" }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const result = await calculatePassengerRoute({
      originAddress: "Centro, Itabaiana",
      destinationAddress: "Centro, Itabaiana",
      vehicleType: "moto",
      allowDemoFallback: false,
    });

    expect(result.usedHaversineFallback).toBe(true);
    expect(result.distance).toBeGreaterThan(0);
  });
});
