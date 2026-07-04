import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { isMapsConfigured, makeRequest } from "../_core/map";
import { ENV } from "../_core/env";
import {
  demoDirections,
  filterDemoPlaces,
  findDemoPlaceByPlaceId,
  findDemoPlaceByText,
} from "@shared/demoMaps";
import type { GeocodingResult, DirectionsResult } from "../_core/map";
import {
  geocodeAddressWithNominatim,
  lookupPlaceIdWithNominatim,
  reverseGeocodeWithNominatim,
  searchPlacesWithNominatim,
  sleepMs,
} from "../_core/nominatim";
import { getDefaultOperationCenter, extractCityFromAddress, rankByLocality, resolveGeocodingScope, resolveHintCity } from "@shared/mapDefaults";
import { findSergipeKnownPlace, findSergipeKnownPlaceByPlaceId, searchSergipeKnownPlaces } from "@shared/sergipeKnownPlaces";
import { calculateDrivingRouteWithOsrm } from "../_core/osrmRoute";
import { calculatePassengerRoute } from "../_core/passengerRoute";

const demoVehicleTypeSchema = z.enum(["moto", "carro", "van", "utilitario"]);

async function geocodeWithOsmOrDemo(params: {
  address?: string;
  placeId?: string;
}): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
} | null> {
  if (params.placeId) {
    const demo = findDemoPlaceByPlaceId(params.placeId);
    if (demo) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        formattedAddress: demo.description,
        placeId: demo.placeId,
      };
    }

    const sergipe = findSergipeKnownPlaceByPlaceId(params.placeId);
    if (sergipe) {
      return {
        lat: sergipe.lat,
        lng: sergipe.lng,
        formattedAddress: sergipe.displayName,
        placeId: sergipe.placeId,
      };
    }

    const byPlaceId = await lookupPlaceIdWithNominatim(params.placeId);
    if (byPlaceId) {
      return {
        lat: byPlaceId.lat,
        lng: byPlaceId.lng,
        formattedAddress: byPlaceId.displayName,
        placeId: byPlaceId.placeId,
      };
    }
  }

  if (params.address && params.address.trim().length >= 2) {
    const trimmed = params.address.trim();
    const known = findSergipeKnownPlace(trimmed);
    if (known) {
      return {
        lat: known.lat,
        lng: known.lng,
        formattedAddress: known.displayName,
        placeId: known.placeId,
      };
    }

    const scope = resolveGeocodingScope(ENV.appCity);
    const hintCity = resolveHintCity(trimmed, scope);
    const nominatim = await geocodeAddressWithNominatim(trimmed, scope.operationalCity);
    if (nominatim) {
      return {
        lat: nominatim.lat,
        lng: nominatim.lng,
        formattedAddress: nominatim.displayName,
        placeId: nominatim.placeId,
      };
    }
  }

  return null;
}

function parseLatLngPair(value: string): { lat: number; lng: number } | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function resolveEndpoint(value: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
} | null> {
  const coords = parseLatLngPair(value);
  if (coords) {
    return { ...coords, formattedAddress: value };
  }

  if (value.startsWith("place_id:")) {
    const placeId = value.slice("place_id:".length);
    const demo = findDemoPlaceByPlaceId(placeId);
    if (demo) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        formattedAddress: demo.description,
        placeId: demo.placeId,
      };
    }
    return geocodeWithOsmOrDemo({ placeId });
  }

  return geocodeWithOsmOrDemo({ address: value });
}

async function resolveDirectionsWithOsrm(origin: string, destination: string) {
  const start = await resolveEndpoint(origin);
  const end = await resolveEndpoint(destination);

  if (!start || !end) {
    return demoDirections(origin, destination);
  }

  const route = await calculateDrivingRouteWithOsrm(start, end);
  return {
    distance: route.distance,
    duration: route.duration,
    startAddress: start.formattedAddress,
    endAddress: end.formattedAddress,
    startLocation: route.startLocation,
    endLocation: route.endLocation,
    overviewPolyline: route.overviewPolyline,
    routePath: route.routePath,
    steps: [] as Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      instructions: string;
      startLocation: { lat: number; lng: number };
      endLocation: { lat: number; lng: number };
    }>,
  };
}

function nominatimToAutocompletePredictions(
  places: Awaited<ReturnType<typeof searchPlacesWithNominatim>>
) {
  return places.map((p) => {
    const parts = p.displayName.split(",");
    const mainText = parts[0]?.trim() || p.displayName;
    const secondaryText = parts.slice(1).join(",").trim();
    return {
      description: p.displayName,
      place_id: p.placeId,
      structured_formatting: {
        main_text: mainText,
        secondary_text: secondaryText,
      },
      types: ["geocode"] as string[],
    };
  });
}

async function geocodeWithoutGoogle(params: {
  address?: string;
  placeId?: string;
  latlng?: string;
}): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
  isCoarse?: boolean;
} | null> {
  if (params.placeId) {
    const demo = findDemoPlaceByPlaceId(params.placeId);
    if (demo) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        formattedAddress: demo.description,
        placeId: demo.placeId,
      };
    }
  }

  if (params.address) {
    const osm = await geocodeWithOsmOrDemo({
      address: params.address,
      placeId: params.placeId,
    });
    if (osm) return osm;
  }

  if (params.latlng) {
    const parsed = parseLatLngPair(params.latlng);
    if (parsed) {
      const reversed = await reverseGeocodeWithNominatim(parsed.lat, parsed.lng);
      if (reversed) {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          formattedAddress: reversed.displayName,
          placeId: reversed.placeId,
          isCoarse: reversed.isCoarse ?? false,
        };
      }
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        formattedAddress: params.latlng,
        placeId: `coord:${parsed.lat},${parsed.lng}`,
        isCoarse: true,
      };
    }
  }

  return null;
}

export const mapsRouter = router({
  /** Whether Google Maps REST APIs are configured (direct key or Forge proxy). */
  isConfigured: publicProcedure.query(() => isMapsConfigured()),

  /**
   * Place Autocomplete - Real-time suggestions as user types
   */
  autocomplete: publicProcedure
    .input(z.object({
      input: z.string().min(2),
      location: z.string().optional(), // "lat,lng" to bias results
      radius: z.number().optional(),
      language: z.string().optional().default("pt-BR"),
      components: z.string().optional(),
    }))
    .query(async ({ input: params }) => {
      const scope = resolveGeocodingScope(ENV.appCity);
      const city = scope.operationalCity ?? "";
      const hasLocalOperation = scope.useRegionalViewbox;
      const opCenter = getDefaultOperationCenter(ENV.appCity);
      const defaultLocation = hasLocalOperation
        ? `${opCenter.lat},${opCenter.lng}`
        : undefined;
      const location = params.location ?? defaultLocation;
      const radius = params.radius ?? (hasLocalOperation ? 25000 : 50000);
      const components = params.components ?? "country:br";

      if (!isMapsConfigured()) {
        const hintCity = extractCityFromAddress(params.input) ?? resolveHintCity(params.input, scope);
        const demoPredictions = filterDemoPlaces(params.input).map((p) => ({
          description: p.description,
          place_id: p.placeId,
          structured_formatting: {
            main_text: p.mainText,
            secondary_text: p.secondaryText,
          },
          types: ["geocode"] as string[],
        }));

        await sleepMs(300);
        const nominatim = await searchPlacesWithNominatim(params.input, 8, {
          city: hintCity || undefined,
          useViewbox: hasLocalOperation,
        });
        const nominatimPredictions = nominatimToAutocompletePredictions(nominatim);
        const catalogPredictions = searchSergipeKnownPlaces(params.input).map((p) => ({
          description: p.displayName,
          place_id: p.placeId,
          structured_formatting: {
            main_text: p.displayName.split(",")[0]?.trim() || p.displayName,
            secondary_text: p.displayName.split(",").slice(1).join(",").trim(),
          },
          types: ["geocode"] as string[],
        }));

        const seen = new Set<string>();
        const merged: typeof demoPredictions = [];
        for (const prediction of [...catalogPredictions, ...demoPredictions, ...nominatimPredictions]) {
          const key = prediction.description.trim().toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(prediction);
        }

        return hasLocalOperation ? rankByLocality(merged, hintCity || city) : merged;
      }

      const autocompleteParams: Record<string, unknown> = {
        input: params.input,
        radius,
        language: params.language,
        components,
      };
      if (location) {
        autocompleteParams.location = location;
      }

      const result = await makeRequest<{
        predictions: Array<{
          description: string;
          place_id: string;
          structured_formatting: {
            main_text: string;
            secondary_text: string;
          };
          types: string[];
        }>;
        status: string;
      }>("/maps/api/place/autocomplete/json", autocompleteParams);

      if (result.status === "OK" || result.status === "ZERO_RESULTS") {
        const predictions = result.predictions || [];
        if (hasLocalOperation && predictions.length > 1) {
          return rankByLocality(predictions, city);
        }
        return predictions;
      }

      return [];
    }),

  /**
   * Geocode - Convert address to coordinates
   */
  geocode: publicProcedure
    .input(z.object({
      address: z.string().optional(),
      placeId: z.string().optional(),
      latlng: z.string().optional(), // For reverse geocoding
      language: z.string().optional().default("pt-BR"),
    }))
    .query(async ({ input: params }) => {
      if (params.latlng) {
        const parsed = parseLatLngPair(params.latlng);
        if (parsed) {
          const reversed = await reverseGeocodeWithNominatim(parsed.lat, parsed.lng);
          if (reversed) {
            return {
              lat: parsed.lat,
              lng: parsed.lng,
              formattedAddress: reversed.displayName,
              placeId: reversed.placeId,
              isCoarse: reversed.isCoarse ?? false,
            };
          }
          return {
            lat: parsed.lat,
            lng: parsed.lng,
            formattedAddress: params.latlng,
            placeId: `coord:${parsed.lat},${parsed.lng}`,
            isCoarse: true,
          };
        }
      }

      if (!isMapsConfigured()) {
        return geocodeWithoutGoogle(params);
      }

      const queryParams: Record<string, unknown> = {
        language: params.language,
      };

      if (params.placeId) {
        queryParams.place_id = params.placeId;
      } else if (params.latlng) {
        queryParams.latlng = params.latlng;
      } else if (params.address) {
        queryParams.address = params.address;
      } else {
        return null;
      }

      const result = await makeRequest<GeocodingResult>(
        "/maps/api/geocode/json",
        queryParams
      );

      if (result.status !== "OK" || !result.results.length) {
        return null;
      }

      const first = result.results[0];
      return {
        lat: first.geometry.location.lat,
        lng: first.geometry.location.lng,
        formattedAddress: first.formatted_address,
        placeId: first.place_id,
      };
    }),

  /**
   * Directions - Get route between two points
   */
  directions: publicProcedure
    .input(z.object({
      origin: z.string(), // "lat,lng" or address or place_id:xxx
      destination: z.string(),
      mode: z.enum(["driving", "walking", "bicycling", "transit"]).optional().default("driving"),
      language: z.string().optional().default("pt-BR"),
      alternatives: z.boolean().optional().default(false),
    }))
    .query(async ({ input: params }) => {
      if (!isMapsConfigured()) {
        return resolveDirectionsWithOsrm(params.origin, params.destination);
      }

      try {
        const result = await makeRequest<DirectionsResult>(
          "/maps/api/directions/json",
          {
            origin: params.origin,
            destination: params.destination,
            mode: params.mode,
            language: params.language,
            alternatives: params.alternatives,
          }
        );

        if (result.status !== "OK" || !result.routes.length) {
          return resolveDirectionsWithOsrm(params.origin, params.destination);
        }

        const route = result.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance,
          duration: leg.duration,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          startLocation: leg.start_location,
          endLocation: leg.end_location,
          overviewPolyline: route.overview_polyline.points,
          steps: leg.steps.map(s => ({
            distance: s.distance,
            duration: s.duration,
            instructions: s.html_instructions,
            startLocation: s.start_location,
            endLocation: s.end_location,
          })),
        };
      } catch (error) {
        console.warn("[maps] Google directions failed, falling back to OSRM:", error);
        return resolveDirectionsWithOsrm(params.origin, params.destination);
      }
    }),

  /**
   * Place Details - Get details for a place_id
   */
  placeDetails: publicProcedure
    .input(z.object({
      placeId: z.string(),
      fields: z.string().optional().default("geometry,formatted_address,name"),
      language: z.string().optional().default("pt-BR"),
    }))
    .query(async ({ input: params }) => {
      if (!isMapsConfigured() && !ENV.isProduction) {
        const place = findDemoPlaceByPlaceId(params.placeId);
        if (place) {
          return {
            placeId: place.placeId,
            name: place.mainText,
            formattedAddress: place.description,
            lat: place.lat,
            lng: place.lng,
          };
        }
        return null;
      }

      const result = await makeRequest<{
        result: {
          place_id: string;
          name: string;
          formatted_address: string;
          geometry: {
            location: { lat: number; lng: number };
          };
        };
        status: string;
      }>("/maps/api/place/details/json", {
        place_id: params.placeId,
        fields: params.fields,
        language: params.language,
      });

      if (result.status !== "OK") {
        return null;
      }

      return {
        placeId: result.result.place_id,
        name: result.result.name,
        formattedAddress: result.result.formatted_address,
        lat: result.result.geometry.location.lat,
        lng: result.result.geometry.location.lng,
      };
    }),

  /**
   * Calcula rota real do passageiro: Nominatim + OSRM (+ fallback local só se necessário).
   */
  calculatePassengerRoute: publicProcedure
    .input(
      z.object({
        originAddress: z.string().min(2),
        destinationAddress: z.string().min(2),
        vehicleType: demoVehicleTypeSchema,
        originPlaceId: z.string().optional(),
        destinationPlaceId: z.string().optional(),
        originLat: z.string().optional(),
        originLng: z.string().optional(),
        destinationLat: z.string().optional(),
        destinationLng: z.string().optional(),
        intermediateStops: z
          .array(
            z.object({
              address: z.string().min(2),
              placeId: z.string().optional(),
            })
          )
          .max(2)
          .optional(),
        allowDemoFallback: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      return calculatePassengerRoute(input);
    }),
});
