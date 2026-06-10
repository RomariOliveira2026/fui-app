/** Fui Utilitários 1.0 — fretes, mudanças e carga urbana. */

export type UtilityServiceType =
  | "freight_fast"
  | "small_move"
  | "store_pickup"
  | "bulky_cargo"
  | "commercial_transport";

export type UtilityVehicleType =
  | "light_utility"
  | "pickup"
  | "van"
  | "small_truck"
  | "medium_truck";

export type UtilityOrderStatus =
  | "requested"
  | "waiting_driver"
  | "accepted"
  | "picking_up"
  | "in_transit"
  | "arriving"
  | "completed"
  | "cancelled";

export type UtilityPaymentMethod = "pix" | "cash" | "card";

export type UtilityFragility = "normal" | "fragile" | "very_fragile";

export type UtilityCargoInfo = {
  itemType?: string;
  description?: string;
  estimatedWeightKg?: number;
  estimatedVolumeM3?: number;
  packageCount?: number;
  fragility?: UtilityFragility;
  photoUrls?: string[];
  /** Mudança pequena */
  roomCount?: number;
  itemSummary?: string;
  /** Retirada em loja */
  storeName?: string;
  storePhone?: string;
  /** Transporte comercial */
  companyName?: string;
  frequency?: string;
  timeWindow?: string;
  recurrence?: string;
};

export type UtilityOperationalExtras = {
  needsHelper?: boolean;
  helperCount?: number;
  needsDisassembly?: boolean;
  needsAssembly?: boolean;
  hasStairs?: boolean;
  hasElevator?: boolean;
  isUrgent?: boolean;
  isScheduled?: boolean;
  scheduledFor?: string;
  notes?: string;
};

export type UtilityQuoteBreakdown = {
  baseFeeCents: number;
  distanceCents: number;
  vehicleCents: number;
  helpersCents: number;
  urgencyCents: number;
  fragilityCents: number;
  stairsCents: number;
  disassemblyCents: number;
  assemblyCents: number;
  schedulingCents: number;
  weightCents: number;
  totalCents: number;
  distanceMeters: number;
  durationSeconds: number;
  suggestedVehicle: UtilityVehicleType;
};

export type UtilityStatusEvent = {
  status: UtilityOrderStatus;
  label: string;
  at: string;
};

export type UtilityOrderMeta = {
  statusHistory: UtilityStatusEvent[];
  trackingCode: string;
};

export type UtilityOrder = {
  id: number;
  senderId: number;
  driverId: number | null;
  driverCurrentLat?: string | null;
  driverCurrentLng?: string | null;
  serviceType: UtilityServiceType;
  status: UtilityOrderStatus;
  originAddress: string;
  originLat: string;
  originLng: string;
  destinationAddress: string;
  destinationLat: string;
  destinationLng: string;
  intermediateStops?: string[];
  cargo: UtilityCargoInfo;
  extras: UtilityOperationalExtras;
  vehicleType: UtilityVehicleType;
  vehicleAutoSuggested: boolean;
  paymentMethod: UtilityPaymentMethod;
  distance: number | null;
  duration: number | null;
  quote: UtilityQuoteBreakdown | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  paymentStatus: "pending" | "paid" | "failed";
  utilityMeta: UtilityOrderMeta;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

export const UTILITY_SERVICE_LABELS: Record<UtilityServiceType, string> = {
  freight_fast: "Frete Rápido",
  small_move: "Mudança Pequena",
  store_pickup: "Retirada em Loja",
  bulky_cargo: "Carga Volumosa",
  commercial_transport: "Transporte Comercial",
};

export const UTILITY_SERVICE_DESCRIPTIONS: Record<UtilityServiceType, string> = {
  freight_fast: "Sofá, geladeira, eletro e itens grandes no mesmo dia",
  small_move: "Quarto, kitnet e mudanças leves com apoio opcional",
  store_pickup: "Retire na loja e leve até você com rastreio",
  bulky_cargo: "Materiais, mercadorias e volumes pesados urbanos",
  commercial_transport: "Comércio local, feiras e distribuição recorrente",
};

export const UTILITY_VEHICLE_LABELS: Record<UtilityVehicleType, string> = {
  light_utility: "Utilitário leve",
  pickup: "Picape",
  van: "Van",
  small_truck: "Caminhão pequeno",
  medium_truck: "Caminhão médio",
};

export const UTILITY_STATUS_LABELS: Record<UtilityOrderStatus, string> = {
  requested: "Solicitado",
  waiting_driver: "Aguardando utilitário",
  accepted: "Aceito",
  picking_up: "Em coleta",
  in_transit: "Em deslocamento",
  arriving: "Chegando",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const UTILITY_STATUS_STEPS: { status: UtilityOrderStatus; label: string }[] = [
  { status: "requested", label: "Solicitado" },
  { status: "waiting_driver", label: "Aguardando" },
  { status: "accepted", label: "Aceito" },
  { status: "picking_up", label: "Em coleta" },
  { status: "in_transit", label: "Em rota" },
  { status: "arriving", label: "Chegando" },
  { status: "completed", label: "Concluído" },
];

export const UTILITY_SERVICE_TYPES: UtilityServiceType[] = [
  "freight_fast",
  "small_move",
  "store_pickup",
  "bulky_cargo",
  "commercial_transport",
];

export const UTILITY_VEHICLE_TYPES: UtilityVehicleType[] = [
  "light_utility",
  "pickup",
  "van",
  "small_truck",
  "medium_truck",
];

export function createInitialUtilityMeta(status: UtilityOrderStatus = "requested"): UtilityOrderMeta {
  const now = new Date().toISOString();
  return {
    trackingCode: generateUtilityTrackingCode(),
    statusHistory: [
      {
        status,
        label: UTILITY_STATUS_LABELS[status],
        at: now,
      },
    ],
  };
}

export function generateUtilityTrackingCode(): string {
  return (
    "UTL" +
    Date.now().toString(36).toUpperCase().slice(-5) +
    Math.random().toString(36).substring(2, 4).toUpperCase()
  );
}

export function appendUtilityStatusEvent(
  meta: UtilityOrderMeta,
  status: UtilityOrderStatus
): UtilityOrderMeta {
  const at = new Date().toISOString();
  return {
    ...meta,
    statusHistory: [
      ...meta.statusHistory,
      { status, label: UTILITY_STATUS_LABELS[status], at },
    ],
  };
}
