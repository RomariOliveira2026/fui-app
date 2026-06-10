/**
 * GOOGLE MAPS COMPONENT
 *
 * Loads Google Maps JavaScript API via:
 * 1. VITE_GOOGLE_MAPS_API_KEY (direct script tag)
 * 2. Manus Forge proxy (VITE_FRONTEND_FORGE_*)
 * 3. Demo SVG map in dev when no credentials are available
 */

import { useEffect, useRef, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  addDemoMarker,
  createDemoMap,
  drawDemoRoute,
  isDemoMap,
  type DemoMapHandle,
} from "@/lib/demoMapFallback";
import {
  getGoogleMapsApiKey,
  hasForgeMapsCredentials,
  shouldUseDemoMapFallback,
} from "@/lib/googleMapsConfig";

// ==========================================
// Google Maps Loader (singleton)
// ==========================================

let googleMapsPromise: Promise<typeof google.maps> | null = null;
let googleMapsLoaded = false;

// Reset state on HMR to avoid stale script references
if ((import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    googleMapsPromise = null;
    googleMapsLoaded = false;
  });
}

function getForgeGoogleMapsApiUrl(): string {
  const baseUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "";
  const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY || "";

  if (!baseUrl || !apiKey) {
    return "";
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}/v1/maps/proxy/maps/api/js?key=${apiKey}&libraries=places,geometry&language=pt-BR&region=BR&callback=__googleMapsCallback`;
}

function getDirectGoogleMapsApiUrl(): string {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return "";
  return `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&language=pt-BR&region=BR&callback=__googleMapsCallback`;
}

function loadGoogleMapsViaScriptTag(url: string): Promise<typeof google.maps> {
  return new Promise((resolve, reject) => {
    if (googleMapsLoaded && window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const onReady = () => {
      if (window.google?.maps) {
        googleMapsLoaded = true;
        resolve(window.google.maps);
      }
    };

    (window as any).__googleMapsCallback = onReady;

    const existing = document.querySelector('script[data-fui-google-maps="true"]');
    if (existing && window.google?.maps) {
      onReady();
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.defer = true;
    script.dataset.fuiGoogleMaps = "true";
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });
}

async function loadGoogleMapsViaForge(): Promise<typeof google.maps> {
  const url = getForgeGoogleMapsApiUrl();
  if (!url) {
    throw new Error("Forge Google Maps API URL not configured");
  }

  (window as any).__googleMapsCallback = () => {
    googleMapsLoaded = true;
  };

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const code = await response.text();

  // eslint-disable-next-line no-eval
  const fn = new Function(code);
  fn();

  if (window.google?.maps) {
    googleMapsLoaded = true;
    return window.google.maps;
  }

  throw new Error("Forge Google Maps script did not initialize google.maps");
}

function loadGoogleMaps(): Promise<typeof google.maps> {
  if (googleMapsLoaded && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = (async () => {
    const directUrl = getDirectGoogleMapsApiUrl();
    if (directUrl) {
      try {
        return await loadGoogleMapsViaScriptTag(directUrl);
      } catch (err) {
        console.warn("[GoogleMap] Direct Google Maps load failed, trying Forge:", err);
        if (hasForgeMapsCredentials()) {
          return loadGoogleMapsViaForge();
        }
        throw err;
      }
    }

    if (hasForgeMapsCredentials()) {
      return loadGoogleMapsViaForge();
    }

    throw new Error("Google Maps API not configured");
  })().catch((err) => {
    googleMapsPromise = null;
    throw err;
  });

  return googleMapsPromise;
}

// ==========================================
// Dark theme style for the map
// ==========================================

const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

// ==========================================
// MAP COMPONENT
// ==========================================

interface GoogleMapProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map | DemoMapHandle) => void;
  darkMode?: boolean;
}

const GoogleMapInner = memo(function GoogleMapInner({
  className,
  initialCenter = { lat: -10.6833, lng: -37.4250 }, // Itabaiana, SE
  initialZoom = 14,
  onMapReady,
  darkMode = true,
}: GoogleMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | DemoMapHandle | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const initRef = useRef(false);
  
  onMapReadyRef.current = onMapReady;

  const initMap = useCallback(async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper || initRef.current) return;
    initRef.current = true;

    const mapDiv = document.createElement("div");
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";

    wrapper.innerHTML = "";
    wrapper.appendChild(mapDiv);
    mapContainerRef.current = mapDiv;

    const initDemoMap = () => {
      const demoMap = createDemoMap(
        mapDiv,
        initialCenter,
        initialZoom,
        onMapReadyRef.current
      );
      mapInstanceRef.current = demoMap;
    };

    if (shouldUseDemoMapFallback()) {
      initDemoMap();
      return;
    }

    try {
      await loadGoogleMaps();

      const map = new google.maps.Map(mapDiv, {
        center: initialCenter,
        zoom: initialZoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: darkMode ? darkMapStyle : undefined,
        gestureHandling: "greedy",
      });

      mapInstanceRef.current = map;

      if (onMapReadyRef.current) {
        onMapReadyRef.current(map);
      }
    } catch (err) {
      console.warn("[GoogleMap] Falling back to demo map:", err);
      if (import.meta.env.DEV) {
        initDemoMap();
        return;
      }
      wrapper.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#14222E;color:#999;font-size:14px;text-align:center;padding:20px;">
            <div>
              <p style="margin-bottom:8px;">Erro ao carregar o mapa</p>
              <p style="font-size:12px;color:#666;">Verifique sua conexão</p>
            </div>
          </div>
        `;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initMap();

    return () => {
      // Cleanup
      mapInstanceRef.current = null;
      if (mapContainerRef.current && mapContainerRef.current.parentNode) {
        try {
          mapContainerRef.current.parentNode.removeChild(mapContainerRef.current);
        } catch (e) {
          // Silently handle
        }
        mapContainerRef.current = null;
      }
      initRef.current = false;
    };
  }, [initMap]);

  return (
    <div className={cn("w-full h-[400px] relative overflow-hidden rounded-lg", className)}>
      <div
        ref={wrapperRef}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      >
        {/* Loading placeholder */}
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

export function GoogleMapView(props: GoogleMapProps) {
  return <GoogleMapInner {...props} />;
}

// ==========================================
// HELPER: Decode Google Maps encoded polyline
// ==========================================

export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
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

// ==========================================
// HELPER: Create custom markers
// ==========================================

export function createGoogleMarker(
  map: google.maps.Map | DemoMapHandle,
  position: { lat: number; lng: number },
  options: {
    color: string;
    label: string;
    title?: string;
  }
): google.maps.marker.AdvancedMarkerElement | google.maps.Marker | ReturnType<typeof addDemoMarker> {
  if (isDemoMap(map)) {
    return addDemoMarker(map, position, options);
  }

  // Use standard Marker (AdvancedMarkerElement requires Map ID)
  const marker = new google.maps.Marker({
    map,
    position,
    title: options.title,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: options.color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 3,
      scale: 12,
    },
    label: {
      text: options.label,
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: "12px",
    },
  });

  return marker;
}

// ==========================================
// HELPER: Draw route polyline on map
// ==========================================

export function drawGoogleRoute(
  map: google.maps.Map | DemoMapHandle,
  encodedPolyline: string,
  options?: {
    color?: string;
    weight?: number;
    opacity?: number;
    fitBounds?: boolean;
  }
): google.maps.Polyline | ReturnType<typeof drawDemoRoute> {
  const path = decodePolyline(encodedPolyline);

  if (isDemoMap(map)) {
    return drawDemoRoute(map, path, {
      color: options?.color,
      weight: options?.weight,
      fitBounds: options?.fitBounds,
    });
  }

  const polyline = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: options?.color || "#F39200",
    strokeOpacity: options?.opacity || 0.9,
    strokeWeight: options?.weight || 5,
    map,
  });

  if (options?.fitBounds !== false) {
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { top: 80, bottom: 300, left: 40, right: 40 });
  }

  return polyline;
}

// ==========================================
// HELPER: Load Google Maps (for external use)
// ==========================================

export { loadGoogleMaps };

// Keep backward compatibility
export default GoogleMapView;
