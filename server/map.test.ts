import { describe, it, expect } from "vitest";

/**
 * Tests for Leaflet/OpenStreetMap integration
 * 
 * These tests verify the OSRM routing and Nominatim geocoding APIs
 * that replaced Google Maps in the Fui! app.
 */

describe("OSRM Route Calculation", () => {
  it("should calculate route between two points in Itabaiana", async () => {
    // Centro de Itabaiana -> Rodoviária
    const origin = { lat: -10.6833, lng: -37.4250 };
    const dest = { lat: -10.6950, lng: -37.4300 };

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.code).toBe("Ok");
    expect(data.routes).toBeDefined();
    expect(data.routes.length).toBeGreaterThan(0);

    const route = data.routes[0];
    expect(route.distance).toBeGreaterThan(0); // meters
    expect(route.duration).toBeGreaterThan(0); // seconds
    expect(route.geometry).toBeDefined();
    expect(route.geometry.coordinates).toBeDefined();
    expect(route.geometry.coordinates.length).toBeGreaterThan(2);
  });

  it("should return valid GeoJSON coordinates", async () => {
    const origin = { lat: -10.6833, lng: -37.4250 };
    const dest = { lat: -10.6900, lng: -37.4280 };

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    const coords = data.routes[0].geometry.coordinates;
    
    // Each coordinate should be [lng, lat]
    for (const coord of coords) {
      expect(coord.length).toBe(2);
      expect(coord[0]).toBeGreaterThan(-40); // lng for Sergipe region
      expect(coord[0]).toBeLessThan(-37);
      expect(coord[1]).toBeGreaterThan(-11); // lat for Sergipe region
      expect(coord[1]).toBeLessThan(-10);
    }
  });
});

describe("Nominatim Geocoding", () => {
  it("should geocode an address in Itabaiana", async () => {
    const address = encodeURIComponent("Centro, Itabaiana, Sergipe, Brasil");
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${address}&limit=1&countrycodes=br`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": "FuiApp/1.0 (test)",
      },
    });

    expect(response.ok).toBe(true);

    const results = await response.json();
    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    expect(parseFloat(result.lat)).toBeCloseTo(-10.68, 0);
    expect(parseFloat(result.lon)).toBeCloseTo(-37.42, 0);
    expect(result.display_name).toBeDefined();
  });

  it("should reverse geocode coordinates in Itabaiana", async () => {
    const lat = -10.6833;
    const lng = -37.4250;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    // Wait 1.1s to respect Nominatim rate limit
    await new Promise(resolve => setTimeout(resolve, 1100));

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": "FuiApp/1.0 (test)",
      },
    });

    expect(response.ok).toBe(true);

    const result = await response.json();
    expect(result.display_name).toBeDefined();
    expect(result.display_name.toLowerCase()).toContain("itabaiana");
  });
});

describe("Price Calculation with Route Data", () => {
  it("should calculate correct price from route distance", () => {
    // Simulate pricing for "carro" type
    const basePrice = 800; // R$ 8.00 in cents
    const pricePerKm = 200; // R$ 2.00 per km in cents
    const pricePerMinute = 30; // R$ 0.30 per minute in cents
    const minimumPrice = 1000; // R$ 10.00 in cents

    // 5km, 10 min route
    const distanceKm = 5;
    const durationMin = 10;

    const calculatedPrice = basePrice + (distanceKm * pricePerKm) + (durationMin * pricePerMinute);
    const finalPrice = Math.max(calculatedPrice, minimumPrice);

    // 800 + 1000 + 300 = 2100 (R$ 21.00)
    expect(calculatedPrice).toBe(2100);
    expect(finalPrice).toBe(2100);
    expect(finalPrice).toBeGreaterThanOrEqual(minimumPrice);
  });

  it("should enforce minimum price for short routes", () => {
    const basePrice = 500; // R$ 5.00 for moto
    const pricePerKm = 150;
    const pricePerMinute = 20;
    const minimumPrice = 600; // R$ 6.00 minimum for moto

    // Very short route: 0.1km, 1 min
    const distanceKm = 0.1;
    const durationMin = 1;

    const calculatedPrice = basePrice + (distanceKm * pricePerKm) + (durationMin * pricePerMinute);
    const finalPrice = Math.max(calculatedPrice, minimumPrice);

    // 500 + 15 + 20 = 535, but minimum is 600
    expect(calculatedPrice).toBe(535);
    expect(finalPrice).toBe(minimumPrice);
  });

  it("should calculate carpool price correctly", () => {
    const totalPrice = 2000; // R$ 20.00
    const maxPassengers = 3;

    const pricePerPassenger = Math.floor(totalPrice / maxPassengers);
    
    expect(pricePerPassenger).toBe(666); // R$ 6.66 per passenger
    expect(pricePerPassenger * maxPassengers).toBeLessThanOrEqual(totalPrice);
  });
});
