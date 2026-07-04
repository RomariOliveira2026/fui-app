import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusPanel from "@/components/fui/StatusPanel";
import { RideStatusBadge, StatusBadge } from "@/components/fui/StatusBadge";
import { fuiBrand, fuiRoute, fuiSurface } from "@/lib/fuiTheme";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation, User, Car, XCircle, CheckCircle2, CreditCard, Star, Clock, MessageCircle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import AppHeader from "@/components/AppHeader";
import RideRouteMap from "@/components/RideRouteMap";
import DemoRideChat from "@/components/DemoRideChat";
import RateDriverModal from "@/components/RateDriverModal";
import { isDemoAppClient } from "@/lib/demoMode";
import { useDemoAcceleratedEta } from "@/lib/demoRideEta";
import { useDemoRideDetails } from "@/lib/useDemoRideDetails";
import {
  applyDemoPayment,
  isDemoPaymentApproved,
  shouldShowDriverEnRoute,
} from "@/lib/demoRidePayment";
import {
  getRideTrackingPresentation,
  shouldShowDriverOnMap,
} from "@/lib/rideTracking";
import { isDemoRideIdClient,
  persistDemoRideFromServer,
  useDemoRideHydration,
  useEnsureDemoRideHydrated,
} from "@/lib/useDemoRideHydration";
import RideSimulationPanel, { type RideWithSimulation } from "@/components/RideSimulationPanel";
import RideLiveTripView from "@/components/ride/RideLiveTripView";
import RideSafetyToolbar from "@/components/ride/RideSafetyToolbar";
import RideDriverTrackingPanel from "@/components/ride/RideDriverTrackingPanel";
import RideETAStatusCard from "@/components/ride/RideETAStatusCard";
import { isDemoDriverSimulationEnabled } from "@/lib/demoSimulation";
import FlowErrorFallback from "@/components/fui/FlowErrorFallback";
import type { RoutePoint } from "@shared/routeAnimation";
import type { RideDispatchMeta } from "@shared/rideDispatcher";

type DemoDriverInfo = {
  driverName: string;
  rating: string;
  avatarUrl?: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
};

export default function RideDetails() {
  const { user } = useAuth();
  const [, params] = useRoute("/ride/:id");
  const [, setLocation] = useLocation();
  const rideId = params?.id ? parseInt(params.id) : 0;

  const utils = trpc.useUtils();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  useDemoRideHydration();
  const isDemoRideRoute = isDemoRideIdClient(rideId);
  const usesDemoPolling = isDemoRideRoute;
  const { ready: demoHydrated, betaPending } = useEnsureDemoRideHydrated(rideId);

  const [demoPollMs, setDemoPollMs] = useState<number | false>(1500);
  const demoRideQuery = useDemoRideDetails(rideId, {
    enabled: usesDemoPolling && demoHydrated,
    refetchInterval: demoPollMs,
  });

  const confirmDemoPayment = trpc.ride.confirmDemoPayment.useMutation({
    onSuccess: (updated) => {
      persistDemoRideFromServer(updated);
      utils.ride.getById.setData({ rideId }, updated);
      if (usesDemoPolling) void demoRideQuery.refetch();
    },
  });

  const simulationEnabled = isDemoDriverSimulationEnabled();
  const simulationAccept = trpc.ride.simulationAccept.useMutation({
    onSuccess: (updated) => {
      persistDemoRideFromServer(updated);
      utils.ride.getById.setData({ rideId }, updated);
      if (usesDemoPolling) void demoRideQuery.refetch();
      toast.success("Motorista Demo aceitou a corrida!");
    },
    onError: (error) => toast.error(error.message),
  });
  const simulationStart = trpc.ride.simulationStart.useMutation({
    onSuccess: (updated) => {
      persistDemoRideFromServer(updated);
      utils.ride.getById.setData({ rideId }, updated);
      if (usesDemoPolling) void demoRideQuery.refetch();
      toast.success("Corrida iniciada!");
    },
    onError: (error) => toast.error(error.message),
  });

  const standardQuery = trpc.ride.getById.useQuery(
    { rideId },
    {
      enabled: !!rideId && demoHydrated && !usesDemoPolling,
      throwOnError: false,
      refetchInterval: (query) => {
        const data = query.state.data as RideWithSimulation | undefined;
        if (!data || data.status === "completed" || data.status === "cancelled") {
          return false;
        }
        if (data.status === "requested" && !data.driverId) {
          return 1500;
        }
        if (simulationEnabled || shouldShowDriverOnMap(data)) {
          return 1000;
        }
        if (data.status === "requested" || data.status === "accepted") {
          return 3000;
        }
        return 5000;
      },
      retry: 1,
    }
  );

  const ride = usesDemoPolling ? demoRideQuery.data : standardQuery.data;
  const isLoading = usesDemoPolling ? demoRideQuery.isLoading : standardQuery.isLoading;
  const isError = usesDemoPolling ? demoRideQuery.isError : standardQuery.isError;
  const error = usesDemoPolling ? demoRideQuery.error : standardQuery.error;
  const refetch = usesDemoPolling ? demoRideQuery.refetch : standardQuery.refetch;

  useEffect(() => {
    if (!usesDemoPolling) return;
    const data = demoRideQuery.data as RideWithSimulation | undefined;
    if (!data || data.status === "completed" || data.status === "cancelled") {
      setDemoPollMs(false);
      return;
    }
    if (data.status === "requested" && !data.driverId) {
      setDemoPollMs(1500);
      return;
    }
    if (simulationEnabled || shouldShowDriverOnMap(data)) {
      setDemoPollMs(1000);
      return;
    }
    if (data.status === "requested" || data.status === "accepted") {
      setDemoPollMs(3000);
      return;
    }
    setDemoPollMs(5000);
  }, [demoRideQuery.data, simulationEnabled, usesDemoPolling]);

  useEffect(() => {
    if (ride && isDemoRideIdClient(ride.id)) {
      persistDemoRideFromServer(ride);
      if (ride.status === "completed" || ride.status === "cancelled") {
        utils.ride.myRides.invalidate();
        utils.ride.myDrives.invalidate();
        utils.user.getRecentRides.invalidate();
      }
    }
  }, [ride, utils]);

  const { data: existingRating } = trpc.rating.getByRideId.useQuery(
    { rideId },
    {
      enabled:
        !!rideId &&
        !!ride &&
        ride.status === "completed" &&
        !isDemoRideIdClient(rideId),
    }
  );

  const cancelRide = trpc.ride.cancel.useMutation({
    onSuccess: () => {
      toast.success("Corrida cancelada");
      utils.ride.getById.invalidate({ rideId });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar corrida");
    },
  });

  useEffect(() => {
    if (ride?.status === "completed") {
      toast.success("Corrida concluída!");
    }
  }, [ride?.status]);

  const previewSimRide = ride as RideWithSimulation | undefined;
  const previewTracking = ride
    ? getRideTrackingPresentation(
        ride,
        previewSimRide?.simulationPhase,
        (ride as { dispatchMeta?: RideDispatchMeta }).dispatchMeta,
        (ride as { tripPath?: RoutePoint[] }).tripPath,
        (ride as { etaSecondsRemaining?: number }).etaSecondsRemaining
      )
    : null;
  const demoEta = useDemoAcceleratedEta(
    !!previewTracking &&
      previewTracking.phase !== "searching" &&
      previewTracking.phase !== "completed" &&
      previewTracking.phase !== "waiting_pickup" &&
      previewTracking.seconds > 0
  );

  if (
    (usesDemoPolling ? demoRideQuery.isLoading : isLoading) ||
    (!usesDemoPolling && !demoHydrated) ||
    (betaPending && isDemoRideRoute && !demoRideQuery.data)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    const expiredDemo =
      usesDemoPolling && !demoRideQuery.hasLocalSnapshot;
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Detalhes da Corrida" />
        <FlowErrorFallback
          title={expiredDemo ? "Corrida demo expirou" : "Não foi possível carregar a corrida"}
          error={
            expiredDemo
              ? new Error(
                  "Esta corrida não está mais disponível neste navegador. Solicite uma nova corrida para continuar testando."
                )
              : error
          }
          onRetry={expiredDemo ? undefined : () => void refetch()}
          onReset={expiredDemo ? () => setLocation("/request-ride") : undefined}
          resetLabel="Solicitar nova corrida"
          onGoHome={() => setLocation("/")}
        />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Corrida não encontrada</CardTitle>
            <CardDescription>
              A corrida solicitada não existe ou você não tem permissão para visualizá-la
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className={`w-full ${fuiBrand.btn}`}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPassenger = ride.passengerId === user?.id;
  const canCancel = ride.status === "requested" || ride.status === "accepted";
  const isDemoRide = isDemoRideIdClient(ride.id);
  const simRide = ride as RideWithSimulation;
  const demoDriver = simRide.demoDriver;
  const paymentApproved = isDemoPaymentApproved(ride);
  const showDriverOnMap = shouldShowDriverOnMap(ride);
  const showDriverEnRoute = shouldShowDriverEnRoute(ride);
  const dispatchMeta = (ride as { dispatchMeta?: RideDispatchMeta }).dispatchMeta;
  const tripPath = (ride as { tripPath?: RoutePoint[] }).tripPath;
  const etaSecondsRemaining = (ride as { etaSecondsRemaining?: number }).etaSecondsRemaining;
  const tracking = getRideTrackingPresentation(
    ride,
    simRide.simulationPhase,
    dispatchMeta,
    tripPath,
    etaSecondsRemaining
  );
  const paymentPending =
    (ride.paymentMethod === "pix" || ride.paymentMethod === "card") &&
    ride.paymentStatus === "pending";

  const handlePayNow = () => {
    if (!isDemoAppClient()) {
      setLocation(`/payment/${ride.id}`);
      return;
    }

    const paidRide = applyDemoPayment(ride);
    const withDriverMeta = demoDriver ? { ...paidRide, demoDriver } : paidRide;

    persistDemoRideFromServer(paidRide);
    utils.ride.getById.setData({ rideId }, withDriverMeta as typeof ride);
    toast.success("Pagamento aprovado!");

    if (isDemoRide) {
      confirmDemoPayment.mutate({ rideId: ride.id });
    }
  };

  const driverDisplayName = demoDriver?.driverName ?? "Motorista";
  const isLiveTrip =
    ride.status === "requested" || ride.status === "accepted" || ride.status === "in_progress";
  const fareCents = ride.finalPrice || ride.estimatedPrice || 0;
  const fareLabel = ride.status === "completed" ? "Valor final" : "Preço estimado";

  if (isLiveTrip && tracking) {
    return (
      <>
        <RideLiveTripView
          ride={simRide}
          tracking={tracking}
          tripPath={tripPath}
          showDriverOnMap={showDriverOnMap}
          showDriverEnRoute={showDriverEnRoute}
          driver={
            ride.driverId
              ? {
                  driverName: demoDriver?.driverName ?? driverDisplayName,
                  rating: demoDriver?.rating,
                  avatarUrl: demoDriver?.avatarUrl,
                  vehicleBrand: demoDriver?.vehicleBrand,
                  vehicleModel: demoDriver?.vehicleModel,
                  vehiclePlate: demoDriver?.vehiclePlate,
                  vehicleColor: demoDriver?.vehicleColor,
                }
              : undefined
          }
          isPassenger={isPassenger}
          onBack={() => setLocation("/")}
          onChat={() => setChatOpen(true)}
          fareCents={fareCents}
          fareLabel={fareLabel}
        >
          {paymentPending ? (
            <Button
              onClick={handlePayNow}
              disabled={confirmDemoPayment.isPending}
              className={`w-full ${fuiBrand.btn}`}
            >
              {confirmDemoPayment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar agora para confirmar
                </>
              )}
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              variant="destructive"
              onClick={() => cancelRide.mutate({ rideId: ride.id })}
              disabled={cancelRide.isPending}
              className="w-full"
            >
              {cancelRide.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar corrida
                </>
              )}
            </Button>
          ) : null}
        </RideLiveTripView>

        {simulationEnabled && isDemoRide && isPassenger && (
          <div className="pointer-events-none fixed left-0 right-0 top-16 z-30 flex justify-end px-3">
            <div className="pointer-events-auto w-full max-w-[17rem]">
              <RideSimulationPanel
                ride={simRide}
                floating
                onSimulateAccept={() => simulationAccept.mutate({ rideId: ride.id })}
                onSimulateStart={() => simulationStart.mutate({ rideId: ride.id })}
                acceptPending={simulationAccept.isPending}
                startPending={simulationStart.isPending}
              />
            </div>
          </div>
        )}

        {(showDriverOnMap || showDriverEnRoute) && isPassenger && (
          <DemoRideChat
            rideId={ride.id}
            otherUserName={driverDisplayName}
            open={chatOpen}
            onOpenChange={setChatOpen}
            showFloatingButton={false}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Detalhes da Corrida" />
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Detalhes da Corrida</CardTitle>
                <CardDescription>ID: #{ride.id}</CardDescription>
              </div>
              {tracking && tracking.phase !== "searching" && tracking.phase !== "completed" ? (
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
              ) : (
                <RideStatusBadge status={ride.status} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {simulationEnabled && isDemoRide && isPassenger && ride.status !== "cancelled" && (
              <RideSimulationPanel
                ride={simRide}
                onSimulateAccept={() => simulationAccept.mutate({ rideId: ride.id })}
                onSimulateStart={() => simulationStart.mutate({ rideId: ride.id })}
                acceptPending={simulationAccept.isPending}
                startPending={simulationStart.isPending}
              />
            )}

            {/* Map + rastreamento premium */}
            <div className="space-y-3">
              <RideRouteMap
                originLat={ride.originLat}
                originLng={ride.originLng}
                destinationLat={ride.destinationLat}
                destinationLng={ride.destinationLng}
                driverLat={showDriverOnMap ? ride.driverCurrentLat : null}
                driverLng={showDriverOnMap ? ride.driverCurrentLng : null}
                rideStatus={ride.status}
                driverId={ride.driverId}
                vehicleType={ride.vehicleType}
                simulationPhase={simRide.simulationPhase}
                tripPath={tripPath}
                driverEtaSeconds={etaSecondsRemaining ?? null}
              />

              {!ride.driverId && tracking && ride.status === "requested" ? (
                <RideETAStatusCard tracking={tracking} />
              ) : null}
            </div>

            {ride.driverId ? (
              <RideDriverTrackingPanel
                ride={simRide}
                tripPath={tripPath}
                driver={{
                  driverName: demoDriver?.driverName ?? driverDisplayName,
                  rating: demoDriver?.rating,
                  avatarUrl: demoDriver?.avatarUrl,
                  vehicleBrand: demoDriver?.vehicleBrand,
                  vehicleModel: demoDriver?.vehicleModel,
                  vehiclePlate: demoDriver?.vehiclePlate,
                  vehicleColor: demoDriver?.vehicleColor,
                }}
                showChat={isPassenger && (showDriverOnMap || showDriverEnRoute)}
                onChat={() => setChatOpen(true)}
              />
            ) : null}

            {/* Route Information */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className={`w-5 h-5 mt-1 ${fuiRoute.originIcon}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Origem</p>
                  <p className="text-base text-foreground">{ride.originAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Navigation className={`w-5 h-5 mt-1 ${fuiRoute.destinationIcon}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Destino</p>
                  <p className="text-base text-foreground">{ride.destinationAddress}</p>
                </div>
              </div>
            </div>

            {/* Ride Info */}
            <div className={`grid grid-cols-2 gap-4 p-4 ${fuiSurface.muted}`}>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Veículo</p>
                <p className="font-semibold capitalize text-foreground">{ride.vehicleType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distância</p>
                <p className="font-semibold text-foreground">
                  {ride.distance ? `${(ride.distance / 1000).toFixed(1)} km` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duração Estimada</p>
                <p className="font-semibold text-foreground">
                  {ride.duration ? `${Math.round(ride.duration / 60)} min` : "-"}
                </p>
                {demoEta.visible && showDriverOnMap ? (
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    Tempo total da viagem no trajeto real. O cronômetro acima mostra o tempo
                    restante na {demoEta.label.toLowerCase()}.
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagamento</p>
                <p className="font-semibold capitalize text-foreground">
                  {ride.paymentMethod === "cash" ? "Dinheiro" : ride.paymentMethod?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Price */}
            <Card className={fuiSurface.price}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {ride.status === "completed" ? "Valor Final" : "Valor Estimado"}
                  </p>
                  <p className={`text-3xl font-bold ${fuiBrand.text}`}>
                    R$ {((ride.finalPrice || ride.estimatedPrice || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Driver Info — legado compacto quando painel premium não cobre */}
            {ride.driverId && !tracking?.showDriverOnMap && ride.status === "requested" && (
              <StatusPanel
                variant="success"
                icon={<User className="w-5 h-5" />}
                title="Motorista encontrado"
                description={
                  <>
                    <p className="text-base font-medium text-foreground">
                      {demoDriver?.driverName ?? "Motorista Fui!"}
                    </p>
                    {demoDriver?.rating && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400/80" />
                        {demoDriver.rating}
                      </p>
                    )}
                  </>
                }
              >
                {(demoDriver || ride.vehicleId) && (
                  <div className="grid grid-cols-2 gap-3 text-sm pt-1 border-t border-border">
                    <div>
                      <p className="text-muted-foreground">Veículo</p>
                      <p className="font-medium text-foreground capitalize">
                        {demoDriver
                          ? `${demoDriver.vehicleBrand} ${demoDriver.vehicleModel}`
                          : ride.vehicleType}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Placa</p>
                      <p className="font-medium text-foreground">
                        {demoDriver?.vehiclePlate ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cor</p>
                      <p className="font-medium text-foreground">
                        {demoDriver?.vehicleColor ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avaliação</p>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80" />
                        {demoDriver?.rating ?? "4.8"}
                      </p>
                    </div>
                  </div>
                )}
              </StatusPanel>
            )}

            {ride.status === "completed" && (
              <StatusPanel
                variant="success"
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="Corrida concluída"
                description="Obrigado por usar o Fui! Avalie sua experiência."
              />
            )}

            {ride.status === "cancelled" && (
              <StatusPanel
                variant="danger"
                title="Corrida cancelada"
                description={
                  ride.cancellationReason ? (
                    <>Motivo: {ride.cancellationReason}</>
                  ) : (
                    "Esta corrida foi cancelada."
                  )
                }
              />
            )}

            {/* Payment status */}
            {(ride.paymentMethod === "pix" || ride.paymentMethod === "card") &&
              ride.status !== "cancelled" && (
              <>
                {paymentPending ? (
                  <StatusPanel
                    variant="brand"
                    title="Pagamento pendente"
                    description={
                      ride.paymentMethod === "pix"
                        ? "Pague via Pix para confirmar a corrida"
                        : "Pague com cartão para confirmar a corrida"
                    }
                    action={
                      <Button
                        onClick={handlePayNow}
                        disabled={confirmDemoPayment.isPending}
                        className={`${fuiBrand.btn} shrink-0`}
                        size="sm"
                      >
                        {confirmDemoPayment.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pagar agora
                          </>
                        )}
                      </Button>
                    }
                  />
                ) : paymentApproved ? (
                  <>
                    <StatusPanel
                      variant="success"
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      title="Pagamento aprovado"
                      badge={<StatusBadge variant="success">Aprovado</StatusBadge>}
                      description="Sua corrida está confirmada. O motorista seguirá para o embarque."
                    />

                    {showDriverEnRoute && tracking && (
                      <StatusPanel
                        variant={tracking.variant === "success" ? "success" : "info"}
                        icon={<Car className="w-5 h-5" />}
                        title={tracking.statusTitle}
                        description={
                          <>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {tracking.etaSubline}
                            </p>
                            <p className="text-xs mt-1">
                              {driverDisplayName} está a caminho do ponto de embarque
                            </p>
                          </>
                        }
                      >
                        {isPassenger && (
                          <Button
                            type="button"
                            className={`w-full ${fuiBrand.btn}`}
                            onClick={() => setChatOpen(true)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat com Motorista
                          </Button>
                        )}
                      </StatusPanel>
                    )}

                    {paymentApproved && !ride.driverId && (
                      <StatusPanel
                        variant="warning"
                        title="Aguardando motorista"
                        description="Pagamento confirmado. Aguardando motorista aceitar a corrida..."
                        compact
                      />
                    )}
                  </>
                ) : null}
              </>
            )}
            {isPassenger && ride.shareToken ? (
              <RideSafetyToolbar shareToken={ride.shareToken} />
            ) : null}

            {/* Actions */}
            <div className="flex gap-3">
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => cancelRide.mutate({ rideId: ride.id })}
                  disabled={cancelRide.isPending}
                  className="flex-1"
                >
                  {cancelRide.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Corrida
                    </>
                  )}
                </Button>
              )}
              
              {ride.status === "completed" && !existingRating && ride.driverId && (
                <Button
                  onClick={() => setShowRatingModal(true)}
                  className={`flex-1 ${fuiBrand.btn}`}
                >
                  Avaliar Motorista
                </Button>
              )}
              
              {ride.status === "completed" && (
                <Button
                  onClick={() => setLocation("/request-ride")}
                  className={`flex-1 ${existingRating ? fuiBrand.btn : fuiBrand.btnOutline}`}
                  variant={existingRating ? "default" : "outline"}
                >
                  Nova Corrida
                </Button>
              )}

              {(ride.status === "cancelled" || ride.status === "completed") && (
                <Button
                  variant="outline"
                  onClick={() => setLocation("/ride-history")}
                  className="flex-1 border-border text-muted-foreground"
                >
                  Ver Histórico
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(showDriverOnMap || showDriverEnRoute) && isPassenger && (
          <DemoRideChat
            rideId={ride.id}
            otherUserName={driverDisplayName}
            open={chatOpen}
            onOpenChange={setChatOpen}
            showFloatingButton={false}
          />
        )}

        {/* Rating Modal */}
        {ride && ride.driverId && showRatingModal && (
          <RateDriverModal
            open={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            rideId={ride.id}
            driverId={ride.driverId}
            driverName={driverDisplayName}
          />
        )}
      </div>
    </div>
  );
}
