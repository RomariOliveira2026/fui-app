import {
  findDemoPlaceByPlaceId,
  findDemoPlaceByText,
  tryResolveDemoCatalog,
} from "@shared/demoMaps";
import {
  getDemoPricingByVehicleType,
  type DemoVehicleType,
} from "@shared/demoPricing";
import { DEFAULT_GEOCODING_CITY } from "@shared/mapDefaults";
import { geocodeAddressWithNominatim, reverseGeocodeWithNominatim, sleepMs } from "./nominatim";
import { ENV } from "./env";
import {
  calculateDrivingRouteWithOsrm,
  calculateDrivingRouteWithWaypoints,
  type RoutePoint,
} from "./osrmRoute";
import type { IntermediateStopInput } from "@shared/passengerPremium";

export type ResolvedLocation = {
  lat: number;
  lng: number;
  displayName: string;
  placeId?: string;
  source: "demo_catalog" | "nominatim" | "demo_fallback";
};

export type PassengerRouteCalculation = {
  origin: ResolvedLocation;
  destination: ResolvedLocation;
  intermediateStops?: ResolvedLocation[];
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  estimatedPrice: number;
  routePath: RoutePoint[];
  overviewPolyline: string;
  usedHaversineFallback: boolean;
  usedDemoLocationFallback: boolean;
};

function computeEstimatedPrice(
  vehicleType: DemoVehicleType,
  distanceM: number,
  durationS: number
): number {
  const pricing = getDemoPricingByVehicleType(vehicleType);
  if (!pricing) return 0;

  const distanceKm = distanceM / 1000;
  const durationMin = durationS / 60;
  const raw =
    pricing.basePrice +
    distanceKm * pricing.pricePerKm +
    durationMin * pricing.pricePerMinute;

  return Math.round(Math.max(raw, pricing.minimumPrice));
}

function parseCoordPlaceId(placeId: string): { lat: number; lng: number } | null {
  if (!placeId.startsWith("coord:")) return null;
  const pair = placeId.slice("coord:".length);
  const match = pair.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parseLatLngStrings(
  lat?: string,
  lng?: string
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null;
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  return { lat: parsedLat, lng: parsedLng };
}

async function resolveLocation(
  address: string,
  placeId: string | undefined,
  allowDemoFallback: boolean,
  coords?: { lat: number; lng: number } | null
): Promise<ResolvedLocation | null> {
  const trimmed = address.trim();

  const coordFromPlaceId = placeId ? parseCoordPlaceId(placeId) : null;
  const pinnedCoords = coords ?? coordFromPlaceId;
  if (pinnedCoords) {
    const reversed = await reverseGeocodeWithNominatim(pinnedCoords.lat, pinnedCoords.lng);
    if (reversed && !reversed.isCoarse) {
      return {
        lat: pinnedCoords.lat,
        lng: pinnedCoords.lng,
        displayName: reversed.displayName,
        placeId: placeId ?? reversed.placeId,
        source: "nominatim",
      };
    }
    if (trimmed.length >= 2) {
      return {
        lat: pinnedCoords.lat,
        lng: pinnedCoords.lng,
        displayName: trimmed,
        placeId: placeId ?? `coord:${pinnedCoords.lat},${pinnedCoords.lng}`,
        source: "nominatim",
      };
    }
  }

  if (placeId?.startsWith("demo-")) {
    const demo = findDemoPlaceByPlaceId(placeId);
    const exactDemo = findDemoPlaceByText(trimmed);
    if (demo && exactDemo?.placeId === placeId) {
      return {
        lat: demo.lat,
        lng: demo.lng,
        displayName: demo.description,
        placeId: demo.placeId,
        source: "demo_catalog",
      };
    }
  }

  if (trimmed.length >= 2) {
    const exactDemo = findDemoPlaceByText(trimmed);
    if (exactDemo) {
      return {
        lat: exactDemo.lat,
        lng: exactDemo.lng,
        displayName: exactDemo.description,
        placeId: exactDemo.placeId,
        source: "demo_catalog",
      };
    }
  }

  if (trimmed.length >= 2) {
    const geoCity = ENV.appCity || DEFAULT_GEOCODING_CITY;
    const geocoded = await geocodeAddressWithNominatim(trimmed, geoCity);
    if (geocoded) {
      return {
        lat: geocoded.lat,
        lng: geocoded.lng,
        displayName: geocoded.displayName,
        placeId: geocoded.placeId,
        source: "nominatim",
      };
    }
  }

  if (allowDemoFallback && trimmed.length >= 2) {
    const fallback = tryResolveDemoCatalog(trimmed);
    if (fallback) {
      const partialDemo = findDemoPlaceByText(fallback.address);
      return {
        lat: fallback.lat,
        lng: fallback.lng,
        displayName: fallback.address,
        placeId: partialDemo?.placeId,
        source: "demo_fallback",
      };
    }
  }

  return null;
}

async function resolveStops(
  stops: IntermediateStopInput[] | undefined,
  allowDemoFallback: boolean
): Promise<ResolvedLocation[]> {
  const resolved: ResolvedLocation[] = [];
  if (!stops?.length) return resolved;

  for (const stop of stops) {
    await sleepMs(1100);
    const location = await resolveLocation(stop.address, stop.placeId, allowDemoFallback);
    if (!location) {
      throw new Error(`Não foi possível localizar a parada: ${stop.address}`);
    }
    resolved.push(location);
  }
  return resolved;
}

export async function calculatePassengerRoute(input: {
  originAddress: string;
  destinationAddress: string;
  vehicleType: DemoVehicleType;
  originPlaceId?: string;
  destinationPlaceId?: string;
  originLat?: string;
  originLng?: string;
  destinationLat?: string;
  destinationLng?: string;
  intermediateStops?: IntermediateStopInput[];
  allowDemoFallback?: boolean;
}): Promise<PassengerRouteCalculation> {
  const allowDemoFallback = input.allowDemoFallback ?? false;
  const originCoords = parseLatLngStrings(input.originLat, input.originLng);

  const origin = await resolveLocation(
    input.originAddress,
    input.originPlaceId,
    allowDemoFallback,
    originCoords
  );
  if (!origin) {
    throw new Error("Não foi possível localizar a origem. Verifique o endereço.");
  }

  await sleepMs(1100);

  const intermediateStops = await resolveStops(input.intermediateStops, allowDemoFallback);

  if (intermediateStops.length > 0) {
    await sleepMs(1100);
  }

  const destinationCoords = parseLatLngStrings(input.destinationLat, input.destinationLng);

  const destination = await resolveLocation(
    input.destinationAddress,
    input.destinationPlaceId,
    allowDemoFallback,
    destinationCoords
  );
  if (!destination) {
    throw new Error("Não foi possível localizar o destino. Verifique o endereço.");
  }

  const waypoints: RoutePoint[] = [
    { lat: origin.lat, lng: origin.lng },
    ...intermediateStops.map((s) => ({ lat: s.lat, lng: s.lng })),
    { lat: destination.lat, lng: destination.lng },
  ];

  const route =
    waypoints.length > 2
      ? await calculateDrivingRouteWithWaypoints(waypoints)
      : await calculateDrivingRouteWithOsrm(waypoints[0]!, waypoints[1]!);

  const estimatedPrice = computeEstimatedPrice(
    input.vehicleType,
    route.distance.value,
    route.duration.value
  );

  return {
    origin,
    destination,
    intermediateStops: intermediateStops.length > 0 ? intermediateStops : undefined,
    distance: route.distance.value,
    duration: route.duration.value,
    distanceText: route.distance.text,
    durationText: route.duration.text,
    estimatedPrice,
    routePath: route.routePath,
    overviewPolyline: route.overviewPolyline,
    usedHaversineFallback: route.usedHaversineFallback,
    usedDemoLocationFallback:
      origin.source === "demo_fallback" ||
      destination.source === "demo_fallback" ||
      intermediateStops.some((s) => s.source === "demo_fallback"),
  };
}
