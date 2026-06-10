import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BookedForThirdParty } from "@shared/passengerPremium";
import { UserRound } from "lucide-react";

type ThirdPartyRideFieldsProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: BookedForThirdParty;
  onChange: (value: BookedForThirdParty) => void;
};

export default function ThirdPartyRideFields({
  enabled,
  onEnabledChange,
  value,
  onChange,
}: ThirdPartyRideFieldsProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" />
          <Label htmlFor="third-party-toggle" className="text-sm font-medium">
            Corrida para outra pessoa
          </Label>
        </div>
        <Switch
          id="third-party-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="third-party-name" className="text-xs text-muted-foreground">
              Nome do passageiro
            </Label>
            <Input
              id="third-party-name"
              placeholder="Ex.: Maria Silva"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="third-party-phone" className="text-xs text-muted-foreground">
              Telefone
            </Label>
            <Input
              id="third-party-phone"
              type="tel"
              placeholder="(79) 99999-9999"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="third-party-notes" className="text-xs text-muted-foreground">
              Observação (opcional)
            </Label>
            <Textarea
              id="third-party-notes"
              rows={2}
              placeholder="Ex.: aguardar na portaria"
              value={value.notes ?? ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value || undefined })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
