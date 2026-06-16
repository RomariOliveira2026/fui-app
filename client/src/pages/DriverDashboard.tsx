import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Star,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Car,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoDriverProfile, patchDemoDriverProfile, saveDemoDriverProfile, saveDemoDriverLocation, loadDemoDriverLocation } from "@/lib/demoDriver";
import {
  persistDemoRideFromServer,
  useDemoRideHydration,
} from "@/lib/useDemoRideHydration";
import { persistDemoOffersFromServer } from "@/lib/demoOfferStorage";
import { fuiBrand, fuiRoute, rideStatusLabels } from "@/lib/fuiTheme";
import { StatusBadge } from "@/components/fui/StatusBadge";
import StatusPanel from "@/components/fui/StatusPanel";
import ExternalNavigationButtons from "@/components/fui/ExternalNavigationButtons";
import { getDriverNavigationTarget } from "@/lib/navigationLinks";
import DriverEarningsSummaryCards from "@/components/driver/premium/DriverEarningsSummaryCards";
import DriverDailyGoalCard from "@/components/driver/premium/DriverDailyGoalCard";
import DriverDemandPanel from "@/components/driver/premium/DriverDemandPanel";
import DriverPremiumControls from "@/components/driver/premium/DriverPremiumControls";
import DriverStatementList from "@/components/driver/premium/DriverStatementList";
import UtilityProviderPanel from "@/components/utilities/provider/UtilityProviderPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck } from "lucide-react";
import {
  persistDemoDriverPremiumPrefs,
  useDemoDriverPremiumHydration,
} from "@/lib/useDemoDriverPremiumHydration";

export default function DriverDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useDemoRideHydration();

  // State for accept/reject dialogs (scheduled rides)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  // State for immediate ride accept dialog
  const [immediateAcceptDialogOpen, setImmediateAcceptDialogOpen] = useState(false);
  const [immediateSelectedRide, setImmediateSelectedRide] = useState<any>(null);
  const [immediateSelectedVehicleId, setImmediateSelectedVehicleId] = useState<string>("");
  const [driverView, setDriverView] = useState<"rides" | "utilities">("rides");

  const { data: driverProfile, isLoading: profileLoading } = trpc.driver.getMyProfile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useDemoDriverPremiumHydration(driverProfile?.id);

  const premiumQueriesEnabled = !!driverProfile && driverProfile.status === "approved";

  const { data: earningsSummary, isLoading: earningsLoading } =
    trpc.driverPremium.getEarningsSummary.useQuery(undefined, {
      enabled: premiumQueriesEnabled,
      refetchInterval: premiumQueriesEnabled ? 30_000 : false,
    });

  const { data: statement, isLoading: statementLoading } = trpc.driverPremium.getStatement.useQuery(
    undefined,
    {
      enabled: premiumQueriesEnabled,
      refetchInterval: premiumQueriesEnabled ? 30_000 : false,
    }
  );

  const { data: demandInsight, isLoading: demandLoading } =
    trpc.driverPremium.getDemandInsight.useQuery(undefined, {
      enabled: premiumQueriesEnabled,
      refetchInterval: premiumQueriesEnabled ? 60_000 : false,
    });

  const { data: premiumPrefs, refetch: refetchPrefs } = trpc.driverPremium.getPreferences.useQuery(
    undefined,
    { enabled: premiumQueriesEnabled }
  );

  const invalidateDriverPremium = useCallback(() => {
    utils.driverPremium.getEarningsSummary.invalidate();
    utils.driverPremium.getStatement.invalidate();
  }, [utils]);

  const updatePremiumPrefs = trpc.driverPremium.updatePreferences.useMutation({
    onSuccess: (data: import("@shared/driverPremium").DriverPremiumPreferences) => {
      persistDemoDriverPremiumPrefs(data);
      refetchPrefs();
      utils.driverPremium.getDemandInsight.invalidate();
      utils.ride.available.invalidate();
    },
  });

  const restoreDemoProfile = trpc.driver.createProfile.useMutation({
    onSuccess: (data) => {
      const profile = "profile" in data ? data.profile : null;
      if (profile) {
        saveDemoDriverProfile(profile);
        utils.driver.getMyProfile.setData(undefined, profile);
      }
    },
  });

  useEffect(() => {
    if (!isLocalDemoDev()) return;
    const stored = loadDemoDriverProfile();
    if (!stored) return;
    utils.driver.getMyProfile.setData(undefined, stored as never);
    if (!driverProfile && !restoreDemoProfile.isPending) {
      restoreDemoProfile.mutate({
        cpf: stored.cpf ?? undefined,
        cnh: stored.cnh ?? undefined,
        cnhImageUrl: stored.cnhImageUrl ?? undefined,
      });
    }
  }, [driverProfile, restoreDemoProfile.isPending, utils]);
  // Reporta posição do motorista para o dispatcher (demo + produção)
  useEffect(() => {
    if (!driverProfile?.isAvailable) return;

    const reportLocation = () => {
      const fallback = loadDemoDriverLocation() ?? { lat: "-10.6833", lng: "-37.4250" };

      if (!("geolocation" in navigator)) {
        updateDriverGlobalLocation.mutate(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateDriverGlobalLocation.mutate({
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
          });
        },
        () => {
          updateDriverGlobalLocation.mutate(fallback);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    };

    reportLocation();
    const interval = setInterval(reportLocation, 30000);
    return () => clearInterval(interval);
  }, [driverProfile?.isAvailable, driverProfile?.id]);
  const { data: activeRides } = trpc.ride.active.useQuery(undefined, {
    enabled: !!driverProfile,
    refetchInterval: 5000,
  });

  const updateLocation = trpc.ride.updateDriverLocation.useMutation();
  const updateDriverGlobalLocation = trpc.driver.updateLocation.useMutation({
    onSuccess: (_data, variables) => {
      if (isLocalDemoDev()) {
        saveDemoDriverLocation({ lat: variables.lat, lng: variables.lng });
      }
    },
  });
  const { data: stats, isLoading: statsLoading } = trpc.driver.getStats.useQuery(undefined, {
    enabled: !!driverProfile,
  });
  const prevRideCountRef = useRef<number | null>(null);
  const [newRideAlert, setNewRideAlert] = useState(false);

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  const { data: availableRides, isLoading: ridesLoading } = trpc.ride.available.useQuery(undefined, {
    enabled: !!driverProfile && !!driverProfile.isAvailable,
    refetchInterval: 5000,
  });

  const openAvailableRides = (availableRides ?? []).filter(
    (ride) => ride.status === "requested" && ride.driverId == null
  );

  const myActiveRides = (activeRides ?? []).filter(
    (ride) =>
      ride.driverId === driverProfile?.id &&
      (ride.status === "accepted" || ride.status === "in_progress")
  );

  useEffect(() => {
    if (!isLocalDemoDev() || !driverProfile?.isAvailable) return;
    void utils.ride.getDemoOffersSnapshot.fetch().then((snapshot) => {
      if (snapshot.offers.length > 0) {
        persistDemoOffersFromServer(snapshot.offers as never);
      }
    });
  }, [availableRides, driverProfile?.isAvailable, utils.ride.getDemoOffersSnapshot]);

  // Alert when new rides arrive
  useEffect(() => {
    const count = openAvailableRides.length;
    if (prevRideCountRef.current !== null && count > prevRideCountRef.current) {
      playAlertSound();
      setNewRideAlert(true);
      toast.success(`Nova corrida disponível! (${count} no total)`, { duration: 5000 });
      setTimeout(() => setNewRideAlert(false), 3000);
    }
    prevRideCountRef.current = count;
  }, [openAvailableRides, playAlertSound]);

  // Scheduled rides pending for this driver
  const { data: pendingScheduled, isLoading: scheduledLoading } =
    trpc.scheduling.getPendingForDriver.useQuery(undefined, {
      enabled: !!driverProfile && !!driverProfile.isAvailable,
      refetchInterval: 10000,
    });

  // Driver's vehicles for selection
  const { data: myVehicles } = trpc.vehicle.list.useQuery(undefined, {
    enabled: !!driverProfile,
  });

  const declineOffer = trpc.ride.declineOffer.useMutation({
    onSuccess: async (data) => {
      toast.success("Oferta recusada");
      utils.ride.available.invalidate();
      if (isLocalDemoDev() && data && "offers" in data && Array.isArray(data.offers)) {
        persistDemoOffersFromServer(data.offers as never);
      } else if (isLocalDemoDev()) {
        try {
          const snapshot = await utils.ride.getDemoOffersSnapshot.fetch();
          persistDemoOffersFromServer(snapshot.offers as never);
        } catch {
          // ignore
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao recusar oferta");
    },
  });

  const acceptImmediateRide = trpc.ride.accept.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Corrida aceita! Dirija-se ao passageiro.");
      setImmediateAcceptDialogOpen(false);
      setImmediateSelectedRide(null);
      setImmediateSelectedVehicleId("");
      utils.ride.available.invalidate();
      utils.ride.active.invalidate();
      if (isLocalDemoDev()) {
        try {
          const updated = await utils.ride.getById.fetch({ rideId: variables.rideId });
          persistDemoRideFromServer(updated);
          const snapshot = await utils.ride.getDemoOffersSnapshot.fetch();
          persistDemoOffersFromServer(snapshot.offers as never);
        } catch {
          // ignore
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aceitar corrida");
    },
  });

  const startRide = trpc.ride.start.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Corrida iniciada!");
      utils.ride.active.invalidate();
      if (isLocalDemoDev()) {
        try {
          const updated = await utils.ride.getById.fetch({ rideId: variables.rideId });
          persistDemoRideFromServer(updated);
        } catch {
          // ignore
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar corrida");
    },
  });

  const completeRide = trpc.ride.complete.useMutation({
    onSuccess: async (updated, variables) => {
      toast.success("Corrida concluída!");
      utils.ride.active.invalidate();
      utils.ride.available.invalidate();
      utils.ride.myRides.invalidate();
      utils.ride.myDrives.invalidate();
      utils.user.getRecentRides.invalidate();
      invalidateDriverPremium();

      if (isLocalDemoDev()) {
        if (updated && typeof updated === "object" && "id" in updated) {
          persistDemoRideFromServer(updated as import("../../../drizzle/schema").Ride);
          utils.ride.getById.setData({ rideId: variables.rideId }, updated as never);
        } else {
          try {
            const fetched = await utils.ride.getById.fetch({ rideId: variables.rideId });
            persistDemoRideFromServer(fetched);
          } catch {
            // ignore
          }
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao concluir corrida");
    },
  });

  const acceptScheduledRide = trpc.scheduling.acceptScheduledRide.useMutation({
    onSuccess: () => {
      toast.success("Corrida agendada aceita com sucesso!");
      setAcceptDialogOpen(false);
      setSelectedRide(null);
      setSelectedVehicleId("");
      utils.scheduling.getPendingForDriver.invalidate();
      utils.ride.active.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aceitar corrida");
    },
  });

  const rejectScheduledRide = trpc.scheduling.rejectScheduledRide.useMutation({
    onSuccess: () => {
      toast.success("Corrida recusada");
      setRejectDialogOpen(false);
      setSelectedRide(null);
      setRejectReason("");
      utils.scheduling.getPendingForDriver.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao recusar corrida");
    },
  });

  // Update driver location for active rides (produção — em demo a simulação roda no servidor)
  useEffect(() => {
    if (isLocalDemoDev()) return;

    if (!driverProfile || !activeRides || activeRides.length === 0) {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    const myActiveRide = activeRides.find(
      (r) => r.driverId === driverProfile.id && (r.status === "accepted" || r.status === "in_progress")
    );

    if (!myActiveRide) {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    const updateDriverLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation.mutate({
              rideId: myActiveRide.id,
              lat: position.coords.latitude.toString(),
              lng: position.coords.longitude.toString(),
            });
          },
          (error) => {
            console.error("Error getting location:", error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    };

    updateDriverLocation();
    locationIntervalRef.current = setInterval(updateDriverLocation, 10000);

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [driverProfile, activeRides, updateLocation]);

  const setAvailability = trpc.driver.setAvailability.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.isAvailable ? "Você está disponível!" : "Você está indisponível");
      if (isLocalDemoDev() && driverProfile) {
        patchDemoDriverProfile({ isAvailable: variables.isAvailable });
        utils.driver.getMyProfile.setData(undefined, {
          ...driverProfile,
          isAvailable: variables.isAvailable,
        } as never);
      }
      utils.driver.getMyProfile.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar disponibilidade");
    },
  });

  const handleImmediateAcceptClick = (ride: any) => {
    setImmediateSelectedRide(ride);
    // Auto-select matching vehicle if only one
    const matchingVehicles = (myVehicles || []).filter(
      (v) => v.type === ride.vehicleType && v.status === "active"
    );
    if (matchingVehicles.length === 1) {
      setImmediateSelectedVehicleId(String(matchingVehicles[0].id));
    } else {
      setImmediateSelectedVehicleId("");
    }
    setImmediateAcceptDialogOpen(true);
  };

  const confirmImmediateAccept = () => {
    if (!immediateSelectedRide || !immediateSelectedVehicleId) return;
    acceptImmediateRide.mutate({
      rideId: immediateSelectedRide.id,
      vehicleId: Number(immediateSelectedVehicleId),
    });
  };

  const handleImmediateDecline = (ride: { id: number }) => {
    declineOffer.mutate({ rideId: ride.id });
  };

  const handleAcceptClick = (ride: any) => {
    setSelectedRide(ride);
    // Auto-select matching vehicle if only one
    const matchingVehicles = (myVehicles || []).filter(
      (v) => v.type === ride.vehicleType && v.status === "active"
    );
    if (matchingVehicles.length === 1) {
      setSelectedVehicleId(String(matchingVehicles[0].id));
    } else {
      setSelectedVehicleId("");
    }
    setAcceptDialogOpen(true);
  };

  const handleRejectClick = (ride: any) => {
    setSelectedRide(ride);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const confirmAccept = () => {
    if (!selectedRide || !selectedVehicleId) return;
    acceptScheduledRide.mutate({
      rideId: selectedRide.id,
      vehicleId: Number(selectedVehicleId),
    });
  };

  const confirmReject = () => {
    if (!selectedRide) return;
    rejectScheduledRide.mutate({
      rideId: selectedRide.id,
      reason: rejectReason || undefined,
    });
  };

  const formatScheduledDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatScheduledTime = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      moto: "Moto",
      carro: "Carro",
      van: "Van",
      utilitario: "Utilitário",
    };
    return labels[type] || type;
  };

  if (profileLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Perfil de Motorista Necessário</CardTitle>
            <CardDescription>
              Você precisa criar um perfil de motorista para acessar este painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/driver/register")} className="w-full">
              Criar Perfil de Motorista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (driverProfile.status !== "approved") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Perfil em Análise</CardTitle>
            <CardDescription>
              Seu perfil de motorista está sendo analisado. Aguarde a aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <StatusBadge variant="warning">Status: {driverProfile.status}</StatusBadge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchingVehiclesForSelected = selectedRide
    ? (myVehicles || []).filter(
        (v) => v.type === selectedRide.vehicleType && v.status === "active"
      )
    : [];

  const matchingVehiclesForImmediate = immediateSelectedRide
    ? (myVehicles || []).filter(
        (v) => v.type === immediateSelectedRide.vehicleType && v.status === "active"
      )
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Painel do Motorista" />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel do Motorista</h1>
            <p className="text-muted-foreground">
              {driverView === "rides"
                ? "Gerencie suas corridas e ganhos"
                : "Fretes, mudanças e utilitários"}
            </p>
          </div>
          {driverProfile.status === "approved" ? (
            <Tabs
              value={driverView}
              onValueChange={(v) => setDriverView(v as "rides" | "utilities")}
            >
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="rides" className="gap-1.5">
                  <Car className="h-4 w-4" />
                  Corridas
                </TabsTrigger>
                <TabsTrigger value="utilities" className="gap-1.5">
                  <Truck className="h-4 w-4" />
                  Utilitários
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>

        {driverView === "utilities" && driverProfile.status === "approved" ? (
          <UtilityProviderPanel driverProfileId={driverProfile.id} />
        ) : (
          <>

        {/* Availability Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="availability" className="text-lg font-semibold">
                  Disponibilidade
                </Label>
                <p className="text-sm text-muted-foreground">
                  {driverProfile.isAvailable
                    ? premiumPrefs?.smartPause
                      ? "Online — em pausa inteligente (sem novas ofertas)"
                      : "Você está disponível para aceitar corridas"
                    : "Você está indisponível"}
                </p>
              </div>
              <Switch
                id="availability"
                checked={driverProfile.isAvailable || false}
                onCheckedChange={(checked) => setAvailability.mutate({ isAvailable: checked })}
                disabled={setAvailability.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Ganhos & operação</h2>
          <p className="text-sm text-muted-foreground">
            Resumo financeiro, meta diária e inteligência de demanda
          </p>
        </div>

        <DriverEarningsSummaryCards summary={earningsSummary} isLoading={earningsLoading} />

        <DriverDailyGoalCard
          earnedTodayCents={earningsSummary?.todayTotalCents ?? 0}
          goalCents={premiumPrefs?.dailyGoalCents ?? 15_000}
          onGoalChange={(dailyGoalCents) =>
            updatePremiumPrefs.mutate({ dailyGoalCents })
          }
        />

        <DriverDemandPanel insight={demandInsight} isLoading={demandLoading} />

        <DriverPremiumControls
          preferences={premiumPrefs}
          isAvailable={!!driverProfile.isAvailable}
          onUpdate={(patch) => updatePremiumPrefs.mutate(patch)}
          isUpdating={updatePremiumPrefs.isPending}
        />

        <DriverStatementList items={statement} isLoading={statementLoading} />

        {/* Active Rides (driver) */}
        {myActiveRides.length > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Corrida Ativa
              </CardTitle>
              <CardDescription>Gerencie a corrida em andamento e abra a navegação externa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myActiveRides.map((ride) => {
                const navTarget = getDriverNavigationTarget(ride);
                const statusLabel = rideStatusLabels[ride.status] ?? ride.status;

                return (
                  <Card key={ride.id} className="fui-ride-card">
                    <CardContent className="pt-5 pb-4 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <StatusBadge variant={ride.status === "in_progress" ? "success" : "info"}>
                          {statusLabel}
                        </StatusBadge>
                        <span className={`text-lg font-bold ${fuiBrand.text}`}>
                          R$ {((ride.estimatedPrice || 0) / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className={`h-4 w-4 mt-0.5 ${fuiRoute.originIcon}`} />
                          <p className="text-sm">{ride.originAddress}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className={`h-4 w-4 mt-0.5 ${fuiRoute.destinationIcon}`} />
                          <p className="text-sm">{ride.destinationAddress}</p>
                        </div>
                      </div>

                      <ExternalNavigationButtons target={navTarget} />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/ride/${ride.id}`)}
                        >
                          Ver detalhes
                        </Button>
                        {ride.status === "accepted" && (
                          <Button
                            size="sm"
                            className={fuiBrand.btn}
                            disabled={startRide.isPending}
                            onClick={() => startRide.mutate({ rideId: ride.id })}
                          >
                            {startRide.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Iniciar corrida
                          </Button>
                        )}
                        {(ride.status === "in_progress" || ride.status === "accepted") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-400"
                            disabled={completeRide.isPending}
                            onClick={() =>
                              completeRide.mutate({
                                rideId: ride.id,
                                finalPrice: ride.estimatedPrice ?? 0,
                              })
                            }
                          >
                            {completeRide.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Concluir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}

        {stats ? (
          <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <Star className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                  <p className="text-lg font-bold">{stats.rating ? stats.rating.toFixed(2) : "—"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <Car className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Total corridas</p>
                  <p className="text-lg font-bold">{stats.totalRides}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Scheduled Rides Pending */}
        {driverProfile.isAvailable && pendingScheduled && pendingScheduled.length > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Corridas Agendadas Pendentes</CardTitle>
              </div>
              <CardDescription>
                Corridas agendadas por passageiros aguardando sua confirmação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingScheduled.map((ride) => (
                  <Card key={ride.id} className="fui-ride-card">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Ride Info */}
                        <div className="flex-1 space-y-3">
                          {/* Passenger & Schedule */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{ride.passengerName}</span>
                            </div>
                            <StatusBadge variant="brand">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatScheduledDate(ride.scheduledFor)}
                            </StatusBadge>
                            <StatusBadge variant="info">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatScheduledTime(ride.scheduledFor)}
                            </StatusBadge>
                          </div>

                          {/* Origin & Destination */}
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${fuiRoute.originIcon}`} />
                              <div>
                                <p className="text-xs text-muted-foreground">Origem</p>
                                <p className="text-sm">{ride.originAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Navigation className={`w-4 h-4 mt-0.5 shrink-0 ${fuiRoute.destinationIcon}`} />
                              <div>
                                <p className="text-xs text-muted-foreground">Destino</p>
                                <p className="text-sm">{ride.destinationAddress}</p>
                              </div>
                            </div>
                          </div>

                          {/* Details Row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className="capitalize">
                              <Car className="h-3 w-3 mr-1" />
                              {getVehicleTypeLabel(ride.vehicleType)}
                            </Badge>
                            {ride.distance && (
                              <span className="text-xs text-muted-foreground">
                                {(ride.distance / 1000).toFixed(1)} km
                              </span>
                            )}
                            {"offerDistanceMeters" in ride &&
                              typeof ride.offerDistanceMeters === "number" && (
                                <span className="text-xs text-muted-foreground">
                                  ~{(ride.offerDistanceMeters / 1000).toFixed(1)} km até origem
                                </span>
                              )}
                            {ride.duration && (
                              <span className="text-xs text-muted-foreground">
                                ~{Math.round(ride.duration / 60)} min
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                          <div className="text-right">
                            <p className={`text-xl font-bold ${fuiBrand.text}`}>
                              R$ {((ride.estimatedPrice || 0) / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {ride.paymentMethod === "cash"
                                ? "Dinheiro"
                                : ride.paymentMethod === "pix"
                                ? "PIX"
                                : "Cartão"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleRejectClick(ride)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              className={fuiBrand.btn}
                              onClick={() => handleAcceptClick(ride)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Rides (instant) */}
        {driverProfile.isAvailable && (
          <Card className={`mb-6 transition-all duration-500 ${newRideAlert ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Corridas Disponíveis
                    {newRideAlert && (
                      <StatusBadge variant="brand">Nova!</StatusBadge>
                    )}
                    {openAvailableRides.length > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                        {openAvailableRides.length}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Corridas próximas aguardando motorista</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ridesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : openAvailableRides.length > 0 ? (
                <div className="space-y-3">
                  {openAvailableRides.map((ride) => (
                    <Card key={ride.id} className="fui-ride-card">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className={`w-4 h-4 mt-1 ${fuiRoute.originIcon}`} />
                              <div>
                                <p className="text-xs text-muted-foreground">Origem</p>
                                <p className="text-sm font-medium">{ride.originAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Navigation className={`w-4 h-4 mt-1 ${fuiRoute.destinationIcon}`} />
                              <div>
                                <p className="text-xs text-muted-foreground">Destino</p>
                                <p className="text-sm font-medium">{ride.destinationAddress}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${fuiBrand.text}`}>
                              R$ {((ride.estimatedPrice || 0) / 100).toFixed(2)}
                            </p>
                            <Badge className="mt-1">{getVehicleTypeLabel(ride.vehicleType)}</Badge>
                            <div className="flex flex-col items-end gap-0.5 mt-1">
                              {"offerRound" in ride && typeof ride.offerRound === "number" && (
                                <span className="text-[11px] text-primary/90 font-medium">
                                  Rodada {ride.offerRound}
                                </span>
                              )}
                              {"offerDistanceMeters" in ride &&
                                typeof ride.offerDistanceMeters === "number" && (
                                  <p className="text-xs text-muted-foreground">
                                    ~{(ride.offerDistanceMeters / 1000).toFixed(1)} km até origem
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            size="sm"
                            disabled={declineOffer.isPending}
                            onClick={() => handleImmediateDecline(ride)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Recusar
                          </Button>
                          <Button
                            onClick={() => handleImmediateAcceptClick(ride)}
                            className={`flex-1 ${fuiBrand.btn}`}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aceitar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma corrida disponível no momento</p>
                  <p className="text-sm mt-1">Aguarde novas solicitações...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/driver/vehicles")}
            className="h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">Meus Veículos</p>
              <p className="text-xs text-muted-foreground">Gerenciar veículos cadastrados</p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/driver/history")}
            className="h-auto py-4"
          >
            <div className="text-left">
              <p className="font-semibold">Histórico de Corridas</p>
              <p className="text-xs text-muted-foreground">Ver todas as corridas realizadas</p>
            </div>
          </Button>
        </div>
          </>
        )}
      </div>

      {/* Immediate Ride Accept Dialog */}
      <Dialog open={immediateAcceptDialogOpen} onOpenChange={setImmediateAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Aceitar Corrida
            </DialogTitle>
            <DialogDescription>
              Selecione o veículo e confirme para aceitar esta corrida
            </DialogDescription>
          </DialogHeader>

          {immediateSelectedRide && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className={`h-4 w-4 mt-0.5 ${fuiRoute.originIcon}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <p className="text-sm font-medium">{immediateSelectedRide.originAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className={`h-4 w-4 mt-0.5 ${fuiRoute.destinationIcon}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Destino</p>
                    <p className="text-sm font-medium">{immediateSelectedRide.destinationAddress}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge>{getVehicleTypeLabel(immediateSelectedRide.vehicleType)}</Badge>
                  <span className={`text-lg font-bold ${fuiBrand.text}`}>
                    R$ {((immediateSelectedRide.estimatedPrice || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Selecione o veículo</Label>
                {matchingVehiclesForImmediate.length === 0 ? (
                  <StatusPanel
                    variant="danger"
                    compact
                    icon={<AlertCircle className="h-4 w-4" />}
                    title={
                      <>
                        Você não tem um veículo do tipo{" "}
                        <strong>{getVehicleTypeLabel(immediateSelectedRide.vehicleType)}</strong> ativo.
                      </>
                    }
                    description="Cadastre um veículo primeiro."
                  />
                ) : (
                  <Select value={immediateSelectedVehicleId} onValueChange={setImmediateSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchingVehiclesForImmediate.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.brand} {v.model} - {v.plate} ({v.color})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImmediateAcceptDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className={fuiBrand.btn}
              onClick={confirmImmediateAccept}
              disabled={
                !immediateSelectedVehicleId ||
                matchingVehiclesForImmediate.length === 0 ||
                acceptImmediateRide.isPending
              }
            >
              {acceptImmediateRide.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar e Aceitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Aceitar Corrida Agendada
            </DialogTitle>
            <DialogDescription>
              Confirme que você estará disponível para esta corrida
            </DialogDescription>
          </DialogHeader>

          {selectedRide && (
            <div className="space-y-4">
              {/* Ride Summary */}
              <div className="bg-card rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedRide.passengerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {formatScheduledDate(selectedRide.scheduledFor)} às{" "}
                    {formatScheduledTime(selectedRide.scheduledFor)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className={`h-4 w-4 mt-0.5 ${fuiRoute.originIcon}`} />
                  <span className="text-sm">{selectedRide.originAddress}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className={`h-4 w-4 mt-0.5 ${fuiRoute.destinationIcon}`} />
                  <span className="text-sm">{selectedRide.destinationAddress}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge className="capitalize">
                    {getVehicleTypeLabel(selectedRide.vehicleType)}
                  </Badge>
                  <span className={`text-lg font-bold ${fuiBrand.text}`}>
                    R$ {((selectedRide.estimatedPrice || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label>Selecione o veículo</Label>
                {matchingVehiclesForSelected.length === 0 ? (
                  <StatusPanel
                    variant="danger"
                    compact
                    icon={<AlertCircle className="h-4 w-4" />}
                    title={
                      <>
                        Você não tem um veículo do tipo{" "}
                        <strong>{getVehicleTypeLabel(selectedRide.vehicleType)}</strong> ativo.
                      </>
                    }
                    description="Cadastre um veículo primeiro."
                  />
                ) : (
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchingVehiclesForSelected.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.brand} {v.model} - {v.plate} ({v.color})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className={fuiBrand.btn}
              onClick={confirmAccept}
              disabled={
                !selectedVehicleId ||
                matchingVehiclesForSelected.length === 0 ||
                acceptScheduledRide.isPending
              }
            >
              {acceptScheduledRide.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Aceitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Recusar Corrida Agendada
            </DialogTitle>
            <DialogDescription>
              A corrida continuará disponível para outros motoristas
            </DialogDescription>
          </DialogHeader>

          {selectedRide && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {formatScheduledDate(selectedRide.scheduledFor)} às{" "}
                    {formatScheduledTime(selectedRide.scheduledFor)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className={`h-4 w-4 mt-0.5 ${fuiRoute.originIcon}`} />
                  <span className="text-sm">{selectedRide.originAddress}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className={`h-4 w-4 mt-0.5 ${fuiRoute.destinationIcon}`} />
                  <span className="text-sm">{selectedRide.destinationAddress}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Textarea
                  placeholder="Ex: Não estarei disponível neste horário..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectScheduledRide.isPending}
            >
              {rejectScheduledRide.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
