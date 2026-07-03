/**
 * Marcador do motorista ao vivo — veículo por categoria com anel Fui.
 */
import L from "leaflet";
import { fuiMapPinIcon } from "@/components/map/fuiMapPinIcon";
import type { DemoVehicleType } from "@shared/demoPricing";

const VEHICLE_SVG_PATHS: Record<DemoVehicleType, string> = {
  moto:
    '<path d="M7 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm10 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="M9.2 17.2h3.2l2.1-4.7H18l1.3 4.1M6.2 17.2l2.6-5.3h2.8l1.9 2.6M11.4 11.9l-1.2-2.4H7.8M15.8 9.5h2.4"/>',
  carro:
    '<path d="M5.2 11.6 7 7.2A2 2 0 0 1 8.9 6h6.2A2 2 0 0 1 17 7.2l1.8 4.4"/><path d="M4 12h16v5.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.2V12Z"/><path d="M7 18.5v1.2M17 18.5v1.2M6.8 15h.1M17.1 15h.1"/>',
  van:
    '<path d="M3.8 7.2h9.8a2 2 0 0 1 2 2v1.4h2.3l2.3 3.1v3.5h-2.1"/><path d="M3.8 7.2v10h2.1M8.2 17.2h6.5"/><path d="M6 10.2h3.2M10.7 10.2h3.2M16.1 12.7h2.1"/><circle cx="7.1" cy="17.2" r="2"/><circle cx="16.9" cy="17.2" r="2"/>',
  utilitario:
    '<path d="M3.5 7h10v10.2H6"/><path d="M13.5 10.5h3.1l3.9 4.1v2.6h-2.1M13.5 17.2h1.9"/><path d="M6 10h4.8M6 13h4.8"/><circle cx="6" cy="17.2" r="2"/><circle cx="17.4" cy="17.2" r="2"/>',
};

function createVehicleLiveIcon(vehicleType: DemoVehicleType = "carro"): L.DivIcon {
  const path = VEHICLE_SVG_PATHS[vehicleType] ?? VEHICLE_SVG_PATHS.carro;
  return L.divIcon({
    className: "fui-driver-live-marker",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #F39200, #D97706);
        box-shadow: 0 10px 24px rgba(0,0,0,.35), 0 0 0 3px rgba(255,255,255,.92);
        display: grid;
        place-items: center;
      ">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true">
          ${path}
        </svg>
      </div>
    `,
  });
}

export function createDriverLiveMarker(
  map: L.Map,
  position: [number, number],
  options?: { title?: string; vehicleType?: DemoVehicleType }
): L.Marker {
  return L.marker(position, {
    icon: options?.vehicleType ? createVehicleLiveIcon(options.vehicleType) : fuiMapPinIcon,
    title: options?.title ?? "Motorista",
    zIndexOffset: 1000,
  }).addTo(map);
}

export { FUI_MAP_PIN_URL, fuiMapPinIcon, FUI_MAP_PIN_ANCHOR } from "@/components/map/fuiMapPinIcon";
