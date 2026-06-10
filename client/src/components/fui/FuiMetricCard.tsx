import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FuiMetricCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  highlight?: boolean;
  className?: string;
};

export default function FuiMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
  className,
}: FuiMetricCardProps) {
  return (
    <Card
      className={cn(
        highlight && "border-primary/25 bg-gradient-to-br from-primary/[0.04] to-transparent",
        className
      )}
    >
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {Icon ? <Icon className="h-3.5 w-3.5 text-primary shrink-0" /> : null}
          <span className="truncate">{label}</span>
        </div>
        <p
          className={cn(
            "text-lg font-bold tabular-nums",
            highlight ? "text-primary" : "text-foreground"
          )}
        >
          {value}
        </p>
        {sub ? <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
