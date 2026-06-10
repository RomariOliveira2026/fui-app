/**
 * Ícone Leaflet padrão do Fui — pin customizado servido de /public/pin-mapa.png
 */
import L from "leaflet";

export const FUI_MAP_PIN_URL = "/pin-mapa.png?v=2";

export const FUI_MAP_PIN_SIZE: L.PointExpression = [40, 40];
export const FUI_MAP_PIN_ANCHOR: L.PointExpression = [20, 40];
export const FUI_MAP_PIN_POPUP_ANCHOR: L.PointExpression = [0, -36];

/** Ícone reutilizável — ponta inferior (20, 40) = posição GPS na rota. */
export const fuiMapPinIcon = L.icon({
  iconUrl: FUI_MAP_PIN_URL,
  iconSize: FUI_MAP_PIN_SIZE,
  iconAnchor: FUI_MAP_PIN_ANCHOR,
  popupAnchor: FUI_MAP_PIN_POPUP_ANCHOR,
  className: "fui-map-pin-icon",
});

export function createFuiMapPinIcon(overrides?: Partial<L.IconOptions>): L.Icon {
  return L.icon({
    iconUrl: FUI_MAP_PIN_URL,
    iconSize: FUI_MAP_PIN_SIZE,
    iconAnchor: FUI_MAP_PIN_ANCHOR,
    popupAnchor: FUI_MAP_PIN_POPUP_ANCHOR,
    className: "fui-map-pin-icon",
    ...overrides,
  });
}
