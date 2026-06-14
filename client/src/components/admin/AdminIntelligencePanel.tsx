import { useState } from "react";
import {
  Loader2,
  MapPin,
  Clock,
  Navigation2,
  TrendingUp,
  TrendingDown,
  Car,
  Target,
  BarChart3,
  AlertTriangle,
  Bell,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import AdminDemandHeatmap from "@/components/admin/AdminDemandHeatmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  adminMetricLabel,
  adminMetricValue,
  adminPanelCard,
  adminSectionSubtitle,
  adminSectionTitle,
} from "@/lib/adminShell";
import type { IntelligencePeriodPreset } from "@shared/operationalIntelligence";

const VEHICLE_LABELS: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

const PERIOD_OPTIONS: { preset: IntelligencePeriodPreset; label: string }[] = [
  { preset: "today", label: "Hoje" },
  { preset: "yesterday", label: "Ontem" },
  { preset: "7d", label: "7 dias" },
  { preset: "30d", label: "30 dias" },
  { preset: "custom", label: "Personalizado" },
];

export default function AdminIntelligencePanel({ enabled = true }: { enabled?: boolean }) {
  const [preset, setPreset] = useState<IntelligencePeriodPreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const periodInput =
    preset === "custom" && customFrom
      ? { preset, from: customFrom, to: customTo || undefined }
      : { preset };

  const { data, isLoading, isFetching, isError, error, refetch } =
    trpc.admin.getOperationalIntelligence.useQuery(periodInput, {
      enabled,
      staleTime: 60_000,
      refetchInterval: 60_000,
      throwOnError: false,
    });

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border/50 bg-card/30">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando inteligência operacional…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(adminPanelCard, "p-8 text-center space-y-4")}>
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <div>
          <h2 className={adminSectionTitle}>Inteligência indisponível</h2>
          <p className={cn(adminSectionSubtitle, "mt-2")}>
            {error.message || "Não foi possível carregar os insights operacionais."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn(adminPanelCard, "p-8 text-center space-y-3")}>
        <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className={adminSectionTitle}>Sem dados de inteligência</h2>
        <p className={adminSectionSubtitle}>
          Nenhum insight disponível para o período selecionado.
        </p>
      </div>
    );
  }

  const peakHours = data.peakHours ?? [];
  const demandZones = data.demandZones ?? [];
  const comparisons = data.comparisons ?? [];
  const alerts = data.alerts ?? [];
  const positioning = data.positioning ?? [];
  const demandPoints = data.demandPoints ?? [];

  const maxPeak = Math.max(...peakHours.map((h) => h.rideCount), 1);
  const sortedHours = [...peakHours].sort((a, b) => a.hour - b.hour);
  const topZone = demandZones[0];
  const topHour = peakHours[0];
  const topPosition = positioning[0];
  const vehicleLabel = data.topVehicleType
    ? (VEHICLE_LABELS[data.topVehicleType] ?? data.topVehicleType)
    : "—";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          adminPanelCard,
          "p-5 sm:p-6 border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card/50 to-card/30"
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/90">
                  Inteligência 7.2
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Painel analítico de demanda
              </h2>
              <p className={cn(adminSectionSubtitle, "mt-1.5 max-w-xl")}>
                {data.periodLabel} · {data.totalRidesAnalyzed} corridas · {data.trend.label}
              </p>
            </div>
            <div className="text-right">
              {isFetching ? (
                <span className="text-xs text-primary/80">Atualizando insights…</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Atualizado {new Date(data.updatedAt).toLocaleTimeString("pt-BR")}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.preset}
                size="sm"
                variant={preset === opt.preset ? "default" : "outline"}
                onClick={() => setPreset(opt.preset)}
              >
                {opt.label}
              </Button>
            ))}
            {preset === "custom" ? (
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border px-4 py-3 flex items-start gap-3",
                alert.severity === "critical"
                  ? "border-red-500/30 bg-red-500/5"
                  : alert.severity === "warning"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-primary/20 bg-primary/5"
              )}
            >
              <Bell
                className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  alert.severity === "critical"
                    ? "text-red-500"
                    : alert.severity === "warning"
                      ? "text-amber-500"
                      : "text-primary"
                )}
              />
              <div>
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {comparisons.map((cmp) => (
          <div key={cmp.id} className={cn(adminPanelCard, "p-4")}>
            <p className={adminMetricLabel}>{cmp.label}</p>
            <div className="flex items-end justify-between gap-2 mt-2">
              <div>
                <p className="text-2xl font-bold">{cmp.current}</p>
                <p className="text-xs text-muted-foreground">vs {cmp.previous} anterior</p>
              </div>
              <ComparisonBadge changePercent={cmp.changePercent} tone={cmp.tone} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeaturedInsight
          icon={MapPin}
          label="Região mais quente"
          value={topZone?.areaLabel ?? "—"}
          detail={
            topZone
              ? `${topZone.rideCount} corridas · ${topZone.sharePercent}% do volume`
              : "Aguardando dados"
          }
          highlight
        />
        <FeaturedInsight
          icon={Clock}
          label="Horário de pico"
          value={topHour && topHour.rideCount > 0 ? topHour.label : "—"}
          detail={
            topHour && topHour.rideCount > 0
              ? `${topHour.rideCount} solicitações · ${topHour.sharePercent}%`
              : "Sem picos no período"
          }
        />
        <FeaturedInsight
          icon={Navigation2}
          label="Melhor posicionamento"
          value={topPosition?.areaLabel ?? "—"}
          detail={topPosition?.message ?? "Sem recomendação ainda"}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SecondaryPill icon={Car} label="Modal top" value={vehicleLabel} />
        <SecondaryPill
          icon={BarChart3}
          label="Taxa de aceite"
          value={data.acceptRatePercent != null ? `${data.acceptRatePercent}%` : "—"}
        />
        <SecondaryPill
          icon={Target}
          label="Tendência"
          value={data.trend.changePercent != null ? `${data.trend.changePercent}%` : "—"}
        />
        <SecondaryPill icon={AlertTriangle} label="Alertas" value={String(alerts.length)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-3">
          <div className="px-1">
            <h3 className={adminSectionTitle}>Mapa de calor · zonas quentes</h3>
            <p className={adminSectionSubtitle}>
              Intensidade por região de origem · tiers baixa / média / alta
            </p>
          </div>
          <div className={cn(adminPanelCard, "p-1 overflow-hidden")}>
            <AdminDemandHeatmap
              points={demandPoints}
              className="border-0 shadow-none rounded-xl"
            />
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className={cn(adminPanelCard, "h-full")}>
            <div className="px-4 py-3.5 border-b border-border/50">
              <h3 className={adminSectionTitle}>Ranking de zonas</h3>
              <p className={adminSectionSubtitle}>Participação no período selecionado</p>
            </div>
            <div className="p-4 space-y-4">
              {demandZones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem zonas</p>
              ) : (
                demandZones.slice(0, 6).map((zone, index) => (
                  <div key={zone.areaLabel} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                            index === 0
                              ? "bg-primary/15 text-primary"
                              : "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{zone.areaLabel}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary tabular-nums shrink-0">
                        {zone.sharePercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all duration-500"
                        style={{ width: `${Math.max(zone.sharePercent, 5)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{zone.rideCount} corridas</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={adminPanelCard}>
          <div className="px-4 py-3.5 border-b border-border/50">
            <h3 className={adminSectionTitle}>Horários de pico</h3>
            <p className={adminSectionSubtitle}>Distribuição por hora do dia</p>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-0.5 h-40 pt-2">
              {sortedHours.map((bucket) => {
                const height =
                  bucket.rideCount > 0 ? Math.max((bucket.rideCount / maxPeak) * 100, 8) : 4;
                const isPeak = bucket.rideCount === maxPeak && bucket.rideCount > 0;
                return (
                  <div
                    key={bucket.hour}
                    className="flex flex-col items-center justify-end gap-1 flex-1 min-w-0 group"
                    title={`${bucket.label}: ${bucket.rideCount}`}
                  >
                    <div
                      className={cn(
                        "w-full max-w-[14px] mx-auto rounded-t transition-all duration-300",
                        isPeak
                          ? "bg-primary shadow-[0_0_12px_rgba(243,146,0,0.35)]"
                          : "bg-primary/30 group-hover:bg-primary/45"
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] text-muted-foreground/70 h-3">
                      {bucket.hour % 4 === 0 ? bucket.hour : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={adminPanelCard}>
          <div className="px-4 py-3.5 border-b border-border/50">
            <h3 className={adminSectionTitle}>Recomendações de posicionamento</h3>
            <p className={adminSectionSubtitle}>Onde concentrar motoristas disponíveis</p>
          </div>
          <div className="p-4 space-y-3">
            {positioning.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem recomendações</p>
            ) : (
              positioning.map((item) => (
                <div
                  key={item.priority}
                  className={cn(
                    "rounded-xl border px-4 py-3 transition-colors",
                    item.priority === 1
                      ? "border-primary/30 bg-primary/[0.06]"
                      : "border-border/50 bg-muted/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                        item.priority === 1
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      P{item.priority}
                    </span>
                    <span className="text-sm font-semibold">{item.areaLabel}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonBadge({
  changePercent,
  tone,
}: {
  changePercent: number | null;
  tone: "up" | "down" | "neutral";
}) {
  if (changePercent == null) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;
  const color =
    tone === "up" ? "text-emerald-500" : tone === "down" ? "text-amber-500" : "text-muted-foreground";
  return (
    <span className={cn("text-sm font-semibold flex items-center gap-1", color)}>
      <Icon className="h-4 w-4" />
      {changePercent > 0 ? "+" : ""}
      {changePercent}%
    </span>
  );
}

function FeaturedInsight({
  icon: Icon,
  label,
  value,
  detail,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        adminPanelCard,
        "p-5",
        highlight && "border-primary/25 bg-gradient-to-br from-primary/[0.05] to-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={adminMetricLabel}>{label}</p>
        <Icon className={cn("h-4 w-4 shrink-0", highlight ? "text-primary" : "text-muted-foreground")} />
      </div>
      <p className={cn(adminMetricValue, "text-xl sm:text-2xl truncate", highlight && "text-primary")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{detail}</p>
    </div>
  );
}

function SecondaryPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className={cn(adminPanelCard, "px-4 py-3 flex items-center gap-3")}>
      <div className="rounded-lg bg-muted/40 p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
