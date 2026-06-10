import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDemoUtilitiesHydration } from "@/lib/useDemoUtilitiesHydration";
import {
  UTILITY_SERVICE_LABELS,
  UTILITY_STATUS_LABELS,
  type UtilityServiceType,
} from "@shared/utilities";
import { ChevronRight, History, Loader2, RotateCcw, Truck } from "lucide-react";

export default function UtilityHistory() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  useDemoUtilitiesHydration();

  const { data: orders, isLoading } = trpc.utilities.myOrders.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const repeatOrder = (serviceType: UtilityServiceType) => {
    navigate(`/utilities/request?service=${serviceType}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Histórico Utilitários" />

      <div className="mx-auto max-w-lg px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="border-border/70 hover:border-primary/25 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        {UTILITY_SERVICE_LABELS[order.serviceType]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.originAddress} → {order.destinationAddress}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                        {UTILITY_STATUS_LABELS[order.status]} · R${" "}
                        {((order.estimatedPrice ?? 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/utilities/${order.id}`)}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => repeatOrder(order.serviceType)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Repetir solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border/70 bg-muted/20">
            <History className="w-12 h-12 mx-auto text-primary/40 mb-3" />
            <p className="font-medium">Nenhum pedido de utilitário ainda</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Solicite fretes, mudanças ou retiradas em loja pelo hub Fui Utilitários.
            </p>
            <Button onClick={() => navigate("/utilities")}>Ir para Fui Utilitários</Button>
          </div>
        )}
      </div>
    </div>
  );
}
