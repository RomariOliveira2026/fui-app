import {
  BRAZIL_MAP_CENTER,
  BRAZIL_MAP_OVERVIEW_ZOOM,
  STREET_LEVEL_MAP_ZOOM,
} from "@shared/mapDefaults";

/** Contrato compartilhado entre backends Leaflet e Google em /request-ride. */
export type RequestRideMapPoint = { lat: number; lng: number };

export type DemoFleetMapMarker = {
  driverId: number;
  name: string;
  lat: number;
  lng: number;
  vehicleType: string;
  status: string;
};

export type RequestRideMapViewProps = {
  className?: string;
  origin?: RequestRideMapPoint | null;
  destination?: RequestRideMapPoint | null;
  /** Posição do motorista (corrida em tempo real). */
  driver?: RequestRideMapPoint | null;
  /** Motoristas demo próximos (modo operacional). */
  nearbyDrivers?: DemoFleetMapMarker[] | null;
  /** Pontos da rota para Leaflet (prioridade sobre polyline codificada). */
  routePath?: Array<{ lat: number; lng: number }> | null;
  /** Polyline codificada (formato Google) — linha direta A→B se ausente. */
  encodedPolyline?: string | null;
  /** Enquadramento inteligente do mapa de rastreamento. */
  trackingPhase?: "searching" | "driver_found" | "en_route" | "arriving" | "waiting_pickup" | "in_trip" | "completed";
};

/** Centro padrão do mapa até o GPS do usuário (visão Brasil). */
export const REQUEST_RIDE_MAP_DEFAULT_CENTER = BRAZIL_MAP_CENTER;

export const REQUEST_RIDE_MAP_DEFAULT_ZOOM = BRAZIL_MAP_OVERVIEW_ZOOM;
export const REQUEST_RIDE_MAP_STREET_ZOOM = STREET_LEVEL_MAP_ZOOM;
