/** Fases do fluxo simulado (demo local — não persistidas no MySQL). */
export type DemoSimulationPhase =
  | "searching"
  | "driver_accepted"
  | "to_pickup"
  | "arrived_pickup"
  | "in_trip"
  | "completed";

export const DEMO_SIMULATION_DRIVER_ID = 799_999;
export const DEMO_SIMULATION_DRIVER_USER_ID = 799_998;
export const DEMO_SIMULATION_DRIVER_NAME = "Motorista Demo";

export const DEMO_SIMULATION_STATUS_LABELS: Record<DemoSimulationPhase, string> = {
  searching: "Procurando motorista",
  driver_accepted: "Motorista aceitou",
  to_pickup: "Motorista a caminho",
  arrived_pickup: "Motorista chegou",
  in_trip: "Corrida em andamento",
  completed: "Corrida finalizada",
};

export const DEMO_SIMULATION_STATUS_ORDER: DemoSimulationPhase[] = [
  "searching",
  "driver_accepted",
  "to_pickup",
  "arrived_pickup",
  "in_trip",
  "completed",
];

export function isDemoDriverSimulationFlag(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

/** Cliente (Vite) — só em DEV. */
export function isDemoDriverSimulationEnabledClient(): boolean {
  return (
    import.meta.env.DEV &&
    isDemoDriverSimulationFlag(import.meta.env.VITE_ENABLE_DEMO_DRIVER as string | undefined)
  );
}

/** Servidor — só fora de produção. */
export function isDemoDriverSimulationEnabledServer(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    isDemoDriverSimulationFlag(process.env.VITE_ENABLE_DEMO_DRIVER)
  );
}

export function isDemoDriverSimulationAutoAcceptServer(): boolean {
  if (!isDemoDriverSimulationEnabledServer()) return false;
  const val = process.env.VITE_DEMO_DRIVER_AUTO_ACCEPT;
  if (val === "false" || val === "0") return false;
  return true;
}

type RideStatusLike = {
  status: string;
  driverId?: number | null;
};

export function resolveSimulationPhase(
  explicitPhase: DemoSimulationPhase | null | undefined,
  ride: RideStatusLike
): DemoSimulationPhase {
  if (explicitPhase) return explicitPhase;
  if (ride.status === "completed") return "completed";
  if (ride.status === "in_progress") return "in_trip";
  if (ride.status === "accepted" && ride.driverId) return "to_pickup";
  if (ride.status === "requested") return "searching";
  return "searching";
}

export function getSimulationStatusLabel(
  phase: DemoSimulationPhase,
  ride: RideStatusLike
): string {
  if (phase === "to_pickup" && ride.status === "accepted") {
    return DEMO_SIMULATION_STATUS_LABELS.to_pickup;
  }
  return DEMO_SIMULATION_STATUS_LABELS[phase] ?? phase;
}
