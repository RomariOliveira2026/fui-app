import type { Ride } from "../../../../drizzle/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand, rideStatusLabels, rideStatusVariant } from "@/lib/fuiTheme";
import EmptyStateCard from "@/components/passenger/EmptyStateCard";
import { ArrowRight, Calendar, MapPin, Navigation, RotateCcw } from "lucide-react";

type PassengerRecentRidesProps = {
  rides: Ride[];
  onRepeat?: (ride: Ride) => void;
  onViewAll: () => void;
  onRequestFirst?: () => void;
};

export default function PassengerRecentRides({
  rides,
  onRepeat,
  onViewAll,
  onRequestFirst,
}: PassengerRecentRidesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Últimas corridas</h2>
        {rides.length > 0 ? (
          <Button variant="ghost" size="sm" className="text-primary text-xs h-8" onClick={onViewAll}>
            Ver todas
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        ) : null}
      </div>

      {rides.length === 0 ? (
        <EmptyStateCard
          title="Nenhuma corrida ainda"
          description="Suas viagens recentes aparecerão aqui."
          actionLabel="Solicitar primeira corrida"
          onAction={onRequestFirst}
        />
      ) : (
        <div className="space-y-2">
          {rides.map((ride) => {
            const variant = rideStatusVariant[ride.status] ?? "default";
            const price = ride.finalPrice ?? ride.estimatedPrice ?? 0;

            return (
              <Card key={ride.id} className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1 flex-1">
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                        <span className="line-clamp-1">{ride.originAddress}</span>
                      </p>
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400/90" />
                        <span className="line-clamp-1">{ride.destinationAddress}</span>
                      </p>
                    </div>
                    <StatusBadge variant={variant}>
                      {rideStatusLabels[ride.status] ?? ride.status}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ride.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                      <span className={fuiBrand.text}>R$ {(price / 100).toFixed(2)}</span>
                    </div>
                    {onRepeat && ride.status === "completed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => onRepeat(ride)}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        Repetir
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
