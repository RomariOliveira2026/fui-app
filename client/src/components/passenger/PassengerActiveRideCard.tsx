import type { Ride } from "../../../../drizzle/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand, fuiTrip } from "@/lib/fuiTheme";
import { rideStatusLabels, rideStatusVariant } from "@/lib/fuiTheme";
import {
  isDemoPaymentApproved,
  shouldShowDriverEnRoute,
} from "@/lib/demoRidePayment";
import type { RoutePoint } from "@shared/routeAnimation";
import { getPassengerDriverEta, shouldShowDriverOnMap } from "@shared/driverTracking";
import type { DemoSimulationPhase } from "@/lib/demoSimulation";
import { ArrowRight, Car, Clock, CreditCard, MapPin } from "lucide-react";

type PassengerActiveRideCardProps = {
  ride: Ride & {
    simulationPhase?: DemoSimulationPhase;
    tripPath?: RoutePoint[];
    etaSecondsRemaining?: number;
  };
  onViewDetails: () => void;
};

export default function PassengerActiveRideCard({
  ride,
  onViewDetails,
}: PassengerActiveRideCardProps) {
  const variant = rideStatusVariant[ride.status] ?? "default";
  const statusLabel = rideStatusLabels[ride.status] ?? ride.status;
  const paymentPending =
    !isDemoPaymentApproved(ride) &&
    (ride.paymentMethod === "pix" || ride.paymentMethod === "card");
  const showOnMap = shouldShowDriverOnMap(ride);
  const driverTracking = getPassengerDriverEta(
    ride,
    ride.simulationPhase,
    ride.tripPath,
    ride.etaSecondsRemaining
  );
  const driverEnRoute = shouldShowDriverEnRoute(ride) || showOnMap;
  const searching = ride.status === "requested" && !ride.driverId;

  return (
    <Card className="border-primary/30 bg-card overflow-hidden shadow-lg shadow-primary/5">
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-primary/10 via-card to-card px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Corrida em andamento
              </p>
              <StatusBadge variant={variant}>
                {driverTracking?.isArriving ? "Motorista chegando" : statusLabel}
              </StatusBadge>
              {searching ? (
                <p className="text-sm text-muted-foreground">
                  Buscando motoristas próximos…
                </p>
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Para {ride.destinationAddress}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/20">
              <Car className="h-5 w-5 text-primary" />
            </div>
          </div>

          {driverEnRoute && driverTracking && !searching ? (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Chegada estimada
                </p>
                <p className={fuiTrip.etaDisplay}>{driverTracking.label}</p>
              </div>
              <Clock className="ml-auto h-8 w-8 text-primary/40" />
            </div>
          ) : null}
        </div>

        <div className="px-5 pb-5 space-y-3">
          {paymentPending && (
            <p className="flex items-center gap-2 text-xs text-amber-400">
              <CreditCard className="h-4 w-4 shrink-0" />
              Pagamento pendente — conclua para confirmar a corrida
            </p>
          )}

          <Button className={`w-full py-5 text-base font-semibold ${fuiBrand.btn}`} onClick={onViewDetails}>
            <MapPin className="mr-2 h-5 w-5" />
            Acompanhar no mapa
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
