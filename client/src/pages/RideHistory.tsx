import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Route, Search, TrendingUp, Wallet } from "lucide-react";
import { repeatRide } from "@/lib/ridePrefill";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { useDemoRideHydration } from "@/lib/useDemoRideHydration";
import { fuiBrand } from "@/lib/fuiTheme";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import RideHistoryCard from "@/components/ride/RideHistoryCard";
import {
  computeRideHistoryStats,
  filterRideHistory,
  formatBrlFromCents,
  formatRideDistanceMeters,
  groupRidesByMonth,
  type RideHistoryStatusFilter,
} from "@shared/rideHistoryUtils";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: RideHistoryStatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "completed", label: "Concluídas" },
  { value: "active", label: "Em andamento" },
  { value: "cancelled", label: "Canceladas" },
];

export default function RideHistory() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const isDriverHistory = location.startsWith("/driver/history");
  const [statusFilter, setStatusFilter] = useState<RideHistoryStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useDemoRideHydration();

  const {
    data: passengerRides,
    isLoading: passengerLoading,
  } = trpc.ride.myRides.useQuery(undefined, {
    enabled: !!user && !isDriverHistory,
    throwOnError: false,
    retry: 1,
  });

  const {
    data: driverRides,
    isLoading: driverLoading,
  } = trpc.ride.myDrives.useQuery(undefined, {
    enabled: !!user && isDriverHistory,
    throwOnError: false,
    retry: 1,
  });

  const rides = isDriverHistory ? driverRides : passengerRides;
  const isLoading = isDriverHistory ? driverLoading : passengerLoading;

  const filteredRides = useMemo(
    () => filterRideHistory(rides ?? [], statusFilter, searchQuery),
    [rides, statusFilter, searchQuery]
  );

  const stats = useMemo(() => computeRideHistoryStats(rides ?? []), [rides]);
  const monthGroups = useMemo(() => groupRidesByMonth(filteredRides), [filteredRides]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageTitle = isDriverHistory ? "Histórico de Corridas (Motorista)" : "Histórico de Corridas";
  const pageSubtitle = isDriverHistory
    ? "Corridas que você realizou como motorista"
    : "Suas corridas anteriores";
  const totalDistanceLabel = formatRideDistanceMeters(stats.totalDistanceMeters) ?? "0 km";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title={pageTitle} />
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageSubtitle}</p>
          </div>
          {!isDriverHistory ? (
            <Button onClick={() => setLocation("/")} className={fuiBrand.btn}>
              Nova Corrida
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setLocation("/driver-dashboard")}>
              Painel do Motorista
            </Button>
          )}
        </div>

        {rides && rides.length > 0 ? (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <FuiMetricCard
                label={isDriverHistory ? "Corridas realizadas" : "Total de corridas"}
                value={String(stats.totalRides)}
                sub={`${stats.completedRides} concluídas`}
                icon={Route}
              />
              <FuiMetricCard
                label={isDriverHistory ? "Ganhos estimados" : "Gasto total"}
                value={formatBrlFromCents(stats.totalSpentCents)}
                sub="Somente concluídas"
                icon={Wallet}
                highlight
              />
              <FuiMetricCard
                label="Distância percorrida"
                value={totalDistanceLabel}
                sub="Acumulado"
                icon={MapPin}
              />
              <FuiMetricCard
                label={isDriverHistory ? "Ticket médio" : "Média por corrida"}
                value={formatBrlFromCents(stats.avgPriceCents)}
                sub="Concluídas"
                icon={TrendingUp}
              />
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por endereço, ID ou cupom..."
                  className="pl-9 bg-card"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    size="sm"
                    variant={statusFilter === filter.value ? "default" : "outline"}
                    className={cn(
                      statusFilter === filter.value && fuiBrand.btn,
                      "rounded-full"
                    )}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {filteredRides.length > 0 ? (
              <div className="space-y-8">
                {monthGroups.map((group) => (
                  <section key={group.key} className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.label}
                    </h2>
                    <div className="grid gap-3 lg:grid-cols-2 xl:gap-4">
                      {group.rides.map((ride) => (
                        <RideHistoryCard
                          key={ride.id}
                          ride={ride}
                          isDriverHistory={isDriverHistory}
                          onOpen={(id) => setLocation(`/ride/${id}`)}
                          onRepeat={
                            !isDriverHistory
                              ? (r) => repeatRide(r, setLocation)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="py-10 text-center space-y-3">
                  <Search className="w-10 h-10 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Nenhuma corrida encontrada</h3>
                  <p className="text-sm text-muted-foreground">
                    Tente outro filtro ou limpe a busca para ver todo o histórico.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isDriverHistory ? "Nenhuma corrida realizada" : "Nenhuma corrida ainda"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isDriverHistory
                  ? "Suas corridas concluídas como motorista aparecerão aqui."
                  : "Suas corridas concluídas aparecerão aqui após finalizar uma viagem."}
              </p>
              {!isDriverHistory ? (
                <Button onClick={() => setLocation("/")} className={fuiBrand.btn}>
                  Solicitar primeira corrida
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
