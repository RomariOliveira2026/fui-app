import { useBetaDemoRuntime } from "@/lib/useBetaDemoRuntime";
import { getDemoRideSpeedMultiplier } from "@shared/demoRideProgression";

export function getClientDemoRideSpeedMultiplier(): number {
  return getDemoRideSpeedMultiplier({
    multiplier: import.meta.env.VITE_DEMO_RIDE_SPEED_MULTIPLIER as string | undefined,
    betaDemo: import.meta.env.VITE_BETA_DEMO as string | undefined,
  });
}

export function formatDemoSpeedMultiplierLabel(multiplier: number): string {
  const rounded = Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(1);
  return `Simulação demo (${rounded}×)`;
}

export function shouldShowAcceleratedDemoEtaNote(
  showEta: boolean,
  betaDemoActive: boolean
): boolean {
  if (!showEta) return false;
  const multiplier = getClientDemoRideSpeedMultiplier();
  if (multiplier <= 1) return false;
  return betaDemoActive || import.meta.env.DEV;
}

/** Nota de simulação acelerada — visível só quando o ETA ao vivo está ativo. */
export function useDemoAcceleratedEta(showEta: boolean) {
  const { active: betaDemoActive } = useBetaDemoRuntime(false);
  const multiplier = getClientDemoRideSpeedMultiplier();
  const visible = shouldShowAcceleratedDemoEtaNote(showEta, betaDemoActive);
  return {
    visible,
    multiplier,
    label: formatDemoSpeedMultiplierLabel(multiplier),
  };
}
