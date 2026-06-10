import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Coffee, Filter } from "lucide-react";
import type { DriverPremiumPreferences } from "@shared/driverPremium";

type DriverPremiumControlsProps = {
  preferences: DriverPremiumPreferences | undefined;
  isAvailable: boolean;
  onUpdate: (patch: Partial<DriverPremiumPreferences>) => void;
  isUpdating?: boolean;
};

const FILTER_LABELS: { key: keyof DriverPremiumPreferences["serviceFilters"]; label: string }[] = [
  { key: "ride", label: "Corridas" },
  { key: "delivery", label: "Entregas" },
  { key: "moto", label: "Moto" },
  { key: "carro", label: "Carro" },
  { key: "van", label: "Van" },
  { key: "utilitario", label: "Utilitário" },
];

export default function DriverPremiumControls({
  preferences,
  isAvailable,
  onUpdate,
  isUpdating,
}: DriverPremiumControlsProps) {
  if (!preferences) return null;

  const toggleFilter = (key: keyof DriverPremiumPreferences["serviceFilters"]) => {
    onUpdate({
      serviceFilters: {
        ...preferences.serviceFilters,
        [key]: !preferences.serviceFilters[key],
      },
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            Pausa inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {preferences.smartPause
                  ? "Sem novas ofertas — você continua online"
                  : "Recebendo ofertas normalmente"}
              </p>
              {!isAvailable ? (
                <p className="text-xs text-amber-500/90 mt-1">Ative a disponibilidade primeiro</p>
              ) : null}
            </div>
            <Switch
              checked={preferences.smartPause}
              disabled={!isAvailable || isUpdating}
              onCheckedChange={(smartPause) => onUpdate({ smartPause })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtro de serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {FILTER_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-2 text-xs">
                <Label htmlFor={`filter-${key}`}>{label}</Label>
                <Switch
                  id={`filter-${key}`}
                  checked={preferences.serviceFilters[key]}
                  disabled={isUpdating}
                  onCheckedChange={() => toggleFilter(key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
