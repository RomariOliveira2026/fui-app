import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CalendarIcon,
  MapPin,
  Navigation,
  Clock,
  X,
  Car,
  Bike,
  Truck,
  Package,
  CheckCircle2,
  Search,
  UserCheck,
  Repeat,
  CalendarClock,
} from "lucide-react";
import { formatRecurrenceLabel } from "@shared/passengerPremium";
import { useDemoRecurringHydration } from "@/lib/useDemoRecurringHydration";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { fuiBrand, fuiRoute } from "@/lib/fuiTheme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const vehicleIcons: Record<string, any> = {
  moto: Bike,
  carro: Car,
  van: Truck,
  utilitario: Package,
};

const vehicleLabels: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

export default function ScheduledRides() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  useDemoRecurringHydration();

  const { data: scheduledRides, isLoading } = trpc.scheduling.getScheduledRides.useQuery(
    undefined,
    { throwOnError: false, retry: 1 }
  );
  const { data: recurringSchedules } = trpc.scheduling.getRecurringSchedules.useQuery(undefined, {
    throwOnError: false,
    retry: 1,
  });

  const scheduleStats = useMemo(() => {
    const rides = scheduledRides ?? [];
    const now = Date.now();
    const upcoming = rides.filter(
      (r) =>
        r.status !== "cancelled" &&
        r.scheduledFor != null &&
        new Date(r.scheduledFor).getTime() >= now
    );
    const confirmed = upcoming.filter((r) => r.status === "accepted" && r.driverId);
    return {
      total: rides.length,
      upcoming: upcoming.length,
      confirmed: confirmed.length,
      recurring: recurringSchedules?.length ?? 0,
    };
  }, [scheduledRides, recurringSchedules]);

  const cancelMutation = trpc.scheduling.cancelScheduledRide.useMutation({
    onSuccess: () => {
      toast.success("Corrida agendada cancelada com sucesso");
      utils.scheduling.getScheduledRides.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cancelar corrida");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Faça login para ver suas corridas agendadas</p>
            <Button onClick={() => setLocation("/")} className={fuiBrand.btn}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (ride: any) => {
    const isPast = new Date(ride.scheduledFor) < new Date();

    if (ride.status === "cancelled") {
      return (
        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">
          <X className="w-3 h-3 mr-1" />
          Cancelada
        </Badge>
      );
    }

    if (ride.status === "accepted" && ride.driverId) {
      return (
        <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
          <UserCheck className="w-3 h-3 mr-1" />
          Motorista confirmado
        </Badge>
      );
    }

    if (isPast) {
      return (
        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">
          Expirada
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
        <Search className="w-3 h-3 mr-1" />
        Aguardando motorista
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Corridas Agendadas" />

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Corridas Agendadas</h1>
            <p className="text-muted-foreground mt-1">
              {scheduleStats.total} corrida{scheduleStats.total !== 1 ? "s" : ""} agendada
              {scheduleStats.total !== 1 ? "s" : ""}
              {scheduleStats.upcoming > 0
                ? ` · ${scheduleStats.upcoming} próxima${scheduleStats.upcoming !== 1 ? "s" : ""}`
                : ""}
            </p>
          </div>
          <Button onClick={() => setLocation("/request-ride")} className={fuiBrand.btn}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Agendar Corrida
          </Button>
        </div>

        {(scheduleStats.total > 0 || scheduleStats.recurring > 0) && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <FuiMetricCard
              label="Total agendadas"
              value={String(scheduleStats.total)}
              icon={CalendarIcon}
            />
            <FuiMetricCard
              label="Próximas"
              value={String(scheduleStats.upcoming)}
              sub="Ainda não realizadas"
              icon={CalendarClock}
              highlight
            />
            <FuiMetricCard
              label="Motorista confirmado"
              value={String(scheduleStats.confirmed)}
              icon={UserCheck}
            />
            <FuiMetricCard
              label="Séries recorrentes"
              value={String(scheduleStats.recurring)}
              sub="Demo local"
              icon={Repeat}
            />
          </div>
        )}

        {/* Empty State */}
        {(!scheduledRides || scheduledRides.length === 0) && (
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-[1fr_1.2fr] lg:items-center">
                <div className="flex flex-col items-center justify-center px-6 py-12 lg:py-16 lg:border-r border-border">
                  <CalendarIcon className="w-20 h-20 text-muted-foreground/40 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
                    Nenhuma corrida agendada
                  </h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Agende uma corrida para um horário futuro e ela aparecerá aqui.
                  </p>
                </div>
                <div className="px-6 py-10 lg:py-16 space-y-4 bg-muted/20">
                  <p className="text-sm font-medium text-foreground">Como funciona</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className={fuiBrand.text}>1.</span>
                      Escolha origem e destino na solicitação de corrida
                    </li>
                    <li className="flex gap-2">
                      <span className={fuiBrand.text}>2.</span>
                      Toque em <strong className="text-foreground">Agendar</strong> e defina data e hora
                    </li>
                    <li className="flex gap-2">
                      <span className={fuiBrand.text}>3.</span>
                      Acompanhe confirmações e cancelamentos nesta tela
                    </li>
                  </ul>
                  <Button
                    onClick={() => setLocation("/request-ride")}
                    className={`${fuiBrand.btn} w-full sm:w-auto`}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Agendar Corrida
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recurringSchedules && recurringSchedules.length > 0 ? (
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Repeat className={`h-4 w-4 ${fuiBrand.text}`} />
                Séries recorrentes (demo)
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recurringSchedules.map((series) => (
                <div
                  key={series.id}
                  className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 p-3"
                >
                  {formatRecurrenceLabel(series.recurrenceRule)} às {series.timeOfDay} —{" "}
                  <span className="line-clamp-2">{series.template.originAddress} → {series.template.destinationAddress}</span>
                </div>
              ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Scheduled Rides List */}
        <div className="grid gap-4 lg:grid-cols-2">
          {scheduledRides?.map((ride: any) => {
            const VehicleIcon = vehicleIcons[ride.vehicleType] || Car;
            const scheduledDate = new Date(ride.scheduledFor);
            const isPast = scheduledDate < new Date();
            const isCancelled = ride.status === "cancelled";
            const isAccepted = ride.status === "accepted" && ride.driverId;

            return (
              <Card
                key={ride.id}
                className={`border-border bg-card ${isPast || isCancelled ? "opacity-60" : ""} ${
                  isAccepted ? "border-green-500/30" : ""
                }`}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAccepted ? "bg-green-500/10" : fuiBrand.bgSoft
                        }`}
                      >
                        {isAccepted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <VehicleIcon className={`w-5 h-5 ${fuiBrand.text}`} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {vehicleLabels[ride.vehicleType] || ride.vehicleType}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {scheduledDate.toLocaleDateString("pt-BR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                            {" às "}
                            {scheduledDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold tabular-nums ${fuiBrand.text}`}>
                        R$ {((ride.estimatedPrice || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {getStatusBadge(ride)}
                    {ride.passengerPremiumMeta?.recurrenceRule ? (
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        <Repeat className="w-3 h-3 mr-1" />
                        {formatRecurrenceLabel(ride.passengerPremiumMeta.recurrenceRule)}
                      </Badge>
                    ) : null}
                    {ride.passengerPremiumMeta?.bookedFor ? (
                      <Badge variant="outline" className="border-sky-500/30 text-sky-400">
                        Para: {ride.passengerPremiumMeta.bookedFor.name}
                      </Badge>
                    ) : null}
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${fuiRoute.originIcon}`} />
                      <p className="text-sm text-muted-foreground line-clamp-2">{ride.originAddress}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className={`w-4 h-4 mt-0.5 shrink-0 ${fuiRoute.destinationIcon}`} />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ride.destinationAddress}
                      </p>
                    </div>
                  </div>

                  {/* Distance & Duration */}
                  {ride.distance && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span>{(ride.distance / 1000).toFixed(1)} km</span>
                      <span>&bull;</span>
                      <span>{Math.round((ride.duration || 0) / 60)} min</span>
                      <span>&bull;</span>
                      <span className="capitalize">
                        {ride.paymentMethod === "cash"
                          ? "Dinheiro"
                          : ride.paymentMethod === "pix"
                          ? "PIX"
                          : "Cartão"}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {!isCancelled && !isPast && (
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancelar Corrida Agendada?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja cancelar esta corrida agendada para{" "}
                              {scheduledDate.toLocaleDateString("pt-BR")} às{" "}
                              {scheduledDate.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              ?
                              {isAccepted && (
                                <span className="block mt-2 text-yellow-400">
                                  Um motorista já confirmou esta corrida. Ele será notificado do
                                  cancelamento.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              Voltar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelMutation.mutate({ rideId: ride.id })}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sim, Cancelar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {scheduledRides && scheduledRides.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button onClick={() => setLocation("/request-ride")} className={fuiBrand.btn}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Agendar Nova Corrida
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
