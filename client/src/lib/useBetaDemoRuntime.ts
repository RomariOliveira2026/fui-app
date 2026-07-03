import { useEffect, useState } from "react";
import { isBetaDemoRuntime, setRuntimeBetaDemoActive } from "@/lib/demoMode";

type AppConfigResponse = { betaDemo?: boolean };

/** Beta demo: build-time (VITE_BETA_DEMO) ou runtime (/api/app-config → BETA_DEMO). */
export function useBetaDemoRuntime(skip: boolean) {
  const buildTimeActive = isBetaDemoRuntime();
  const [serverActive, setServerActive] = useState<boolean | null>(
    buildTimeActive ? true : skip ? false : null
  );

  useEffect(() => {
    if (buildTimeActive || skip) return;

    let cancelled = false;
    fetch("/api/app-config", { credentials: "same-origin" })
      .then((response) =>
        response.ok ? (response.json() as Promise<AppConfigResponse>) : { betaDemo: false }
      )
      .then((data) => {
        if (!cancelled) setServerActive(Boolean(data?.betaDemo));
      })
      .catch(() => {
        if (!cancelled) setServerActive(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildTimeActive, skip]);

  const pending = !buildTimeActive && !skip && serverActive === null;
  const active = buildTimeActive || serverActive === true;

  useEffect(() => {
    setRuntimeBetaDemoActive(active);
  }, [active]);

  return { active, pending };
}
