import { RequestRideMap } from "@/components/RequestRideMap";

type DriverActiveRideMapProps = {
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  driver?: { lat: number; lng: number } | null;
  vehicleType?: "moto" | "carro" | "van" | "utilitario";
  routePath?: Array<{ lat: number; lng: number }> | null;
  trackingPhase?: "searching" | "driver_found" | "en_route" | "arriving" | "waiting_pickup" | "in_trip" | "completed";
  mapFitPaddingBottom?: number;
  className?: string;
};

/** Mapa operacional fullscreen para o motorista durante corrida ativa. */
export default function DriverActiveRideMap({
  origin,
  destination,
  driver,
  vehicleType = "carro",
  routePath,
  trackingPhase,
  mapFitPaddingBottom,
  className = "h-56 w-full rounded-xl overflow-hidden border border-border",
}: DriverActiveRideMapProps) {
  if (!origin && !destination) return null;

  return (
    <RequestRideMap
      className={className}
      origin={origin ?? null}
      destination={destination ?? null}
      driver={driver ?? null}
      vehicleType={vehicleType}
      routePath={routePath ?? null}
      trackingPhase={trackingPhase}
      mapFitPaddingBottom={mapFitPaddingBottom}
    />
  );
}
