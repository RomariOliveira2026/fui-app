import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemoUtilitiesHydration } from "@/lib/useDemoUtilitiesHydration";
import { fuiBrand } from "@/lib/fuiTheme";
import {
  UTILITY_SERVICE_LABELS,
  UTILITY_STATUS_LABELS,
  type UtilityOrderStatus,
  type UtilityServiceType,
} from "@shared/utilities";
import { ChevronRight, Clock, History, Loader2, RotateCcw, Truck } from "lucide-react";

export default function UtilityHistory() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  useDemoUtilitiesHydration();

  const { data: orders, isLoading } = trpc.utilities.myOrders.useQuery(undefined, {
    enabled: !!user,
    throwOnError: false,
    retry: 1,
  });

  const stats = useMemo(() => {
    const list = orders ?? [];
    const completed = list.filter((o) => o.status === "completed").length;
    const active = list.filter(
      (o) => o.status !== "completed" && o.status !== "cancelled"
    ).length;
    const totalSpent = list.reduce((sum, o) => sum + (o.finalPrice ?? o.estimatedPrice ?? 0), 0);
    return { total: list.length, completed, active, totalSpent };
  }, [orders]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%)]" />
      <AppHeader title="Histórico Utilitários" />

      <div className="relative mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className={`mb-3 ${fuiBrand.border} ${fuiBrand.text}`}>
              Fui Utilitários
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Pedidos</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Acompanhe fretes, mudanças e retiradas em loja solicitados pelo hub de utilitários.
            </p>
          </div>
          <Button className={fuiBrand.btn} onClick={() => navigate("/utilities")}>
            Novo pedido
          </Button>
        </div>

        {stats.total > 0 ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <FuiMetricCard label="Total" value={String(stats.total)} icon={Truck} highlight />
            <FuiMetricCard label="Concluídos" value={String(stats.completed)} icon={History} />
            <FuiMetricCard label="Em andamento" value={String(stats.active)} icon={Clock} />
            <FuiMetricCard
              label="Volume"
              value={`R$ ${(stats.totalSpent / 100).toFixed(0)}`}
              icon={Truck}
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="border-border/80 hover:border-primary/25 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {UTILITY_SERVICE_LABELS[order.serviceType]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.originAddress} → {order.destinationAddress}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">
                            {UTILITY_STATUS_LABELS[order.status as UtilityOrderStatus]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-primary mt-2">
                          R$ {((order.finalPrice ?? order.estimatedPrice ?? 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/utilities/${order.id}`)}
                      aria-label="Ver detalhes"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => repeatOrder(order.serviceType)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Repetir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-[1fr_1.2fr] lg:items-center">
                <div className="flex flex-col items-center justify-center px-6 py-12 lg:py-16 lg:border-r border-border">
                  <History className="w-20 h-20 text-muted-foreground/40 mb-4" />
                  <h3 className="text-xl font-semibold text-center">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-2">
                    Solicite fretes, mudanças ou retiradas em loja pelo hub Fui Utilitários.
                  </p>
                </div>
                <div className="px-6 py-10 lg:py-16 space-y-4 bg-muted/20">
                  <CardDescription className="text-sm font-medium text-foreground">
                    Serviços disponíveis
                  </CardDescription>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Frete rápido e carga volumosa</li>
                    <li>Mudança pequena com apoio opcional</li>
                    <li>Retirada em loja com rastreio</li>
                  </ul>
                  <Button className={fuiBrand.btn} onClick={() => navigate("/utilities")}>
                    Ir para Fui Utilitários
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
