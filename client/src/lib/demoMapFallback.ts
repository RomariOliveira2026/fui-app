/**
 * Mapa demo local (sem Google Maps JS API).
 * Suporta marcadores e polylines via SVG sobre fundo estilizado.
 */

export type DemoMapHandle = {
  __demoMap: true;
  container: HTMLDivElement;
  center: { lat: number; lng: number };
  zoom: number;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: { north: number; south: number; east: number; west: number }) => void;
};

type MarkerEntry = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  title?: string;
};

type PolylineEntry = {
  id: string;
  points: Array<{ lat: number; lng: number }>;
  color: string;
  weight: number;
};

let markerCounter = 0;
let polylineCounter = 0;

const stateByContainer = new WeakMap<
  HTMLDivElement,
  {
    center: { lat: number; lng: number };
    zoom: number;
    markers: MarkerEntry[];
    polylines: PolylineEntry[];
    overlay: HTMLDivElement;
    svg: SVGSVGElement;
  }
>();

function project(
  lat: number,
  lng: number,
  center: { lat: number; lng: number },
  zoom: number,
  width: number,
  height: number
) {
  const scale = 256 * Math.pow(2, zoom);
  const toX = (lon: number) => ((lon + 180) / 360) * scale;
  const toY = (latDeg: number) => {
    const sin = Math.sin((latDeg * Math.PI) / 180);
    return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  };

  const cx = toX(center.lng);
  const cy = toY(center.lat);
  const px = toX(lng);
  const py = toY(lat);

  return {
    x: width / 2 + (px - cx),
    y: height / 2 + (py - cy),
  };
}

function renderMap(container: HTMLDivElement) {
  const state = stateByContainer.get(container);
  if (!state) return;

  const { width, height } = container.getBoundingClientRect();
  const w = Math.max(width, 320);
  const h = Math.max(height, 240);

  state.overlay.innerHTML = "";
  state.svg.innerHTML = "";
  state.svg.setAttribute("width", String(w));
  state.svg.setAttribute("height", String(h));
  state.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  for (const line of state.polylines) {
    if (line.points.length < 2) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    path.setAttribute(
      "points",
      line.points
        .map((p) => {
          const { x, y } = project(p.lat, p.lng, state.center, state.zoom, w, h);
          return `${x},${y}`;
        })
        .join(" ")
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", line.color);
    path.setAttribute("stroke-width", String(line.weight));
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("opacity", "0.9");
    state.svg.appendChild(path);
  }

  for (const marker of state.markers) {
    const { x, y } = project(marker.lat, marker.lng, state.center, state.zoom, w, h);
    const el = document.createElement("div");
    el.title = marker.title || marker.label;
    el.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);
      width:28px;height:28px;border-radius:50%;background:${marker.color};
      border:3px solid #fff;color:#fff;font-weight:bold;font-size:12px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;
    `;
    el.textContent = marker.label;
    state.overlay.appendChild(el);
  }
}

export function isDemoMap(map: unknown): map is DemoMapHandle {
  return Boolean(map && typeof map === "object" && (map as DemoMapHandle).__demoMap);
}

export function createDemoMap(
  container: HTMLDivElement,
  initialCenter: { lat: number; lng: number },
  initialZoom: number,
  onReady?: (map: DemoMapHandle) => void
): DemoMapHandle {
  container.innerHTML = "";
  container.style.position = "relative";
  container.style.overflow = "hidden";
  container.style.background =
    "linear-gradient(180deg,#1a3646 0%,#1d2c4d 40%,#14222E 100%)";

  const grid = document.createElement("div");
  grid.style.cssText = `
    position:absolute;inset:0;opacity:.15;
    background-image:linear-gradient(#334e87 1px,transparent 1px),linear-gradient(90deg,#334e87 1px,transparent 1px);
    background-size:40px 40px;
  `;
  container.appendChild(grid);

  const badge = document.createElement("div");
  badge.textContent = "Mapa Demo · Brasil";
  badge.style.cssText = `
    position:absolute;top:10px;left:10px;z-index:2;
    background:rgba(0,0,0,.55);color:#F39200;font-size:11px;
    padding:4px 8px;border-radius:6px;border:1px solid rgba(243,146,0,.35);
  `;
  container.appendChild(badge);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.cssText = "position:absolute;inset:0;z-index:1;pointer-events:none;";
  container.appendChild(svg);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;z-index:2;pointer-events:none;";
  container.appendChild(overlay);

  const state = {
    center: initialCenter,
    zoom: initialZoom,
    markers: [] as MarkerEntry[],
    polylines: [] as PolylineEntry[],
    overlay,
    svg,
  };
  stateByContainer.set(container, state);

  const handle: DemoMapHandle = {
    __demoMap: true,
    container,
    center: initialCenter,
    zoom: initialZoom,
    setCenter(center) {
      state.center = center;
      handle.center = center;
      renderMap(container);
    },
    setZoom(zoom) {
      state.zoom = zoom;
      handle.zoom = zoom;
      renderMap(container);
    },
    fitBounds(bounds) {
      const center = {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
      };
      state.center = center;
      handle.center = center;
      renderMap(container);
    },
  };

  const ro = new ResizeObserver(() => renderMap(container));
  ro.observe(container);
  renderMap(container);

  if (onReady) onReady(handle);
  return handle;
}

export function addDemoMarker(
  map: DemoMapHandle,
  position: { lat: number; lng: number },
  options: { color: string; label: string; title?: string }
) {
  const state = stateByContainer.get(map.container);
  if (!state) return { setMap: () => {} };

  const id = `m-${++markerCounter}`;
  state.markers.push({ id, lat: position.lat, lng: position.lng, ...options });
  renderMap(map.container);

  return {
    setMap: (target: unknown) => {
      if (!target) {
        state.markers = state.markers.filter((m) => m.id !== id);
        renderMap(map.container);
      }
    },
  };
}

export function drawDemoRoute(
  map: DemoMapHandle,
  points: Array<{ lat: number; lng: number }>,
  options?: { color?: string; weight?: number; fitBounds?: boolean }
) {
  const state = stateByContainer.get(map.container);
  if (!state) return { setMap: () => {} };

  const id = `p-${++polylineCounter}`;
  state.polylines.push({
    id,
    points,
    color: options?.color || "#F39200",
    weight: options?.weight || 5,
  });
  renderMap(map.container);

  if (options?.fitBounds !== false && points.length >= 2) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds({
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    });
  }

  return {
    setMap: (target: unknown) => {
      if (!target) {
        state.polylines = state.polylines.filter((p) => p.id !== id);
        renderMap(map.container);
      }
    },
  };
}
