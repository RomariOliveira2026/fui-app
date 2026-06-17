import { useEffect, useMemo, useState } from "react";
import { RequestRideMap } from "@/components/RequestRideMap";
import { trpc } from "@/lib/trpc";
import {
  getRideTrackingPresentation,
  resolveRideTrackingPhase,
  shouldShowDriverOnMap,
} from "@/lib/rideTracking";
import type { DemoSimulationPhase } from "@/lib/demoSimulation";
import { cn } from "@/lib/utils";

type MapPoint = { lat: number; lng: number };

function parseMapPoint(
  latValue: string | number | null | undefined,
  lngValue: string | number | null | undefined
): MapPoint | null {
  const lat = typeof latValue === "number" ? latValue : Number.parseFloat(String(latValue ?? ""));
  const lng = typeof lngValue === "number" ? lngValue : Number.parseFloat(String(lngValue ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

type RideRouteMapProps = {
  originLat?: string | number | null;
  originLng?: string | number | null;
  destinationLat?: string | number | null;
  destinationLng?: string | number | null;
  driverLat?: string | number | null;
  driverLng?: string | number | null;
  rideStatus?: string;
  driverId?: number | null;
  simulationPhase?: DemoSimulationPhase | null;
  /** Rota OSRM do servidor — mesma geometria usada na simulação do motorista. */
  tripPath?: MapPoint[] | null;
  className?: string;
};

/** Mapa premium de rastreamento — marcador ao vivo, rota e enquadramento inteligente. */
export default function RideRouteMap({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  driverLat,
  driverLng,
  rideStatus = "requested",
  driverId,
  simulationPhase,
  tripPath: serverTripPath,
  className,
}: RideRouteMapProps) {
  const utils = trpc.useUtils();
  const origin = useMemo(
    () => parseMapPoint(originLat, originLng),
    [originLat, originLng]
  );
  const destination = useMemo(
    () => parseMapPoint(destinationLat, destinationLng),
    [destinationLat, destinationLng]
  );
  const driver = useMemo(
    () => parseMapPoint(driverLat, driverLng),
    [driverLat, driverLng]
  );

  const rideLike = useMemo(
    () => ({
      status: rideStatus,
      originLat: String(originLat ?? ""),
      originLng: String(originLng ?? ""),
      destinationLat: String(destinationLat ?? ""),
      destinationLng: String(destinationLng ?? ""),
      driverCurrentLat: driverLat != null ? String(driverLat) : null,
      driverCurrentLng: driverLng != null ? String(driverLng) : null,
      driverId: driverId ?? null,
    }),
    [
      rideStatus,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      driverLat,
      driverLng,
      driverId,
    ]
  );

  const trackingPhase = useMemo(
    () => resolveRideTrackingPhase(rideLike, simulationPhase),
    [rideLike, simulationPhase]
  );

  const showDriver = shouldShowDriverOnMap(rideLike) && !!driver;

  const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null);
  const [fetchedRoutePath, setFetchedRoutePath] = useState<MapPoint[] | null>(null);

  const hasServerTripPath = !!serverTripPath && serverTripPath.length >= 2;

  useEffect(() => {
    if (hasServerTripPath) {
      setEncodedPolyline(null);
      setFetchedRoutePath(null);
      return;
    }

    setEncodedPolyline(null);
    setFetchedRoutePath(null);
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
        if (path && path.length >= 2) {
          setFetchedRoutePath(path);
        }
      } catch {
        // RequestRideMap desenha fallback A→B densificado
      }
    })();

    return () => {
      active = false;
    };
  }, [origin, destination, hasServerTripPath, utils]);

  const routePath = hasServerTripPath ? serverTripPath! : fetchedRoutePath;

  const tracking = getRideTrackingPresentation(rideLike, simulationPhase, null, routePath);

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-border">
        <RequestRideMap
          className={cn("w-full h-[420px] rounded-none border-0", className)}
          origin={origin}
          destination={destination}
          driver={showDriver ? driver : null}
          encodedPolyline={encodedPolyline}
          routePath={routePath}
          trackingPhase={trackingPhase}
        />
        {showDriver && tracking?.showLivePulse ? (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Ao vivo
          </div>
        ) : null}
      </div>
    </div>
  );
}
