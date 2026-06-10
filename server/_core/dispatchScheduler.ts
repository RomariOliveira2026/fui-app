import { DISPATCHER_TICK_INTERVAL_MS } from "@shared/rideDispatcher";
import { processDispatchTick, processProductionDispatchTick } from "./dispatchEngine";
import { ENV } from "./env";

let tickInterval: ReturnType<typeof setInterval> | null = null;

export function startDispatchScheduler(): void {
  if (tickInterval) return;

  tickInterval = setInterval(() => {
    try {
      processDispatchTick();
    } catch (error) {
      console.error("[DispatchScheduler] demo tick failed:", error);
    }

    if (ENV.isProduction) {
      void processProductionDispatchTick().catch((error) => {
        console.warn("[DispatchScheduler] production tick skipped:", error);
      });
    }
  }, DISPATCHER_TICK_INTERVAL_MS);

  console.log(
    `[DispatchScheduler] Ativo · tick a cada ${DISPATCHER_TICK_INTERVAL_MS / 1000}s` +
      (ENV.isProduction ? " (demo + produção)" : " (demo)")
  );
}
