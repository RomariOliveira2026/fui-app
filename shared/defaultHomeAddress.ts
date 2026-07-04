/** Residência padrão do passageiro — origem sugerida ao solicitar corrida. */

import {
  getDefaultPassengerHomeForApp,
  type SergipeCityHome,
} from "./sergipeOperatingCities";

function resolveBuildTimeAppCity(): string | undefined {
  if (typeof process !== "undefined" && process.env.VITE_APP_CITY?.trim()) {
    return process.env.VITE_APP_CITY.trim();
  }
  try {
    const viteCity = (import.meta as ImportMeta & { env?: { VITE_APP_CITY?: string } })
      .env?.VITE_APP_CITY;
    return viteCity?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Origem padrão conforme VITE_APP_CITY (build) ou Itabaiana (piloto). */
export function getDefaultPassengerHome(appCity?: string | null): SergipeCityHome {
  return getDefaultPassengerHomeForApp(appCity ?? resolveBuildTimeAppCity());
}

export type { SergipeCityHome } from "./sergipeOperatingCities";

/** Constante de build — prefira getDefaultPassengerHome(WL.city) quando WL.city for dinâmico. */
export const DEFAULT_PASSENGER_HOME = getDefaultPassengerHome();
