/** Rotas da landing comercial B2B — usadas para lazy load e ocultar prompts do app. */
export const LANDING_ROUTE_PATHS = [
  "/para-sua-cidade",
  "/licenca",
  "/fui-licenciamento",
] as const;

export function isLandingRoute(path: string): boolean {
  return LANDING_ROUTE_PATHS.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/** Checagem síncrona para bootstrap (main.tsx) antes do router montar. */
export function isLandingRoutePathname(pathname: string = ""): boolean {
  const path = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
  return isLandingRoute(path);
}
