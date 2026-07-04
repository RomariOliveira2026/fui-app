import { useMemo } from "react";
import { RequestRideMap } from "@/components/RequestRideMap";
import { useLiveEtaSeconds } from "@/lib/useLiveEtaSeconds";
import { useRideRouteGeometry } from "@/lib/useRideRouteGeometry";
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
  rideId?: number;
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
  /** Polyline OSRM persistida — usada quando tripPath ainda é fallback. */
  demoRoutePolyline?: string | null;
  /** ETA restante (s) para animação contínua do motorista no mapa. */
  driverEtaSeconds?: number | null;
  /** Padding inferior do fitBounds quando mapa fullscreen com painel embaixo. */
  mapFitPaddingBottom?: number;
  className?: string;
};

/** Mapa premium de rastreamento — marcador ao vivo, rota e enquadramento inteligente. */
export default function RideRouteMap({
  rideId,
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
  demoRoutePolyline,
  driverEtaSeconds,
  mapFitPaddingBottom,
  className,
}: RideRouteMapProps) {
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

  const { routePath, encodedPolyline, hasRealRoute } = useRideRouteGeometry(
    origin,
    destination,
    {
      rideId,
      serverPath: serverTripPath,
      serverSource: tripPathSource,
      demoRoutePolyline,
      enabled: !!origin && !!destination,
    }
  );

  const showRouteLine =
    hasRealRoute &&
    trackingPhase !== "waiting_pickup" &&
    trackingPhase !== "searching";

  const mapDriver = showDriver ? driver : null;

  const tracking = getRideTrackingPresentation(
    rideLike,
    simulationPhase,
    null,
    showRouteLine ? routePath : null
  );
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
          encodedPolyline={showRouteLine ? encodedPolyline : null}
          routePath={showRouteLine ? routePath : null}
          trackingPhase={trackingPhase}
          driverEtaSeconds={liveDriverEtaSeconds ?? driverEtaSeconds ?? null}
          mapFitPaddingBottom={mapFitPaddingBottom}
          zoomControlPosition={isFullscreen ? "bottomright" : undefined}
        />
        {showDriver && tracking?.showLivePulse ? (
          <div
            className={cn(
              "pointer-events-none absolute flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm",
              isFullscreen ? "left-4 top-[3.75rem]" : "left-3 top-3"
            )}
          >
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
