import {
  getUtilityTrackingPresentation,
  UTILITY_TRACKING_SEQUENCE,
  resolveUtilityTrackingPhase,
} from "@shared/utilityTracking";
import type { UtilityOrderStatus } from "@shared/utilities";
import { UTILITY_STATUS_LABELS } from "@shared/utilities";
import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";

type Props = {
  status: UtilityOrderStatus;
  driverId?: number | null;
  distance?: number | null;
  className?: string;
};

const variantClasses = {
  brand: "border-primary/40 bg-primary/10 text-primary",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  danger: "border-red-500/40 bg-red-500/10 text-red-400",
  default: "border-border bg-muted/20 text-muted-foreground",
};

export default function UtilityStatusBanner({ status, driverId, distance, className }: Props) {
  const tracking = getUtilityTrackingPresentation({ status, driverId, distanceMeters: distance });
  const currentPhase = resolveUtilityTrackingPhase(status);
  const currentIndex = UTILITY_TRACKING_SEQUENCE.findIndex((s) => s.phase === currentPhase);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "rounded-2xl border p-4",
          variantClasses[tracking.variant]
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-background/40 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">
              {tracking.statusBadge}
            </p>
            <p className="text-lg font-bold mt-0.5">{tracking.statusTitle}</p>
            <p className="text-sm opacity-90 mt-1">{tracking.etaSubline}</p>
          </div>
        </div>
      </div>

      {status !== "cancelled" ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {UTILITY_TRACKING_SEQUENCE.map((step, index) => {
            const done = currentIndex > index;
            const active = currentIndex === index;
            return (
              <div
                key={step.phase}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium whitespace-nowrap",
                  active && "border-primary/50 bg-primary/10 text-primary",
                  done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                  !done && !active && "border-border text-muted-foreground/70"
                )}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-red-400 font-medium">{UTILITY_STATUS_LABELS.cancelled}</p>
      )}
    </div>
  );
}
