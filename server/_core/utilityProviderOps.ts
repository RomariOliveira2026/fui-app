import type { UtilityOrder } from "@shared/utilities";
import type {
  UtilityProviderEarningsSummary,
  UtilityProviderProfile,
  UtilityProviderStatementItem,
} from "@shared/utilityProvider";
import { getDemoUtilityOrdersByDriver } from "./demoUtilities";
import { isOrderCompatibleWithProvider } from "./utilityDispatcher";

const PLATFORM_COMMISSION_PERCENT = 15;

/** @deprecated use getAvailableUtilityOrdersForProvider from utilityDispatcher */
export function filterOrdersForProvider(
  orders: UtilityOrder[],
  profile: UtilityProviderProfile,
  driverId: number
): UtilityOrder[] {
  return orders.filter((order) => isOrderCompatibleWithProvider(order, profile, driverId));
}

function splitNet(grossCents: number): { grossCents: number; netCents: number } {
  const commissionCents = Math.round((grossCents * PLATFORM_COMMISSION_PERCENT) / 100);
  return { grossCents, netCents: grossCents - commissionCents };
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isWithinLastDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

export function buildUtilityProviderEarnings(
  driverId: number
): UtilityProviderEarningsSummary {
  const completed = getDemoUtilityOrdersByDriver(driverId).filter(
    (o) => o.status === "completed"
  );
  const now = new Date();
  const today = completed.filter((o) =>
    isSameDay(new Date(o.completedAt ?? o.createdAt), now)
  );
  const week = completed.filter((o) =>
    isWithinLastDays(new Date(o.completedAt ?? o.createdAt), 7)
  );

  const sumNet = (list: typeof completed) =>
    list.reduce((s, o) => s + splitNet(o.finalPrice ?? o.estimatedPrice ?? 0).netCents, 0);

  const todayNet = sumNet(today);
  const weekNet = sumNet(week);

  return {
    todayNetCents: todayNet,
    weekNetCents: weekNet,
    todayCount: today.length,
    weekCount: week.length,
    todayAvgTicketCents: today.length ? Math.round(todayNet / today.length) : 0,
    weekAvgTicketCents: week.length ? Math.round(weekNet / week.length) : 0,
  };
}

export function buildUtilityProviderStatement(
  driverId: number
): UtilityProviderStatementItem[] {
  return getDemoUtilityOrdersByDriver(driverId)
    .filter((o) => o.status === "completed")
    .map((o) => {
      const gross = o.finalPrice ?? o.estimatedPrice ?? 0;
      const { netCents } = splitNet(gross);
      return {
        id: o.id,
        serviceType: o.serviceType,
        date: o.completedAt ?? o.createdAt,
        originLabel: o.originAddress,
        destinationLabel: o.destinationAddress,
        grossCents: gross,
        netCents,
      };
    });
}
