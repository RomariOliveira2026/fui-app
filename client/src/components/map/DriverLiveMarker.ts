/**
 * Marcador do motorista ao vivo — ícone escuro por categoria, sem fundo laranja.
 */
import L from "leaflet";
import type { DemoVehicleType } from "@shared/demoPricing";

const DRIVER_ICON_COLOR = "#071116";

const VEHICLE_SVG_PATHS: Record<DemoVehicleType, string> = {
  moto:
    '<path d="M5.9 15.6a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"/><path d="M17.9 15.6a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"/><path d="M8.1 17.4h3.6l2.15-4.7h3.15l1.85 4.25M6 17.25l2.65-5.15h2.7l2.15 3.05M10.45 12.1l-1.1-2.45H7.35M15.2 9.65h2.85"/>',
  carro:
    '<path d="M5.2 11.6 7 7.2A2 2 0 0 1 8.9 6h6.2A2 2 0 0 1 17 7.2l1.8 4.4"/><path d="M4 12h16v5.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.2V12Z"/><path d="M7 18.5v1.2M17 18.5v1.2M6.8 15h.1M17.1 15h.1"/>',
  van:
    '<path d="M3.8 7.2h9.8a2 2 0 0 1 2 2v1.4h2.3l2.3 3.1v3.5h-2.1"/><path d="M3.8 7.2v10h2.1M8.2 17.2h6.5"/><path d="M6 10.2h3.2M10.7 10.2h3.2M16.1 12.7h2.1"/><circle cx="7.1" cy="17.2" r="2"/><circle cx="16.9" cy="17.2" r="2"/>',
  utilitario:
    '<path d="M3.5 7h10v10.2H6"/><path d="M13.5 10.5h3.1l3.9 4.1v2.6h-2.1M13.5 17.2h1.9"/><path d="M6 10h4.8M6 13h4.8"/><circle cx="6" cy="17.2" r="2"/><circle cx="17.4" cy="17.2" r="2"/>',
};

export function normalizeDriverVehicleType(raw?: string | null): DemoVehicleType {
  const value = (raw ?? "carro").toLowerCase().trim();
  if (value === "moto" || value === "carro" || value === "van" || value === "utilitario") {
    return value;
  }
  return "carro";
}

export function createVehicleLiveIcon(vehicleType?: string | null): L.DivIcon {
  const type = normalizeDriverVehicleType(vehicleType);
  const path = VEHICLE_SVG_PATHS[type];
  return L.divIcon({
    className: `fui-driver-live-marker fui-driver-live-marker--${type}`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <div class="fui-driver-live-marker__inner">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g fill="none" stroke="${DRIVER_ICON_COLOR}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            ${path}
          </g>
        </svg>
      </div>
    `,
  });
}

export function createDriverLiveMarker(
  map: L.Map,
  position: [number, number],
  options?: { title?: string; vehicleType?: string | null }
): L.Marker {
  return L.marker(position, {
    icon: createVehicleLiveIcon(options?.vehicleType),
    title: options?.title ?? "Motorista",
    zIndexOffset: 1000,
  }).addTo(map);
}

export { FUI_MAP_PIN_URL, fuiMapPinIcon, FUI_MAP_PIN_ANCHOR } from "@/components/map/fuiMapPinIcon";
