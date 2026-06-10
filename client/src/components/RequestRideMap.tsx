/**
 * Mapa de /request-ride — facade que alterna Leaflet (OSM) ou Google Maps.
 *
 * Troca de provedor: VITE_REQUEST_RIDE_MAP_PROVIDER=leaflet | google
 * Padrão: leaflet (demo local sem billing Google).
 *
 * RequestRide.tsx importa apenas este componente; backends ficam isolados.
 */

import { getRequestRideMapProvider } from "@/lib/requestRideMapConfig";
import { RequestRideMapGoogle } from "@/components/requestRideMap/RequestRideMapGoogle";
import { RequestRideMapLeaflet } from "@/components/requestRideMap/RequestRideMapLeaflet";
import type { RequestRideMapViewProps } from "@/components/requestRideMap/types";

export type { RequestRideMapPoint, RequestRideMapViewProps } from "@/components/requestRideMap/types";

export function RequestRideMap(props: RequestRideMapViewProps) {
  const provider = getRequestRideMapProvider();

  if (provider === "google") {
    return <RequestRideMapGoogle {...props} />;
  }

  return <RequestRideMapLeaflet {...props} />;
}

export default RequestRideMap;
