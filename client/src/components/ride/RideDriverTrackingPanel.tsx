import type { RoutePoint } from "@shared/routeAnimation";
import type { DemoSimulationPhase } from "@/lib/demoSimulation";
import {
  getRideTrackingPresentation,
  getRideTrackingSequence,
  resolveRideTrackingPhase,
} from "@/lib/rideTracking";
import { cn } from "@/lib/utils";
import RideDriverFoundCard, { type RideDriverInfo } from "@/components/ride/RideDriverFoundCard";
import RideETAStatusCard from "@/components/ride/RideETAStatusCard";
import type { Ride } from "../../../../drizzle/schema";

type RideDriverTrackingPanelProps = {
  ride: Ride & { simulationPhase?: DemoSimulationPhase; etaSecondsRemaining?: number };
  driver: RideDriverInfo;
  tripPath?: RoutePoint[] | null;
  onChat?: () => void;
  showChat?: boolean;
  className?: string;
};

export default function RideDriverTrackingPanel({
  ride,
  driver,
  tripPath,
  onChat,
  showChat,
  className,
}: RideDriverTrackingPanelProps) {
  const tracking = getRideTrackingPresentation(
    ride,
    ride.simulationPhase,
    undefined,
    tripPath,
    ride.etaSecondsRemaining
  );
  const currentPhase = resolveRideTrackingPhase(ride, ride.simulationPhase);
  const sequence = getRideTrackingSequence();
  const currentIndex = sequence.findIndex((s) => s.phase === currentPhase);

  return (
    <div className={cn("space-y-4", className)}>
      {tracking ? <RideETAStatusCard tracking={tracking} /> : null}

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {sequence.slice(0, 6).map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div
              key={step.phase}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium",
                active && "border-primary/50 bg-primary/10 text-primary",
                done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                !done && !active && "border-border text-muted-foreground/60"
              )}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      {ride.driverId ? (
        <RideDriverFoundCard
          driver={driver}
          tracking={tracking}
          onChat={onChat}
          showChat={showChat}
        />
      ) : null}
    </div>
  );
}
