import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ADMIN_DEMO_AREAS } from "@shared/adminOperational";
import type { AdminFiltersState } from "@/lib/adminOperationalUi";
import { adminPanelCard } from "@/lib/adminShell";
import { cn } from "@/lib/utils";

type AdminFiltersProps = {
  filters: AdminFiltersState;
  onChange: (next: AdminFiltersState) => void;
  areas: string[];
};

export default function AdminFilters({ filters, onChange, areas }: AdminFiltersProps) {
  const areaOptions = areas.length > 0 ? areas : [...ADMIN_DEMO_AREAS];

  return (
    <div className={cn(adminPanelCard, "flex flex-wrap items-end gap-3 p-4")}>
      <FilterSelect
        label="Corridas"
        value={filters.rideStatus}
        onValueChange={(rideStatus) => {
          const status = rideStatus as AdminFiltersState["rideStatus"];
          onChange({
            ...filters,
            rideStatus: status,
            showCompletedRides:
              status === "completed" ? true : filters.showCompletedRides,
          });
        }}
        options={[
          { value: "all", label: "Todas" },
          { value: "requested", label: "Pendentes" },
          { value: "accepted", label: "Aceitas" },
          { value: "in_progress", label: "Em andamento" },
          { value: "completed", label: "Concluídas" },
        ]}
      />

      <FilterSelect
        label="Motoristas"
        value={filters.driverStatus}
        onValueChange={(driverStatus) =>
          onChange({ ...filters, driverStatus: driverStatus as AdminFiltersState["driverStatus"] })
        }
        options={[
          { value: "all", label: "Todos" },
          { value: "available", label: "Disponíveis" },
          { value: "busy", label: "Ocupados" },
          { value: "offline", label: "Offline" },
        ]}
      />

      <FilterSelect
        label="Veículo"
        value={filters.vehicleType}
        onValueChange={(vehicleType) =>
          onChange({ ...filters, vehicleType: vehicleType as AdminFiltersState["vehicleType"] })
        }
        options={[
          { value: "all", label: "Todos" },
          { value: "moto", label: "Moto" },
          { value: "carro", label: "Carro" },
          { value: "van", label: "Van" },
          { value: "utilitario", label: "Utilitário" },
        ]}
      />

      <FilterSelect
        label="Região demo"
        value={filters.area}
        onValueChange={(area) => onChange({ ...filters, area })}
        options={[{ value: "all", label: "Todas" }, ...areaOptions.map((a) => ({ value: a, label: a }))]}
      />

      <div className="flex items-center gap-2 ml-auto">
        <Switch
          id="show-completed"
          checked={filters.showCompletedRides}
          onCheckedChange={(showCompletedRides) => onChange({ ...filters, showCompletedRides })}
        />
        <Label htmlFor="show-completed" className="text-sm text-muted-foreground cursor-pointer">
          Mostrar concluídas no mapa
        </Label>
      </div>

      <div className="flex flex-wrap gap-2 w-full pt-1 border-t border-border/50">
        <LegendDot color="#D97706" label="Motorista" />
        <LegendDot color="#F59E0B" label="Pendente" />
        <LegendDot color="#38BDF8" label="Aceita" />
        <LegendDot color="#34D399" label="Em andamento" />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="min-w-[130px]">
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 bg-background/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground border-border/60">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </Badge>
  );
}
