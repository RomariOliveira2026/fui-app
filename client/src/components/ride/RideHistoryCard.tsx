import type { Ride } from "../../../../drizzle/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand, fuiRoute, rideStatusVariant } from "@/lib/fuiTheme";
import {
  formatRideDateTime,
  formatRideDistanceMeters,
  formatRideDuration,
  formatBrlFromCents,
  getRidePriceCents,
  PAYMENT_METHOD_LABELS,
  RIDE_HISTORY_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@shared/rideHistoryUtils";
import {
  Banknote,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Navigation,
  RotateCcw,
  Tag,
  Wallet,
} from "lucide-react";

type RideHistoryCardProps = {
  ride: Ride;
  isDriverHistory?: boolean;
  onOpen: (rideId: number) => void;
  onRepeat?: (ride: Ride) => void;
};

function PaymentIcon({ method }: { method: string }) {
  if (method === "pix") return <Wallet className="h-3.5 w-3.5" />;
  if (method === "card") return <CreditCard className="h-3.5 w-3.5" />;
  return <Banknote className="h-3.5 w-3.5" />;
}

export default function RideHistoryCard({
  ride,
  isDriverHistory = false,
  onOpen,
  onRepeat,
}: RideHistoryCardProps) {
  const priceCents = getRidePriceCents(ride);
  const durationLabel = formatRideDuration(ride.duration);
  const distanceLabel = formatRideDistanceMeters(ride.distance);
  const paymentLabel = PAYMENT_METHOD_LABELS[ride.paymentMethod] ?? ride.paymentMethod;
  const vehicleLabel = VEHICLE_TYPE_LABELS[ride.vehicleType] ?? ride.vehicleType;

  return (
    <Card
      className="border-border bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onOpen(ride.id)}
    >
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">Corrida #{ride.id}</p>
              {ride.isScheduled === "yes" ? (
                <Badge variant="outline" className="text-[10px]">
                  Agendada
                </Badge>
              ) : null}
              {ride.couponCode ? (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Tag className="h-3 w-3" />
                  {ride.couponCode}
                </Badge>
              ) : null}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatRideDateTime(ride)}
            </p>
          </div>
          <StatusBadge variant={rideStatusVariant[ride.status] ?? "default"} className="shrink-0">
            {RIDE_HISTORY_STATUS_LABELS[ride.status] ?? ride.status}
          </StatusBadge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${fuiRoute.originIcon}`} />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Origem</p>
              <p className="text-sm line-clamp-2">{ride.originAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Navigation className={`w-4 h-4 mt-0.5 shrink-0 ${fuiRoute.destinationIcon}`} />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Destino</p>
              <p className="text-sm line-clamp-2">{ride.destinationAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {vehicleLabel}
          </Badge>
          {distanceLabel ? <span>{distanceLabel}</span> : null}
          {durationLabel ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {durationLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <PaymentIcon method={ride.paymentMethod} />
            {paymentLabel}
          </span>
          {ride.discountAmount > 0 ? (
            <span className="text-emerald-400">
              − R$ {(ride.discountAmount / 100).toFixed(2)} cupom
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <p className={`text-xl font-bold tabular-nums ${fuiBrand.text}`}>
            {formatBrlFromCents(priceCents)}
          </p>
          <div className="flex items-center gap-2">
            {!isDriverHistory && ride.status === "completed" && onRepeat ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRepeat(ride);
                }}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Repetir
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(ride.id);
              }}
            >
              Ver detalhes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
