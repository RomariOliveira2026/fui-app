import { haversineMeters } from "./demoMaps";
import type { RideDispatchMeta } from "./rideDispatcher";
import type { DemoSimulationPhase } from "./demoSimulation";
import {
  DRIVER_ARRIVING_THRESHOLD_M,
  formatEtaDisplay,
  getPassengerDriverEta,
  parseMapPoint,
  shouldShowDriverOnMap,
  type MapCoord,
} from "./driverTracking";
import type { RoutePoint } from "./routeAnimation";

export type RideTrackingPhase =
  | "searching"
  | "driver_found"
  | "en_route"
  | "arriving"
  | "waiting_pickup"
  | "in_trip"
  | "completed";

export type RideTrackingVariant = "brand" | "success" | "info" | "warning" | "default";

export type RideTrackingPresentation = {
  phase: RideTrackingPhase;
  variant: RideTrackingVariant;
  statusTitle: string;
  statusBadge: string;
  etaHeadline: string;
  etaSubline: string;
  showLivePulse: boolean;
  showDriverOnMap: boolean;
  minutes: number;
  distanceM: number;
};

type RideLike = {
  driverId?: number | null;
  status: string;
  originLat: string;
  originLng: string;
  destinationLat: string;
  destinationLng: string;
  driverCurrentLat?: string | null;
  driverCurrentLng?: string | null;
};

const STATUS_SEQUENCE: Array<{ phase: RideTrackingPhase; label: string }> = [
  { phase: "searching", label: "Procurando motorista" },
  { phase: "driver_found", label: "Motorista encontrado" },
  { phase: "en_route", label: "Motorista a caminho" },
  { phase: "arriving", label: "Motorista chegando" },
  { phase: "waiting_pickup", label: "Aguardando embarque" },
  { phase: "in_trip", label: "Em corrida" },
  { phase: "completed", label: "Concluída" },
];

export function getRideTrackingSequence() {
  return STATUS_SEQUENCE;
}

export function resolveRideTrackingPhase(
  ride: RideLike,
  simulationPhase?: DemoSimulationPhase | null
): RideTrackingPhase {
  if (ride.status === "completed") return "completed";
  if (ride.status === "cancelled") return "searching";
  if (ride.status === "in_progress") return "in_trip";

  if (simulationPhase === "arrived_pickup") return "waiting_pickup";
  if (simulationPhase === "to_pickup" || simulationPhase === "driver_accepted") {
    return "en_route";
  }

  if (ride.status === "accepted" && ride.driverId) {
    const driver = parseMapPoint(ride.driverCurrentLat, ride.driverCurrentLng);
    const origin = parseMapPoint(ride.originLat, ride.originLng);
    if (driver && origin) {
      const dist = haversineMeters(driver, origin);
      if (dist <= DRIVER_ARRIVING_THRESHOLD_M) return "arriving";
    }
    return "en_route";
  }

  if (ride.driverId && ride.status === "requested") return "driver_found";
  if (ride.status === "requested") return "searching";
  return "searching";
}

function formatScheduledWait(scheduledFor: string | null): string | null {
  if (!scheduledFor) return null;
  const date = new Date(scheduledFor);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function searchingSubline(dispatchMeta?: RideDispatchMeta | null): string {
  if (!dispatchMeta) {
    return "Encontrando o melhor motorista para você";
  }
  if (dispatchMeta.isScheduledWaiting) {
    const when = formatScheduledWait(dispatchMeta.scheduledFor);
    return when
      ? `Corrida agendada · busca de motorista a partir de ${when}`
      : "Corrida agendada · aguardando horário para buscar motorista";
  }
  if (dispatchMeta.isExpandedRound) {
    return `Busca ampliada · rodada ${dispatchMeta.currentRound} · ampliando raio de motoristas`;
  }
  if (dispatchMeta.currentRound > 1) {
    const declined =
      dispatchMeta.declinedOffers > 0
        ? ` · ${dispatchMeta.declinedOffers} recusa(s)`
        : "";
    return `Nova rodada de busca · rodada ${dispatchMeta.currentRound}${declined}`;
  }
  if (dispatchMeta.pendingOffers > 0) {
    return `Aguardando resposta de ${dispatchMeta.pendingOffers} motorista(s) próximo(s)`;
  }
  if (dispatchMeta.declinedOffers > 0) {
    return `Reorganizando busca após ${dispatchMeta.declinedOffers} recusa(s)`;
  }
  return "Encontrando o melhor motorista para você";
}

export function getRideTrackingPresentation(
  ride: RideLike,
  simulationPhase?: DemoSimulationPhase | null,
  dispatchMeta?: RideDispatchMeta | null,
  tripPath?: RoutePoint[] | null
): RideTrackingPresentation | null {
  const phase = resolveRideTrackingPhase(ride, simulationPhase);
  const onMap = shouldShowDriverOnMap(ride);
  const eta = getPassengerDriverEta(ride, simulationPhase, tripPath);

  if (phase === "searching") {
    const roundBadge = dispatchMeta?.isScheduledWaiting
      ? "Agendada"
      : dispatchMeta?.isExpandedRound
        ? "Busca ampliada"
        : dispatchMeta && dispatchMeta.currentRound > 1
          ? `Rodada ${dispatchMeta.currentRound}`
          : "Buscando";
    return {
      phase,
      variant: "warning",
      statusTitle: dispatchMeta?.isScheduledWaiting
        ? "Aguardando horário"
        : "Procurando motorista",
      statusBadge: roundBadge,
      etaHeadline: "—",
      etaSubline: searchingSubline(dispatchMeta),
      showLivePulse: true,
      showDriverOnMap: false,
      minutes: 0,
      distanceM: 0,
    };
  }

  if (phase === "completed") {
    return {
      phase,
      variant: "success",
      statusTitle: "Corrida finalizada",
      statusBadge: "Concluída",
      etaHeadline: "✓",
      etaSubline: "Obrigado por viajar com o Fui!",
      showLivePulse: false,
      showDriverOnMap: false,
      minutes: 0,
      distanceM: 0,
    };
  }

  if (phase === "driver_found" && !onMap) {
    return {
      phase,
      variant: "success",
      statusTitle: "Motorista encontrado",
      statusBadge: "Confirmado",
      etaHeadline: "—",
      etaSubline: "Preparando deslocamento até o embarque",
      showLivePulse: true,
      showDriverOnMap: false,
      minutes: 0,
      distanceM: 0,
    };
  }

  if (phase === "waiting_pickup") {
    return {
      phase,
      variant: "success",
      statusTitle: "Motorista chegou",
      statusBadge: "No local",
      etaHeadline: "0",
      etaSubline: "Aguardando embarque",
      showLivePulse: true,
      showDriverOnMap: onMap,
      minutes: 0,
      distanceM: 0,
    };
  }

  if (phase === "in_trip" && eta) {
    const display = formatEtaDisplay(eta.minutes, eta.distanceM);
    return {
      phase,
      variant: "brand",
      statusTitle: "Em corrida",
      statusBadge: "A caminho do destino",
      etaHeadline: display.headline,
      etaSubline: eta.label,
      showLivePulse: true,
      showDriverOnMap: onMap,
      minutes: eta.minutes,
      distanceM: eta.distanceM,
    };
  }

  if (eta) {
    const isArriving = phase === "arriving" || eta.isArriving;
    const display = formatEtaDisplay(eta.minutes, eta.distanceM);
    return {
      phase: isArriving ? "arriving" : "en_route",
      variant: isArriving ? "success" : "brand",
      statusTitle: eta.statusTitle,
      statusBadge: isArriving ? "Chegando" : "A caminho",
      etaHeadline: display.headline,
      etaSubline: eta.label,
      showLivePulse: true,
      showDriverOnMap: onMap,
      minutes: eta.minutes,
      distanceM: eta.distanceM,
    };
  }

  return null;
}

export function getTrackingBoundsPoints(
  ride: RideLike,
  driver: MapCoord | null,
  phase: RideTrackingPhase
): MapCoord[] {
  const origin = parseMapPoint(ride.originLat, ride.originLng);
  const destination = parseMapPoint(ride.destinationLat, ride.destinationLng);
  const points: MapCoord[] = [];

  if (driver) points.push(driver);
  if (origin) points.push(origin);

  if (phase === "in_trip" || phase === "completed" || phase === "searching") {
    if (destination) points.push(destination);
  }

  return points;
}
