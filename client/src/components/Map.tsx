/**
 * LEAFLET + OPENSTREETMAP MAP COMPONENT
 * 
 * Free, no API key required, works on any domain.
 * Uses OSRM for routing (free, no limits).
 * Uses Nominatim for geocoding (free, rate-limited to 1 req/sec).
 * 
 * CRITICAL: This component uses DOM isolation to prevent React 19 from
 * interfering with Leaflet's direct DOM manipulation. The map container
 * is managed entirely outside React's virtual DOM reconciliation.
 * 
 * USAGE:
 * ======
 * import { LeafletMap, geocodeAddress, calculateRoute } from "@/components/Map";
 * 
 * <LeafletMap
 *   initialCenter={[-10.6833, -37.4250]}
 *   initialZoom={14}
 *   onMapReady={(map) => { mapRef.current = map; }}
 * />
 */

import { useEffect, useRef, useCallback, memo } from "react";
import { BRAZIL_MAP_CENTER, STREET_LEVEL_MAP_ZOOM } from "@shared/mapDefaults";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ==========================================
// GEOCODING (Nominatim - Free, no key needed)
// ==========================================

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Geocode an address string to coordinates using Nominatim
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`;
  
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "pt-BR",
      "User-Agent": "FuiApp/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar endereço");
  }

  const results = await response.json();
  
  if (!results || results.length === 0) {
    throw new Error("Endereço não encontrado");
  }

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "pt-BR",
      "User-Agent": "FuiApp/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar endereço");
  }

  const result = await response.json();
  return result.display_name || "Endereço desconhecido";
}

// ==========================================
// ROUTING (OSRM - Free, no key needed)
// ==========================================

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: [number, number][]; // [lat, lng] pairs
}

/**
 * Calculate route between two points using OSRM
 */
export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult> {
  // OSRM uses lng,lat format (opposite of Leaflet)
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao calcular rota");
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("Não foi possível calcular a rota");
  }

  const route = data.routes[0];
  
  // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
  const geometry: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  return {
    distance: Math.round(route.distance), // meters
    duration: Math.round(route.duration), // seconds
    geometry,
  };
}

// ==========================================
// MAP COMPONENT (DOM-Isolated from React)
// ==========================================

/** Pane da rota — abaixo dos rótulos de ruas/rodovias. */
export const ROUTE_MAP_PANE = "fui-route-pane";
/** Pane dos rótulos Carto — acima da rota laranja. */
export const LABELS_MAP_PANE = "fui-labels-pane";

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Base sem rótulos + camada de nomes por cima da rota (via/pane). */
export function setupLayeredBaseMap(map: L.Map): void {
  if (!map.getPane(ROUTE_MAP_PANE)) {
    map.createPane(ROUTE_MAP_PANE);
    const routePane = map.getPane(ROUTE_MAP_PANE);
    if (routePane) routePane.style.zIndex = "350";
  }

  if (!map.getPane(LABELS_MAP_PANE)) {
    map.createPane(LABELS_MAP_PANE);
    const labelsPane = map.getPane(LABELS_MAP_PANE);
    if (labelsPane) {
      labelsPane.style.zIndex = "450";
      labelsPane.style.pointerEvents = "none";
    }
  }

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
    attribution: CARTO_ATTRIBUTION,
    maxZoom: 20,
    subdomains: "abcd",
  }).addTo(map);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
    attribution: CARTO_ATTRIBUTION,
    maxZoom: 20,
    subdomains: "abcd",
    pane: LABELS_MAP_PANE,
  }).addTo(map);
}

interface LeafletMapProps {
  className?: string;
  initialCenter?: [number, number]; // [lat, lng]
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
  /** Posição dos botões +/- — use bottomright em telas com botão voltar no topo. */
  zoomControlPosition?: L.ControlPosition;
}

/**
 * LeafletMap Component - DOM Isolated
 * 
 * CRITICAL FIX: This component prevents React from reconciling the map container.
 * The outer wrapper div is managed by React, but the inner map container is created
 * via imperative DOM API and never touched by React's reconciler.
 * 
 * This prevents the "NotFoundError: Failed to execute 'insertBefore' on 'Node'"
 * error that occurs when React 19 tries to reconcile DOM nodes that Leaflet has
 * directly manipulated (tiles, markers, layers, etc).
 */
const LeafletMapInner = memo(function LeafletMapInner({
  className,
  initialCenter = [BRAZIL_MAP_CENTER.lat, BRAZIL_MAP_CENTER.lng],
  initialZoom = STREET_LEVEL_MAP_ZOOM,
  onMapReady,
  zoomControlPosition = "topleft",
}: LeafletMapProps) {
  // Ref for the outer wrapper that React manages
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Ref for the imperatively created map container (outside React's control)
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  
  // Keep callback ref updated without causing re-renders
  onMapReadyRef.current = onMapReady;

  const initMap = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || mapInstanceRef.current) return;

    // Create the map container imperatively - React will never touch this div
    const mapDiv = document.createElement("div");
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";
    mapDiv.style.minHeight = "400px";
    
    // Clear wrapper and append our imperatively created div
    wrapper.innerHTML = "";
    wrapper.appendChild(mapDiv);
    mapContainerRef.current = mapDiv;

    try {
      // Create map on our imperatively created container
      const map = L.map(mapDiv, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: zoomControlPosition }).addTo(map);

      setupLayeredBaseMap(map);

      mapInstanceRef.current = map;

      // Force a resize after mount to fix rendering issues
      requestAnimationFrame(() => {
        map.invalidateSize();
      });

      // Additional resize after a short delay for edge cases
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);

      // Notify parent
      if (onMapReadyRef.current) {
        onMapReadyRef.current(map);
      }
    } catch (err) {
      console.error("[LeafletMap] Error initializing map:", err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Silently handle cleanup errors
          console.warn("[LeafletMap] Cleanup warning:", e);
        }
        mapInstanceRef.current = null;
      }
      // Remove the imperatively created container
      if (mapContainerRef.current && mapContainerRef.current.parentNode) {
        try {
          mapContainerRef.current.parentNode.removeChild(mapContainerRef.current);
        } catch (e) {
          // Silently handle
        }
        mapContainerRef.current = null;
      }
    };
  }, [initMap]);

  return (
    <div className={cn("w-full h-[400px] relative overflow-hidden rounded-lg", className)}>
      {/* 
        This wrapper div is the boundary between React and Leaflet.
        React manages this div, but everything INSIDE it is managed by Leaflet
        via imperative DOM manipulation. We use suppressHydrationWarning and
        dangerouslySetInnerHTML={{__html: ''}} pattern is NOT used - instead
        we use a ref callback to create the map container imperatively.
      */}
      <div
        ref={wrapperRef}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      >
        {/* Loading placeholder - will be replaced by imperative map container */}
        <div className="flex items-center justify-center h-full bg-card">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200] mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Export with stable name
export function LeafletMap(props: LeafletMapProps) {
  return <LeafletMapInner {...props} />;
}

// ==========================================
// HELPER: Create custom markers
// ==========================================

/**
 * Create a colored circle marker (similar to Google Maps style)
 */
export function createCircleMarker(
  map: L.Map,
  position: [number, number],
  options: {
    color: string;
    label: string;
    title?: string;
  }
): L.Marker {
  const icon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${options.color};
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 13px;
      ">${options.label}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return L.marker(position, {
    icon,
    title: options.title,
  }).addTo(map);
}

/**
 * Draw a route polyline on the map
 */
export function drawRoute(
  map: L.Map,
  geometry: [number, number][],
  options?: {
    color?: string;
    weight?: number;
    opacity?: number;
    fitBounds?: boolean;
  }
): L.Polyline {
  const routePane = map.getPane(ROUTE_MAP_PANE) ? ROUTE_MAP_PANE : undefined;
  const polyline = L.polyline(geometry, {
    color: options?.color || "#F39200",
    weight: options?.weight || 5,
    opacity: options?.opacity ?? 0.72,
    lineCap: "round",
    lineJoin: "round",
    pane: routePane,
    interactive: false,
  }).addTo(map);

  if (options?.fitBounds !== false) {
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  }

  return polyline;
}

// Keep backward compatibility - export MapView as alias
export const MapView = LeafletMap;
