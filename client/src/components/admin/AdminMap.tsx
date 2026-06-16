import { memo, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import { LeafletMap, drawRoute, createCircleMarker } from "@/components/Map";
import { createDriverLiveMarker } from "@/components/map/DriverLiveMarker";
import { ADMIN_MAP_DEFAULT_CENTER } from "@shared/adminOperational";
import type {
  AdminOperationalDriver,
  AdminOperationalRide,
} from "@shared/adminOperational";
import type { AdminSelection } from "@/lib/adminOperationalUi";
import { cn } from "@/lib/utils";
import { Car, MapPin } from "lucide-react";

const RIDE_MARKER_COLORS: Record<string, { color: string; label: string }> = {
  requested: { color: "#F59E0B", label: "P" },
  accepted: { color: "#38BDF8", label: "A" },
  in_progress: { color: "#34D399", label: "●" },
  completed: { color: "#64748B", label: "✓" },
};

type AdminMapProps = {
  rides: AdminOperationalRide[];
  drivers: AdminOperationalDriver[];
  selection: AdminSelection;
  className?: string;
  onSelectRide: (ride: AdminOperationalRide) => void;
  onSelectDriver: (driver: AdminOperationalDriver) => void;
  onMapReady?: (map: L.Map) => void;
};

function markerKey(type: "ride" | "driver", id: number): string {
  return `${type}-${id}`;
}

function createRideMarker(
  map: L.Map,
  ride: AdminOperationalRide,
  highlighted: boolean,
  onClick: () => void
): L.Marker {
  const style = RIDE_MARKER_COLORS[ride.status] ?? RIDE_MARKER_COLORS.requested;
  const scale = highlighted ? 1.15 : 1;
  const ring = highlighted ? "0 0 0 3px rgba(243,146,0,0.55)" : "0 2px 8px rgba(0,0,0,0.35)";

  const icon = L.divIcon({
    className: "fui-admin-ride-marker",
    html: `
      <div style="transform:translate(-50%,-50%) scale(${scale});">
        <div style="
          width:30px;height:30px;border-radius:50%;
          background:${style.color};
          border:2.5px solid rgba(255,255,255,0.9);
          box-shadow:${ring};
          display:flex;align-items:center;justify-content:center;
          color:#0f172a;font-weight:700;font-size:12px;
        ">${style.label}</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  const marker = L.marker([ride.originLat, ride.originLng], { icon }).addTo(map);
  marker.bindPopup(
    `<strong>#${ride.id}</strong> · ${ride.status}<br/>${ride.originAddress.split(",")[0]}<br/><em>Clique para detalhes</em>`
  );
  marker.on("click", onClick);
  return marker;
}

export default memo(function AdminMap({
  rides,
  drivers,
  selection,
  className,
  onSelectRide,
  onSelectDriver,
  onMapReady,
}: AdminMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersByKey = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const onSelectRideRef = useRef(onSelectRide);
  const onSelectDriverRef = useRef(onSelectDriver);
  const selectionRef = useRef(selection);

  onSelectRideRef.current = onSelectRide;
  onSelectDriverRef.current = onSelectDriver;
  selectionRef.current = selection;

  const clearRouteOverlay = useCallback(() => {
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;
    destMarkerRef.current?.remove();
    destMarkerRef.current = null;
  }, []);

  const clearMarkers = useCallback(() => {
    Array.from(markersByKey.current.values()).forEach((marker) => marker.remove());
    markersByKey.current.clear();
  }, []);

  const applySelectionHighlight = useCallback((sel: AdminSelection) => {
    Array.from(markersByKey.current.entries()).forEach(([key, marker]) => {
      const isSelected =
        (sel?.type === "ride" && key === markerKey("ride", sel.id)) ||
        (sel?.type === "driver" && key === markerKey("driver", sel.id));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    });
  }, []);

  const syncMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    clearMarkers();

    const bounds: L.LatLngExpression[] = [
      [ADMIN_MAP_DEFAULT_CENTER.lat, ADMIN_MAP_DEFAULT_CENTER.lng],
    ];

    for (const driver of drivers) {
      const key = markerKey("driver", driver.id);
      const highlighted =
        selectionRef.current?.type === "driver" && selectionRef.current.id === driver.id;
      const marker = createDriverLiveMarker(map, [driver.lat, driver.lng], {
        title: driver.name,
      });
      marker.bindPopup(
        `<strong>${driver.name}</strong><br/>${driver.vehicleType} · ${driver.operationalStatus}<br/><em>Clique para detalhes</em>`
      );
      marker.on("click", () => onSelectDriverRef.current(driver));
      if (highlighted) marker.setZIndexOffset(1000);
      markersByKey.current.set(key, marker);
      bounds.push([driver.lat, driver.lng]);
    }

    for (const ride of rides) {
      const key = markerKey("ride", ride.id);
      const highlighted =
        selectionRef.current?.type === "ride" && selectionRef.current.id === ride.id;
      const marker = createRideMarker(map, ride, highlighted, () =>
        onSelectRideRef.current(ride)
      );
      markersByKey.current.set(key, marker);
      bounds.push([ride.originLat, ride.originLng]);
    }

    if (!selectionRef.current) {
      if (bounds.length > 1) {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [48, 48], maxZoom: 15 });
      } else {
        map.setView([ADMIN_MAP_DEFAULT_CENTER.lat, ADMIN_MAP_DEFAULT_CENTER.lng], 14);
      }
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [drivers, rides, clearMarkers]);

  useEffect(() => {
    syncMarkers();
  }, [syncMarkers]);

  useEffect(() => {
    applySelectionHighlight(selection);
  }, [selection, applySelectionHighlight]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearRouteOverlay();

    if (selection?.type === "ride") {
      const ride = rides.find((r) => r.id === selection.id);
      if (!ride) return;

      const geometry: [number, number][] = [
        [ride.originLat, ride.originLng],
        [ride.destinationLat, ride.destinationLng],
      ];

      routeLayerRef.current = drawRoute(map, geometry, {
        color: "#F39200",
        weight: 5,
        opacity: 0.85,
        fitBounds: false,
      });

      destMarkerRef.current = createCircleMarker(
        map,
        [ride.destinationLat, ride.destinationLng],
        {
          color: "#EF4444",
          label: "B",
          title: ride.destinationAddress,
        }
      );

      const bounds = L.latLngBounds(geometry);
      map.flyToBounds(bounds, { padding: [56, 56], maxZoom: 16, duration: 0.65 });
      return;
    }

    if (selection?.type === "driver") {
      const driver = drivers.find((d) => d.id === selection.id);
      if (driver) map.flyTo([driver.lat, driver.lng], 16, { duration: 0.6 });
    }
  }, [selection, rides, drivers, clearRouteOverlay]);

  const handleMapReady = useCallback(
    (map: L.Map) => {
      mapRef.current = map;
      onMapReady?.(map);
      syncMarkers();
      setTimeout(() => map.invalidateSize(), 350);
    },
    [onMapReady, syncMarkers]
  );

  const isEmpty = drivers.length === 0 && rides.length === 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border border-border/70 bg-card/30 shadow-lg shadow-black/15",
        className
      )}
    >
      <LeafletMap
        className="h-full min-h-[480px] lg:min-h-[min(72vh,640px)] w-full"
        initialCenter={[ADMIN_MAP_DEFAULT_CENTER.lat, ADMIN_MAP_DEFAULT_CENTER.lng]}
        initialZoom={14}
        onMapReady={handleMapReady}
      />

      <div className="absolute top-4 right-4 z-[400] flex gap-2">
        <span className="rounded-lg bg-background/95 backdrop-blur-md px-3 py-1.5 text-xs border border-border/50 shadow-sm flex items-center gap-1.5 text-foreground/90">
          <Car className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium tabular-nums">{drivers.length}</span>
          <span className="text-muted-foreground">motoristas</span>
        </span>
        <span className="rounded-lg bg-background/95 backdrop-blur-md px-3 py-1.5 text-xs border border-border/50 shadow-sm flex items-center gap-1.5 text-foreground/90">
          <MapPin className="h-3.5 w-3.5 text-primary/80" />
          <span className="font-medium tabular-nums">{rides.length}</span>
          <span className="text-muted-foreground">corridas</span>
        </span>
      </div>

      {isEmpty ? (
        <div className="absolute inset-0 z-[300] pointer-events-none flex items-center justify-center">
          <div className="rounded-xl bg-background/80 backdrop-blur border border-border/60 px-6 py-4 text-center max-w-xs">
            <p className="text-sm font-medium text-foreground">Mapa em modo demo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Motoristas demo. Solicite uma corrida para ver marcadores ao vivo.
            </p>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-background/90 backdrop-blur px-3 py-2 text-xs text-muted-foreground border border-border/60">
        Brasil · OpenStreetMap
      </div>
    </div>
  );
});
