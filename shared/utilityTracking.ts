import { haversineMeters } from "./demoMaps";
import type { UtilityOrderStatus } from "./utilities";
import { UTILITY_STATUS_LABELS } from "./utilities";

export type UtilityTrackingPhase =
  | "searching"
  | "accepted"
  | "picking_up"
  | "in_transit"
  | "arriving"
  | "completed"
  | "cancelled";

export type UtilityTrackingPresentation = {
  phase: UtilityTrackingPhase;
  statusTitle: string;
  statusBadge: string;
  etaSubline: string;
  showDriverOnMap: boolean;
  showLivePulse: boolean;
  variant: "brand" | "success" | "info" | "warning" | "danger" | "default";
};

const STATUS_TO_PHASE: Record<UtilityOrderStatus, UtilityTrackingPhase> = {
  requested: "searching",
  waiting_driver: "searching",
  accepted: "accepted",
  picking_up: "picking_up",
  in_transit: "in_transit",
  arriving: "arriving",
  completed: "completed",
  cancelled: "cancelled",
};

export const UTILITY_TRACKING_SEQUENCE: Array<{ phase: UtilityTrackingPhase; label: string }> = [
  { phase: "searching", label: "Solicitado" },
  { phase: "accepted", label: "Aceito" },
  { phase: "picking_up", label: "Em coleta" },
  { phase: "in_transit", label: "Em deslocamento" },
  { phase: "arriving", label: "Chegando" },
  { phase: "completed", label: "Concluído" },
];

export function resolveUtilityTrackingPhase(status: UtilityOrderStatus): UtilityTrackingPhase {
  return STATUS_TO_PHASE[status] ?? "searching";
}

export function shouldShowUtilityDriverOnMap(status: UtilityOrderStatus, driverId?: number | null): boolean {
  if (!driverId) return false;
  return ["accepted", "picking_up", "in_transit", "arriving"].includes(status);
}

export function getUtilityTrackingPresentation(input: {
  status: UtilityOrderStatus;
  driverId?: number | null;
  distanceMeters?: number | null;
}): UtilityTrackingPresentation {
  const phase = resolveUtilityTrackingPhase(input.status);
  const showDriverOnMap = shouldShowUtilityDriverOnMap(input.status, input.driverId);

  if (phase === "cancelled") {
    return {
      phase,
      statusTitle: "Pedido cancelado",
      statusBadge: UTILITY_STATUS_LABELS.cancelled,
      etaSubline: "Este frete foi cancelado",
      showDriverOnMap: false,
      showLivePulse: false,
      variant: "danger",
    };
  }

  if (phase === "completed") {
    return {
      phase,
      statusTitle: "Serviço concluído",
      statusBadge: UTILITY_STATUS_LABELS.completed,
      etaSubline: "Entrega finalizada com sucesso",
      showDriverOnMap: false,
      showLivePulse: false,
      variant: "success",
    };
  }

  if (phase === "searching") {
    return {
      phase,
      statusTitle: "Aguardando prestador",
      statusBadge: UTILITY_STATUS_LABELS.waiting_driver,
      etaSubline: "Buscando utilitário compatível na região",
      showDriverOnMap: false,
      showLivePulse: true,
      variant: "warning",
    };
  }

  if (phase === "accepted") {
    return {
      phase,
      statusTitle: "Prestador a caminho da coleta",
      statusBadge: UTILITY_STATUS_LABELS.accepted,
      etaSubline: "O utilitário está se deslocando até a origem",
      showDriverOnMap,
      showLivePulse: true,
      variant: "brand",
    };
  }

  if (phase === "picking_up") {
    return {
      phase,
      statusTitle: "Em coleta",
      statusBadge: UTILITY_STATUS_LABELS.picking_up,
      etaSubline: "Carregando itens no ponto de origem",
      showDriverOnMap,
      showLivePulse: true,
      variant: "info",
    };
  }

  if (phase === "in_transit") {
    const km = input.distanceMeters ? (input.distanceMeters / 1000).toFixed(1) : null;
    return {
      phase,
      statusTitle: "Em deslocamento",
      statusBadge: UTILITY_STATUS_LABELS.in_transit,
      etaSubline: km ? `Transportando carga · ~${km} km` : "Transportando carga até o destino",
      showDriverOnMap,
      showLivePulse: true,
      variant: "brand",
    };
  }

  return {
    phase: "arriving",
    statusTitle: "Chegando ao destino",
    statusBadge: UTILITY_STATUS_LABELS.arriving,
    etaSubline: "Prestador próximo ao local de entrega",
    showDriverOnMap,
    showLivePulse: true,
    variant: "success",
  };
}

export function parseUtilityMapPoint(
  latValue: string | number | null | undefined,
  lngValue: string | number | null | undefined
): { lat: number; lng: number } | null {
  const lat = typeof latValue === "number" ? latValue : Number.parseFloat(String(latValue ?? ""));
  const lng = typeof lngValue === "number" ? lngValue : Number.parseFloat(String(lngValue ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function estimateUtilityEtaMinutes(distanceMeters: number): number {
  return Math.max(2, Math.round(distanceMeters / 1000 / 0.45));
}

export function utilityDriverDistanceToTargetMeters(
  driver: { lat: number; lng: number },
  target: { lat: number; lng: number }
): number {
  return Math.round(haversineMeters(driver, target));
}
