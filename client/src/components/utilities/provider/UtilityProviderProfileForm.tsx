import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UtilityProviderProfile } from "@shared/utilityProvider";
import { UTILITY_VEHICLE_LABELS, UTILITY_VEHICLE_TYPES } from "@shared/utilities";
import { Settings } from "lucide-react";

type Props = {
  profile: UtilityProviderProfile | undefined;
  onChange: (patch: Partial<UtilityProviderProfile>) => void;
  isUpdating?: boolean;
};

export default function UtilityProviderProfileForm({ profile, onChange }: Props) {
  if (!profile) {
    return <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />;
  }

  const toggles: Array<{ key: keyof UtilityProviderProfile; label: string }> = [
    { key: "acceptsFreight", label: "Frete rápido" },
    { key: "acceptsSmallMove", label: "Mudança pequena" },
    { key: "acceptsStorePickup", label: "Retirada em loja" },
    { key: "acceptsBulkyCargo", label: "Carga volumosa" },
    { key: "acceptsCommercial", label: "Transporte comercial" },
    { key: "worksWithHelper", label: "Trabalha com ajudante" },
    { key: "isActive", label: "Receber pedidos" },
  ];

  return (
    <Card className="border-border/70 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Perfil do prestador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Veículo principal</Label>
          <Select
            value={profile.vehicleType}
            onValueChange={(v) => onChange({ vehicleType: v as UtilityProviderProfile["vehicleType"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UTILITY_VEHICLE_TYPES.map((v) => (
                <SelectItem key={v} value={v}>
                  {UTILITY_VEHICLE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Capacidade (kg)</Label>
            <Input
              type="number"
              value={profile.maxWeightKg}
              onChange={(e) => onChange({ maxWeightKg: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Volume (m³)</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.maxVolumeM3}
              onChange={(e) => onChange({ maxVolumeM3: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Raio (km)</Label>
            <Input
              type="number"
              value={profile.serviceRadiusKm}
              onChange={(e) => onChange({ serviceRadiusKm: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Mínimo (R$)</Label>
            <Input
              type="number"
              value={profile.minimumOrderCents / 100}
              onChange={(e) =>
                onChange({ minimumOrderCents: Math.round(Number(e.target.value) * 100) })
              }
            />
          </div>
          <div>
            <Label>Ajudantes disp.</Label>
            <Input
              type="number"
              min={0}
              max={4}
              value={profile.availableHelpers}
              onChange={(e) => onChange({ availableHelpers: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          {toggles.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm">{label}</Label>
              <Switch
                checked={!!profile[key]}
                onCheckedChange={(checked) => onChange({ [key]: checked } as Partial<UtilityProviderProfile>)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
