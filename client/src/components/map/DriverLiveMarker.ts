/**
 * Marcador do motorista ao vivo — ícone escuro por categoria, sem fundo laranja.
 */
import L from "leaflet";
import type { DemoVehicleType } from "@shared/demoPricing";

const DRIVER_ICON_COLOR = "#071116";

/**
 * Ícones em vista de cima (bird's eye). Todos apontam para o NORTE (para cima)
 * por padrão, então a rotação CSS pode usar o bearing da rota diretamente.
 */
const VEHICLE_SVG_MARKUP: Record<DemoVehicleType, string> = {
  moto: `
    <g fill="${DRIVER_ICON_COLOR}" stroke="none">
      <path d="M9.4 4.9c0-1.05 1.16-1.9 2.6-1.9s2.6.85 2.6 1.9-1.16 1.6-2.6 1.6-2.6-.55-2.6-1.6Z" fill="#f39200"/>
      <rect x="10.9" y="4" width="2.2" height="4.1" rx="1.1"/>
      <rect x="7.7" y="6.1" width="8.6" height="1.7" rx="0.85"/>
      <path d="M11 7.6h2v3.1a1 1 0 0 1-2 0Z"/>
      <path d="M9.4 10.2h5.2c.7 0 1.1.7.85 1.35l-1.5 3.8c-.2.5-.7.85-1.25.85h-1.4c-.55 0-1.05-.35-1.25-.85l-1.5-3.8c-.25-.65.15-1.35.85-1.35Z"/>
      <rect x="10.6" y="15.7" width="2.8" height="4.4" rx="1.4"/>
    </g>
  `,
  carro: `
    <g fill="${DRIVER_ICON_COLOR}" stroke="none">
      <rect x="6.4" y="3.4" width="11.2" height="17.2" rx="4.2"/>
      <path d="M8.2 6.6c.6-1.1 1.9-1.7 3.8-1.7s3.2.6 3.8 1.7l.7 2.2H7.5l.7-2.2Z" fill="#cfe0e8"/>
      <rect x="8" y="10.4" width="8" height="4.4" rx="1.2" fill="#cfe0e8"/>
      <rect x="9.1" y="1.9" width="1.8" height="1.9" rx="0.7"/>
      <rect x="13.1" y="1.9" width="1.8" height="1.9" rx="0.7"/>
    </g>
  `,
  van: `
    <g fill="${DRIVER_ICON_COLOR}" stroke="none">
      <rect x="5.6" y="2.6" width="12.8" height="18.8" rx="3.2"/>
      <rect x="7.2" y="4.4" width="9.6" height="3.4" rx="1" fill="#cfe0e8"/>
      <rect x="7.2" y="9" width="9.6" height="8.6" rx="1" fill="#cfe0e8" opacity="0.65"/>
    </g>
  `,
  utilitario: `
    <g fill="${DRIVER_ICON_COLOR}" stroke="none">
      <rect x="6" y="2.4" width="12" height="7.4" rx="2"/>
      <rect x="7.5" y="3.8" width="9" height="3.2" rx="0.9" fill="#cfe0e8"/>
      <rect x="5.3" y="10" width="13.4" height="11.4" rx="1.6" opacity="0.85"/>
    </g>
  `,
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
  const markup = VEHICLE_SVG_MARKUP[type];
  return L.divIcon({
    className: `fui-driver-live-marker fui-driver-live-marker--${type}`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `
      <div class="fui-driver-live-marker__inner">
        <svg width="34" height="34" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          ${markup}
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
