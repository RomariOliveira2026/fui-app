import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import UtilityStatusBanner from "@/components/utilities/UtilityStatusBanner";
import UtilityStatusStepper from "@/components/utilities/UtilityStatusStepper";
import UtilityTrackingMap from "@/components/utilities/UtilityTrackingMap";
import UtilityChatPanel from "@/components/utilities/UtilityChatPanel";
import type { UtilityOrder } from "@shared/utilities";
import {
  UTILITY_SERVICE_LABELS,
  UTILITY_VEHICLE_LABELS,
} from "@shared/utilities";
import { shouldShowUtilityDriverOnMap } from "@shared/utilityTracking";
import { Loader2, MapPin, Package } from "lucide-react";

type Props = {
  order: UtilityOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvance?: () => void;
  advancePending?: boolean;
  canAdvance?: boolean;
};

export default function UtilityProviderOrderSheet({
  order,
  open,
  onOpenChange,
  onAdvance,
  advancePending,
  canAdvance,
}: Props) {
  if (!order) return null;

  const showTracking = shouldShowUtilityDriverOnMap(order.status, order.driverId);
  const chatEnabled = !!order.driverId && order.status !== "cancelled";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>{UTILITY_SERVICE_LABELS[order.serviceType]}</SheetTitle>
          <p className="text-sm text-muted-foreground font-mono">
            {order.utilityMeta.trackingCode}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-2xl font-bold text-primary">
              R$ {((order.estimatedPrice ?? 0) / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Estimado · líquido ~85%</p>
          </div>

          <UtilityStatusBanner
            status={order.status}
            driverId={order.driverId}
            distance={order.distance}
          />

          {showTracking ? (
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
          ) : null}

          <UtilityStatusStepper status={order.status} variant="compact" />

          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p>{order.originAddress}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Destino</p>
                <p>{order.destinationAddress}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
            <p className="font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Carga
            </p>
            {order.cargo.itemType ? <p>{order.cargo.itemType}</p> : null}
            {order.cargo.description ? <p className="text-muted-foreground">{order.cargo.description}</p> : null}
            {order.cargo.estimatedWeightKg ? <p>Peso: {order.cargo.estimatedWeightKg} kg</p> : null}
            {order.extras.needsHelper ? (
              <p>Ajudantes: {order.extras.helperCount ?? 1}</p>
            ) : null}
            <p>{UTILITY_VEHICLE_LABELS[order.vehicleType]}</p>
            {order.extras.notes ? (
              <p className="text-muted-foreground italic">{order.extras.notes}</p>
            ) : null}
          </div>

          {order.cargo.photoUrls?.[0] ? (
            <img
              src={order.cargo.photoUrls[0]}
              alt="Carga"
              className="w-full h-40 rounded-lg object-cover border border-border"
            />
          ) : null}

          {chatEnabled ? (
            <UtilityChatPanel
              orderId={order.id}
              enabled={chatEnabled}
              otherPartyLabel="Cliente"
              compact
            />
          ) : null}

          {canAdvance && order.status !== "completed" && order.status !== "cancelled" ? (
            <Button className="w-full" onClick={onAdvance} disabled={advancePending}>
              {advancePending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Avançar status
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
