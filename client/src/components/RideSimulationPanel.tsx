import { useState } from "react";
import type { Ride } from "../../../drizzle/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fuiBrand } from "@/lib/fuiTheme";
import {
  DEMO_SIMULATION_DRIVER_NAME,
  DEMO_SIMULATION_STATUS_LABELS,
  DEMO_SIMULATION_STATUS_ORDER,
  type DemoSimulationPhase,
  getSimulationStatusLabel,
  resolveSimulationPhase,
} from "@/lib/demoSimulation";
import { cn } from "@/lib/utils";
import { Car, ChevronDown, Loader2, Play, UserCheck } from "lucide-react";

export type RideWithSimulation = Ride & {
  simulationPhase?: DemoSimulationPhase;
  demoDriver?: DemoDriverInfo;
};

type DemoDriverInfo = {
  driverName: string;
  rating: string;
  avatarUrl?: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
};

type RideSimulationPanelProps = {
  ride: RideWithSimulation;
  onSimulateAccept: () => void;
  onSimulateStart: () => void;
  acceptPending?: boolean;
  startPending?: boolean;
  /** Flutuante no mapa — não empurra o painel inferior. */
  floating?: boolean;
};

function phaseNeedsUserAction(phase: DemoSimulationPhase): boolean {
  return phase === "searching" || phase === "arrived_pickup";
}

export default function RideSimulationPanel({
  ride,
  onSimulateAccept,
  onSimulateStart,
  acceptPending,
  startPending,
  floating = false,
}: RideSimulationPanelProps) {
  const phase = resolveSimulationPhase(ride.simulationPhase, ride);
  const currentIndex = DEMO_SIMULATION_STATUS_ORDER.indexOf(phase);
  const [open, setOpen] = useState(() => phaseNeedsUserAction(phase));

  const cardClass = cn(
    "border-primary/30 bg-card/95 backdrop-blur-md shadow-lg",
    floating && "border-primary/20"
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cardClass}>
        <CardContent className={cn("p-3", open && "space-y-3")}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Car className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Simulação DEV</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {DEMO_SIMULATION_STATUS_LABELS[phase]}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Motorista fake:{" "}
              <span className="font-medium text-foreground">{DEMO_SIMULATION_DRIVER_NAME}</span>
              {ride.demoDriver?.driverName ? ` — ${ride.demoDriver.driverName}` : ""}
            </p>

            <ol className="max-h-40 space-y-1.5 overflow-y-auto">
              {DEMO_SIMULATION_STATUS_ORDER.map((step, index) => {
                const done = index < currentIndex || phase === "completed";
                const active = index === currentIndex;
                return (
                  <li
                    key={step}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]",
                      active && "border-primary/40 bg-primary/10 text-foreground",
                      done && !active && "border-border bg-muted/20 text-muted-foreground",
                      !done && !active && "border-border text-muted-foreground/70"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                        active && "bg-primary text-primary-foreground",
                        done && !active && "bg-emerald-500/20 text-emerald-400",
                        !done && !active && "bg-muted text-muted-foreground"
                      )}
                    >
                      {done && !active ? "✓" : index + 1}
                    </span>
                    <span className={cn(active && "font-semibold")}>
                      {getSimulationStatusLabel(step, ride)}
                    </span>
                  </li>
                );
              })}
            </ol>

            {phase === "searching" && (
              <Button
                className={`w-full ${fuiBrand.btn}`}
                size="sm"
                onClick={onSimulateAccept}
                disabled={acceptPending}
              >
                {acceptPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Simular aceite
              </Button>
            )}

            {phase === "arrived_pickup" && (
              <Button
                className={`w-full ${fuiBrand.btn}`}
                size="sm"
                onClick={onSimulateStart}
                disabled={startPending}
              >
                {startPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Iniciar corrida
              </Button>
            )}

            {(phase === "to_pickup" || phase === "driver_accepted" || phase === "in_trip") && (
              <p className="text-center text-[11px] text-muted-foreground">
                Motorista se move no mapa — atualização ~1s
              </p>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
