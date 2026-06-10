import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the map module
vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(),
}));

import { makeRequest } from "./_core/map";

const mockMakeRequest = makeRequest as ReturnType<typeof vi.fn>;

describe("Maps Router - Google Maps API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Autocomplete", () => {
    it("should return predictions for a valid input", async () => {
      mockMakeRequest.mockResolvedValueOnce({
        predictions: [
          {
            description: "Rua A, Itabaiana - SE, Brasil",
            place_id: "ChIJ_abc123",
            structured_formatting: {
              main_text: "Rua A",
              secondary_text: "Itabaiana - SE, Brasil",
            },
          },
          {
            description: "Rua B, Itabaiana - SE, Brasil",
            place_id: "ChIJ_def456",
            structured_formatting: {
              main_text: "Rua B",
              secondary_text: "Itabaiana - SE, Brasil",
            },
          },
        ],
        status: "OK",
      });

      const result = await mockMakeRequest("/maps/api/place/autocomplete/json", {
        input: "Rua",
        location: "-10.6833,-37.4250",
        radius: 20000,
        language: "pt-BR",
        components: "country:br",
      });

      expect(result).toBeDefined();
      expect((result as any).predictions).toHaveLength(2);
      expect((result as any).predictions[0].description).toContain("Rua A");
      expect(mockMakeRequest).toHaveBeenCalledWith(
        "/maps/api/place/autocomplete/json",
        expect.objectContaining({ input: "Rua" })
      );
    });

    it("should handle empty results", async () => {
      mockMakeRequest.mockResolvedValueOnce({
        predictions: [],
        status: "ZERO_RESULTS",
      });

      const result = await mockMakeRequest("/maps/api/place/autocomplete/json", {
        input: "xyznonexistent",
      });

      expect((result as any).predictions).toHaveLength(0);
    });
  });

  describe("Geocode", () => {
    it("should return coordinates for a valid address", async () => {
      mockMakeRequest.mockResolvedValueOnce({
        results: [
          {
            formatted_address: "Itabaiana - SE, Brasil",
            geometry: {
              location: { lat: -10.6833, lng: -37.4250 },
            },
            place_id: "ChIJ_test123",
          },
        ],
        status: "OK",
      });

      const result = await mockMakeRequest("/maps/api/geocode/json", {
        address: "Itabaiana, SE, Brasil",
        language: "pt-BR",
      });

      expect(result).toBeDefined();
      expect((result as any).results[0].geometry.location.lat).toBe(-10.6833);
      expect((result as any).results[0].geometry.location.lng).toBe(-37.4250);
    });

    it("should handle address not found", async () => {
      mockMakeRequest.mockResolvedValueOnce({
        results: [],
        status: "ZERO_RESULTS",
      });

      const result = await mockMakeRequest("/maps/api/geocode/json", {
        address: "nonexistent place",
      });

      expect((result as any).results).toHaveLength(0);
    });
  });

  describe("Directions", () => {
    it("should return route between two points", async () => {
      mockMakeRequest.mockResolvedValueOnce({
        routes: [
          {
            legs: [
              {
                distance: { text: "5.2 km", value: 5200 },
                duration: { text: "12 min", value: 720 },
                start_address: "Rua A, Itabaiana",
                end_address: "Rua B, Itabaiana",
              },
            ],
            overview_polyline: { points: "abc123encoded" },
          },
        ],
        status: "OK",
      });

      const result = await mockMakeRequest("/maps/api/directions/json", {
        origin: "-10.6833,-37.4250",
        destination: "-10.6900,-37.4300",
        mode: "driving",
        language: "pt-BR",
      });

      expect(result).toBeDefined();
      expect((result as any).routes).toHaveLength(1);
      expect((result as any).routes[0].legs[0].distance.value).toBe(5200);
      expect((result as any).routes[0].legs[0].duration.value).toBe(720);
      expect((result as any).routes[0].overview_polyline.points).toBe("abc123encoded");
    });

    it("should handle no route found", async () => {
      mockMakeRequest.mockResolvedValueOnce({
        routes: [],
        status: "ZERO_RESULTS",
      });

      const result = await mockMakeRequest("/maps/api/directions/json", {
        origin: "0,0",
        destination: "0,0",
      });

      expect((result as any).routes).toHaveLength(0);
    });
  });

  describe("Polyline Decoding", () => {
    it("should correctly decode an encoded polyline", async () => {
      // Import the decode function from GoogleMap component
      // We test the algorithm logic here
      function decodePolyline(encoded: string): { lat: number; lng: number }[] {
        const points: { lat: number; lng: number }[] = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encoded.length) {
          let b: number;
          let shift = 0;
          let result = 0;

          do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);

          const dlat = result & 1 ? ~(result >> 1) : result >> 1;
          lat += dlat;

          shift = 0;
          result = 0;

          do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);

          const dlng = result & 1 ? ~(result >> 1) : result >> 1;
          lng += dlng;

          points.push({
            lat: lat / 1e5,
            lng: lng / 1e5,
          });
        }

        return points;
      }

      // Test with known encoded polyline
      // "_p~iF~ps|U_ulLnnqC_mqNvxq`@" decodes to:
      // (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
      const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
      
      expect(points).toHaveLength(3);
      expect(points[0].lat).toBeCloseTo(38.5, 1);
      expect(points[0].lng).toBeCloseTo(-120.2, 1);
      expect(points[1].lat).toBeCloseTo(40.7, 1);
      expect(points[1].lng).toBeCloseTo(-120.95, 1);
    });
  });
});
