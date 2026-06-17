import { formatEtaFromSeconds } from "@shared/driverTracking";
import { useEffect, useRef, useState } from "react";

/** Contagem regressiva local entre polls — ancora no valor do servidor a cada atualização. */
export function useLiveEtaSeconds(
  serverSeconds: number | undefined,
  enabled: boolean
): number | undefined {
  const anchorRef = useRef({ at: Date.now(), seconds: serverSeconds ?? 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (serverSeconds == null) return;
    anchorRef.current = { at: Date.now(), seconds: serverSeconds };
    setTick((n) => n + 1);
  }, [serverSeconds]);

  useEffect(() => {
    if (!enabled || serverSeconds == null || serverSeconds <= 0) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [enabled, serverSeconds]);

  if (!enabled || serverSeconds == null) return serverSeconds;

  void tick;
  const elapsed = Math.floor((Date.now() - anchorRef.current.at) / 1000);
  return Math.max(0, anchorRef.current.seconds - elapsed);
}

export function useLiveEtaPresentation(
  seconds: number | undefined,
  distanceM: number,
  enabled: boolean
): { headline: string; unit: string; label: string } | null {
  const liveSeconds = useLiveEtaSeconds(seconds, enabled);
  if (liveSeconds == null) return null;
  const display = formatEtaFromSeconds(liveSeconds, distanceM);
  return { headline: display.headline, unit: display.unit, label: display.label };
}
