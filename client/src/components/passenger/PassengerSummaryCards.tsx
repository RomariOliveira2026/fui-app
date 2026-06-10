import { Card, CardContent } from "@/components/ui/card";
import type { PassengerSummary } from "@/lib/usePassengerDashboardData";
import { Calendar, DollarSign, MapPin, TrendingUp } from "lucide-react";

type PassengerSummaryCardsProps = {
  summary: PassengerSummary;
};

export default function PassengerSummaryCards({ summary }: PassengerSummaryCardsProps) {
  const items = [
    {
      label: "Corridas",
      value: String(summary.totalRides),
      icon: MapPin,
      accent: "text-primary",
    },
    {
      label: "Total gasto",
      value: `R$ ${(summary.totalSpent / 100).toFixed(0)}`,
      icon: DollarSign,
      accent: "text-foreground",
    },
    {
      label: "Economia",
      value: `R$ ${(summary.totalSaved / 100).toFixed(0)}`,
      icon: TrendingUp,
      accent: "text-emerald-400",
    },
    {
      label: "Agendadas",
      value: String(summary.scheduledCount),
      icon: Calendar,
      accent: "text-muted-foreground",
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Seu resumo</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label} className="border-border bg-card">
            <CardContent className="p-4">
              <item.icon className={`mb-2 h-4 w-4 ${item.accent}`} />
              <p className={`text-lg font-bold ${item.accent}`}>{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
