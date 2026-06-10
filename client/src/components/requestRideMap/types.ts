/** Contrato compartilhado entre backends Leaflet e Google em /request-ride. */
export type RequestRideMapPoint = { lat: number; lng: number };

export type RequestRideMapViewProps = {
  className?: string;
  origin?: RequestRideMapPoint | null;
  destination?: RequestRideMapPoint | null;
  /** Posição do motorista (corrida em tempo real). */
  driver?: RequestRideMapPoint | null;
  /** Pontos da rota para Leaflet (prioridade sobre polyline codificada). */
  routePath?: Array<{ lat: number; lng: number }> | null;
  /** Polyline codificada (formato Google) — linha direta A→B se ausente. */
  encodedPolyline?: string | null;
  /** Enquadramento inteligente do mapa de rastreamento. */
  trackingPhase?: "searching" | "driver_found" | "en_route" | "arriving" | "waiting_pickup" | "in_trip" | "completed";
};

/** Centro padrão: Itabaiana, SE */
export const REQUEST_RIDE_MAP_DEFAULT_CENTER = {
  lat: -10.6833,
  lng: -37.4250,
} as const;

export const REQUEST_RIDE_MAP_DEFAULT_ZOOM = 14;
