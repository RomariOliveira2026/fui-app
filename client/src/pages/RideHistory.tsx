import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation, Calendar, RotateCcw } from "lucide-react";
import { repeatRide } from "@/lib/ridePrefill";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { useDemoRideHydration } from "@/lib/useDemoRideHydration";
import { fuiBrand } from "@/lib/fuiTheme";

const statusLabels: Record<string, string> = {
  requested: "Solicitada",
  accepted: "Aceita",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  requested: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  accepted: "bg-sky-500/10 text-sky-400 border-sky-500/25",
  in_progress: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  completed: "bg-muted text-foreground border-border",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/25",
};

export default function RideHistory() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const isDriverHistory = location.startsWith("/driver/history");

  useDemoRideHydration();

  const {
    data: passengerRides,
    isLoading: passengerLoading,
  } = trpc.ride.myRides.useQuery(undefined, {
    enabled: !!user && !isDriverHistory,
  });

  const {
    data: driverRides,
    isLoading: driverLoading,
  } = trpc.ride.myDrives.useQuery(undefined, {
    enabled: !!user && isDriverHistory,
    retry: false,
  });

  const rides = isDriverHistory ? driverRides : passengerRides;
  const isLoading = isDriverHistory ? driverLoading : passengerLoading;

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title={pageTitle} />
      <div className="container max-w-4xl mx-auto py-8 p-4">
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
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
          <div className="space-y-4">
            {rides.map((ride) => (
              <Card
                key={ride.id}
                className="hover:shadow-lg transition-shadow border-border bg-card"
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <CardTitle className="text-lg">Corrida #{ride.id}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(
                          ride.completedAt ?? ride.createdAt
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={statusColors[ride.status] ?? ""}>
                      {statusLabels[ride.status] ?? ride.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Origem</p>
                        <p className="text-sm truncate">{ride.originAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-rose-400 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Destino</p>
                        <p className="text-sm truncate">{ride.destinationAddress}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">
                          {ride.vehicleType}
                        </Badge>
                        {ride.distance ? (
                          <span className="text-sm text-muted-foreground">
                            {(ride.distance / 1000).toFixed(1)} km
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isDriverHistory && ride.status === "completed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              repeatRide(ride, setLocation);
                            }}
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Repetir
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/ride/${ride.id}`)}
                        >
                          Ver detalhes
                        </Button>
                        <p className={`text-lg font-bold ${fuiBrand.text}`}>
                          R$ {((ride.finalPrice || ride.estimatedPrice || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
