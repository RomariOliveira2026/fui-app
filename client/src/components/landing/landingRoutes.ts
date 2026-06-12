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
