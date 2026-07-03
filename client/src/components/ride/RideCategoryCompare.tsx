import { Bike, Car, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { fuiBrand, fuiSelectedTile } from "@/lib/fuiTheme";
import type { CategoryQuote } from "@shared/rideQuote";
import {
  formatRideDurationMinutes,
  formatRidePriceBRL,
  RIDE_CATEGORIES,
  type RideCategoryMeta,
} from "@shared/rideCategories";
import type { DemoVehicleType } from "@shared/demoPricing";
import { Loader2 } from "lucide-react";

const CATEGORY_ICONS = {
  moto: Bike,
  carro: Car,
  van: Truck,
  utilitario: Package,
} as const;

type RideCategoryCompareProps = {
  selected: DemoVehicleType;
  onSelect: (type: DemoVehicleType) => void;
  quotes?: CategoryQuote[];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
};

export default function RideCategoryCompare({
  selected,
  onSelect,
  quotes,
  loading,
  disabled,
  compact,
}: RideCategoryCompareProps) {
  const quoteMap = new Map(quotes?.map((q) => [q.vehicleType, q]));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Escolha a categoria
        </p>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />}
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-1")}>
        {RIDE_CATEGORIES.map((category: RideCategoryMeta) => {
          const Icon = CATEGORY_ICONS[category.type];
          const quote = quoteMap.get(category.type);
          const isSelected = selected === category.type;

          return (
            <button
              key={category.type}
              type="button"
              disabled={disabled || loading}
              onClick={() => onSelect(category.type)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
                fuiSelectedTile(isSelected),
                isSelected && "shadow-sm shadow-primary/10"
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                  isSelected ? "bg-primary/15 text-primary" : "bg-muted/50 text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{category.label}</span>
                  {quote ? (
                    <span className={cn("text-sm font-bold tabular-nums", fuiBrand.text)}>
                      {formatRidePriceBRL(quote.estimatedPrice)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{category.description}</span>
                  {quote && (
                    <span className="shrink-0 tabular-nums">
                      {formatRideDurationMinutes(quote.durationS)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
