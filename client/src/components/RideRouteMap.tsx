import { useEffect, useMemo, useState } from "react";
import { RequestRideMap } from "@/components/RequestRideMap";
import { trpc } from "@/lib/trpc";
import { useLiveEtaSeconds } from "@/lib/useLiveEtaSeconds";
import {
  getRideTrackingPresentation,
  resolveRideTrackingPhase,
  shouldShowDriverOnMap,
} from "@/lib/rideTracking";
import type { DemoSimulationPhase } from "@/lib/demoSimulation";
import { cn } from "@/lib/utils";
import type { DemoVehicleType } from "@shared/demoPricing";

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
  vehicleType?: DemoVehicleType | string | null;
  simulationPhase?: DemoSimulationPhase | null;
  /** Rota OSRM do servidor — mesma geometria usada na simulação do motorista. */
  tripPath?: MapPoint[] | null;
  /** Indica se tripPath ainda é linha reta (aguardando OSRM). */
  tripPathSource?: "osrm" | "fallback" | null;
  /** ETA restante (s) para animação contínua do motorista no mapa. */
  driverEtaSeconds?: number | null;
  /** Padding inferior do fitBounds quando mapa fullscreen com painel embaixo. */
  mapFitPaddingBottom?: number;
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
  vehicleType,
  simulationPhase,
  tripPath: serverTripPath,
  tripPathSource,
  driverEtaSeconds,
  mapFitPaddingBottom,
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

  const liveDriverEtaSeconds = useLiveEtaSeconds(
    driverEtaSeconds ?? undefined,
    showDriver &&
      (trackingPhase === "in_trip" ||
        trackingPhase === "en_route" ||
        trackingPhase === "arriving")
  );

  const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null);
  const [fetchedRoutePath, setFetchedRoutePath] = useState<MapPoint[] | null>(null);

  const hasServerTripPath = !!serverTripPath && serverTripPath.length >= 2;
  const serverRouteIsFallback = tripPathSource === "fallback";
  const shouldFetchRoute =
    !!origin && !!destination && (!hasServerTripPath || serverRouteIsFallback);

  useEffect(() => {
    if (!shouldFetchRoute) {
      setEncodedPolyline(null);
      setFetchedRoutePath(null);
      return;
    }

    setEncodedPolyline(null);
    setFetchedRoutePath(null);

    let active = true;
    (async () => {
      try {
        const route = await utils.maps.directions.fetch({
          origin: `${origin!.lat},${origin!.lng}`,
          destination: `${destination!.lat},${destination!.lng}`,
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
  }, [origin, destination, shouldFetchRoute, utils]);

  const routePath =
    hasServerTripPath && !serverRouteIsFallback
      ? serverTripPath!
      : fetchedRoutePath ?? (hasServerTripPath ? serverTripPath! : null);
  const stableRoutePath = useMemo(() => {
    if (!routePath || routePath.length < 2) return routePath ?? null;
    return routePath;
  }, [
    routePath,
    routePath?.length,
    routePath?.[0]?.lat,
    routePath?.[0]?.lng,
    routePath?.[routePath.length - 1]?.lat,
    routePath?.[routePath.length - 1]?.lng,
  ]);
  const mapDriver = showDriver ? driver : null;

  const tracking = getRideTrackingPresentation(rideLike, simulationPhase, null, routePath);
  const isFullscreen = Boolean(className?.includes("h-full"));

  return (
    <div className={cn(isFullscreen ? "h-full w-full min-h-0" : "space-y-2")}>
      <div
        className={cn(
          "relative overflow-hidden",
          isFullscreen ? "h-full w-full" : "rounded-xl border border-border"
        )}
      >
        <RequestRideMap
          className={cn(
            isFullscreen ? "h-full w-full min-h-0" : "h-[420px] w-full",
            "rounded-none border-0",
            className
          )}
          origin={origin}
          destination={destination}
          driver={mapDriver}
          vehicleType={(vehicleType as DemoVehicleType | undefined) ?? undefined}
          encodedPolyline={encodedPolyline}
          routePath={stableRoutePath}
          trackingPhase={trackingPhase}
          driverEtaSeconds={liveDriverEtaSeconds ?? driverEtaSeconds ?? null}
          mapFitPaddingBottom={mapFitPaddingBottom}
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
