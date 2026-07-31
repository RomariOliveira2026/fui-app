/**
 * Dados fictícios para screenshots do painel do passageiro em ambiente demo.
 * Somente exibição — não persiste em banco nem altera lógica operacional.
 */

import type { Ride } from "../../../drizzle/schema";
import type { DemoSavedAddress } from "@/lib/demoSavedAddresses";
import type { PassengerSummary } from "@/lib/usePassengerDashboardData";

export const PORTFOLIO_PASSENGER_SUMMARY: PassengerSummary = {
  totalRides: 128,
  totalSpent: 384_270,
  totalSaved: 27_640,
  scheduledCount: 3,
};

const now = new Date();

function daysAgo(days: number, hour = 14, minute = 30): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function ride(
  id: number,
  originAddress: string,
  destinationAddress: string,
  finalPrice: number,
  createdAt: Date
): Ride {
  return {
    id,
    passengerId: 0,
    driverId: 101,
    vehicleId: 1,
    status: "completed",
    vehicleType: "carro",
    originAddress,
    originLat: "-10.9472",
    originLng: "-37.0731",
    destinationAddress,
    destinationLat: "-10.9009",
    destinationLng: "-37.0719",
    driverCurrentLat: null,
    driverCurrentLng: null,
    distance: 5200,
    duration: 900,
    estimatedPrice: finalPrice,
    finalPrice,
    paymentMethod: "pix",
    paymentStatus: "paid",
    stripePaymentIntentId: null,
    couponId: null,
    couponCode: null,
    discountAmount: 0,
    isShared: false,
    maxPassengers: 1,
    currentPassengers: 1,
    pricePerPassenger: null,
    isFreight: false,
    cargoWeight: null,
    cargoType: null,
    cargoDescription: null,
    needsHelpers: false,
    numberOfHelpers: 0,
    shareToken: null,
    sosActivated: false,
    sosActivatedAt: null,
    createdAt,
    updatedAt: createdAt,
    acceptedAt: createdAt,
    arrivedAt: createdAt,
    startedAt: createdAt,
    completedAt: createdAt,
    cancelledAt: null,
    scheduledFor: null,
    isScheduled: "no",
    cancelledBy: null,
    cancellationReason: null,
    passengerPremiumMeta: null,
  };
}

/** Cinco corridas recentes plausíveis para portfólio (Aracaju / Sergipe). */
export const PORTFOLIO_RECENT_RIDES: Ride[] = [
  ride(
    9001,
    "Rua Laranjeiras, 210 — Centro, Aracaju/SE",
    "Shopping Jardins — Av. Min. Geraldo Barreto Sobral, Aracaju/SE",
    1890,
    daysAgo(2, 19, 15)
  ),
  ride(
    9002,
    "Condomínio Parque dos Faróis — Farolândia, Aracaju/SE",
    "Aeroporto Internacional de Aracaju — Santa Maria/SE",
    4250,
    daysAgo(5, 8, 40)
  ),
  ride(
    9003,
    "Av. Santos Dumont, 980 — Atalaia, Aracaju/SE",
    "Orla de Atalaia — Av. Santos Dumont, Aracaju/SE",
    1240,
    daysAgo(8, 21, 5)
  ),
  ride(
    9004,
    "Praça da Matriz — Centro, Lagarto/SE",
    "Av. Hermes Fontes, 1200 — Farolândia, Aracaju/SE",
    8900,
    daysAgo(12, 7, 20)
  ),
  ride(
    9005,
    "Hospital de Urgência de Sergipe — Aracaju/SE",
    "Rua Itabaiana, 455 — Centro, Aracaju/SE",
    1570,
    daysAgo(16, 17, 50)
  ),
];

const portfolioAddressTs = "2026-01-15T12:00:00.000Z";

export const PORTFOLIO_SAVED_ADDRESSES: DemoSavedAddress[] = [
  {
    id: 700_101,
    userId: 0,
    label: "home",
    customLabel: null,
    address: "Rua Santos Dumont, 145 — Centro, Aracaju/SE",
    lat: "-10.9110",
    lng: "-37.0677",
    createdAt: portfolioAddressTs,
    updatedAt: portfolioAddressTs,
  },
  {
    id: 700_102,
    userId: 0,
    label: "work",
    customLabel: null,
    address: "Av. Beira Mar, 2250 — Atalaia, Aracaju/SE",
    lat: "-10.9920",
    lng: "-37.0510",
    createdAt: portfolioAddressTs,
    updatedAt: portfolioAddressTs,
  },
  {
    id: 700_103,
    userId: 0,
    label: "other",
    customLabel: "Academia",
    address: "Av. Hermes Fontes, 680 — Farolândia, Aracaju/SE",
    lat: "-10.9280",
    lng: "-37.0580",
    createdAt: portfolioAddressTs,
    updatedAt: portfolioAddressTs,
  },
  {
    id: 700_104,
    userId: 0,
    label: "other",
    customLabel: "Aeroporto",
    address: "Aeroporto Internacional de Aracaju — Santa Maria, Aracaju/SE",
    lat: "-10.9840",
    lng: "-37.0703",
    createdAt: portfolioAddressTs,
    updatedAt: portfolioAddressTs,
  },
  {
    id: 700_105,
    userId: 0,
    label: "other",
    customLabel: "Shopping",
    address: "Shopping Jardins — Av. Min. Geraldo Barreto Sobral, 215 — Jardins, Aracaju/SE",
    lat: "-10.9009",
    lng: "-37.0719",
    createdAt: portfolioAddressTs,
    updatedAt: portfolioAddressTs,
  },
];
