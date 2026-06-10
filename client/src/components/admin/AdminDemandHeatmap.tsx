import { memo, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import { LeafletMap } from "@/components/Map";
import { ADMIN_MAP_DEFAULT_CENTER } from "@shared/adminOperational";
import type { DemandHeatPoint } from "@shared/operationalIntelligence";
import { cn } from "@/lib/utils";

type AdminDemandHeatmapProps = {
  points: DemandHeatPoint[];
  className?: string;
};

function tierStyles(tier: DemandHeatPoint["tier"], intensity: number) {
  if (tier === "high" || intensity >= 0.7) {
    return {
      fill: "rgba(243, 146, 0, 0.62)",
      stroke: "rgba(243, 146, 0, 0.55)",
      marker: "#F39200",
      label: "Alta",
    };
  }
  if (tier === "medium" || intensity >= 0.4) {
    return {
      fill: "rgba(245, 158, 11, 0.45)",
      stroke: "rgba(245, 158, 11, 0.4)",
      marker: "#F59E0B",
      label: "Média",
    };
  }
  return {
    fill: "rgba(251, 191, 36, 0.3)",
    stroke: "rgba(251, 191, 36, 0.35)",
    marker: "#FBBF24",
    label: "Baixa",
  };
}

function heatRadius(intensity: number, weight: number): number {
  return 320 + intensity * 480 + Math.min(weight, 10) * 35;
}

export default memo(function AdminDemandHeatmap({
  points,
  className,
}: AdminDemandHeatmapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  const syncLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const layer of layersRef.current) {
      layer.remove();
    }
    layersRef.current = [];

    if (points.length === 0) {
      map.setView([ADMIN_MAP_DEFAULT_CENTER.lat, ADMIN_MAP_DEFAULT_CENTER.lng], 13);
      return;
    }

    const bounds: L.LatLngExpression[] = [];
    const sorted = [...points].sort((a, b) => b.intensity - a.intensity);

    for (const point of sorted) {
      const styles = tierStyles(point.tier, point.intensity);
      const isTop = point === sorted[0];

      const circle = L.circle([point.lat, point.lng], {
        radius: heatRadius(point.intensity, point.weight),
        color: styles.stroke,
        weight: isTop ? 2 : 1,
        fillColor: styles.fill,
        fillOpacity: isTop ? 0.9 : 0.75,
        className: isTop ? "fui-heat-pulse" : undefined,
      }).addTo(map);

      circle.bindTooltip(
        `<strong>${point.areaLabel}</strong><br/>${point.weight} corrida(s)<br/><em>${styles.label}</em>`,
        { direction: "top", opacity: 0.95 }
      );

      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 5 + point.intensity * 10,
        color: "#fff",
        weight: 2,
        fillColor: styles.marker,
        fillOpacity: 0.95,
      }).addTo(map);

      if (isTop) {
        const label = L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: "fui-heat-label",
            html: `<span style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;white-space:nowrap;">🔥 ${point.areaLabel}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 24],
          }),
        }).addTo(map);
        layersRef.current.push(label);
      }

      layersRef.current.push(circle, marker);
      bounds.push([point.lat, point.lng]);
    }

    map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [52, 52], maxZoom: 14 });
    requestAnimationFrame(() => map.invalidateSize());
  }, [points]);

  useEffect(() => {
    syncLayers();
  }, [syncLayers]);

  const handleMapReady = useCallback(
    (map: L.Map) => {
      mapRef.current = map;
      syncLayers();
      setTimeout(() => map.invalidateSize(), 350);
    },
    [syncLayers]
  );

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border border-border/60 bg-card/20",
        className
      )}
    >
      <LeafletMap
        className="h-full min-h-[400px] lg:min-h-[480px] w-full"
        initialCenter={[ADMIN_MAP_DEFAULT_CENTER.lat, ADMIN_MAP_DEFAULT_CENTER.lng]}
        initialZoom={13}
        onMapReady={handleMapReady}
      />

      {points.length === 0 ? (
        <div className="absolute inset-0 z-[300] pointer-events-none flex items-center justify-center">
          <div className="rounded-xl bg-background/85 backdrop-blur border border-border/60 px-5 py-4 text-center max-w-sm">
            <p className="text-sm font-medium">Sem densidade no período</p>
            <p className="text-xs text-muted-foreground mt-1">
              Solicite corridas demo para popular o mapa de calor
            </p>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-background/92 backdrop-blur px-3 py-2.5 border border-border/60 shadow-sm">
        <p className="text-[11px] font-medium text-foreground mb-2">Intensidade de demanda</p>
        <div className="flex flex-col gap-1.5 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-amber-300/50 border border-amber-300/60" />
            Baixa
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-amber-500/55 border border-amber-500/60" />
            Média
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-primary/70 border border-primary/80" />
            Alta · zona líder destacada
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[400] rounded-lg bg-background/92 backdrop-blur px-2.5 py-1.5 border border-border/60 text-[10px] text-muted-foreground">
        {points.length} zona(s)
      </div>
    </div>
  );
});
