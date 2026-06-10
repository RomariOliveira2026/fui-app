import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import type { AddressHistoryItem } from "@/lib/addressHistory";

type AddressHistorySuggestionsProps = {
  items: AddressHistoryItem[];
  onSelect: (item: AddressHistoryItem) => void;
  label?: string;
};

export function AddressHistorySuggestions({
  items,
  onSelect,
  label = "Recentes",
}: AddressHistorySuggestionsProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {items.map((item, index) => (
          <Button
            key={`${item.placeId ?? "addr"}-${index}`}
            type="button"
            size="sm"
            variant="outline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(item)}
            className="text-xs max-w-full h-auto py-1.5 whitespace-normal text-left"
            title={item.address}
          >
            <History className="w-3 h-3 mr-1 shrink-0 inline" />
            <span className="line-clamp-2">{item.address}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
