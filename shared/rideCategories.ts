import type { DemoVehicleType } from "./demoPricing";

export type RideCategoryMeta = {
  type: DemoVehicleType;
  label: string;
  description: string;
  etaHint?: string;
};

export const RIDE_CATEGORIES: RideCategoryMeta[] = [
  {
    type: "moto",
    label: "Moto",
    description: "Rápida e econômica",
    etaHint: "Chega antes",
  },
  {
    type: "carro",
    label: "Carro",
    description: "Conforto e segurança",
    etaHint: "Padrão",
  },
  {
    type: "van",
    label: "Van",
    description: "Espaço para grupos",
    etaHint: "Mais assentos",
  },
  {
    type: "utilitario",
    label: "Utilitário",
    description: "Frete e mudanças",
    etaHint: "Carga",
  },
];

export const VEHICLE_TYPE_LABELS: Record<DemoVehicleType, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

export function formatRidePriceBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatRideDurationMinutes(durationS: number): string {
  const minutes = Math.max(1, Math.round(durationS / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function formatRideDistanceKm(distanceM: number): string {
  return `${(distanceM / 1000).toFixed(1)} km`;
}
