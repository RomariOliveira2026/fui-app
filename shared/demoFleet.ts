/** Frota demo in-memory — motoristas fake para teste ponta a ponta. */

export type DemoFleetVehicleType = "moto" | "carro" | "van" | "utilitario";

export type DemoFleetDriverStatus = "online" | "offline" | "a_caminho" | "em_corrida";

export type DemoFleetDriverSeed = {
  userId: number;
  name: string;
  vehicleType: DemoFleetVehicleType;
  brand: string;
  model: string;
  plate: string;
  color: string;
  /** Rating 0–500 (ex.: 480 = 4.8) */
  rating: number;
  avatarUrl: string;
  /** Distância inicial do centro (graus lat/lng) */
  offsetLat: number;
  offsetLng: number;
};

function avatarFor(name: string): string {
  const encoded = encodeURIComponent(name.replace(/\s+/g, "+"));
  return `https://ui-avatars.com/api/?name=${encoded}&background=F39200&color=fff&size=128`;
}

export const DEMO_FLEET_DRIVERS: DemoFleetDriverSeed[] = [
  {
    userId: 801_001,
    name: "Carlos Silva",
    vehicleType: "carro",
    brand: "Chevrolet",
    model: "Onix",
    plate: "ABC1D23",
    color: "Prata",
    rating: 488,
    avatarUrl: avatarFor("Carlos Silva"),
    offsetLat: 0.006,
    offsetLng: -0.004,
  },
  {
    userId: 801_002,
    name: "Ana Souza",
    vehicleType: "moto",
    brand: "Honda",
    model: "CG 160",
    plate: "MOT2E45",
    color: "Vermelha",
    rating: 495,
    avatarUrl: avatarFor("Ana Souza"),
    offsetLat: -0.005,
    offsetLng: 0.007,
  },
  {
    userId: 801_003,
    name: "Pedro Lima",
    vehicleType: "van",
    brand: "Mercedes",
    model: "Sprinter",
    plate: "VAN3F67",
    color: "Branca",
    rating: 472,
    avatarUrl: avatarFor("Pedro Lima"),
    offsetLat: 0.008,
    offsetLng: 0.003,
  },
  {
    userId: 801_004,
    name: "Juliana Costa",
    vehicleType: "carro",
    brand: "Fiat",
    model: "Argo",
    plate: "JUL4G89",
    color: "Azul",
    rating: 481,
    avatarUrl: avatarFor("Juliana Costa"),
    offsetLat: -0.007,
    offsetLng: -0.006,
  },
  {
    userId: 801_005,
    name: "Rafael Mendes",
    vehicleType: "utilitario",
    brand: "Fiat",
    model: "Fiorino",
    plate: "UTL5H12",
    color: "Cinza",
    rating: 465,
    avatarUrl: avatarFor("Rafael Mendes"),
    offsetLat: 0.004,
    offsetLng: -0.008,
  },
];

export const DEMO_FLEET_STATUS_LABELS: Record<DemoFleetDriverStatus, string> = {
  online: "Online",
  offline: "Offline",
  a_caminho: "A caminho",
  em_corrida: "Em corrida",
};
