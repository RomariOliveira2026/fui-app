export type DeliveryStatus =
  | "requested"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type DeliveryStatusEvent = {
  status: DeliveryStatus;
  label: string;
  at: string;
};

export type DeliveryPremiumMeta = {
  confirmationCode: string;
  statusHistory: DeliveryStatusEvent[];
  signatureConfirmed?: boolean;
  signatureName?: string;
};

export const DELIVERY_STATUS_STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: "requested", label: "Solicitado" },
  { status: "accepted", label: "Aceito" },
  { status: "picked_up", label: "Em coleta" },
  { status: "in_transit", label: "Em rota" },
  { status: "delivered", label: "Entregue" },
];

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  requested: "Solicitado",
  accepted: "Aceito",
  picked_up: "Em coleta",
  in_transit: "Em rota",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const DEMO_PROOF_PLACEHOLDER =
  "https://placehold.co/400x300/1a1a1a/F39200?text=Prova+de+Entrega+Fui";

export function generateDeliveryConfirmationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createInitialDeliveryPremiumMeta(
  status: DeliveryStatus = "requested"
): DeliveryPremiumMeta {
  const now = new Date().toISOString();
  return {
    confirmationCode: generateDeliveryConfirmationCode(),
    statusHistory: [
      {
        status,
        label: DELIVERY_STATUS_LABELS[status],
        at: now,
      },
    ],
  };
}

export function appendDeliveryStatusEvent(
  meta: DeliveryPremiumMeta | null | undefined,
  status: DeliveryStatus
): DeliveryPremiumMeta {
  const base = meta ?? createInitialDeliveryPremiumMeta("requested");
  const at = new Date().toISOString();
  const last = base.statusHistory[base.statusHistory.length - 1];
  if (last?.status === status) {
    return base;
  }
  return {
    ...base,
    statusHistory: [
      ...base.statusHistory,
      { status, label: DELIVERY_STATUS_LABELS[status], at },
    ],
  };
}

export function getDemoProofPlaceholder(orderId: number): string {
  return `${DEMO_PROOF_PLACEHOLDER}&id=${orderId}`;
}

export function getActiveStepIndex(status: DeliveryStatus): number {
  if (status === "cancelled") return -1;
  const idx = DELIVERY_STATUS_STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export const DEMO_DELIVERY_STATUS_FLOW: DeliveryStatus[] = [
  "requested",
  "accepted",
  "picked_up",
  "in_transit",
];

export function getNextDemoDeliveryStatus(current: DeliveryStatus): DeliveryStatus | null {
  const idx = DEMO_DELIVERY_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= DEMO_DELIVERY_STATUS_FLOW.length - 1) return null;
  return DEMO_DELIVERY_STATUS_FLOW[idx + 1] ?? null;
}
