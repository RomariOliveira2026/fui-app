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
  ArrowLeft,
  Car,
  Bike,
  Truck,
  Package,
  CheckCircle2,
  Search,
  UserCheck,
  Repeat,
} from "lucide-react";
import { formatRecurrenceLabel } from "@shared/passengerPremium";
import { useDemoRecurringHydration } from "@/lib/useDemoRecurringHydration";
import { syncDemoRecurringSchedulesFromServer } from "@/lib/demoRecurringStorage";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
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

  const { data: scheduledRides, isLoading } = trpc.scheduling.getScheduledRides.useQuery();
  const { data: recurringSchedules } = trpc.scheduling.getRecurringSchedules.useQuery();

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
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Faça login para ver suas corridas agendadas</p>
            <Button onClick={() => setLocation("/")} className="bg-[#F39200] hover:bg-[#D46A03]">
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
    <div className="min-h-screen bg-background">
      <AppHeader title="Corridas Agendadas" />

      <div className="container max-w-2xl py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Corridas Agendadas</h1>
            <p className="text-muted-foreground text-sm">
              {scheduledRides?.length || 0} corrida{(scheduledRides?.length || 0) !== 1 ? "s" : ""}{" "}
              agendada{(scheduledRides?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {(!scheduledRides || scheduledRides.length === 0) && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <CalendarIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma corrida agendada
              </h3>
              <p className="text-muted-foreground mb-6">
                Agende uma corrida para um horário futuro e ela aparecerá aqui.
              </p>
              <Button
                onClick={() => setLocation("/request-ride")}
                className="bg-[#F39200] hover:bg-[#D46A03]"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Agendar Corrida
              </Button>
            </CardContent>
          </Card>
        )}

        {recurringSchedules && recurringSchedules.length > 0 ? (
          <Card className="mb-4 border-primary/20">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Repeat className="h-4 w-4 text-[#F39200]" />
                Séries recorrentes (demo)
              </div>
              {recurringSchedules.map((series) => (
                <div
                  key={series.id}
                  className="text-xs text-muted-foreground border-t border-border pt-2 first:border-0 first:pt-0"
                >
                  {formatRecurrenceLabel(series.recurrenceRule)} às {series.timeOfDay} —{" "}
                  {series.template.originAddress} → {series.template.destinationAddress}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Scheduled Rides List */}
        <div className="space-y-4">
          {scheduledRides?.map((ride: any) => {
            const VehicleIcon = vehicleIcons[ride.vehicleType] || Car;
            const scheduledDate = new Date(ride.scheduledFor);
            const isPast = scheduledDate < new Date();
            const isCancelled = ride.status === "cancelled";
            const isAccepted = ride.status === "accepted" && ride.driverId;

            return (
              <Card
                key={ride.id}
                className={`${isPast || isCancelled ? "opacity-60" : ""} ${
                  isAccepted ? "border-green-500/30" : ""
                }`}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAccepted
                            ? "bg-green-500/10"
                            : "bg-[#F39200]/10"
                        }`}
                      >
                        {isAccepted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <VehicleIcon className="w-5 h-5 text-[#F39200]" />
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
                      <p className="text-lg font-bold text-[#F39200]">
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
                      <MapPin className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground line-clamp-1">{ride.originAddress}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground line-clamp-1">
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
          <div className="mt-6 text-center">
            <Button
              onClick={() => setLocation("/request-ride")}
              className="bg-[#F39200] hover:bg-[#D46A03]"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Agendar Nova Corrida
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
