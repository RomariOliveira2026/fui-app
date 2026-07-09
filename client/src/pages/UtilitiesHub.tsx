import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fuiBrand, fuiIconRingClass, fuiStatusBadgeClass, type FuiSemantic } from "@/lib/fuiTheme";
import {
  UTILITY_SERVICE_DESCRIPTIONS,
  UTILITY_SERVICE_LABELS,
  UTILITY_SERVICE_TYPES,
  UTILITY_STATUS_LABELS,
  type UtilityOrderStatus,
  type UtilityServiceType,
} from "@shared/utilities";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Clock,
  History,
  Loader2,
  MapPin,
  Package,
  Route,
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

const SERVICE_THEMES: Record<
  UtilityServiceType,
  { accent: string; glow: string; ring: string; badge: string }
> = {
  freight_fast: {
    accent: "from-primary/25 via-primary/10 to-transparent",
    glow: "group-hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]",
    ring: "bg-primary/15 text-primary ring-primary/25",
    badge: "bg-primary/15 text-primary border-primary/25",
  },
  small_move: {
    accent: "from-sky-500/20 via-sky-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(56,189,248,0.35)]",
    ring: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/25",
  },
  store_pickup: {
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(52,211,153,0.35)]",
    ring: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  },
  bulky_cargo: {
    accent: "from-amber-500/20 via-amber-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35)]",
    ring: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  },
  commercial_transport: {
    accent: "from-violet-500/20 via-violet-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(167,139,250,0.35)]",
    ring: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/25",
  },
};

const UTILITY_STATUS_VARIANT: Record<UtilityOrderStatus, FuiSemantic> = {
  requested: "warning",
  waiting_driver: "warning",
  accepted: "info",
  picking_up: "info",
  in_transit: "success",
  arriving: "success",
  completed: "default",
  cancelled: "danger",
};

const FEATURED_SERVICE: UtilityServiceType = "freight_fast";
const GRID_SERVICES = UTILITY_SERVICE_TYPES.filter((type) => type !== FEATURED_SERVICE);

const STEPS = [
  {
    icon: Sparkles,
    title: "Escolha o serviço",
    description: "Frete, mudança, retirada em loja ou transporte comercial.",
  },
  {
    icon: MapPin,
    title: "Informe rota e carga",
    description: "Origem, destino, volume e observações do transporte.",
  },
  {
    icon: Route,
    title: "Acompanhe em tempo real",
    description: "Status, chat e rastreio até a conclusão do pedido.",
  },
] as const;

function ServiceCard({
  type,
  featured = false,
  onSelect,
}: {
  type: UtilityServiceType;
  featured?: boolean;
  onSelect: (type: UtilityServiceType) => void;
}) {
  const Icon = SERVICE_ICONS[type];
  const theme = SERVICE_THEMES[type];

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={cn(
        "group relative overflow-hidden text-left rounded-2xl border border-border/80 bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-lg",
        theme.glow,
        featured ? "p-6 sm:p-7" : "p-5 h-full"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b pointer-events-none", theme.accent)} />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl ring-1",
              featured ? "h-14 w-14" : "h-12 w-12",
              theme.ring
            )}
          >
            <Icon className={featured ? "w-7 h-7" : "w-6 h-6"} strokeWidth={2} />
          </div>
          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", theme.badge)}>
            {featured ? "Mais pedido" : "Disponível"}
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className={cn("font-semibold text-foreground", featured ? "text-xl" : "text-base")}>
            {UTILITY_SERVICE_LABELS[type]}
          </h3>
          <p className={cn("text-muted-foreground leading-relaxed", featured ? "text-sm" : "text-sm line-clamp-2")}>
            {UTILITY_SERVICE_DESCRIPTIONS[type]}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-sm font-medium text-primary pt-1">
          Solicitar agora
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

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

  const goToService = (type: UtilityServiceType) => {
    navigate(`/utilities/request?service=${type}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%)]" />
      <AppHeader title="Fui Utilitários" />

      <div className="relative mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className={cn("mb-3", fuiBrand.border, fuiBrand.text)}>
              Fretes & mudanças
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Fui Utilitários</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed">
              Serviço dedicado para carga, mudanças urbanas e transporte comercial — com fluxo,
              preço e acompanhamento próprios, separado de corrida e entrega leve.
            </p>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => navigate("/utilities/history")}>
            <History className="w-4 h-4 mr-2" />
            Ver histórico
          </Button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <FuiMetricCard label="Pedidos" value={String(hubStats.total)} icon={Truck} highlight />
          <FuiMetricCard label="Em andamento" value={String(hubStats.active)} icon={Clock} />
          <FuiMetricCard label="Concluídos" value={String(hubStats.completed)} icon={Package} />
          <FuiMetricCard label="Modalidades" value={String(hubStats.services)} icon={Sparkles} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-6 py-5">
                  <h2 className="text-lg font-semibold">Como funciona</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Três passos para solicitar seu transporte com veículo adequado
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={fuiIconRingClass("brand", "h-10 w-10")}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {index < STEPS.length - 1 ? (
                            <div className="mt-2 h-full min-h-8 w-px bg-border/80" />
                          ) : null}
                        </div>
                        <div className="pb-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                            Passo {index + 1}
                          </p>
                          <p className="font-medium mt-0.5">{step.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Seus pedidos
                </CardTitle>
                <CardDescription>
                  {hubStats.total > 0
                    ? `${hubStats.total} pedido(s) registrado(s) no utilitário`
                    : "Seu histórico aparecerá aqui após o primeiro pedido"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const statusVariant = UTILITY_STATUS_VARIANT[order.status];
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => navigate(`/utilities/${order.id}`)}
                        className="w-full text-left rounded-xl border border-border/80 bg-background/40 p-4 hover:border-primary/30 hover:bg-primary/[0.03] transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={fuiIconRingClass("brand", "h-10 w-10")}>
                              <Truck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {UTILITY_SERVICE_LABELS[order.serviceType as UtilityServiceType]}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("mt-1.5 text-[10px]", fuiStatusBadgeClass(statusVariant))}
                              >
                                {UTILITY_STATUS_LABELS[order.status]}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center bg-muted/10">
                    <div className={cn(fuiIconRingClass("default", "h-12 w-12 mx-auto mb-3"))}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhum pedido ainda</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Comece pelo Frete Rápido ou escolha outra modalidade ao lado.
                    </p>
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

          <Card className="border-border/80 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-xl">Escolha o serviço</CardTitle>
              <CardDescription>
                Cada modalidade tem veículo, preço e fluxo otimizados para o tipo de carga
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <ServiceCard type={FEATURED_SERVICE} featured onSelect={goToService} />

              <div className="grid gap-4 sm:grid-cols-2">
                {GRID_SERVICES.map((type) => (
                  <ServiceCard key={type} type={type} onSelect={goToService} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
