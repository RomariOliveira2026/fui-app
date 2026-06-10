import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  UTILITY_SERVICE_DESCRIPTIONS,
  UTILITY_SERVICE_LABELS,
  UTILITY_SERVICE_TYPES,
  type UtilityServiceType,
} from "@shared/utilities";
import {
  Building2,
  ChevronRight,
  History,
  Package,
  ShoppingBag,
  Truck,
  Warehouse,
} from "lucide-react";
import { useDemoUtilitiesHydration } from "@/lib/useDemoUtilitiesHydration";
import { trpc } from "@/lib/trpc";

const SERVICE_ICONS: Record<UtilityServiceType, typeof Truck> = {
  freight_fast: Truck,
  small_move: Package,
  store_pickup: ShoppingBag,
  bulky_cargo: Warehouse,
  commercial_transport: Building2,
};

export default function UtilitiesHub() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  useDemoUtilitiesHydration();

  const { data: orders } = trpc.utilities.myOrders.useQuery(undefined, { enabled: !!user });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Fui Utilitários" />

      <div className="mx-auto max-w-lg px-4 py-5 space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
            Fretes & mudanças
          </p>
          <h1 className="text-2xl font-bold text-foreground">Fui Utilitários</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Serviço dedicado para carga, mudanças urbanas e transporte comercial — diferente de
            corrida e entrega leve.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Escolha o serviço</h2>
          {UTILITY_SERVICE_TYPES.map((type) => {
            const Icon = SERVICE_ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => navigate(`/utilities/request?service=${type}`)}
                className={cn(
                  "w-full text-left rounded-xl border border-border/70 bg-card/50 p-4",
                  "hover:border-primary/30 hover:bg-primary/[0.04] transition-all group"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{UTILITY_SERVICE_LABELS[type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {UTILITY_SERVICE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        <Card className="border-border/70">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Histórico</p>
                <p className="text-xs text-muted-foreground">
                  {orders?.length ?? 0} pedido(s) de utilitário
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/utilities/history")}>
              Ver todos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
