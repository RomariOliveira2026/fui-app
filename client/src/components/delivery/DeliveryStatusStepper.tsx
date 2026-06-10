import { cn } from "@/lib/utils";
import {
  DELIVERY_STATUS_STEPS,
  DELIVERY_STATUS_LABELS,
  getActiveStepIndex,
  type DeliveryStatus,
  type DeliveryStatusEvent,
} from "@shared/deliveryPremium";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

type DeliveryStatusStepperProps = {
  status: DeliveryStatus;
  statusHistory?: DeliveryStatusEvent[];
  className?: string;
};

export default function DeliveryStatusStepper({
  status,
  statusHistory = [],
  className,
}: DeliveryStatusStepperProps) {
  const isCancelled = status === "cancelled";
  const activeIndex = getActiveStepIndex(status);

  const historyAt = (stepStatus: DeliveryStatus) => {
    const event = statusHistory.find((e) => e.status === stepStatus);
    if (!event) return null;
    return new Date(event.at).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isCancelled) {
    return (
      <div className={cn("flex items-center gap-2 text-red-400 text-sm", className)}>
        <XCircle className="h-5 w-5 shrink-0" />
        <span>{DELIVERY_STATUS_LABELS.cancelled}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {DELIVERY_STATUS_STEPS.map((step, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        const at = historyAt(step.status);

        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              {done || (current && status === "delivered") ? (
                <CheckCircle2
                  className={cn(
                    "h-5 w-5 shrink-0",
                    current ? "text-orange-500" : "text-emerald-500"
                  )}
                />
              ) : (
                <Circle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    current ? "text-orange-500" : "text-muted-foreground/40"
                  )}
                />
              )}
              {index < DELIVERY_STATUS_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[24px] my-1",
                    done ? "bg-emerald-500/50" : "bg-border"
                  )}
                />
              ) : null}
            </div>
            <div className="pb-4 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  current ? "text-orange-500" : done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {at ? <p className="text-xs text-muted-foreground mt-0.5">{at}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
