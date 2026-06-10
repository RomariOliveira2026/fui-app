import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdminOperationalDriver } from "@shared/adminOperational";
import { Car, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  busy: "Ocupado",
  offline: "Offline",
  pending: "Pendente",
};

const STATUS_CLASS: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  busy: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  offline: "bg-muted text-muted-foreground border-border",
  pending: "bg-sky-500/10 text-sky-400 border-sky-500/25",
};

type AdminDriverListProps = {
  drivers: AdminOperationalDriver[];
  selectedId: number | null;
  onSelect: (driver: AdminOperationalDriver) => void;
  onOpenDetails: (driver: AdminOperationalDriver) => void;
};

export default function AdminDriverList({
  drivers,
  selectedId,
  onSelect,
  onOpenDetails,
}: AdminDriverListProps) {
  if (drivers.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10 px-4 rounded-lg border border-dashed border-border/60 bg-muted/20">
        Nenhum motorista com os filtros atuais
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px] lg:h-[min(72vh,560px)] pr-3">
      <div className="space-y-2">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(driver)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(driver);
              }
            }}
            className={cn(
              "w-full text-left rounded-lg border p-3 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selectedId === driver.id
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 bg-card/40 hover:bg-muted/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{driver.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {driver.vehicleBrand} {driver.vehicleModel} · {driver.vehiclePlate}
                </p>
              </div>
              <Badge variant="outline" className={STATUS_CLASS[driver.operationalStatus]}>
                {STATUS_LABELS[driver.operationalStatus]}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="capitalize flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {driver.vehicleType}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary" />
                {driver.rating.toFixed(1)}
              </span>
              <span>{driver.areaLabel}</span>
            </div>
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(driver);
                }}
              >
                Detalhes
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
