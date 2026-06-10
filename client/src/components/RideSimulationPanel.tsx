import type { Ride } from "../../../drizzle/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Car, Loader2, Play, UserCheck } from "lucide-react";

export type RideWithSimulation = Ride & {
  simulationPhase?: DemoSimulationPhase;
  demoDriver?: DemoDriverInfo;
};

type DemoDriverInfo = {
  driverName: string;
  rating: string;
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
};

export default function RideSimulationPanel({
  ride,
  onSimulateAccept,
  onSimulateStart,
  acceptPending,
  startPending,
}: RideSimulationPanelProps) {
  const phase = resolveSimulationPhase(ride.simulationPhase, ride);
  const currentIndex = DEMO_SIMULATION_STATUS_ORDER.indexOf(phase);

  return (
    <Card className="border-primary/30 bg-card">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Modo Simulação (DEV)</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Motorista fake: <span className="text-foreground font-medium">{DEMO_SIMULATION_DRIVER_NAME}</span>
          {ride.demoDriver?.driverName ? ` — ${ride.demoDriver.driverName}` : ""}
        </p>

        <ol className="space-y-2">
          {DEMO_SIMULATION_STATUS_ORDER.map((step, index) => {
            const done = index < currentIndex || phase === "completed";
            const active = index === currentIndex;
            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                  active && "border-primary/40 bg-primary/10 text-foreground",
                  done && !active && "border-border bg-muted/20 text-muted-foreground",
                  !done && !active && "border-border text-muted-foreground/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
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

        <p className="text-center text-sm font-medium text-primary">
          {DEMO_SIMULATION_STATUS_LABELS[phase]}
        </p>

        {phase === "searching" && (
          <Button
            className={`w-full ${fuiBrand.btn}`}
            onClick={onSimulateAccept}
            disabled={acceptPending}
          >
            {acceptPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            Simular aceite do motorista
          </Button>
        )}

        {phase === "arrived_pickup" && (
          <Button
            className={`w-full ${fuiBrand.btn}`}
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
          <p className="text-center text-xs text-muted-foreground">
            Deslocamento simulado no mapa — atualização automática a cada ~2s
          </p>
        )}
      </CardContent>
    </Card>
  );
}
