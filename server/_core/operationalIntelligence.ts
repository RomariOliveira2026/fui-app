import type { Ride } from "../../drizzle/schema";
import { DEMO_PLACES } from "@shared/demoMaps";
import type {
  DemandHeatPoint,
  DemandZoneRank,
  DriverPositioningSuggestion,
  IntelligencePeriodInput,
  IntelligencePeriodPreset,
  OperationalAlert,
  OperationalInsightCard,
  OperationalIntelligenceReport,
  PeakHourBucket,
  TemporalComparisonMetric,
  TrendInsight,
} from "@shared/operationalIntelligence";
import {
  DEFAULT_INTELLIGENCE_PERIOD,
  percentChange,
} from "@shared/operationalIntelligence";
import { getAllDemoRides } from "./demoRide";
import { getAllDemoDriverProfiles } from "./demoDriver";
import { parseCoord } from "./rideDispatcher";
import * as db from "../db";

const RECENT_POSITIONING_HOURS = 48;
const RECENT_PEAK_WINDOW_HOURS = 3;

const VEHICLE_LABELS: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

export function inferRideAreaLabel(address: string): string {
  for (const place of DEMO_PLACES) {
    if (address.toLowerCase().includes(place.mainText.toLowerCase())) {
      return place.mainText;
    }
  }
  const parts = address.split(",");
  return parts[0]?.trim() || "Itabaiana";
}

function areaCenter(areaLabel: string): { lat: number; lng: number } {
  const place = DEMO_PLACES.find((p) => p.mainText === areaLabel);
  if (place) return { lat: place.lat, lng: place.lng };
  return { lat: -10.6833, lng: -37.425 };
}

function isAnalyticsEligible(ride: Ride): boolean {
  return ride.status !== "cancelled";
}

function isAcceptedOrBeyond(ride: Ride): boolean {
  return (
    ride.driverId != null &&
    (ride.status === "accepted" ||
      ride.status === "in_progress" ||
      ride.status === "completed")
  );
}

export function resolvePeriodRange(
  period: IntelligencePeriodInput = DEFAULT_INTELLIGENCE_PERIOD
): { start: Date; end: Date; label: string } {
  const now = new Date();

  if (period.preset === "custom" && period.from) {
    const start = new Date(period.from);
    const end = period.to ? new Date(period.to) : now;
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Período personalizado" };
  }

  switch (period.preset) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "Hoje" };
    }
    case "yesterday": {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "Ontem" };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "Últimos 30 dias" };
    }
    case "7d":
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "Últimos 7 dias" };
    }
  }
}

function filterRidesInRange(rides: Ride[], start: Date, end: Date): Ride[] {
  return rides.filter(
    (r) => r.createdAt.getTime() >= start.getTime() && r.createdAt.getTime() <= end.getTime()
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDemandZones(rides: Ride[]): DemandZoneRank[] {
  const counts = new Map<string, number>();
  for (const ride of rides) {
    const area = inferRideAreaLabel(ride.originAddress);
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }

  const total = rides.length || 1;
  return Array.from(counts.entries())
    .map(([areaLabel, rideCount]) => {
      const center = areaCenter(areaLabel);
      return {
        areaLabel,
        rideCount,
        sharePercent: Math.round((rideCount / total) * 1000) / 10,
        lat: center.lat,
        lng: center.lng,
      };
    })
    .sort((a, b) => b.rideCount - a.rideCount);
}

function intensityTier(intensity: number): DemandHeatPoint["tier"] {
  if (intensity >= 0.7) return "high";
  if (intensity >= 0.4) return "medium";
  return "low";
}

function buildHeatPoints(zones: DemandZoneRank[]): DemandHeatPoint[] {
  if (zones.length === 0) return [];
  const max = Math.max(...zones.map((z) => z.rideCount), 1);

  return zones.map((zone) => {
    const intensity = zone.rideCount / max;
    return {
      lat: zone.lat,
      lng: zone.lng,
      weight: zone.rideCount,
      intensity,
      areaLabel: zone.areaLabel,
      tier: intensityTier(intensity),
    };
  });
}

function buildPeakHours(rides: Ride[]): PeakHourBucket[] {
  const counts = new Array<number>(24).fill(0);
  for (const ride of rides) {
    counts[ride.createdAt.getHours()]++;
  }

  const total = rides.length || 1;
  return counts
    .map((rideCount, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}h`,
      rideCount,
      sharePercent: Math.round((rideCount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.rideCount - a.rideCount);
}

function topVehicleType(rides: Ride[]): string | null {
  const counts = new Map<string, number>();
  for (const ride of rides) {
    counts.set(ride.vehicleType, (counts.get(ride.vehicleType) ?? 0) + 1);
  }
  let top: string | null = null;
  let max = 0;
  for (const [type, count] of Array.from(counts.entries())) {
    if (count > max) {
      max = count;
      top = type;
    }
  }
  return top;
}

function computeAcceptRate(rides: Ride[]): number | null {
  if (rides.length === 0) return null;
  const accepted = rides.filter(isAcceptedOrBeyond).length;
  return Math.round((accepted / rides.length) * 1000) / 10;
}

function buildComparisons(allEligible: Ride[]): TemporalComparisonMetric[] {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const todayCount = filterRidesInRange(allEligible, todayStart, todayEnd).length;
  const yesterdayCount = filterRidesInRange(allEligible, yesterdayStart, yesterdayEnd).length;
  const dayChange = percentChange(todayCount, yesterdayCount);

  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);

  const thisWeekCount = filterRidesInRange(allEligible, thisWeekStart, todayEnd).length;
  const lastWeekCount = filterRidesInRange(allEligible, lastWeekStart, lastWeekEnd).length;
  const weekChange = percentChange(thisWeekCount, lastWeekCount);

  return [
    {
      id: "today-vs-yesterday",
      label: "Hoje vs ontem",
      current: todayCount,
      previous: yesterdayCount,
      changePercent: dayChange,
      tone:
        dayChange == null || dayChange === 0
          ? "neutral"
          : dayChange > 0
            ? "up"
            : "down",
    },
    {
      id: "week-vs-week",
      label: "Semana atual vs anterior",
      current: thisWeekCount,
      previous: lastWeekCount,
      changePercent: weekChange,
      tone:
        weekChange == null || weekChange === 0
          ? "neutral"
          : weekChange > 0
            ? "up"
            : "down",
    },
  ];
}

function buildTrend(comparisons: TemporalComparisonMetric[]): TrendInsight {
  const week = comparisons.find((c) => c.id === "week-vs-week");
  const day = comparisons.find((c) => c.id === "today-vs-yesterday");
  const ref = week?.changePercent ?? day?.changePercent ?? null;

  if (ref == null || Math.abs(ref) < 5) {
    return {
      direction: "stable",
      label: "Demanda estável",
      changePercent: ref,
      detail: "Variação dentro da faixa normal no período",
    };
  }
  if (ref > 0) {
    return {
      direction: "up",
      label: "Tendência de alta",
      changePercent: ref,
      detail: `Volume ${ref}% acima da semana anterior`,
    };
  }
  return {
    direction: "down",
    label: "Tendência de queda",
    changePercent: ref,
    detail: `Volume ${Math.abs(ref)}% abaixo da semana anterior`,
  };
}

function countAvailableDrivers(): number {
  return getAllDemoDriverProfiles().filter(
    (p) => p.isAvailable && p.status === "approved"
  ).length;
}

function buildAlerts(
  zones: DemandZoneRank[],
  rides: Ride[],
  peakHours: PeakHourBucket[]
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const top = zones[0];
  const available = countAvailableDrivers();

  if (top && top.sharePercent >= 35 && top.rideCount >= 2) {
    alerts.push({
      id: "high-demand-concentration",
      severity: top.sharePercent >= 50 ? "critical" : "warning",
      title: "Alta concentração de demanda",
      message: `${top.sharePercent}% das solicitações em ${top.areaLabel}`,
      areaLabel: top.areaLabel,
    });
  }

  if (rides.length >= 3 && available <= 1) {
    alerts.push({
      id: "low-supply",
      severity: "critical",
      title: "Baixa oferta de motoristas",
      message: `Apenas ${available} motorista(s) disponível(is) para ${rides.length} solicitações no período`,
    });
  }

  const recentCutoff = Date.now() - RECENT_PEAK_WINDOW_HOURS * 60 * 60 * 1000;
  const recentRides = rides.filter((r) => r.createdAt.getTime() >= recentCutoff);
  if (recentRides.length >= 3) {
    const area = inferRideAreaLabel(recentRides[0]?.originAddress ?? "");
    alerts.push({
      id: "recent-peak",
      severity: "info",
      title: "Pico recente detectado",
      message: `${recentRides.length} solicitações nas últimas ${RECENT_PEAK_WINDOW_HOURS}h · atenção em ${area}`,
      areaLabel: area,
    });
  }

  const topHour = peakHours[0];
  if (topHour && topHour.rideCount >= 2) {
    alerts.push({
      id: "peak-hour",
      severity: "info",
      title: "Horário de pico",
      message: `Maior volume às ${topHour.label} (${topHour.rideCount} solicitações)`,
    });
  }

  return alerts.slice(0, 5);
}

function buildInsights(
  zones: DemandZoneRank[],
  peakHours: PeakHourBucket[],
  vehicleType: string | null,
  acceptRate: number | null,
  total: number,
  periodLabel: string,
  trend: TrendInsight
): OperationalInsightCard[] {
  const topZone = zones[0];
  const topHour = peakHours[0];

  return [
    {
      id: "top-zone",
      title: "Região mais quente",
      value: topZone?.areaLabel ?? "—",
      detail: topZone
        ? `${topZone.rideCount} corridas · ${topZone.sharePercent}% do volume`
        : "Sem dados no período",
      tone: "brand",
    },
    {
      id: "peak-hour",
      title: "Horário de pico",
      value: topHour && topHour.rideCount > 0 ? topHour.label : "—",
      detail:
        topHour && topHour.rideCount > 0
          ? `${topHour.rideCount} solicitações · ${topHour.sharePercent}%`
          : "Sem picos identificados",
      tone: "info",
    },
    {
      id: "vehicle",
      title: "Modal mais solicitado",
      value: vehicleType ? (VEHICLE_LABELS[vehicleType] ?? vehicleType) : "—",
      detail: vehicleType ? "Tipo predominante no período" : "Sem amostra",
      tone: "warning",
    },
    {
      id: "trend",
      title: "Tendência",
      value: trend.label,
      detail: trend.detail,
      tone:
        trend.direction === "up"
          ? "success"
          : trend.direction === "down"
            ? "warning"
            : "info",
    },
    {
      id: "accept-rate",
      title: "Taxa de aceite",
      value: acceptRate != null ? `${acceptRate}%` : "—",
      detail:
        acceptRate != null
          ? "Corridas com motorista atribuído"
          : "Dados insuficientes",
      tone: acceptRate != null && acceptRate >= 60 ? "success" : "info",
    },
    {
      id: "volume",
      title: "Volume analisado",
      value: String(total),
      detail: `${periodLabel} · origens válidas`,
      tone: "info",
    },
  ];
}

function buildPositioning(
  rides: Ride[],
  zones: DemandZoneRank[]
): DriverPositioningSuggestion[] {
  const recentCutoff = Date.now() - RECENT_POSITIONING_HOURS * 60 * 60 * 1000;
  const recentCounts = new Map<string, number>();

  for (const ride of rides) {
    if (ride.createdAt.getTime() < recentCutoff) continue;
    const area = inferRideAreaLabel(ride.originAddress);
    recentCounts.set(area, (recentCounts.get(area) ?? 0) + 1);
  }

  const ranked = zones
    .map((zone) => ({
      ...zone,
      recentRideCount: recentCounts.get(zone.areaLabel) ?? 0,
    }))
    .sort((a, b) => b.recentRideCount - a.recentRideCount || b.rideCount - a.rideCount)
    .slice(0, 3);

  return ranked.map((zone, index) => ({
    priority: index + 1,
    areaLabel: zone.areaLabel,
    lat: zone.lat,
    lng: zone.lng,
    recentRideCount: zone.recentRideCount,
    message:
      zone.recentRideCount > 0
        ? `Melhor área para posicionamento: ${zone.areaLabel} (${zone.recentRideCount} chamada(s) recentes)`
        : `Concentração em ${zone.areaLabel} (${zone.rideCount} corridas no período)`,
  }));
}

export function buildOperationalIntelligenceReport(
  rides: Ride[],
  period: IntelligencePeriodInput = DEFAULT_INTELLIGENCE_PERIOD
): OperationalIntelligenceReport {
  const range = resolvePeriodRange(period);
  const allEligible = rides
    .filter(isAnalyticsEligible)
    .filter((r) => parseCoord(r.originLat) != null && parseCoord(r.originLng) != null);

  const eligible = filterRidesInRange(allEligible, range.start, range.end);
  const zones = buildDemandZones(eligible);
  const peakHours = buildPeakHours(eligible);
  const vehicle = topVehicleType(eligible);
  const acceptRate = computeAcceptRate(eligible);
  const comparisons = buildComparisons(allEligible);
  const trend = buildTrend(comparisons);
  const alerts = buildAlerts(zones, eligible, peakHours);

  return {
    updatedAt: new Date().toISOString(),
    periodLabel: range.label,
    period,
    totalRidesAnalyzed: eligible.length,
    demandPoints: buildHeatPoints(zones),
    demandZones: zones,
    peakHours,
    insights: buildInsights(zones, peakHours, vehicle, acceptRate, eligible.length, range.label, trend),
    positioning: buildPositioning(eligible, zones),
    acceptRatePercent: acceptRate,
    topVehicleType: vehicle,
    comparisons,
    alerts,
    trend,
  };
}

export function getDemoOperationalIntelligence(
  period: IntelligencePeriodInput = DEFAULT_INTELLIGENCE_PERIOD
): OperationalIntelligenceReport {
  return buildOperationalIntelligenceReport(getAllDemoRides(), period);
}

export async function getProductionOperationalIntelligence(
  period: IntelligencePeriodInput = DEFAULT_INTELLIGENCE_PERIOD
): Promise<OperationalIntelligenceReport> {
  try {
    const rides = await db.getAllRides();
    return buildOperationalIntelligenceReport(rides, period);
  } catch {
    return buildOperationalIntelligenceReport([], period);
  }
}

export type { IntelligencePeriodPreset };
