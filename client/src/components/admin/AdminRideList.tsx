import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RideStatusBadge } from "@/components/fui/StatusBadge";
import type { AdminOperationalRide } from "@shared/adminOperational";
import {
  canAdminCancelRide,
  canAdminRedispatchRide,
  formatAdminDate,
  formatAdminPrice,
} from "@/lib/adminOperationalUi";
import { MapPin, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminRideListProps = {
  rides: AdminOperationalRide[];
  selectedId: number | null;
  onSelect: (ride: AdminOperationalRide) => void;
  onCancel?: (ride: AdminOperationalRide) => void;
  onRedispatch?: (ride: AdminOperationalRide) => void;
  actionRideId?: number | null;
};

export default function AdminRideList({
  rides,
  selectedId,
  onSelect,
  onCancel,
  onRedispatch,
  actionRideId = null,
}: AdminRideListProps) {
  if (rides.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10 px-4 rounded-lg border border-dashed border-border/60 bg-muted/20">
        Nenhuma corrida com os filtros atuais
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px] lg:h-[min(72vh,560px)] pr-3">
      <div className="space-y-2">
        {rides.map((ride) => {
          const showCancel = canAdminCancelRide(ride.status) && Boolean(onCancel);
          const showRedispatch =
            canAdminRedispatchRide(ride.status, ride.driverId) && Boolean(onRedispatch);
          const isActionTarget = actionRideId === ride.id;

          return (
            <div
              key={ride.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(ride)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(ride);
                }
              }}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                selectedId === ride.id
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 bg-card/40 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-sm">#{ride.id}</span>
                <RideStatusBadge status={ride.status} />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400/80" />
                  <span className="line-clamp-1">{ride.originAddress}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-400/80" />
                  <span className="line-clamp-1">{ride.destinationAddress}</span>
                </p>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="capitalize text-muted-foreground">{ride.vehicleType}</span>
                <span className="font-medium text-foreground">
                  {formatAdminPrice(ride.finalPrice ?? ride.estimatedPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="text-[11px] text-muted-foreground">{formatAdminDate(ride.createdAt)}</span>
                {(showCancel || showRedispatch) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {showRedispatch ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary"
                        title="Reenfileirar"
                        disabled={isActionTarget}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRedispatch?.(ride);
                        }}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isActionTarget && "animate-spin")} />
                      </Button>
                    ) : null}
                    {showCancel ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Cancelar"
                        disabled={isActionTarget}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Cancelar corrida #${ride.id}? Esta ação não pode ser desfeita.`
                            )
                          ) {
                            onCancel?.(ride);
                          }
                        }}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
