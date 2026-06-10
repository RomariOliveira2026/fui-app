import { calculateRoute } from "@/components/Map";
import {
  demoDirections,
  encodeDemoPolyline,
  findDemoPlaceByPlaceId,
  resolveDemoLocation,
} from "@shared/demoMaps";
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

/** Rota estável para demo local — OSRM (OSM) com fallback em lugares de Itabaiana. */
export async function fetchLocalPassengerRoute(
  originAddress: string,
  destinationAddress: string,
  originPlaceId?: string,
  destinationPlaceId?: string
): Promise<LocalPassengerRoute> {
  const originKey = toRouteKey(originAddress, originPlaceId);
  const destKey = toRouteKey(destinationAddress, destinationPlaceId);

  const start = resolveDemoLocation(originKey);
  const end = resolveDemoLocation(destKey);

  try {
    const osrm = await calculateRoute(
      { lat: start.lat, lng: start.lng },
      { lat: end.lat, lng: end.lng }
    );

    const routePath = osrm.geometry.map(([lat, lng]) => ({ lat, lng }));

    return {
      distance: { text: formatDistance(osrm.distance), value: osrm.distance },
      duration: { text: formatDuration(osrm.duration), value: osrm.duration },
      startLocation: { lat: start.lat, lng: start.lng },
      endLocation: { lat: end.lat, lng: end.lng },
      overviewPolyline: encodeDemoPolyline(routePath),
      routePath,
    };
  } catch (error) {
    console.warn("[fetchLocalPassengerRoute] OSRM failed, using demo route:", error);
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
export function resolveLocalCoords(
  address: string,
  placeId?: string
): { lat: number; lng: number } | null {
  if (placeId) {
    const place = findDemoPlaceByPlaceId(placeId);
    if (place) return { lat: place.lat, lng: place.lng };
  }
  const loc = resolveDemoLocation(address);
  return { lat: loc.lat, lng: loc.lng };
}
