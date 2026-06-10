import { UTILITY_STATUS_STEPS, UTILITY_STATUS_LABELS, type UtilityOrderStatus } from "@shared/utilities";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type UtilityStatusStepperProps = {
  status: UtilityOrderStatus;
  className?: string;
  variant?: "default" | "compact";
};

export default function UtilityStatusStepper({
  status,
  className,
  variant = "default",
}: UtilityStatusStepperProps) {
  const activeIdx =
    status === "cancelled"
      ? -1
      : UTILITY_STATUS_STEPS.findIndex((s) => s.status === status);

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {UTILITY_STATUS_STEPS.map((step, idx) => {
          const done = activeIdx > idx;
          const active = activeIdx === idx;
          return (
            <span
              key={step.status}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium border",
                done && "bg-primary/15 border-primary/30 text-primary",
                active && "bg-primary border-primary text-primary-foreground",
                !done && !active && "border-border text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {UTILITY_STATUS_STEPS.map((step, idx) => {
        const done = activeIdx > idx;
        const active = activeIdx === idx;
        return (
          <div key={step.status} className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-colors",
                done && "bg-primary border-primary text-primary-foreground",
                active && "border-primary text-primary bg-primary/20 shadow-[0_0_0_3px_rgba(243,146,0,0.15)]",
                !done && !active && "border-border/80 text-muted-foreground bg-muted/20"
              )}
            >
              {done ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <div>
              <span
                className={cn(
                  "text-sm block",
                  active ? "font-bold text-foreground" : done ? "font-medium text-foreground/80" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {active ? (
                <span className="text-[11px] text-primary">{UTILITY_STATUS_LABELS[step.status]}</span>
              ) : null}
            </div>
          </div>
        );
      })}
      {status === "cancelled" ? (
        <p className="text-sm text-red-400 font-semibold pl-11">{UTILITY_STATUS_LABELS.cancelled}</p>
      ) : null}
    </div>
  );
}
