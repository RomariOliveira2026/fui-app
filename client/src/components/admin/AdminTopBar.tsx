import { Button } from "@/components/ui/button";
import { Bell, BarChart3, RefreshCw, Settings, Tag, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { adminLiveBadge, adminSectionSubtitle } from "@/lib/adminShell";
import {
  ADMIN_NAV_ROUTES,
  resolveAdminNavActive,
  type AdminNavId,
} from "@/lib/adminNav";
import { cn } from "@/lib/utils";

type AdminTopBarProps = {
  updatedAt?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showLiveIndicator?: boolean;
  /** Sobrescreve detecção automática (ex.: aba Inteligência na Central). */
  activeNav?: AdminNavId | null;
};

const NAV_ITEMS: Array<{
  id: AdminNavId;
  label: string;
  icon: typeof Wallet;
}> = [
  { id: "finance", label: "Financeiro", icon: Wallet },
  { id: "manage", label: "Gestão", icon: Settings },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "coupons", label: "Cupons", icon: Tag },
];

export default function AdminTopBar({
  updatedAt,
  onRefresh,
  isRefreshing,
  showLiveIndicator = true,
  activeNav,
}: AdminTopBarProps) {
  const [location, setLocation] = useLocation();
  const detectedActive =
    activeNav !== undefined
      ? activeNav
      : resolveAdminNavActive(location, window.location.search);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Central Operacional
          </h1>
          {showLiveIndicator ? (
            <span className={adminLiveBadge}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Ao vivo
            </span>
          ) : null}
        </div>
        <p className={adminSectionSubtitle}>
          Monitoramento operacional · mapa, filas e inteligência de demanda
        </p>
        {updatedAt ? (
          <p className="text-[11px] text-muted-foreground/80">
            Última sincronização {new Date(updatedAt).toLocaleTimeString("pt-BR")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {onRefresh ? (
          <Button
            variant="outline"
            size="sm"
            className="border-border/70 bg-card/40"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando…" : "Atualizar"}
          </Button>
        ) : null}
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = detectedActive === id;
          return (
            <Button
              key={id}
              variant="outline"
              size="sm"
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "border-border/70 bg-card/40",
                isActive && "border-primary/40 bg-primary/10 text-primary shadow-sm"
              )}
              onClick={() => setLocation(ADMIN_NAV_ROUTES[id])}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
