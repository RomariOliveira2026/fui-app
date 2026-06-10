import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Clock, TrendingUp, Car, Bell } from "lucide-react";
import type { DriverDemandInsight } from "@shared/driverPremium";

type DriverDemandPanelProps = {
  insight: DriverDemandInsight | undefined;
  isLoading?: boolean;
};

export default function DriverDemandPanel({ insight, isLoading }: DriverDemandPanelProps) {
  if (isLoading || !insight) {
    return (
      <Card className="mb-6 animate-pulse">
        <CardContent className="pt-6 h-32 bg-muted/20" />
      </Card>
    );
  }

  const maxShare = Math.max(...insight.demandZones.map((z) => z.sharePercent), 1);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Mapa de demanda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-sm font-medium flex items-start gap-2">
            <Navigation className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            Maior demanda recente em {insight.topAreaLabel}
            {insight.topAreaRideCount > 0 ? ` (${insight.topAreaRideCount} corridas)` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Melhor região para aguardar: <strong>{insight.bestRegionLabel}</strong>
          </p>
          <p className="text-xs text-muted-foreground">{insight.bestRegionMessage}</p>
        </div>

        {(insight.peakHourLabel || insight.topVehicleLabel || insight.trendLabel) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {insight.peakHourLabel ? (
              <div className="rounded-md border border-border/60 px-2 py-1.5 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary shrink-0" />
                <span>Pico: {insight.peakHourLabel}</span>
              </div>
            ) : null}
            {insight.topVehicleLabel ? (
              <div className="rounded-md border border-border/60 px-2 py-1.5 flex items-center gap-1.5">
                <Car className="h-3 w-3 text-primary shrink-0" />
                <span>Top: {insight.topVehicleLabel}</span>
              </div>
            ) : null}
            {insight.trendLabel ? (
              <div className="rounded-md border border-border/60 px-2 py-1.5 flex items-center gap-1.5 col-span-2">
                <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                <span>
                  {insight.trendLabel}
                  {insight.trendDetail ? ` · ${insight.trendDetail}` : ""}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {insight.operationalTip ? (
          <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-2.5 py-2 flex items-start gap-2 text-xs">
            <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>{insight.operationalTip}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Áreas mais quentes</p>
          {insight.demandZones.map((zone) => (
            <div key={zone.areaLabel} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{zone.areaLabel}</span>
                <span className="text-muted-foreground">{zone.sharePercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/80"
                  style={{ width: `${(zone.sharePercent / maxShare) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {insight.heatPoints.length > 0 ? (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {insight.heatPoints.slice(0, 8).map((p, i) => (
              <div
                key={`${p.areaLabel}-${i}`}
                className="rounded-md border border-border p-1.5 text-center"
                style={{
                  backgroundColor: `rgba(243, 146, 0, ${0.08 + p.intensity * 0.35})`,
                }}
                title={p.areaLabel}
              >
                <span className="text-[9px] line-clamp-2 leading-tight">{p.areaLabel}</span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
