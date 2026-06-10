import { useEffect, useMemo, useState } from "react";
import { RequestRideMap } from "@/components/RequestRideMap";
import { trpc } from "@/lib/trpc";
import {
  getUtilityTrackingPresentation,
  parseUtilityMapPoint,
  resolveUtilityTrackingPhase,
  shouldShowUtilityDriverOnMap,
} from "@shared/utilityTracking";
import type { UtilityOrderStatus } from "@shared/utilities";
import { cn } from "@/lib/utils";

type MapPoint = { lat: number; lng: number };

type Props = {
  originLat: string;
  originLng: string;
  destinationLat: string;
  destinationLng: string;
  driverLat?: string | null;
  driverLng?: string | null;
  status: UtilityOrderStatus;
  driverId?: number | null;
  distance?: number | null;
  className?: string;
};

export default function UtilityTrackingMap({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  driverLat,
  driverLng,
  status,
  driverId,
  distance,
  className,
}: Props) {
  const utils = trpc.useUtils();
  const origin = useMemo(() => parseUtilityMapPoint(originLat, originLng), [originLat, originLng]);
  const destination = useMemo(
    () => parseUtilityMapPoint(destinationLat, destinationLng),
    [destinationLat, destinationLng]
  );
  const driver = useMemo(() => parseUtilityMapPoint(driverLat, driverLng), [driverLat, driverLng]);

  const tracking = getUtilityTrackingPresentation({
    status,
    driverId,
    distanceMeters: distance,
  });
  const trackingPhase = resolveUtilityTrackingPhase(status);
  const showDriver = shouldShowUtilityDriverOnMap(status, driverId) && !!driver;

  const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<MapPoint[] | null>(null);

  useEffect(() => {
    setEncodedPolyline(null);
    setRoutePath(null);
    if (!origin || !destination) return;

    let active = true;
    (async () => {
      try {
        const route = await utils.maps.directions.fetch({
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
        });
        if (!active || !route) return;
        setEncodedPolyline(route.overviewPolyline ?? null);
        const path = (route as { routePath?: MapPoint[] }).routePath;
        if (path && path.length >= 2) setRoutePath(path);
      } catch {
        // fallback linha direta
      }
    })();

    return () => {
      active = false;
    };
  }, [origin, destination, utils]);

  if (!origin || !destination) {
    return (
      <div className="h-[280px] rounded-xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
        Mapa indisponível para esta rota
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-border">
        <RequestRideMap
          className={cn("w-full h-[320px] rounded-none border-0", className)}
          origin={origin}
          destination={destination}
          driver={showDriver ? driver : null}
          encodedPolyline={encodedPolyline}
          routePath={routePath}
          trackingPhase={trackingPhase === "in_transit" ? "in_trip" : trackingPhase === "arriving" ? "arriving" : trackingPhase === "accepted" ? "en_route" : "searching"}
        />
        {showDriver && tracking.showLivePulse ? (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Rastreio ao vivo
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{tracking.etaSubline}</p>
    </div>
  );
}
