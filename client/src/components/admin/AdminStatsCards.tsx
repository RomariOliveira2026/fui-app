import type { AdminOperationalMetrics } from "@shared/adminOperational";
import { Car, Clock, DollarSign, MapPin, Radio, Users, Zap, type LucideIcon } from "lucide-react";
import { formatAdminPrice } from "@/lib/adminOperationalUi";
import { adminMetricLabel, adminMetricValue, adminPanelCard } from "@/lib/adminShell";
import { cn } from "@/lib/utils";

type AdminStatsCardsProps = {
  metrics: AdminOperationalMetrics;
};

const primaryMetrics = [
  { key: "pendingRides" as const, label: "Pendentes", icon: Clock },
  { key: "inProgressRides" as const, label: "Em andamento", icon: Zap },
  { key: "acceptedRides" as const, label: "Aceitas", icon: MapPin },
  { key: "completedToday" as const, label: "Concluídas hoje", icon: Car },
];

const fleetMetrics = [
  { key: "driversOnline" as const, label: "Motoristas online", icon: Users },
  { key: "driversAvailable" as const, label: "Disponíveis agora", icon: Radio },
];

export default function AdminStatsCards({ metrics }: AdminStatsCardsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {primaryMetrics.map(({ key, label, icon: Icon }) => (
          <MetricTile key={key} label={label} icon={Icon} value={metrics[key]} />
        ))}

        <div
          className={cn(
            adminPanelCard,
            "col-span-2 lg:col-span-1 p-4 flex flex-col justify-between",
            "border-primary/25 bg-gradient-to-br from-primary/[0.08] to-card/40"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={adminMetricLabel}>Faturamento hoje</p>
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
          </div>
          <p className={cn(adminMetricValue, "text-primary mt-3")}>
            {formatAdminPrice(metrics.revenueTodayCents)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        {fleetMetrics.map(({ key, label, icon: Icon }) => (
          <MetricTile key={key} label={label} icon={Icon} value={metrics[key]} compact />
        ))}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  icon: Icon,
  value,
  compact,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  compact?: boolean;
}) {
  return (
    <div className={cn(adminPanelCard, "p-4", compact && "p-3.5")}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={adminMetricLabel}>{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
      </div>
      <p className={cn(adminMetricValue, compact && "text-xl")}>{value}</p>
    </div>
  );
}
