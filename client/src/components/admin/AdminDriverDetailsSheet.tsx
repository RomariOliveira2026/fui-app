import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminOperationalDriver } from "@shared/adminOperational";
import { formatAdminPrice } from "@/lib/adminOperationalUi";
import { useLocation } from "wouter";
import { Car, Star } from "lucide-react";

type AdminDriverDetailsSheetProps = {
  driver: AdminOperationalDriver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  busy: "Ocupado",
  offline: "Offline",
  pending: "Pendente",
};

export default function AdminDriverDetailsSheet({
  driver,
  open,
  onOpenChange,
}: AdminDriverDetailsSheetProps) {
  const [, setLocation] = useLocation();

  if (!driver) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border">
        <SheetHeader>
          <SheetTitle>{driver.name}</SheetTitle>
          <SheetDescription>Motorista #{driver.id}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Badge variant="outline" className="capitalize">
            {STATUS_LABELS[driver.operationalStatus] ?? driver.operationalStatus}
          </Badge>

          <DetailRow
            label="Veículo"
            value={`${driver.vehicleBrand} ${driver.vehicleModel} (${driver.vehicleType})`}
            icon={<Car className="h-4 w-4 text-primary" />}
          />
          <DetailRow label="Placa" value={driver.vehiclePlate || "—"} />
          <DetailRow label="Região aproximada" value={driver.areaLabel} />
          <DetailRow
            label="Avaliação"
            value={`${driver.rating.toFixed(1)} · ${driver.totalRides} corridas`}
            icon={<Star className="h-4 w-4 text-primary" />}
          />
          {driver.totalEarningsCents > 0 ? (
            <DetailRow label="Ganhos" value={formatAdminPrice(driver.totalEarningsCents)} />
          ) : null}
          <DetailRow
            label="Coordenadas"
            value={`${driver.lat.toFixed(5)}, ${driver.lng.toFixed(5)}`}
          />

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setLocation("/driver-dashboard")}
          >
            Ver painel motorista
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm flex items-start gap-2">
        {icon}
        <span>{value}</span>
      </p>
    </div>
  );
}
