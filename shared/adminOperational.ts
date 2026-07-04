/** Tipos compartilhados — Central Operacional Admin (Módulo 6). */

import { BRAZIL_MAP_CENTER } from "./mapDefaults";

export type AdminDriverOperationalStatus = "available" | "busy" | "offline" | "pending";

export type AdminOperationalDriver = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  isAvailable: boolean;
  operationalStatus: AdminDriverOperationalStatus;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  rating: number;
  totalRides: number;
  totalEarningsCents: number;
  areaLabel: string;
};

/** Nível de prioridade operacional para triagem na Central. */
export type AdminRidePriority = "sos" | "critical" | "warning" | "normal";

/** Uma etapa da timeline operacional da corrida. */
export type AdminRideTimelineStep = {
  key: "created" | "accepted" | "arrived" | "started" | "completed" | "cancelled";
  label: string;
  at: string | null;
  done: boolean;
};

export type AdminOperationalRide = {
  id: number;
  status: string;
  vehicleType: string;
  /** Rótulo comercial da categoria (ex.: "Carro", "Utilitário"). */
  categoryLabel: string;
  originAddress: string;
  destinationAddress: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  driverId: number | null;
  driverName: string | null;
  passengerName: string | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  /** ETA restante estimado (s) quando em andamento; null se não aplicável. */
  etaSeconds: number | null;
  createdAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  /** Segundos desde a criação enquanto aguarda aceite (0 se já aceita). */
  waitingSeconds: number;
  /** Prioridade calculada para destaque na fila. */
  priority: AdminRidePriority;
  /** Motivo textual da prioridade (ex.: "Aguardando aceite há 3 min"). */
  priorityReason: string | null;
  sosActive: boolean;
  areaLabel: string;
};

/** Alerta operacional exibido no painel de fila/alertas da Central. */
export type AdminOperationalAlert = {
  id: string;
  rideId: number;
  priority: AdminRidePriority;
  title: string;
  detail: string;
  createdAt: string;
};

export type AdminOperationalMetrics = {
  pendingRides: number;
  acceptedRides: number;
  inProgressRides: number;
  completedToday: number;
  driversOnline: number;
  driversAvailable: number;
  revenueTodayCents: number;
};

export type AdminOperationalOverview = {
  metrics: AdminOperationalMetrics;
  rides: AdminOperationalRide[];
  drivers: AdminOperationalDriver[];
  alerts: AdminOperationalAlert[];
  updatedAt: string;
};

export const ADMIN_MAP_DEFAULT_CENTER = BRAZIL_MAP_CENTER;

/** Limite (s) de espera por aceite antes de sinalizar atenção/atraso. */
export const ADMIN_WAIT_WARNING_SECONDS = 90;
export const ADMIN_WAIT_CRITICAL_SECONDS = 180;

const CATEGORY_LABELS: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

export function getRideCategoryLabel(vehicleType: string): string {
  return CATEGORY_LABELS[vehicleType] ?? vehicleType;
}

/** Rótulos das etapas da timeline. */
export const ADMIN_TIMELINE_LABELS: Record<AdminRideTimelineStep["key"], string> = {
  created: "Solicitada",
  accepted: "Aceita",
  arrived: "No embarque",
  started: "Iniciada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

/** Monta a timeline operacional de uma corrida a partir dos timestamps. */
export function buildRideTimeline(ride: AdminOperationalRide): AdminRideTimelineStep[] {
  const steps: AdminRideTimelineStep[] = [
    { key: "created", label: ADMIN_TIMELINE_LABELS.created, at: ride.createdAt, done: true },
    {
      key: "accepted",
      label: ADMIN_TIMELINE_LABELS.accepted,
      at: ride.acceptedAt,
      done: !!ride.acceptedAt || ["accepted", "in_progress", "completed"].includes(ride.status),
    },
    {
      key: "arrived",
      label: ADMIN_TIMELINE_LABELS.arrived,
      at: ride.arrivedAt,
      done: !!ride.arrivedAt || ["in_progress", "completed"].includes(ride.status),
    },
    {
      key: "started",
      label: ADMIN_TIMELINE_LABELS.started,
      at: ride.startedAt,
      done: !!ride.startedAt || ["in_progress", "completed"].includes(ride.status),
    },
  ];

  if (ride.status === "cancelled") {
    steps.push({
      key: "cancelled",
      label: ADMIN_TIMELINE_LABELS.cancelled,
      at: ride.cancelledAt,
      done: true,
    });
  } else {
    steps.push({
      key: "completed",
      label: ADMIN_TIMELINE_LABELS.completed,
      at: ride.completedAt,
      done: ride.status === "completed",
    });
  }

  return steps;
}

export const ADMIN_DEMO_AREAS = [
  "Centro",
  "Rodoviária",
  "Hospital",
  "Praça da Matriz",
  "UFS Campus",
] as const;
