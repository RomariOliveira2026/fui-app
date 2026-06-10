/**
 * Marcador do motorista ao vivo — pin Fui (/pin-mapa.png), ponta inferior na rota.
 */
import L from "leaflet";
import { fuiMapPinIcon } from "@/components/map/fuiMapPinIcon";

export function createDriverLiveMarker(
  map: L.Map,
  position: [number, number],
  options?: { title?: string }
): L.Marker {
  return L.marker(position, {
    icon: fuiMapPinIcon,
    title: options?.title ?? "Motorista",
    zIndexOffset: 1000,
  }).addTo(map);
}

export { FUI_MAP_PIN_URL, fuiMapPinIcon, FUI_MAP_PIN_ANCHOR } from "@/components/map/fuiMapPinIcon";
