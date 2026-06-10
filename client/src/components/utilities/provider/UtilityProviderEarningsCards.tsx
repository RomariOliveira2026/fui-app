import FuiMetricCard from "@/components/fui/FuiMetricCard";
import type { UtilityProviderEarningsSummary } from "@shared/utilityProvider";
import { DollarSign, Package, TrendingUp, Wallet } from "lucide-react";

type Props = {
  summary: UtilityProviderEarningsSummary | undefined;
  isLoading?: boolean;
};

function formatBrl(cents: number) {
  return `R$ ${(cents / 100).toFixed(2)}`;
}

function grossFromNet(netCents: number): number {
  return Math.round(netCents / 0.85);
}

export default function UtilityProviderEarningsCards({ summary, isLoading }: Props) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const todayGross = grossFromNet(summary.todayNetCents);
  const weekGross = grossFromNet(summary.weekNetCents);

  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FuiMetricCard
          label="Líquido hoje"
          value={formatBrl(summary.todayNetCents)}
          sub={`${summary.todayCount} serviço(s) · bruto ${formatBrl(todayGross)}`}
          icon={Wallet}
          highlight
        />
        <FuiMetricCard
          label="Líquido semana"
          value={formatBrl(summary.weekNetCents)}
          sub={`${summary.weekCount} serviço(s) · bruto ${formatBrl(weekGross)}`}
          icon={TrendingUp}
        />
        <FuiMetricCard
          label="Ticket líq. (hoje)"
          value={formatBrl(summary.todayAvgTicketCents)}
          sub="Média por serviço"
          icon={Package}
        />
        <FuiMetricCard
          label="Comissão plataforma"
          value="15%"
          sub="Líquido ≈ 85% do bruto"
          icon={DollarSign}
        />
      </div>
    </div>
  );
}
