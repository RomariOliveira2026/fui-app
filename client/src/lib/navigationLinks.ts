/** Links de navegação externa (Google Maps / Waze) — Módulo 4 Fui Maps */

export type NavigationPoint = {
  lat: number;
  lng: number;
  label?: string;
};

function parseCoord(value: string | number | null | undefined): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

export function parseNavigationPoint(
  lat: string | number | null | undefined,
  lng: string | number | null | undefined,
  label?: string
): NavigationPoint | null {
  const latNum = parseCoord(lat);
  const lngNum = parseCoord(lng);
  if (latNum == null || lngNum == null) return null;
  return { lat: latNum, lng: lngNum, label };
}

/** Abre rota até destino no Google Maps (app ou web). */
export function buildGoogleMapsDirectionsUrl(point: NavigationPoint): string {
  const destination = `${point.lat},${point.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

/** Abre navegação no Waze. */
export function buildWazeUrl(point: NavigationPoint): string {
  return `https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`;
}

export function openExternalNavigation(url: string): void {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Destino de navegação conforme status da corrida (motorista). */
export function getDriverNavigationTarget(ride: {
  status: string;
  originLat: string | number | null | undefined;
  originLng: string | number | null | undefined;
  destinationLat: string | number | null | undefined;
  destinationLng: string | number | null | undefined;
}): NavigationPoint | null {
  if (ride.status === "accepted") {
    return parseNavigationPoint(ride.originLat, ride.originLng, "Origem (passageiro)");
  }
  if (ride.status === "in_progress") {
    return parseNavigationPoint(ride.destinationLat, ride.destinationLng, "Destino");
  }
  return null;
}
