/** Tipos — Módulo 7 Inteligência Operacional (v7.2). */

export type IntelligencePeriodPreset = "today" | "yesterday" | "7d" | "30d" | "custom";

export type IntelligencePeriodInput = {
  preset: IntelligencePeriodPreset;
  from?: string;
  to?: string;
};

export type DemandHeatPoint = {
  lat: number;
  lng: number;
  weight: number;
  intensity: number;
  areaLabel: string;
  tier?: "low" | "medium" | "high";
};

export type DemandZoneRank = {
  areaLabel: string;
  rideCount: number;
  sharePercent: number;
  lat: number;
  lng: number;
};

export type PeakHourBucket = {
  hour: number;
  label: string;
  rideCount: number;
  sharePercent: number;
};

export type OperationalInsightCard = {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "brand" | "info" | "success" | "warning";
};

export type DriverPositioningSuggestion = {
  priority: number;
  areaLabel: string;
  message: string;
  lat: number;
  lng: number;
  recentRideCount: number;
};

export type TemporalComparisonMetric = {
  id: string;
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
  tone: "up" | "down" | "neutral";
};

export type OperationalAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  areaLabel?: string;
};

export type TrendInsight = {
  direction: "up" | "down" | "stable";
  label: string;
  changePercent: number | null;
  detail: string;
};

export type OperationalIntelligenceReport = {
  updatedAt: string;
  periodLabel: string;
  period: IntelligencePeriodInput;
  totalRidesAnalyzed: number;
  demandPoints: DemandHeatPoint[];
  demandZones: DemandZoneRank[];
  peakHours: PeakHourBucket[];
  insights: OperationalInsightCard[];
  positioning: DriverPositioningSuggestion[];
  acceptRatePercent: number | null;
  topVehicleType: string | null;
  comparisons: TemporalComparisonMetric[];
  alerts: OperationalAlert[];
  trend: TrendInsight;
};

export const DEFAULT_INTELLIGENCE_PERIOD: IntelligencePeriodInput = {
  preset: "7d",
};

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
