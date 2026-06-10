import { z } from "zod";
import { router } from "../_core/trpc";
import { driverProcedure } from "../_core/driverProcedure";
import { isDemoPassenger } from "../_core/demoUser";
import { getDemoDriverRides } from "../_core/demoRide";
import { getDemoDeliveryOrdersByDriver } from "../_core/demoDelivery";
import {
  applyNetToLegacyEarnings,
  buildDriverEarningsFromLedger,
  buildDriverStatementFromLedger,
  getLedgerEntriesForDriver,
} from "../_core/financialLedger";
import { buildDriverEarningsSummary, buildDriverStatement } from "../_core/driverEarnings";
import {
  getFinanceConfigSync,
  resolveServiceKeyForRide,
  splitGrossRevenue,
} from "../_core/platformFinance";
import type { FinanceServiceKey } from "@shared/adminFinance";
import {
  getDemoOperationalIntelligence,
  getProductionOperationalIntelligence,
} from "../_core/operationalIntelligence";
import {
  loadDriverPremiumPreferences,
  saveDriverPremiumPreferences,
  hydrateDriverPremiumPreferencesFromDemo,
} from "../_core/driverPrefsStore";
import type { DriverDemandInsight, DriverPremiumPreferences } from "@shared/driverPremium";
import * as db from "../db";

const serviceFiltersSchema = z.object({
  ride: z.boolean().optional(),
  delivery: z.boolean().optional(),
  moto: z.boolean().optional(),
  carro: z.boolean().optional(),
  van: z.boolean().optional(),
  utilitario: z.boolean().optional(),
});

async function getDriverWorkHistory(ctx: {
  user: { openId: string };
  driverProfile: { id: number };
}) {
  if (isDemoPassenger(ctx.user)) {
    return {
      rides: getDemoDriverRides(ctx.driverProfile.id, { includeCancelled: false }),
      deliveries: getDemoDeliveryOrdersByDriver(ctx.driverProfile.id),
    };
  }
  return {
    rides: await db.getDriverRides(ctx.driverProfile.id),
    deliveries: await db.getDeliveryOrdersByDriver(ctx.driverProfile.id),
  };
}

const VEHICLE_LABELS: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

function buildDemandInsight(
  report: Awaited<ReturnType<typeof getDemoOperationalIntelligence>>
): DriverDemandInsight {
  const topZone = report.demandZones[0];
  const topPosition = report.positioning[0];
  const topHour = report.peakHours[0];
  const topAlert = report.alerts[0];

  return {
    topAreaLabel: topZone?.areaLabel ?? "Centro",
    topAreaRideCount: topZone?.rideCount ?? 0,
    positioningMessage: topPosition?.message ?? "Posicione-se próximo ao centro da cidade.",
    bestRegionLabel: topPosition?.areaLabel ?? topZone?.areaLabel ?? "Centro",
    bestRegionMessage:
      topPosition?.message ??
      `Maior demanda recente em ${topZone?.areaLabel ?? "Centro"}.`,
    peakHourLabel:
      topHour && topHour.rideCount > 0 ? topHour.label : undefined,
    topVehicleLabel: report.topVehicleType
      ? (VEHICLE_LABELS[report.topVehicleType] ?? report.topVehicleType)
      : undefined,
    trendLabel: report.trend.label,
    trendDetail: report.trend.detail,
    operationalTip: topAlert?.message,
    demandZones: report.demandZones.slice(0, 5).map((z) => ({
      areaLabel: z.areaLabel,
      rideCount: z.rideCount,
      sharePercent: z.sharePercent,
    })),
    heatPoints: report.demandPoints.slice(0, 8).map((p) => ({
      lat: p.lat,
      lng: p.lng,
      intensity: p.intensity,
      areaLabel: p.areaLabel,
    })),
  };
}

export const driverPremiumRouter = router({
  hydrateDemoPreferences: driverProcedure
    .input(
      z.object({
        preferences: z.object({
          dailyGoalCents: z.number().optional(),
          smartPause: z.boolean().optional(),
          serviceFilters: serviceFiltersSchema.optional(),
        }),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!isDemoPassenger(ctx.user)) return { success: false };
      hydrateDriverPremiumPreferencesFromDemo([
        {
          driverId: ctx.driverProfile.id,
          preferences: input.preferences as never,
        },
      ]);
      return { success: true };
    }),

  getPreferences: driverProcedure.query(async ({ ctx }) => {
    return loadDriverPremiumPreferences(ctx.driverProfile.id, ctx.user);
  }),

  updatePreferences: driverProcedure
    .input(
      z.object({
        dailyGoalCents: z.number().min(1000).max(1_000_000).optional(),
        smartPause: z.boolean().optional(),
        serviceFilters: serviceFiltersSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return saveDriverPremiumPreferences(
        ctx.driverProfile.id,
        input as Partial<DriverPremiumPreferences>,
        ctx.user
      );
    }),

  getEarningsSummary: driverProcedure.query(async ({ ctx }) => {
    const { rides, deliveries } = await getDriverWorkHistory(ctx);
    const ledger = await getLedgerEntriesForDriver(ctx.driverProfile.id);

    if (ledger.length > 0) {
      const fromLedger = buildDriverEarningsFromLedger(ledger);
      return applyNetToLegacyEarnings(fromLedger, rides, deliveries);
    }

    const gross = buildDriverEarningsSummary(rides, deliveries);
    return applyNetToLegacyEarnings(
      {
        todayTotalCents: 0,
        todayGrossCents: 0,
        todayCommissionCents: 0,
        weekTotalCents: 0,
        weekGrossCents: 0,
        weekCommissionCents: 0,
        todayRideCount: gross.todayRideCount,
        weekRideCount: gross.weekRideCount,
        todayDeliveryCount: gross.todayDeliveryCount,
        weekDeliveryCount: gross.weekDeliveryCount,
        todayAvgTicketCents: 0,
        weekAvgTicketCents: 0,
      },
      rides,
      deliveries
    );
  }),

  getStatement: driverProcedure.query(async ({ ctx }) => {
    const { rides, deliveries } = await getDriverWorkHistory(ctx);
    const ledger = await getLedgerEntriesForDriver(ctx.driverProfile.id);

    if (ledger.length > 0) {
      return buildDriverStatementFromLedger(ledger, rides, deliveries);
    }

    const config = getFinanceConfigSync();
    return buildDriverStatement(rides, deliveries).map((item) => {
      const ride = rides.find((r) => r.id === item.id);
      const serviceKey: FinanceServiceKey =
        item.type === "delivery"
          ? "delivery"
          : ride
            ? resolveServiceKeyForRide(ride.vehicleType)
            : "ride";
      const split = splitGrossRevenue(item.amountCents, serviceKey, config);
      return {
        ...item,
        grossCents: split.grossCents,
        commissionCents: split.commissionCents,
        amountCents: split.driverPayoutCents,
        couponCode: ride?.couponCode ?? undefined,
      };
    });
  }),

  getDemandInsight: driverProcedure.query(async ({ ctx }) => {
    const dbInstance = await db.getDb();
    const report =
      isDemoPassenger(ctx.user) || !dbInstance
        ? getDemoOperationalIntelligence({ preset: "7d" })
        : await getProductionOperationalIntelligence({ preset: "7d" });
    return buildDemandInsight(report);
  }),
});
