import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Clock, DollarSign, Shield } from "lucide-react";
import { GoogleMapView, createGoogleMarker } from "@/components/GoogleMap";
import { isDemoMap, type DemoMapHandle } from "@/lib/demoMapFallback";

export default function LiveTracking() {
  const [, params] = useRoute("/track/:shareToken");
  const shareToken = params?.shareToken || "";

  const { data: ride, isLoading, error } = trpc.safety.getSharedRide.useQuery(
    { shareToken },
    {
      enabled: !!shareToken,
      refetchInterval: 5000,
    }
  );

  const mapRef = useRef<google.maps.Map | DemoMapHandle | null>(null);
  const driverMarkerRef = useRef<{ setMap: (map: unknown) => void; setPosition?: (pos: { lat: number; lng: number }) => void } | google.maps.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && ride) {
      if (ride.driverCurrentLat && ride.driverCurrentLng) {
        const driverPos = {
          lat: parseFloat(ride.driverCurrentLat),
          lng: parseFloat(ride.driverCurrentLng),
        };

        if (driverMarkerRef.current?.setPosition) {
          driverMarkerRef.current.setPosition(driverPos);
        } else if (!driverMarkerRef.current && mapRef.current) {
          driverMarkerRef.current = createGoogleMarker(
            mapRef.current,
            driverPos,
            { color: "#EF4444", label: "D", title: "Motorista" }
          ) as google.maps.Marker;
        }

        if (mapRef.current) {
          if (isDemoMap(mapRef.current)) {
            mapRef.current.setCenter(driverPos);
          } else {
            mapRef.current.panTo(driverPos);
          }
        }
      }
    }
  }, [ride]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200]"></div>
            <p className="text-muted-foreground">Carregando rastreamento...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <Shield className="w-16 h-16 text-[#F39200]" />
            <h1 className="text-2xl font-bold text-foreground">Corrida não encontrada</h1>
            <p className="text-muted-foreground">
              O link de rastreamento pode estar incorreto ou a corrida já foi finalizada.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    requested: "Aguardando Motorista",
    accepted: "Motorista a Caminho",
    in_progress: "Em Andamento",
    completed: "Finalizada",
    cancelled: "Cancelada",
  };

  const statusColors: Record<string, string> = {
    requested: "bg-yellow-900/30 text-yellow-400",
    accepted: "bg-blue-900/30 text-blue-400",
    in_progress: "bg-green-900/30 text-green-400",
    completed: "bg-gray-900/30 text-gray-400",
    cancelled: "bg-red-900/30 text-red-400",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F39200]/20 rounded-full">
              <Shield className="w-6 h-6 text-[#F39200]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Rastreamento ao Vivo</h1>
              <p className="text-sm text-muted-foreground">Acompanhe a corrida em tempo real</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden h-[500px]">
              <GoogleMapView
                onMapReady={(map) => { mapRef.current = map; }}
                initialCenter={{ lat: -10.6847, lng: -37.4250 }}
                initialZoom={14}
                darkMode={true}
                className="h-full !rounded-none"
              />
            </Card>
          </div>

          {/* Ride Info */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[ride.status]}`}>
                  {statusLabels[ride.status]}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Corrida #{ride.id}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Rota</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="p-2 bg-green-900/30 rounded-full h-fit">
                    <MapPin className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Origem</p>
                    <p className="text-sm font-medium text-foreground">{ride.originAddress}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="p-2 bg-red-900/30 rounded-full h-fit">
                    <Navigation className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Destino</p>
                    <p className="text-sm font-medium text-foreground">{ride.destinationAddress}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Detalhes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Preço Estimado</span>
                  </div>
                  <span className="font-semibold text-[#F39200]">
                    R$ {((ride.estimatedPrice || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Solicitada em</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(ride.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-[#F39200]/10 border-[#F39200]/30">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-[#F39200] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#F39200] mb-1">Rastreamento Seguro</h4>
                  <p className="text-xs text-muted-foreground">
                    Esta página é atualizada automaticamente a cada 5 segundos com a localização do motorista.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
