import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UtilityOrder } from "@shared/utilities";
import { UTILITY_SERVICE_LABELS, UTILITY_VEHICLE_LABELS } from "@shared/utilities";
import { MapPin, Truck, Users, Zap } from "lucide-react";

type Props = {
  order: UtilityOrder;
  onAccept?: () => void;
  onDecline?: () => void;
  onOpen?: () => void;
  acceptPending?: boolean;
  mode: "available" | "active";
};

export default function UtilityProviderOrderCard({
  order,
  onAccept,
  onDecline,
  onOpen,
  acceptPending,
  mode,
}: Props) {
  const distanceKm = order.distance ? (order.distance / 1000).toFixed(1) : "—";

  return (
    <Card
      className="border-border/70 hover:border-primary/25 transition-colors cursor-pointer"
      onClick={onOpen}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">
              {UTILITY_SERVICE_LABELS[order.serviceType]}
            </p>
            <p className="text-lg font-bold text-primary mt-0.5">
              R$ {((order.estimatedPrice ?? 0) / 100).toFixed(2)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {order.extras.isUrgent ? (
              <Badge variant="outline" className="text-orange-400 border-orange-400/40">
                <Zap className="w-3 h-3 mr-1" />
                Urgente
              </Badge>
            ) : null}
            {order.extras.needsHelper ? (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {order.extras.helperCount ?? 1} ajud.
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-xs">
              <Truck className="w-3 h-3 mr-1" />
              {UTILITY_VEHICLE_LABELS[order.vehicleType]}
            </Badge>
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/80" />
            <span className="line-clamp-1">{order.originAddress}</span>
          </div>
          <div className="flex gap-2 pl-5">
            <span className="line-clamp-1">→ {order.destinationAddress}</span>
          </div>
          <p>{distanceKm} km · {order.cargo.itemType || order.cargo.description || "Carga"}</p>
          {order.extras.notes ? (
            <p className="italic line-clamp-2">{order.extras.notes}</p>
          ) : null}
        </div>

        {order.cargo.photoUrls?.[0] ? (
          <img
            src={order.cargo.photoUrls[0]}
            alt="Carga"
            className="h-20 w-full rounded-lg object-cover border border-border"
            onClick={(e) => e.stopPropagation()}
          />
        ) : null}

        {mode === "available" ? (
          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="flex-1"
              onClick={onAccept}
              disabled={acceptPending}
            >
              Aceitar
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={onDecline}>
              Recusar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
