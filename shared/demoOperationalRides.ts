/**
 * Modo demo operacional — frota fake + fluxo automático de corrida.
 *
 * Ativar:  DEMO_OPERATIONAL_RIDES=true  (servidor)
 *          VITE_DEMO_OPERATIONAL_RIDES=true  (cliente, opcional — UI)
 *
 * Desligar: DEMO_OPERATIONAL_RIDES=false  (mesmo com BETA_DEMO=true)
 *
 * Por padrão liga automaticamente quando BETA_DEMO=true (Vercel beta).
 */

export function isDemoOperationalFlagEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export function isDemoOperationalFlagDisabled(value: string | undefined): boolean {
  return value === "false" || value === "0";
}

/** Servidor — frota demo + aceite automático. */
export function isDemoOperationalRidesEnabledServer(): boolean {
  const explicit =
    process.env.DEMO_OPERATIONAL_RIDES ?? process.env.VITE_DEMO_OPERATIONAL_RIDES;
  if (isDemoOperationalFlagDisabled(explicit)) return false;
  if (isDemoOperationalFlagEnabled(explicit)) return true;
  return process.env.BETA_DEMO === "true";
}

/** Cliente — exibir motoristas no mapa / hints de demo. */
export function isDemoOperationalRidesEnabledClient(): boolean {
  const explicit = import.meta.env.VITE_DEMO_OPERATIONAL_RIDES as string | undefined;
  if (isDemoOperationalFlagDisabled(explicit)) return false;
  if (isDemoOperationalFlagEnabled(explicit)) return true;
  const beta = import.meta.env.VITE_BETA_DEMO;
  return beta === "true" || beta === true;
}

/** Aceite automático após busca (ms). */
export const DEMO_OPERATIONAL_ACCEPT_DELAY_MS = 3_500;

/** Espera no embarque antes de iniciar viagem (ms). */
export const DEMO_OPERATIONAL_PICKUP_WAIT_MS = 2_500;

/** Duração mínima de cada trecho animado (ms). */
export const DEMO_OPERATIONAL_SEGMENT_MS = 22_000;

/**
 * Multiplicador de velocidade da simulação (rotas longas em modo demo).
 * Env: DEMO_RIDE_SPEED_MULTIPLIER — padrão 10× quando BETA_DEMO=true.
 */
export { getDemoRideSpeedMultiplier } from "./demoRideProgression";
