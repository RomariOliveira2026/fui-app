import { buildRideTimeline, type AdminOperationalRide } from "@shared/adminOperational";
import { formatAdminDate } from "@/lib/adminOperationalUi";
import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminRideTimelineProps = {
  ride: AdminOperationalRide;
};

/** Timeline operacional das etapas da corrida (Central Operacional). */
export default function AdminRideTimeline({ ride }: AdminRideTimelineProps) {
  const steps = buildRideTimeline(ride);
  const isCancelled = ride.status === "cancelled";

  return (
    <ol className="relative space-y-3">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const cancelledStep = step.key === "cancelled";
        return (
          <li key={step.key} className="relative flex gap-3">
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[7px] top-4 h-full w-px",
                  step.done ? "bg-primary/40" : "bg-border"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full",
                cancelledStep
                  ? "bg-destructive text-destructive-foreground"
                  : step.done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted"
              )}
            >
              {cancelledStep ? (
                <X className="h-2.5 w-2.5" />
              ) : step.done ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Circle className="h-2 w-2 text-muted-foreground" />
              )}
            </span>
            <div className="flex flex-1 items-center justify-between gap-2 pb-0.5">
              <span
                className={cn(
                  "text-sm",
                  cancelledStep
                    ? "font-medium text-destructive"
                    : step.done
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {step.at ? formatAdminDate(step.at) : isCancelled && !cancelledStep ? "—" : ""}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
