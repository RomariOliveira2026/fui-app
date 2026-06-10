export type DriverServiceType = "ride" | "delivery";

export type DriverVehicleFilter = "moto" | "carro" | "van" | "utilitario";

export type DriverServiceFilters = {
  ride: boolean;
  delivery: boolean;
  moto: boolean;
  carro: boolean;
  van: boolean;
  utilitario: boolean;
};

export type DriverPremiumPreferences = {
  dailyGoalCents: number;
  smartPause: boolean;
  serviceFilters: DriverServiceFilters;
};

export type DriverEarningsSummary = {
  /** Valor líquido (repasse ao motorista). */
  todayTotalCents: number;
  weekTotalCents: number;
  todayGrossCents?: number;
  weekGrossCents?: number;
  todayCommissionCents?: number;
  weekCommissionCents?: number;
  todayRideCount: number;
  weekRideCount: number;
  todayDeliveryCount: number;
  weekDeliveryCount: number;
  todayAvgTicketCents: number;
  weekAvgTicketCents: number;
};

export type DriverStatementItem = {
  id: number;
  type: DriverServiceType;
  date: string;
  originLabel: string;
  destinationLabel: string;
  /** Valor líquido creditado ao motorista. */
  amountCents: number;
  grossCents?: number;
  commissionCents?: number;
  couponCode?: string;
  serviceLabel: string;
};

export type DriverDemandInsight = {
  topAreaLabel: string;
  topAreaRideCount: number;
  positioningMessage: string;
  bestRegionLabel: string;
  bestRegionMessage: string;
  peakHourLabel?: string;
  topVehicleLabel?: string;
  trendLabel?: string;
  trendDetail?: string;
  operationalTip?: string;
  demandZones: Array<{
    areaLabel: string;
    rideCount: number;
    sharePercent: number;
  }>;
  heatPoints: Array<{
    lat: number;
    lng: number;
    intensity: number;
    areaLabel: string;
  }>;
};

export const DEFAULT_DRIVER_SERVICE_FILTERS: DriverServiceFilters = {
  ride: true,
  delivery: true,
  moto: true,
  carro: true,
  van: true,
  utilitario: true,
};

export const DEFAULT_DAILY_GOAL_CENTS = 15_000;

export const DEFAULT_DRIVER_PREMIUM_PREFERENCES: DriverPremiumPreferences = {
  dailyGoalCents: DEFAULT_DAILY_GOAL_CENTS,
  smartPause: false,
  serviceFilters: { ...DEFAULT_DRIVER_SERVICE_FILTERS },
};

export function mergeDriverPreferences(
  patch: Partial<DriverPremiumPreferences>
): DriverPremiumPreferences {
  return {
    dailyGoalCents: patch.dailyGoalCents ?? DEFAULT_DAILY_GOAL_CENTS,
    smartPause: patch.smartPause ?? false,
    serviceFilters: {
      ...DEFAULT_DRIVER_SERVICE_FILTERS,
      ...patch.serviceFilters,
    },
  };
}
