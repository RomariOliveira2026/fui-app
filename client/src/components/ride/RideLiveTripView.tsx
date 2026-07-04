import { useState, type ReactNode } from "react";
import { StatusBadge } from "@/components/fui/StatusBadge";
import RideRouteMap from "@/components/RideRouteMap";
import RideDriverTrackingPanel from "@/components/ride/RideDriverTrackingPanel";
import RideETAStatusCard from "@/components/ride/RideETAStatusCard";
import RideSafetyToolbar from "@/components/ride/RideSafetyToolbar";
import type { RideDriverInfo } from "@/components/ride/RideDriverFoundCard";
import { fuiBrand, fuiTrip } from "@/lib/fuiTheme";
import type { RideTrackingPresentation } from "@/lib/rideTracking";
import type { RoutePoint } from "@shared/routeAnimation";
import type { DemoSimulationPhase } from "@/lib/demoSimulation";
import type { Ride } from "../../../../drizzle/schema";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type RideLiveTripViewProps = {
  ride: Ride & { simulationPhase?: DemoSimulationPhase; etaSecondsRemaining?: number };
  tracking: RideTrackingPresentation;
  tripPath?: RoutePoint[];
  showDriverOnMap: boolean;
  showDriverEnRoute: boolean;
  driver?: RideDriverInfo;
  isPassenger: boolean;
  onBack: () => void;
  onChat?: () => void;
  fareCents: number;
  fareLabel: string;
  children?: ReactNode;
};

const SHEET_PADDING_COLLAPSED = 128;
const SHEET_PADDING_EXPANDED = 340;

export default function RideLiveTripView({
  ride,
  tracking,
  tripPath,
  showDriverOnMap,
  showDriverEnRoute,
  driver,
  isPassenger,
  onBack,
  onChat,
  fareCents,
  fareLabel,
  children,
}: RideLiveTripViewProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const showDriverPanel = !!ride.driverId && !!driver;
  const showSearchingCard = !ride.driverId && ride.status === "requested";
  const mapFitPaddingBottom = sheetExpanded ? SHEET_PADDING_EXPANDED : SHEET_PADDING_COLLAPSED;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div className={fuiTrip.mapChrome}>
        <RideRouteMap
          className="h-full w-full !rounded-none border-0"
          originLat={ride.originLat}
          originLng={ride.originLng}
          destinationLat={ride.destinationLat}
          destinationLng={ride.destinationLng}
          driverLat={showDriverOnMap ? ride.driverCurrentLat : null}
          driverLng={showDriverOnMap ? ride.driverCurrentLng : null}
          rideStatus={ride.status}
          driverId={ride.driverId}
          vehicleType={ride.vehicleType}
          simulationPhase={ride.simulationPhase}
          tripPath={tripPath}
          driverEtaSeconds={ride.etaSecondsRemaining ?? null}
          mapFitPaddingBottom={mapFitPaddingBottom}
        />
      </div>

      <header className={fuiTrip.topBar}>
        <button
          type="button"
          onClick={onBack}
          className={fuiTrip.topBarBtn}
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <StatusBadge
          variant={
            tracking.variant === "success"
              ? "success"
              : tracking.variant === "warning"
                ? "warning"
                : "brand"
          }
        >
          {tracking.statusBadge}
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
              aria-label={sheetExpanded ? "Recolher detalhes da corrida" : "Expandir detalhes da corrida"}
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
                    {tracking.statusTitle}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{tracking.etaSubline}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={fuiTrip.fareLabel}>{fareLabel}</p>
                  <p className={cn("text-xl font-bold tabular-nums", fuiBrand.text)}>
                    R$ {(fareCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {!sheetExpanded && showDriverPanel && driver ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                  onClick={() => setSheetExpanded(true)}
                >
                  <span className="truncate font-medium">{driver.driverName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {driver.vehicleModel} · {driver.vehiclePlate}
                  </span>
                </button>
              ) : null}

              {sheetExpanded ? (
                <>
                  {showSearchingCard ? <RideETAStatusCard tracking={tracking} /> : null}

                  {showDriverPanel ? (
                    <RideDriverTrackingPanel
                      ride={ride}
                      tripPath={tripPath}
                      driver={driver!}
                      showChat={isPassenger && (showDriverOnMap || showDriverEnRoute)}
                      onChat={onChat}
                    />
                  ) : null}

                  {isPassenger ? (
                    <RideSafetyToolbar shareToken={ride.shareToken} compact />
                  ) : null}

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
