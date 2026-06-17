import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { IntermediateStopInput } from "@shared/passengerPremium";
import { MapPin, Plus, X } from "lucide-react";

const MAX_STOPS = 2;

type IntermediateStopsFieldsProps = {
  stops: IntermediateStopInput[];
  onChange: (stops: IntermediateStopInput[]) => void;
  onStopsCleared?: () => void;
  locationBias?: { lat: number; lng: number } | null;
};

export default function IntermediateStopsFields({
  stops,
  onChange,
  onStopsCleared,
  locationBias = null,
}: IntermediateStopsFieldsProps) {
  const addStop = () => {
    if (stops.length >= MAX_STOPS) return;
    onChange([...stops, { address: "" }]);
  };

  const updateStop = (index: number, patch: Partial<IntermediateStopInput>) => {
    const next = [...stops];
    next[index] = { ...next[index]!, ...patch };
    onChange(next);
  };

  const removeStop = (index: number) => {
    const next = stops.filter((_, i) => i !== index);
    onChange(next);
    if (next.length === 0) onStopsCleared?.();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-amber-400" />
          Paradas intermediárias
        </Label>
        {stops.length < MAX_STOPS ? (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addStop}>
            <Plus className="mr-1 h-3 w-3" />
            Adicionar parada
          </Button>
        ) : null}
      </div>

      {stops.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Adicione até {MAX_STOPS} paradas entre origem e destino.
        </p>
      ) : (
        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-1">
                <Label className="text-xs text-muted-foreground">Parada {index + 1}</Label>
                <AddressAutocomplete
                  value={stop.address}
                  onChange={(address) => updateStop(index, { address, placeId: undefined })}
                  onSelect={(result) =>
                    updateStop(index, {
                      address: result.address,
                      placeId: result.placeId,
                    })
                  }
                  placeholder="Endereço da parada"
                  icon={<MapPin className="h-4 w-4 text-amber-400" />}
                  locationBias={locationBias}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 mt-6 h-8 w-8"
                onClick={() => removeStop(index)}
                aria-label={`Remover parada ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
