/** Dados de mapa locais para demo em Itabaiana, SE (sem Google Maps API). */

export type DemoPlace = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
};

export const DEMO_PLACES: DemoPlace[] = [
  {
    placeId: "demo-centro",
    description: "Centro, Itabaiana - SE",
    mainText: "Centro",
    secondaryText: "Itabaiana - SE",
    lat: -10.685,
    lng: -37.425,
  },
  {
    placeId: "demo-rodoviaria",
    description: "Rodoviária, Itabaiana - SE",
    mainText: "Rodoviária",
    secondaryText: "Itabaiana - SE",
    lat: -10.682,
    lng: -37.428,
  },
  {
    placeId: "demo-hospital",
    description: "Hospital Dr. José Henrique, Itabaiana - SE",
    mainText: "Hospital Dr. José Henrique",
    secondaryText: "Itabaiana - SE",
    lat: -10.688,
    lng: -37.422,
  },
  {
    placeId: "demo-praca",
    description: "Praça da Matriz, Itabaiana - SE",
    mainText: "Praça da Matriz",
    secondaryText: "Itabaiana - SE",
    lat: -10.6845,
    lng: -37.4245,
  },
  {
    placeId: "demo-universidade",
    description: "UFS - Campus Itabaiana, SE",
    mainText: "UFS Campus Itabaiana",
    secondaryText: "Itabaiana - SE",
    lat: -10.691,
    lng: -37.418,
  },
];

export function filterDemoPlaces(input: string): DemoPlace[] {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];

  return DEMO_PLACES.filter(
    (p) =>
      p.description.toLowerCase().includes(q) ||
      p.mainText.toLowerCase().includes(q)
  );
}

export function findDemoPlaceByPlaceId(placeId: string): DemoPlace | undefined {
  return DEMO_PLACES.find((p) => p.placeId === placeId);
}

export function findDemoPlaceByText(text: string): DemoPlace | undefined {
  const q = text.trim().toLowerCase();
  return DEMO_PLACES.find((p) => p.description.toLowerCase() === q);
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Polyline encoding (Google format) para rota demo em linha reta. */
export function encodeDemoPolyline(
  points: Array<{ lat: number; lng: number }>
): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    result += encodeSigned(lat - lastLat);
    result += encodeSigned(lng - lastLng);

    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

function encodeSigned(value: number): string {
  let s = value < 0 ? ~(value << 1) : value << 1;
  let result = "";
  while (s >= 0x20) {
    result += String.fromCharCode((0x20 | (s & 0x1f)) + 63);
    s >>= 5;
  }
  result += String.fromCharCode(s + 63);
  return result;
}

export function resolveDemoLocation(input: string): {
  lat: number;
  lng: number;
  address: string;
} {
  if (input.startsWith("place_id:")) {
    const placeId = input.slice("place_id:".length);
    const place = findDemoPlaceByPlaceId(placeId);
    if (place) {
      return { lat: place.lat, lng: place.lng, address: place.description };
    }
  }

  const byText = findDemoPlaceByText(input);
  if (byText) {
    return { lat: byText.lat, lng: byText.lng, address: byText.description };
  }

  const partial = DEMO_PLACES.find((p) =>
    input.toLowerCase().includes(p.mainText.toLowerCase())
  );
  if (partial) {
    return { lat: partial.lat, lng: partial.lng, address: partial.description };
  }

  // Fallback: centro de Itabaiana
  const centro = DEMO_PLACES[0];
  return { lat: centro.lat, lng: centro.lng, address: input || centro.description };
}

export function demoDirections(origin: string, destination: string) {
  const start = resolveDemoLocation(origin);
  const end = resolveDemoLocation(destination);
  const distanceM = Math.max(Math.round(haversineMeters(start, end)), 500);
  const durationS = Math.max(Math.round((distanceM / 1000 / 30) * 3600), 120);

  return {
    distance: {
      text: `${(distanceM / 1000).toFixed(1)} km`,
      value: distanceM,
    },
    duration: {
      text: `${Math.round(durationS / 60)} min`,
      value: durationS,
    },
    startAddress: start.address,
    endAddress: end.address,
    startLocation: { lat: start.lat, lng: start.lng },
    endLocation: { lat: end.lat, lng: end.lng },
    overviewPolyline: encodeDemoPolyline([
      { lat: start.lat, lng: start.lng },
      { lat: end.lat, lng: end.lng },
    ]),
    steps: [],
  };
}
