import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Receipt } from "lucide-react";
import type { DriverStatementItem } from "@shared/driverPremium";

type DriverStatementListProps = {
  items: DriverStatementItem[] | undefined;
  isLoading?: boolean;
};

export default function DriverStatementList({ items, isLoading }: DriverStatementListProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          Extrato · valores líquidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-lg border border-border p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium capitalize">
                    {item.type === "ride" ? "Corrida" : "Entrega"} · {item.serviceLabel}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary block">
                      R$ {(item.amountCents / 100).toFixed(2)}
                    </span>
                    {item.grossCents != null && item.grossCents !== item.amountCents ? (
                      <span className="text-[9px] text-muted-foreground">
                        bruto R$ {(item.grossCents / 100).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(item.date).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-1">
                  <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                  {item.originLabel}
                </p>
                <p className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-1">
                  <Navigation className="h-3 w-3 shrink-0 mt-0.5" />
                  {item.destinationLabel}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum serviço concluído ainda. Complete corridas ou entregas para ver o extrato.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
