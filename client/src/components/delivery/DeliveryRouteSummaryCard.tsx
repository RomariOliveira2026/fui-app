import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type DeliveryRouteSummaryCardProps = {
  distanceM: number;
  durationS: number;
  priceCents: number;
  className?: string;
};

function formatPriceBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type MetricBlockProps = {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
};

function MetricBlock({ icon, label, value, highlight }: MetricBlockProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 p-4 sm:p-5 sm:items-start">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
          highlight
            ? "bg-primary/10 ring-primary/20"
            : "bg-muted/50 ring-border/60"
        )}
      >
        {icon}
      </div>
      <div className="w-full text-center sm:text-left">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-lg font-semibold tabular-nums tracking-tight",
            highlight ? "text-orange-500" : "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DeliveryRouteSummaryCard({
  distanceM,
  durationS,
  priceCents,
  className,
}: DeliveryRouteSummaryCardProps) {
  const distanceKm = (distanceM / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const durationMin = Math.ceil(durationS / 60);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 bg-gradient-to-b from-card via-card to-muted/10 shadow-sm",
        className
      )}
    >
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricBlock
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            label="Distância"
            value={`${distanceKm} km`}
          />
          <MetricBlock
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            label="Tempo estimado"
            value={`${durationMin} min`}
          />
          <MetricBlock
            icon={<CircleDollarSign className="h-4 w-4 text-orange-500" />}
            label="Valor da entrega"
            value={formatPriceBRL(priceCents)}
            highlight
          />
        </div>
      </CardContent>
    </Card>
  );
}
