import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fuiBrand } from "@/lib/fuiTheme";
import {
  UTILITY_SERVICE_DESCRIPTIONS,
  UTILITY_SERVICE_LABELS,
  UTILITY_SERVICE_TYPES,
  UTILITY_STATUS_LABELS,
  type UtilityServiceType,
} from "@shared/utilities";
import {
  Building2,
  ChevronRight,
  Clock,
  History,
  Loader2,
  Package,
  ShoppingBag,
  Sparkles,
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

  const { data: orders, isLoading } = trpc.utilities.myOrders.useQuery(undefined, {
    enabled: !!user,
    throwOnError: false,
    retry: 1,
  });

  const hubStats = useMemo(() => {
    const list = orders ?? [];
    const active = list.filter((o) => o.status !== "completed" && o.status !== "cancelled").length;
    const completed = list.filter((o) => o.status === "completed").length;
    return {
      total: list.length,
      active,
      completed,
      services: UTILITY_SERVICE_TYPES.length,
    };
  }, [orders]);

  const recentOrders = useMemo(() => (orders ?? []).slice(0, 3), [orders]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Fui Utilitários" />

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
              Fretes & mudanças
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Fui Utilitários</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Serviço dedicado para carga, mudanças urbanas e transporte comercial — diferente de
              corrida e entrega leve.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/utilities/history")}>
            <History className="w-4 h-4 mr-2" />
            Ver histórico
          </Button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <FuiMetricCard label="Pedidos" value={String(hubStats.total)} icon={Truck} highlight />
          <FuiMetricCard label="Em andamento" value={String(hubStats.active)} icon={Clock} />
          <FuiMetricCard label="Concluídos" value={String(hubStats.completed)} icon={Package} />
          <FuiMetricCard label="Serviços" value={String(hubStats.services)} icon={Sparkles} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Transporte com veículo adequado</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Do frete rápido à mudança completa, cada modalidade tem fluxo, preço e
                    acompanhamento próprios — sem misturar com corrida de passageiro.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className={fuiBrand.text}>1.</span>
                    Escolha o tipo de serviço no painel ao lado
                  </li>
                  <li className="flex gap-2">
                    <span className={fuiBrand.text}>2.</span>
                    Informe origem, destino e detalhes da carga
                  </li>
                  <li className="flex gap-2">
                    <span className={fuiBrand.text}>3.</span>
                    Acompanhe o pedido em tempo real até a entrega
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Seus pedidos
                </CardTitle>
                <CardDescription>
                  {hubStats.total > 0
                    ? `${hubStats.total} pedido(s) de utilitário registrado(s)`
                    : "Nenhum pedido ainda — comece escolhendo um serviço"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => navigate(`/utilities/${order.id}`)}
                      className="w-full text-left rounded-lg border border-border bg-card/50 p-3 hover:border-primary/30 hover:bg-primary/[0.04] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {UTILITY_SERVICE_LABELS[order.serviceType as UtilityServiceType]}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {UTILITY_STATUS_LABELS[order.status]}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                    <Truck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Seu histórico aparecerá aqui</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/utilities/history")}
                >
                  Ver histórico completo
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Escolha o serviço</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione a modalidade ideal para o seu transporte
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {UTILITY_SERVICE_TYPES.map((type, index) => {
                const Icon = SERVICE_ICONS[type];
                const isLastOdd =
                  index === UTILITY_SERVICE_TYPES.length - 1 &&
                  UTILITY_SERVICE_TYPES.length % 2 !== 0;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => navigate(`/utilities/request?service=${type}`)}
                    className={cn(
                      "text-left rounded-xl border border-border bg-card p-5 h-full",
                      "hover:border-primary/35 hover:bg-primary/[0.04] hover:shadow-sm transition-all group",
                      isLastOdd && "sm:col-span-2"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground">{UTILITY_SERVICE_LABELS[type]}</p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {UTILITY_SERVICE_DESCRIPTIONS[type]}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
