import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, MapPin, Navigation } from "lucide-react";
import DriverActiveRideMap from "@/components/driver/DriverActiveRideMap";
import ExternalNavigationButtons from "@/components/fui/ExternalNavigationButtons";
import { StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand, fuiRoute, fuiTrip, rideStatusLabels } from "@/lib/fuiTheme";
import type { NavigationPoint } from "@/lib/navigationLinks";
import { cn } from "@/lib/utils";

type DriverLiveRideViewProps = {
  ride: {
    id: number;
    status: string;
    originAddress: string;
    destinationAddress: string;
    originLat?: string | null;
    originLng?: string | null;
    destinationLat?: string | null;
    destinationLng?: string | null;
    estimatedPrice?: number | null;
    vehicleType?: "moto" | "carro" | "van" | "utilitario";
    driverCurrentLat?: string | null;
    driverCurrentLng?: string | null;
  };
  navigationTarget: NavigationPoint | null;
  onBack: () => void;
  children?: ReactNode;
};

const SHEET_PADDING_COLLAPSED = 120;
const SHEET_PADDING_EXPANDED = 320;

export default function DriverLiveRideView({
  ride,
  navigationTarget,
  onBack,
  children,
}: DriverLiveRideViewProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const statusLabel = rideStatusLabels[ride.status] ?? ride.status;
  const mapFitPaddingBottom = sheetExpanded ? SHEET_PADDING_EXPANDED : SHEET_PADDING_COLLAPSED;
  const trackingPhase = ride.status === "in_progress" ? "in_trip" : "en_route";

  const origin = useMemo(
    () =>
      ride.originLat && ride.originLng
        ? { lat: Number(ride.originLat), lng: Number(ride.originLng) }
        : null,
    [ride.originLat, ride.originLng]
  );
  const destination = useMemo(
    () =>
      ride.destinationLat && ride.destinationLng
        ? { lat: Number(ride.destinationLat), lng: Number(ride.destinationLng) }
        : null,
    [ride.destinationLat, ride.destinationLng]
  );
  const driver = useMemo(
    () =>
      ride.driverCurrentLat && ride.driverCurrentLng
        ? { lat: Number(ride.driverCurrentLat), lng: Number(ride.driverCurrentLng) }
        : null,
    [ride.driverCurrentLat, ride.driverCurrentLng]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div className={fuiTrip.mapChrome}>
        <DriverActiveRideMap
          className="h-full w-full !rounded-none border-0"
          origin={origin}
          destination={destination}
          driver={driver}
          vehicleType={ride.vehicleType}
          trackingPhase={trackingPhase}
          mapFitPaddingBottom={mapFitPaddingBottom}
        />
      </div>

      <header className={fuiTrip.topBar}>
        <button type="button" onClick={onBack} className={fuiTrip.topBarBtn} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <StatusBadge variant={ride.status === "in_progress" ? "success" : "info"}>
          {statusLabel}
        </StatusBadge>
        <div className="w-10" aria-hidden />
      </header>

      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className={fuiTrip.sheet}>
          <div className={fuiTrip.sheetInner}>
            <button
              type="button"
              className={fuiTrip.sheetHandleBtn}
              aria-expanded={sheetExpanded}
              aria-label={sheetExpanded ? "Recolher detalhes" : "Expandir detalhes"}
              onClick={() => setSheetExpanded((open) => !open)}
            >
              <div className={fuiTrip.sheetHandle} />
              {sheetExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronUp className="h-4 w-4" aria-hidden />
              )}
            </button>

            <div
              className={cn(
                sheetExpanded ? fuiTrip.sheetInnerExpanded : fuiTrip.sheetInnerCollapsed
              )}
            >
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Corrida #{ride.id}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ride.status === "accepted"
                      ? "Dirija-se ao passageiro"
                      : "Leve o passageiro ao destino"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={fuiTrip.fareLabel}>Ganho estimado</p>
                  <p className={cn("text-xl font-bold tabular-nums", fuiBrand.text)}>
                    R$ {((ride.estimatedPrice ?? 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {!sheetExpanded ? (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="truncate font-medium">{ride.destinationAddress}</p>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className={cn("mt-0.5 h-4 w-4", fuiRoute.originIcon)} />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Origem
                      </p>
                      <p className="text-sm font-medium text-foreground">{ride.originAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Navigation className={cn("mt-0.5 h-4 w-4", fuiRoute.destinationIcon)} />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Destino
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {ride.destinationAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sheetExpanded ? (
                <>
                  <ExternalNavigationButtons target={navigationTarget} />
                  {children}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
