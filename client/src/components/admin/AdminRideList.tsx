import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RideStatusBadge } from "@/components/fui/StatusBadge";
import type { AdminOperationalRide } from "@shared/adminOperational";
import {
  canAdminCancelRide,
  canAdminRedispatchRide,
  formatAdminDate,
  formatAdminDuration,
  formatAdminPrice,
  priorityAccentClass,
  priorityDotClass,
} from "@/lib/adminOperationalUi";
import { Clock, MapPin, RefreshCw, Timer, User, XCircle } from "lucide-react";
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
                  : cn("border-border/60 bg-card/40 hover:bg-muted/30", priorityAccentClass(ride.priority))
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 font-semibold text-sm">
                  {ride.priority !== "normal" ? (
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        priorityDotClass(ride.priority),
                        ride.priority === "sos" && "animate-pulse"
                      )}
                      aria-hidden
                    />
                  ) : null}
                  #{ride.id}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {ride.categoryLabel}
                  </span>
                </span>
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
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ride.passengerName ?? "Passageiro"}
                </span>
                {ride.driverName ? (
                  <span className="truncate">🚗 {ride.driverName}</span>
                ) : (
                  <span className="text-amber-500/90">Aguardando aceite</span>
                )}
                {ride.status === "in_progress" && ride.etaSeconds != null ? (
                  <span className="flex items-center gap-1 text-emerald-500/90">
                    <Timer className="h-3 w-3" />
                    ETA {formatAdminDuration(ride.etaSeconds)}
                  </span>
                ) : null}
                {ride.waitingSeconds > 0 ? (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      ride.priority === "critical"
                        ? "text-orange-500"
                        : ride.priority === "warning"
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    Espera {formatAdminDuration(ride.waitingSeconds)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
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
