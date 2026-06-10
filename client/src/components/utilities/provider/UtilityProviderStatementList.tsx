import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Receipt } from "lucide-react";
import {
  UTILITY_SERVICE_LABELS,
  type UtilityServiceType,
} from "@shared/utilities";
import type { UtilityProviderStatementItem } from "@shared/utilityProvider";

type Props = {
  items: UtilityProviderStatementItem[] | undefined;
  isLoading?: boolean;
};

export default function UtilityProviderStatementList({ items, isLoading }: Props) {
  return (
    <Card className="mb-6 border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          Extrato · serviços concluídos
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Valores líquidos após comissão demo de 15%
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 p-3 space-y-2 bg-muted/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">
                      {UTILITY_SERVICE_LABELS[item.serviceType as UtilityServiceType]}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.date).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">
                      R$ {(item.netCents / 100).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      bruto R$ {(item.grossCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-1">
                  <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary/70" />
                  {item.originLabel}
                </p>
                <p className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-1">
                  <Navigation className="h-3 w-3 shrink-0 mt-0.5 text-primary/70" />
                  {item.destinationLabel}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum serviço concluído ainda. Complete fretes para ver o extrato.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
