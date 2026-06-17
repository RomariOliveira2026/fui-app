import { Button } from "@/components/ui/button";
import { fuiBrand, fuiIconRingClass } from "@/lib/fuiTheme";
import { useLiveEtaPresentation } from "@/lib/useLiveEtaSeconds";
import type { RideTrackingPresentation } from "@/lib/rideTracking";
import { cn } from "@/lib/utils";
import { Car, MessageCircle, Star, User } from "lucide-react";

export type RideDriverInfo = {
  driverName: string;
  rating?: string;
  avatarUrl?: string | null;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
};

type RideDriverFoundCardProps = {
  driver: RideDriverInfo;
  tracking?: RideTrackingPresentation | null;
  onChat?: () => void;
  showChat?: boolean;
  className?: string;
};

export default function RideDriverFoundCard({
  driver,
  tracking,
  onChat,
  showChat,
  className,
}: RideDriverFoundCardProps) {
  const liveEta = useLiveEtaPresentation(
    tracking?.seconds && tracking.seconds > 0 ? tracking.seconds : undefined,
    tracking?.distanceM ?? 0,
    !!tracking && tracking.seconds > 0
  );

  const headline = liveEta?.headline ?? tracking?.etaHeadline;
  const unit = liveEta?.unit ?? tracking?.etaUnit;
  const etaDisplay =
    tracking && tracking.seconds > 0 && headline
      ? `${headline}${unit ? ` ${unit}` : ""}`
      : null;

  const etaLine = etaDisplay ? `Chegada estimada: ${etaDisplay}` : tracking?.etaSubline;

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <div className="border-b border-border bg-muted/20 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Seu motorista
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          {driver.avatarUrl ? (
            <img
              src={driver.avatarUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className={fuiIconRingClass("brand")}>
              <User className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-foreground truncate">{driver.driverName}</p>
            {driver.rating ? (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/80" />
                {driver.rating}
              </p>
            ) : null}
          </div>
          {tracking?.showLivePulse ? (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", fuiBrand.bgSoft)}>
              <Car className={cn("h-5 w-5", fuiBrand.text)} />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">Veículo</p>
            <p className="font-medium text-foreground capitalize">
              {[driver.vehicleBrand, driver.vehicleModel].filter(Boolean).join(" ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Placa</p>
            <p className="font-medium text-foreground uppercase">{driver.vehiclePlate ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Cor</p>
            <p className="font-medium text-foreground capitalize">{driver.vehicleColor ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">ETA</p>
            <p className={cn("font-semibold", fuiBrand.text)}>
              {etaDisplay ?? etaLine ?? "—"}
            </p>
          </div>
        </div>

        {showChat && onChat ? (
          <Button type="button" className={`w-full ${fuiBrand.btn}`} onClick={onChat}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat com motorista
          </Button>
        ) : null}
      </div>
    </div>
  );
}
