import { useEffect, useState } from "react";
import { Bike, Car, Clock, MapPin, Navigation, Package, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fuiBrand, fuiRoute, fuiTrip } from "@/lib/fuiTheme";
import { formatRidePriceBRL, VEHICLE_TYPE_LABELS } from "@shared/rideCategories";
import type { DemoVehicleType } from "@shared/demoPricing";

const VEHICLE_ICONS = {
  moto: Bike,
  carro: Car,
  van: Truck,
  utilitario: Package,
} as const;

export type DriverOfferRide = {
  id: number;
  originAddress: string;
  destinationAddress: string;
  estimatedPrice?: number | null;
  vehicleType?: string;
  offerExpiresAt?: string;
  offerDistanceMeters?: number;
  offerRound?: number;
};

type DriverRideOfferOverlayProps = {
  ride: DriverOfferRide | null;
  onAccept: (ride: DriverOfferRide) => void;
  onDecline: (ride: DriverOfferRide) => void;
  onExpired?: (ride: DriverOfferRide) => void;
  accepting?: boolean;
};

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DriverRideOfferOverlay({
  ride,
  onAccept,
  onDecline,
  onExpired,
  accepting,
}: DriverRideOfferOverlayProps) {
  const [remainingMs, setRemainingMs] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!ride?.offerExpiresAt) {
      setRemainingMs(45_000);
      setExpired(false);
      return;
    }

    const tick = () => {
      const expires = new Date(ride.offerExpiresAt!).getTime();
      const next = Math.max(0, expires - Date.now());
      setRemainingMs(next);
      if (next <= 0 && !expired) {
        setExpired(true);
        onExpired?.(ride);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [ride?.id, ride?.offerExpiresAt, expired, onExpired, ride]);

  if (!ride) return null;

  const vehicle = (ride.vehicleType ?? "carro") as DemoVehicleType;
  const VehicleIcon = VEHICLE_ICONS[vehicle] ?? Car;
  const urgent = remainingMs <= 10_000;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nova corrida
          </p>
          <h2 className="text-xl font-bold text-foreground">Aceitar agora?</h2>
        </div>
        <button
          type="button"
          onClick={() => onDecline(ride)}
          className={cn(fuiTrip.topBarBtn, "pointer-events-auto")}
          aria-label="Recusar oferta"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-end px-4 pb-8">
        <div className={cn(fuiTrip.sheet, "max-w-lg")}>
          <div className={fuiTrip.sheetInner}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <VehicleIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{VEHICLE_TYPE_LABELS[vehicle]}</p>
                  {ride.offerRound != null && (
                    <p className="text-xs text-muted-foreground">Rodada {ride.offerRound}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={fuiTrip.fareLabel}>Ganho estimado</p>
                <p className={cn("text-2xl font-bold tabular-nums", fuiBrand.text)}>
                  {ride.estimatedPrice != null
                    ? formatRidePriceBRL(ride.estimatedPrice)
                    : "—"}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3",
                expired
                  ? "border-border bg-muted/40"
                  : urgent
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-primary/30 bg-primary/5"
              )}
            >
              <Clock
                className={cn(
                  "h-5 w-5",
                  expired ? "text-muted-foreground" : urgent ? "text-red-400" : "text-primary"
                )}
              />
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums tracking-tight",
                  expired ? "text-muted-foreground" : urgent ? "text-red-400" : "text-primary"
                )}
              >
                {expired ? "Expirada" : formatCountdown(remainingMs)}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <MapPin className={cn("mt-0.5 h-4 w-4", fuiRoute.originIcon)} />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Origem</p>
                  <p className="text-sm font-medium text-foreground">{ride.originAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Navigation className={cn("mt-0.5 h-4 w-4", fuiRoute.destinationIcon)} />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Destino</p>
                  <p className="text-sm font-medium text-foreground">{ride.destinationAddress}</p>
                </div>
              </div>
              {ride.offerDistanceMeters != null && (
                <p className="text-xs text-muted-foreground">
                  Você está a {(ride.offerDistanceMeters / 1000).toFixed(1)} km da origem
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => onDecline(ride)}
                disabled={accepting}
              >
                Recusar
              </Button>
              <Button
                className={cn("h-12 font-bold", fuiBrand.btn)}
                onClick={() => onAccept(ride)}
                disabled={accepting || remainingMs <= 0 || expired}
              >
                {accepting ? "Aceitando…" : "Aceitar corrida"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
