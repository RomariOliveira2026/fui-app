import type { Ride } from "../../../../drizzle/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand } from "@/lib/fuiTheme";
import { rideStatusLabels, rideStatusVariant } from "@/lib/fuiTheme";
import {
  isDemoPaymentApproved,
  shouldShowDriverEnRoute,
} from "@/lib/demoRidePayment";
import type { RoutePoint } from "@shared/routeAnimation";
import { getPassengerDriverEta, shouldShowDriverOnMap } from "@shared/driverTracking";
import type { DemoSimulationPhase } from "@/lib/demoSimulation";
import { ArrowRight, Car, Clock, CreditCard } from "lucide-react";

type PassengerActiveRideCardProps = {
  ride: Ride & { simulationPhase?: DemoSimulationPhase; tripPath?: RoutePoint[] };
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
  const driverTracking = getPassengerDriverEta(ride, ride.simulationPhase, ride.tripPath);
  const driverEnRoute = shouldShowDriverEnRoute(ride) || showOnMap;

  return (
    <Card className="border-primary/25 bg-card overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Corrida em andamento
            </p>
            <StatusBadge variant={variant}>
              {driverTracking?.isArriving ? "Motorista chegando" : statusLabel}
            </StatusBadge>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="line-clamp-1 text-muted-foreground">
            <span className="text-foreground font-medium">De:</span> {ride.originAddress}
          </p>
          <p className="line-clamp-1 text-muted-foreground">
            <span className="text-foreground font-medium">Para:</span> {ride.destinationAddress}
          </p>
        </div>

        {paymentPending && (
          <p className="flex items-center gap-2 text-xs text-amber-400">
            <CreditCard className="h-4 w-4 shrink-0" />
            Pagamento pendente — conclua para confirmar a corrida
          </p>
        )}

        {driverEnRoute && driverTracking && (
          <p className="flex items-center gap-2 text-xs text-sky-400">
            <Clock className="h-4 w-4 shrink-0" />
            {driverTracking.label}
          </p>
        )}

        <Button className={`w-full ${fuiBrand.btn}`} onClick={onViewDetails}>
          Ver detalhes da corrida
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
