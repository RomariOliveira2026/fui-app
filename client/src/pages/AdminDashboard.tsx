import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { canAccessAdminPanel } from "@/lib/adminAccess";
import { useDemoRideHydration } from "@/lib/useDemoRideHydration";
import { useAdminView } from "@/lib/useAdminView";
import { adminContainer, adminPageBg } from "@/lib/adminShell";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminViewSwitcher from "@/components/admin/AdminViewSwitcher";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminMap from "@/components/admin/AdminMap";
import AdminRideList from "@/components/admin/AdminRideList";
import AdminDriverList from "@/components/admin/AdminDriverList";
import AdminRideDetailsSheet from "@/components/admin/AdminRideDetailsSheet";
import AdminAlertsPanel from "@/components/admin/AdminAlertsPanel";
import AdminDriverDetailsSheet from "@/components/admin/AdminDriverDetailsSheet";
import AdminIntelligencePanel from "@/components/admin/AdminIntelligencePanel";
import AdminPanelErrorBoundary from "@/components/admin/AdminPanelErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminPanelCard, adminSectionSubtitle, adminSectionTitle } from "@/lib/adminShell";
import type {
  AdminOperationalDriver,
  AdminOperationalRide,
} from "@shared/adminOperational";
import {
  DEFAULT_ADMIN_FILTERS,
  filterAdminDrivers,
  filterAdminRides,
  type AdminFiltersState,
  type AdminSelection,
} from "@/lib/adminOperationalUi";
import FlowErrorFallback from "@/components/fui/FlowErrorFallback";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [adminView, setAdminView] = useAdminView();
  useDemoRideHydration();

  const [filters, setFilters] = useState<AdminFiltersState>(DEFAULT_ADMIN_FILTERS);
  const [selection, setSelection] = useState<AdminSelection>(null);
  const [rideDetails, setRideDetails] = useState<AdminOperationalRide | null>(null);
  const [driverDetails, setDriverDetails] = useState<AdminOperationalDriver | null>(null);
  const [rideSheetOpen, setRideSheetOpen] = useState(false);
  const [driverSheetOpen, setDriverSheetOpen] = useState(false);

  const allowed = canAccessAdminPanel(user);

  useEffect(() => {
    if (!authLoading && !allowed) {
      setLocation("/");
    }
  }, [authLoading, allowed, setLocation]);

  const utils = trpc.useUtils();

  const {
    data: overview,
    isLoading: overviewLoading,
    isFetching,
    isError: overviewError,
    error: overviewQueryError,
    refetch,
  } = trpc.admin.getOperationalOverview.useQuery(undefined, {
    enabled: allowed && adminView === "live",
    refetchInterval: adminView === "live" ? 8000 : false,
    throwOnError: false,
    retry: 1,
  });

  const cancelRideMutation = trpc.admin.cancelRide.useMutation({
    onSuccess: () => {
      toast.success("Corrida cancelada pela central");
      void utils.admin.getOperationalOverview.invalidate();
      setRideSheetOpen(false);
      setRideDetails(null);
      setSelection(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const redispatchRideMutation = trpc.admin.redispatchRide.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Reenfileirada · ${result.offersCreated} oferta(s) · rodada ${result.offerRound}`
      );
      void utils.admin.getOperationalOverview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const assignRideMutation = trpc.admin.assignRide.useMutation({
    onSuccess: () => {
      toast.success("Motorista designado pela central");
      void utils.admin.getOperationalOverview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredRides = useMemo(
    () => filterAdminRides(overview?.rides ?? [], filters),
    [overview?.rides, filters]
  );

  const filteredDrivers = useMemo(
    () => filterAdminDrivers(overview?.drivers ?? [], filters),
    [overview?.drivers, filters]
  );

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const r of overview?.rides ?? []) set.add(r.areaLabel);
    for (const d of overview?.drivers ?? []) set.add(d.areaLabel);
    return Array.from(set).sort();
  }, [overview]);

  const handleSelectRide = (ride: AdminOperationalRide) => {
    setSelection({ type: "ride", id: ride.id });
    setRideDetails(ride);
    setRideSheetOpen(true);
    setDriverSheetOpen(false);
  };

  const handleOpenRideById = (rideId: number) => {
    const ride = overview?.rides.find((r) => r.id === rideId);
    if (ride) handleSelectRide(ride);
  };

  const handleAdminCancelRide = (ride: AdminOperationalRide) => {
    cancelRideMutation.mutate({
      rideId: ride.id,
      reason: "Cancelada pela central operacional",
    });
  };

  const handleAdminRedispatchRide = (ride: AdminOperationalRide) => {
    redispatchRideMutation.mutate({ rideId: ride.id });
  };

  const handleAdminAssignRide = (ride: AdminOperationalRide, driverId: number) => {
    assignRideMutation.mutate({ rideId: ride.id, driverId });
  };

  useEffect(() => {
    if (!rideDetails || !overview) return;
    const fresh = overview.rides.find((r) => r.id === rideDetails.id);
    if (fresh && fresh !== rideDetails) setRideDetails(fresh);
  }, [overview, rideDetails]);

  const handleSelectDriver = (driver: AdminOperationalDriver) => {
    setSelection({ type: "driver", id: driver.id });
    setDriverDetails(driver);
    setDriverSheetOpen(true);
  };

  if (authLoading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminView === "live" && overviewLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={adminPageBg}>
      <AppHeader title="Central Operacional" showBack />
      <div className={adminContainer}>
        <AdminTopBar
          updatedAt={adminView === "live" ? overview?.updatedAt : undefined}
          onRefresh={adminView === "live" ? () => refetch() : undefined}
          isRefreshing={adminView === "live" ? isFetching : false}
          showLiveIndicator={adminView === "live"}
          activeNav={adminView === "intelligence" ? "analytics" : null}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <AdminViewSwitcher value={adminView} onChange={setAdminView} />
          {isFetching && adminView === "live" && !overviewLoading ? (
            <p className="text-xs text-primary/80">Sincronizando operação…</p>
          ) : null}
        </div>

        {adminView === "intelligence" ? (
          <AdminPanelErrorBoundary title="Inteligência operacional">
            <AdminIntelligencePanel enabled={allowed} />
          </AdminPanelErrorBoundary>
        ) : (
          <div className="space-y-5">
            {overviewError ? (
              <FlowErrorFallback
                title="Central operacional indisponível"
                error={overviewQueryError}
                onRetry={() => void refetch()}
                onGoHome={() => setLocation("/")}
              />
            ) : null}
            {overview ? <AdminStatsCards metrics={overview.metrics} /> : null}

            <AdminFilters filters={filters} onChange={setFilters} areas={areas} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              <div className="xl:col-span-9 space-y-3">
                <div className="px-1">
                  <h2 className={adminSectionTitle}>Mapa operacional</h2>
                  <p className={adminSectionSubtitle}>
                    Visualização em tempo quase real · clique para detalhes e rota
                  </p>
                </div>
                <AdminMap
                  className="ring-1 ring-border/50 shadow-lg shadow-black/20"
                  rides={filteredRides}
                  drivers={filteredDrivers}
                  selection={selection}
                  onSelectRide={handleSelectRide}
                  onSelectDriver={handleSelectDriver}
                />
              </div>

              <div className="xl:col-span-3 xl:sticky xl:top-4 space-y-4">
                {overview ? (
                  <AdminAlertsPanel
                    alerts={overview.alerts}
                    onSelectRide={handleOpenRideById}
                  />
                ) : null}
                <div className={cn(adminPanelCard, "overflow-hidden")}>
                  <div className="px-4 py-3.5 border-b border-border/50 bg-muted/10">
                    <h2 className={adminSectionTitle}>Fila operacional</h2>
                    <p className={adminSectionSubtitle}>
                      Corridas e motoristas filtrados
                    </p>
                  </div>
                  <div className="p-3">
                    <Tabs defaultValue="rides">
                      <TabsList className="w-full grid grid-cols-2 mb-3 h-9 bg-muted/30">
                        <TabsTrigger value="rides" className="text-xs">
                          Corridas ({filteredRides.length})
                        </TabsTrigger>
                        <TabsTrigger value="drivers" className="text-xs">
                          Motoristas ({filteredDrivers.length})
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="rides" className="mt-0">
                        <AdminRideList
                          rides={filteredRides}
                          selectedId={selection?.type === "ride" ? selection.id : null}
                          onSelect={handleSelectRide}
                          onCancel={handleAdminCancelRide}
                          onRedispatch={handleAdminRedispatchRide}
                          actionRideId={
                            cancelRideMutation.isPending || redispatchRideMutation.isPending
                              ? cancelRideMutation.variables?.rideId ??
                                redispatchRideMutation.variables?.rideId ??
                                null
                              : null
                          }
                        />
                      </TabsContent>
                      <TabsContent value="drivers" className="mt-0">
                        <AdminDriverList
                          drivers={filteredDrivers}
                          selectedId={selection?.type === "driver" ? selection.id : null}
                          onSelect={(driver) => setSelection({ type: "driver", id: driver.id })}
                          onOpenDetails={handleSelectDriver}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminRideDetailsSheet
        ride={rideDetails}
        open={rideSheetOpen}
        onOpenChange={setRideSheetOpen}
        onCancel={handleAdminCancelRide}
        onRedispatch={handleAdminRedispatchRide}
        onAssign={handleAdminAssignRide}
        availableDrivers={overview?.drivers ?? []}
        isCancelPending={cancelRideMutation.isPending}
        isRedispatchPending={redispatchRideMutation.isPending}
        isAssignPending={assignRideMutation.isPending}
      />
      <AdminDriverDetailsSheet
        driver={driverDetails}
        open={driverSheetOpen}
        onOpenChange={setDriverSheetOpen}
      />
    </div>
  );
}
