import { RequestRideMap } from "@/components/RequestRideMap";

type DriverActiveRideMapProps = {
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  vehicleType?: "moto" | "carro" | "van" | "utilitario";
  routePath?: Array<{ lat: number; lng: number }> | null;
  className?: string;
};

/** Mapa operacional para o motorista durante corrida ativa. */
export default function DriverActiveRideMap({
  origin,
  destination,
  vehicleType = "carro",
  routePath,
  className = "h-56 w-full rounded-xl overflow-hidden border border-border",
}: DriverActiveRideMapProps) {
  if (!origin && !destination) return null;

  return (
    <RequestRideMap
      className={className}
      origin={origin ?? null}
      destination={destination ?? null}
      vehicleType={vehicleType}
      routePath={routePath ?? null}
    />
  );
}
