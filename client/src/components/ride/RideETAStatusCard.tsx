import { StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand, fuiSemantic, type FuiSemantic } from "@/lib/fuiTheme";
import { useLiveEtaPresentation } from "@/lib/useLiveEtaSeconds";
import type { RideTrackingPresentation } from "@/lib/rideTracking";
import { cn } from "@/lib/utils";
import { Clock, Navigation } from "lucide-react";

type RideETAStatusCardProps = {
  tracking: RideTrackingPresentation;
  className?: string;
};

const variantMap: Record<RideTrackingPresentation["variant"], FuiSemantic> = {
  brand: "brand",
  success: "success",
  info: "info",
  warning: "warning",
  default: "default",
};

export default function RideETAStatusCard({ tracking, className }: RideETAStatusCardProps) {
  const semantic = fuiSemantic(variantMap[tracking.variant] ?? "brand");
  const showEta =
    tracking.phase !== "searching" &&
    tracking.phase !== "completed" &&
    tracking.phase !== "waiting_pickup" &&
    tracking.etaHeadline !== "—";

  const liveEta = useLiveEtaPresentation(
    tracking.seconds > 0 ? tracking.seconds : undefined,
    tracking.distanceM,
    showEta && tracking.seconds > 0
  );

  const headline = liveEta?.headline ?? tracking.etaHeadline;
  const unit = liveEta?.unit ?? tracking.etaUnit;

  let etaSubline = tracking.etaSubline;
  if (liveEta && tracking.seconds > 0) {
    if (tracking.phase === "in_trip") {
      etaSubline = `${liveEta.label} até o destino`;
    } else if (tracking.phase === "arriving") {
      etaSubline = liveEta.label;
    } else {
      etaSubline = `Motorista a ${liveEta.label}`;
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card border-l-[3px]",
        semantic.accent,
        className
      )}
    >
      <div className="flex items-stretch gap-0 p-4">
        <div className="flex min-w-[4.5rem] flex-col items-center justify-center border-r border-border pr-4">
          {showEta ? (
            <>
              <span className={cn("text-3xl font-bold tabular-nums leading-none", fuiBrand.text)}>
                {headline}
              </span>
              {unit ? (
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {unit}
                </span>
              ) : null}
            </>
          ) : (
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", semantic.icon)}>
              {tracking.phase === "waiting_pickup" ? (
                <Navigation className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center gap-1.5 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{tracking.statusTitle}</h3>
            <StatusBadge variant={variantMap[tracking.variant] ?? "brand"}>
              {tracking.statusBadge}
            </StatusBadge>
            {tracking.showLivePulse ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{etaSubline}</p>
        </div>
      </div>
    </div>
  );
}
