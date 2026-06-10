import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import AppHeader from "@/components/AppHeader";
import UtilityStatusBanner from "@/components/utilities/UtilityStatusBanner";
import UtilityStatusStepper from "@/components/utilities/UtilityStatusStepper";
import UtilityTrackingMap from "@/components/utilities/UtilityTrackingMap";
import UtilityChatPanel from "@/components/utilities/UtilityChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  persistDemoUtilityFromServer,
  useDemoUtilitiesHydration,
} from "@/lib/useDemoUtilitiesHydration";
import { useDemoUtilityChatHydration } from "@/lib/useDemoUtilityChatHydration";
import {
  UTILITY_SERVICE_LABELS,
  UTILITY_VEHICLE_LABELS,
} from "@shared/utilities";
import { shouldShowUtilityDriverOnMap } from "@shared/utilityTracking";
import { Loader2, MapPin, Package, Truck, XCircle } from "lucide-react";

export default function UtilityDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/utilities/:id");
  const orderId = Number(params?.id);

  useDemoUtilitiesHydration();
  useDemoUtilityChatHydration();
  const utils = trpc.useUtils();

  const { data: order, isLoading, refetch } = trpc.utilities.getById.useQuery(
    { id: orderId },
    {
      enabled: !!user && Number.isFinite(orderId) && orderId > 0,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        if (["completed", "cancelled"].includes(data.status)) return false;
        if (shouldShowUtilityDriverOnMap(data.status, data.driverId)) return 3000;
        return 8000;
      },
    }
  );

  const cancelMutation = trpc.utilities.cancel.useMutation({
    onSuccess: async () => {
      toast.success("Pedido cancelado");
      await refetch();
      if (isLocalDemoDev()) {
        const updated = await utils.utilities.getById.fetch({ id: orderId });
        persistDemoUtilityFromServer(updated);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const advanceMutation = trpc.utilities.advanceDemoStatus.useMutation({
    onSuccess: async () => {
      toast.success("Status atualizado (demo)");
      await refetch();
      if (isLocalDemoDev()) {
        const updated = await utils.utilities.getById.fetch({ id: orderId });
        persistDemoUtilityFromServer(updated);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !order) {
    navigate("/utilities");
    return null;
  }

  const canCancel = !["completed", "cancelled"].includes(order.status);
  const chatEnabled = !!order.driverId && order.status !== "cancelled";
  const showTracking = shouldShowUtilityDriverOnMap(order.status, order.driverId);

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader title="Detalhes do Utilitário" />

      <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
          <CardContent className="pt-5">
            <p className="text-xs text-primary font-medium uppercase tracking-wider">
              {UTILITY_SERVICE_LABELS[order.serviceType]}
            </p>
            <p className="text-2xl font-bold mt-1">
              R$ {((order.finalPrice ?? order.estimatedPrice ?? 0) / 100).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {order.utilityMeta.trackingCode}
            </p>
          </CardContent>
        </Card>

        <UtilityStatusBanner
          status={order.status}
          driverId={order.driverId}
          distance={order.distance}
        />

        {(showTracking || order.status === "waiting_driver" || order.status === "requested") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rastreio</CardTitle>
            </CardHeader>
            <CardContent>
              <UtilityTrackingMap
                originLat={order.originLat}
                originLng={order.originLng}
                destinationLat={order.destinationLat}
                destinationLng={order.destinationLng}
                driverLat={order.driverCurrentLat}
                driverLng={order.driverCurrentLng}
                status={order.status}
                driverId={order.driverId}
                distance={order.distance}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <UtilityStatusStepper status={order.status} />
            {isLocalDemoDev() && order.status !== "completed" && order.status !== "cancelled" ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => advanceMutation.mutate({ id: orderId })}
                disabled={advanceMutation.isPending}
              >
                Avançar status (demo)
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <UtilityChatPanel
          orderId={orderId}
          enabled={chatEnabled}
          otherPartyLabel="Prestador"
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <p>{order.originAddress}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destino</p>
              <p>{order.destinationAddress}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Carga
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.cargo.itemType ? <p><span className="text-muted-foreground">Item:</span> {order.cargo.itemType}</p> : null}
            {order.cargo.description ? <p>{order.cargo.description}</p> : null}
            {order.cargo.estimatedWeightKg ? <p>Peso: {order.cargo.estimatedWeightKg} kg</p> : null}
            {order.cargo.photoUrls?.[0] ? (
              <img src={order.cargo.photoUrls[0]} alt="Carga" className="h-32 rounded-lg object-cover border border-border" />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Veículo & extras
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{UTILITY_VEHICLE_LABELS[order.vehicleType]}</p>
            {order.extras.needsHelper ? <p>Ajudantes: {order.extras.helperCount ?? 1}</p> : null}
            {order.extras.isUrgent ? <p className="text-orange-400">Urgente</p> : null}
            {order.extras.notes ? <p className="text-muted-foreground">{order.extras.notes}</p> : null}
          </CardContent>
        </Card>

        {canCancel ? (
          <Button
            variant="outline"
            className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => cancelMutation.mutate({ id: orderId })}
            disabled={cancelMutation.isPending}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar pedido
          </Button>
        ) : null}
      </div>
    </div>
  );
}
