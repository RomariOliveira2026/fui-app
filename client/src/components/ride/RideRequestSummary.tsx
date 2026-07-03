import { MapPin, Navigation, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { fuiBrand, fuiRoute, fuiSurface } from "@/lib/fuiTheme";
import {
  formatRideDistanceKm,
  formatRideDurationMinutes,
  formatRidePriceBRL,
  VEHICLE_TYPE_LABELS,
} from "@shared/rideCategories";
import type { DemoVehicleType } from "@shared/demoPricing";

type RideRequestSummaryProps = {
  origin: string;
  destination: string;
  vehicleType: DemoVehicleType;
  estimatedPrice: number | null;
  distanceM: number;
  durationS: number;
  loading?: boolean;
  className?: string;
};

export default function RideRequestSummary({
  origin,
  destination,
  vehicleType,
  estimatedPrice,
  distanceM,
  durationS,
  loading,
  className,
}: RideRequestSummaryProps) {
  if (!origin.trim() || !destination.trim()) return null;

  return (
    <div className={cn(fuiSurface.price, "p-4 space-y-4", className)}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", fuiRoute.originIcon)} />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Origem
            </p>
            <p className="text-sm font-medium text-foreground line-clamp-2">{origin}</p>
          </div>
        </div>
        <div className="ml-2 h-4 w-px bg-border" />
        <div className="flex items-start gap-3">
          <Navigation className={cn("mt-0.5 h-4 w-4 shrink-0", fuiRoute.destinationIcon)} />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Destino
            </p>
            <p className="text-sm font-medium text-foreground line-clamp-2">{destination}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border/80 pt-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Categoria
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {VEHICLE_TYPE_LABELS[vehicleType]}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Route className="h-3 w-3" />
            Distância
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {distanceM > 0 ? formatRideDistanceKm(distanceM) : "—"}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3 w-3" />
            ETA
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {durationS > 0 ? formatRideDurationMinutes(durationS) : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-border/80 pt-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Preço estimado
          </p>
          <p className="text-xs text-muted-foreground">Taxas e trânsito podem alterar o valor</p>
        </div>
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        ) : estimatedPrice != null && estimatedPrice > 0 ? (
          <p className={cn("text-3xl font-bold tabular-nums tracking-tight", fuiBrand.text)}>
            {formatRidePriceBRL(estimatedPrice)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Aguardando rota…</p>
        )}
      </div>
    </div>
  );
}
