import {
  demoDirections,
  encodeDemoPolyline,
  findDemoPlaceByPlaceId,
  tryResolveDemoCatalog,
} from "@shared/demoMaps";
import { geocodeAddress, calculateRoute } from "@/components/Map";
import { appendCountryToAddress } from "@shared/mapDefaults";
import type { ResolvedRoute } from "@/lib/demoRoute";

export type LocalPassengerRoute = ResolvedRoute & {
  /** Geometria pronta para Leaflet (preferível à polyline codificada). */
  routePath?: Array<{ lat: number; lng: number }>;
};

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

function toRouteKey(address: string, placeId?: string): string {
  if (placeId) return `place_id:${placeId}`;
  return address.trim();
}

async function resolveRoutePoint(
  address: string,
  placeId?: string
): Promise<{ lat: number; lng: number }> {
  if (placeId) {
    const place = findDemoPlaceByPlaceId(placeId);
    if (place) return { lat: place.lat, lng: place.lng };
  }

  const catalog = tryResolveDemoCatalog(toRouteKey(address, placeId));
  if (catalog) return { lat: catalog.lat, lng: catalog.lng };

  const geocoded = await geocodeAddress(appendCountryToAddress(address));
  return { lat: geocoded.lat, lng: geocoded.lng };
}

/** Rota local via OSRM (OSM), com geocoding nacional. */
export async function fetchLocalPassengerRoute(
  originAddress: string,
  destinationAddress: string,
  originPlaceId?: string,
  destinationPlaceId?: string
): Promise<LocalPassengerRoute> {
  const start = await resolveRoutePoint(originAddress, originPlaceId);
  const end = await resolveRoutePoint(destinationAddress, destinationPlaceId);

  try {
    const osrm = await calculateRoute(start, end);
    const routePath = osrm.geometry.map(([lat, lng]) => ({ lat, lng }));

    return {
      distance: { text: formatDistance(osrm.distance), value: osrm.distance },
      duration: { text: formatDuration(osrm.duration), value: osrm.duration },
      startLocation: start,
      endLocation: end,
      overviewPolyline: encodeDemoPolyline(routePath),
      routePath,
    };
  } catch (error) {
    console.warn("[fetchLocalPassengerRoute] OSRM failed, using demo route:", error);
    const originKey = toRouteKey(originAddress, originPlaceId);
    const destKey = toRouteKey(destinationAddress, destinationPlaceId);
    const demo = demoDirections(originKey, destKey);
    return {
      ...demo,
      routePath: [
        { lat: demo.startLocation.lat, lng: demo.startLocation.lng },
        { lat: demo.endLocation.lat, lng: demo.endLocation.lng },
      ],
    };
  }
}

/** Resolve coordenadas a partir de endereço ou placeId demo. */
export async function resolveLocalCoords(
  address: string,
  placeId?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    return await resolveRoutePoint(address, placeId);
  } catch {
    return null;
  }
}
