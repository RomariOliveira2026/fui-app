import { DollarSign, Package, TrendingUp, Wallet } from "lucide-react";
import type { DriverEarningsSummary } from "@shared/driverPremium";
import FuiMetricCard from "@/components/fui/FuiMetricCard";

function formatBrl(cents: number) {
  return `R$ ${(cents / 100).toFixed(2)}`;
}

type DriverEarningsSummaryCardsProps = {
  summary: DriverEarningsSummary | undefined;
  isLoading?: boolean;
};

export default function DriverEarningsSummaryCards({
  summary,
  isLoading,
}: DriverEarningsSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Líquido hoje",
      value: formatBrl(summary.todayTotalCents),
      sub:
        summary.todayGrossCents != null
          ? `Bruto ${formatBrl(summary.todayGrossCents)} · ${summary.todayRideCount + summary.todayDeliveryCount} serv.`
          : `${summary.todayRideCount + summary.todayDeliveryCount} serviços`,
      icon: Wallet,
      highlight: true,
    },
    {
      label: "Líquido semana",
      value: formatBrl(summary.weekTotalCents),
      sub:
        summary.weekGrossCents != null
          ? `Bruto ${formatBrl(summary.weekGrossCents)}`
          : `${summary.weekRideCount + summary.weekDeliveryCount} serviços`,
      icon: TrendingUp,
    },
    {
      label: "Ticket líq. (hoje)",
      value: formatBrl(summary.todayAvgTicketCents),
      sub: `${summary.todayRideCount} corr. · ${summary.todayDeliveryCount} ent.`,
      icon: Package,
    },
    {
      label: "Comissão (hoje)",
      value: formatBrl(summary.todayCommissionCents ?? 0),
      sub: "Retida pela plataforma",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <FuiMetricCard
          key={c.label}
          label={c.label}
          value={c.value}
          sub={c.sub}
          icon={c.icon}
          highlight={c.highlight}
        />
      ))}
    </div>
  );
}
