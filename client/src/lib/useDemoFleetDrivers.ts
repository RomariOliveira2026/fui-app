import { trpc } from "@/lib/trpc";
import { isDemoOperationalRidesEnabledClient } from "@shared/demoOperationalRides";

type FleetPoint = {
  driverId: number;
  name: string;
  lat: number;
  lng: number;
  vehicleType: string;
  plate: string;
  status: string;
};

export function useDemoFleetDrivers(near?: { lat: number; lng: number } | null) {
  const enabled = isDemoOperationalRidesEnabledClient();

  const { data } = trpc.demoOperational.getFleetDrivers.useQuery(
    near ? { nearLat: near.lat, nearLng: near.lng } : undefined,
    {
      enabled,
      staleTime: 8_000,
      refetchInterval: 8_000,
    }
  );

  return (data ?? []) as FleetPoint[];
}
