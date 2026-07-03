/** Constantes e tipos compartilhados do Dispatcher Inteligente (Módulo 5). */

export const DISPATCHER_TOP_N_OFFERS = 3;

/** Rodadas sequenciais antes do fallback ampliado. */
export const DISPATCHER_MAX_ROUNDS = 3;

/** Intervalo do scheduler de expiração / auto-redispatch (ms). */
export const DISPATCHER_TICK_INTERVAL_MS = 5_000;

/** Tempo padrão até oferta expirar (ms). Sobrescrevível via DISPATCHER_OFFER_TIMEOUT_MS. */
export const DISPATCHER_OFFER_TIMEOUT_MS_DEFAULT = 45_000;

export function getDispatcherOfferTimeoutMs(): number {
  const env = Number(process.env.DISPATCHER_OFFER_TIMEOUT_MS);
  return Number.isFinite(env) && env > 0 ? env : DISPATCHER_OFFER_TIMEOUT_MS_DEFAULT;
}

export type RideOfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "superseded";

export type RideOfferRecord = {
  id: number;
  rideId: number;
  driverId: number;
  status: RideOfferStatus;
  distanceMeters: number;
  offerRound: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

export type DispatcherEligibleDriver = {
  driverId: number;
  lat: number;
  lng: number;
  distanceMeters: number;
};

export type DispatchResult = {
  offersCreated: number;
  eligibleCount: number;
  usedFallback: boolean;
  offerRound: number;
  expandedPool: boolean;
  offeredDriverIds: number[];
};

export type DispatchRoundSelection = {
  drivers: DispatcherEligibleDriver[];
  offerRound: number;
  expandedPool: boolean;
};

/** Seleciona motoristas para a rodada, excluindo já ofertados (exceto fallback ampliado). */
export function selectDriversForRound(
  eligible: DispatcherEligibleDriver[],
  offerRound: number,
  previouslyOfferedDriverIds: Set<number>
): DispatchRoundSelection {
  const fresh = eligible.filter((d) => !previouslyOfferedDriverIds.has(d.driverId));
  const expandedPool = offerRound >= DISPATCHER_MAX_ROUNDS;

  if (expandedPool) {
    return {
      drivers: eligible.slice(0, DISPATCHER_TOP_N_OFFERS),
      offerRound,
      expandedPool: true,
    };
  }

  return {
    drivers: fresh.slice(0, DISPATCHER_TOP_N_OFFERS),
    offerRound,
    expandedPool: false,
  };
}

/** Janela antes do horário agendado para iniciar ofertas (30 min). */
export const DISPATCHER_SCHEDULED_DISPATCH_WINDOW_MS = 30 * 60 * 1000;

export function isRideReadyForDispatch(ride: {
  isScheduled?: string | null;
  scheduledFor?: Date | string | null;
}): boolean {
  if (ride.isScheduled !== "yes" || !ride.scheduledFor) {
    return true;
  }
  const scheduled = new Date(ride.scheduledFor);
  if (Number.isNaN(scheduled.getTime())) {
    return true;
  }
  return Date.now() >= scheduled.getTime() - DISPATCHER_SCHEDULED_DISPATCH_WINDOW_MS;
}

/** Metadados de dispatch expostos ao passageiro/motorista. */
export type RideDispatchMeta = {
  currentRound: number;
  dispatchAttempts: number;
  pendingOffers: number;
  declinedOffers: number;
  lastDispatchAt: string | null;
  isExpandedRound: boolean;
  isScheduledWaiting: boolean;
  scheduledFor: string | null;
};
