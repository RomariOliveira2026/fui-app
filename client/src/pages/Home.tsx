import { useAuth } from "@/_core/hooks/useAuth";
import { WL } from "@/whitelabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Car, 
  MapPin, 
  DollarSign, 
  Star, 
  Shield, 
  Clock, 
  ArrowRight, 
  Smartphone,
  Users,
  Zap,
  Heart,
  Bike,
  Package,
  ChevronRight,
  Search,
  Home as HomeIcon,
  Briefcase,
  Loader2,
  Menu,
  X,
  History,
  Calendar,
  User,
  Settings,
  LogOut,
  Truck,
  CreditCard,
  ChevronLeft,
  Navigation
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useCallback, useEffect } from "react";
import { RequestRideMap } from "@/components/RequestRideMap";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  addAddressHistory,
  FUI_HISTORY_DESTINATION_KEY,
  FUI_HISTORY_ORIGIN_KEY,
  loadAddressHistory,
  type AddressHistoryItem,
} from "@/lib/addressHistory";
import { persistRideAddressHistory, resolveLocalPlaceId, simulateLocalRideRequest } from "@/lib/requestRideLocal";
import { useSavedAddresses } from "@/lib/useSavedAddresses";
import { getDemoPricingByVehicleType } from "@shared/demoPricing";
import { toast } from "sonner";
import { isLocalDemoDev } from "@/lib/demoMode";
import { usePassengerCurrentLocation } from "@/lib/usePassengerCurrentLocation";
import { persistDemoRideFromServer } from "@/lib/useDemoRideHydration";
import NotificationCenter from "@/components/NotificationCenter";
import AppLogoMark from "@/components/fui/AppLogoMark";
import PassengerActiveRideCard from "@/components/passenger/PassengerActiveRideCard";
import PassengerDashboardHeader from "@/components/passenger/PassengerDashboardHeader";
import PassengerGreeting from "@/components/passenger/PassengerGreeting";
import PassengerPrimaryActionCard from "@/components/passenger/PassengerPrimaryActionCard";
import PassengerQuickActions from "@/components/passenger/PassengerQuickActions";
import PassengerRecentRides from "@/components/passenger/PassengerRecentRides";
import { repeatRide } from "@/lib/ridePrefill";
import PassengerSavedAddressesPanel from "@/components/passenger/PassengerSavedAddressesPanel";
import PassengerSummaryCards from "@/components/passenger/PassengerSummaryCards";
import { cn } from "@/lib/utils";
import { fuiBrand, fuiSelectedTile, fuiSurface } from "@/lib/fuiTheme";
import { usePassengerDashboardData } from "@/lib/usePassengerDashboardData";

// ============================================
// LOGGED-IN HOME: Fullscreen Map + Ride Request
// ============================================

function LoggedInHome() {
  const { user, logout, canUsePrivateUserApi } = useAuth();
  const showAdminPanel = isLocalDemoDev() || user?.role === "admin";
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const isSidebarPathActive = (path: string) =>
    location === path || location.startsWith(`${path}/`);

  const sidebarNavClass = (active: boolean) =>
    cn(
      "w-full flex items-center gap-2.5 min-h-11 px-3 py-2.5 rounded-lg text-sm transition-all",
      active
        ? "bg-primary/12 text-foreground font-medium border-l-2 border-primary pl-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        : "text-muted-foreground hover:bg-accent/80 hover:text-foreground border-l-2 border-transparent"
    );

  const sidebarIconClass = (active: boolean) =>
    cn("w-[18px] h-[18px] shrink-0", active ? "text-primary" : "text-primary/80");
  const [requestMode, setRequestMode] = useState(false);
  const dashboard = usePassengerDashboardData();
  
  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Address state
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [originPlaceId, setOriginPlaceId] = useState("");
  const [destPlaceId, setDestPlaceId] = useState("");
  const [originHistory, setOriginHistory] = useState<AddressHistoryItem[]>([]);
  const [destinationHistory, setDestinationHistory] = useState<AddressHistoryItem[]>([]);
  
  // Route state
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [routePolylineEncoded, setRoutePolylineEncoded] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<"moto" | "carro" | "van" | "utilitario">("carro");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("cash");
  
  // Store coordinates for ride request (refs stay in sync for mutations)
  const originCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const shouldAutoLocate = requestMode && !originAddress.trim();
  const passengerLocation = usePassengerCurrentLocation({ enabled: shouldAutoLocate });
  
  // Requesting state
  const [requesting, setRequesting] = useState(false);
  
  // Data
  const { data: pricing } = trpc.pricing.getAll.useQuery();
  const { savedAddresses } = useSavedAddresses();
  const calculatePassengerRouteMutation = trpc.maps.calculatePassengerRoute.useMutation();
  const { data: myDriverProfile } = trpc.driver.getMyProfile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setOriginHistory(loadAddressHistory(FUI_HISTORY_ORIGIN_KEY));
    setDestinationHistory(loadAddressHistory(FUI_HISTORY_DESTINATION_KEY));
  }, []);

  useEffect(() => {
    if (!shouldAutoLocate || !passengerLocation.address) return;
    setOriginAddress(passengerLocation.address);
    if (passengerLocation.placeId) setOriginPlaceId(passengerLocation.placeId);
  }, [shouldAutoLocate, passengerLocation.address, passengerLocation.placeId]);

  useEffect(() => {
    if (!shouldAutoLocate || !passengerLocation.coords) return;
    originCoordsRef.current = passengerLocation.coords;
    setOriginCoords(passengerLocation.coords);
  }, [shouldAutoLocate, passengerLocation.coords]);

  useEffect(() => {
    if (!requestMode || passengerLocation.status !== "denied") return;
    toast.error(
      passengerLocation.errorMessage ??
        "Permissão de localização negada. Digite sua origem manualmente."
    );
  }, [requestMode, passengerLocation.status, passengerLocation.errorMessage]);

  const clearRoute = useCallback(() => {
    setRouteCalculated(false);
    setEstimatedPrice(null);
    setDistance(0);
    setDuration(0);
    setOriginCoords(null);
    setDestCoords(null);
    setRoutePath(null);
    setRoutePolylineEncoded(null);
    originCoordsRef.current = null;
    destCoordsRef.current = null;
  }, []);

  const resolvePriceForVehicle = useCallback(
    (type: typeof vehicleType, distM: number, durS: number) => {
      const vehiclePricing =
        pricing?.find((p: { vehicleType: string }) => p.vehicleType === type) ??
        getDemoPricingByVehicleType(type);
      if (!vehiclePricing || distM <= 0) return null;

      const distanceKm = distM / 1000;
      const durationMin = durS / 60;
      const calculatedPrice =
        vehiclePricing.basePrice +
        distanceKm * vehiclePricing.pricePerKm +
        durationMin * vehiclePricing.pricePerMinute;

      return Math.round(Math.max(calculatedPrice, vehiclePricing.minimumPrice));
    },
    [pricing]
  );

  const handleCalculateRoute = async () => {
    const originTrimmed = originAddress.trim();
    const destTrimmed = destinationAddress.trim();

    if (!originTrimmed || !destTrimmed) {
      toast.error("Preencha origem e destino");
      return;
    }

    setCalculating(true);
    clearRoute();

    try {
      const result = await calculatePassengerRouteMutation.mutateAsync({
        originAddress: originTrimmed,
        destinationAddress: destTrimmed,
        vehicleType,
        originPlaceId: originPlaceId || undefined,
        destinationPlaceId: destPlaceId || undefined,
      });

      if (result.origin.placeId) setOriginPlaceId(result.origin.placeId);
      if (result.destination.placeId) setDestPlaceId(result.destination.placeId);
      setOriginAddress(result.origin.displayName);
      setDestinationAddress(result.destination.displayName);

      const startCoords = { lat: result.origin.lat, lng: result.origin.lng };
      const endCoords = { lat: result.destination.lat, lng: result.destination.lng };

      originCoordsRef.current = startCoords;
      destCoordsRef.current = endCoords;
      setOriginCoords(startCoords);
      setDestCoords(endCoords);
      setRoutePath(result.routePath);
      setRoutePolylineEncoded(result.overviewPolyline);
      setDistance(result.distance);
      setDuration(result.duration);
      setEstimatedPrice(result.estimatedPrice);
      setRouteCalculated(true);

      const { originHistory: nextOrigin, destinationHistory: nextDest } =
        persistRideAddressHistory(
          result.origin.displayName,
          result.destination.displayName,
          result.origin.placeId,
          result.destination.placeId
        );
      setOriginHistory(nextOrigin);
      setDestinationHistory(nextDest);

      if (result.usedDemoLocationFallback) {
        toast.warning("Algum endereço usou fallback local — confira origem e destino no mapa.");
      }

      toast.success(`Rota: ${result.distanceText} - ${result.durationText}`);
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao calcular rota");
    } finally {
      setCalculating(false);
    }
  };

  const requestRide = trpc.ride.request.useMutation();

  const handleRequestRide = async () => {
    if (!routeCalculated || !estimatedPrice || estimatedPrice <= 0 || distance <= 0 || duration <= 0) {
      toast.error("Calcule a rota primeiro");
      return;
    }
    if (!originCoordsRef.current || !destCoordsRef.current) {
      toast.error("Calcule a rota primeiro");
      return;
    }

    const payload = {
      vehicleType,
      originAddress,
      originLat: String(originCoordsRef.current.lat),
      originLng: String(originCoordsRef.current.lng),
      destinationAddress,
      destinationLat: String(destCoordsRef.current.lat),
      destinationLng: String(destCoordsRef.current.lng),
      distance,
      duration,
      estimatedPrice,
      paymentMethod,
    };

    setRequesting(true);

    try {
      const data = await requestRide.mutateAsync(payload);
      if (isLocalDemoDev()) {
        try {
          const created = await utils.ride.getById.fetch({ rideId: data.rideId });
          persistDemoRideFromServer(created);
        } catch {
          // ignore
        }
      }
      if (isLocalDemoDev() || paymentMethod === "cash") {
        toast.success("Corrida solicitada! Buscando motoristas...");
        setLocation(`/ride/${data.rideId}`);
      } else {
        toast.success("Corrida solicitada! Redirecionando para pagamento...");
        setLocation(`/payment/${data.rideId}`);
      }
    } catch (error) {
      if (!isLocalDemoDev()) {
        toast.error(error instanceof Error ? error.message : "Erro ao solicitar corrida");
        return;
      }

      const rideId = simulateLocalRideRequest(payload);
      toast.success("Corrida solicitada (demo local)!");
      setLocation(`/ride/${rideId}`);
    } finally {
      setRequesting(false);
    }
  };

  const vehicleOptions = [
    { type: "moto" as const, icon: Bike, label: "Moto" },
    { type: "carro" as const, icon: Car, label: "Carro" },
    { type: "van" as const, icon: Truck, label: "Van" },
    { type: "utilitario" as const, icon: Package, label: "Utilitário" },
  ];

  const openRequestFlow = (prefill?: { origin?: string; destination?: string }) => {
    clearRoute();
    if (prefill?.origin) setOriginAddress(prefill.origin);
    if (prefill?.destination) setDestinationAddress(prefill.destination);
    setRequestMode(true);
  };

  const locationBias = passengerLocation.coords ?? originCoords;

  return (
    <div
      className={cn(
        requestMode
          ? "h-screen w-screen relative overflow-hidden bg-background"
          : "min-h-screen bg-background"
      )}
    >
      {requestMode ? (
        <>
      {/* Fullscreen map — Leaflet/OSM em DEV (mesmo padrão de /request-ride) */}
      <div className="absolute inset-0 z-0">
        <RequestRideMap
          className="w-full h-full !rounded-none border-0"
          origin={originCoords}
          destination={destCoords}
          routePath={routePath}
          encodedPolyline={routePolylineEncoded}
        />
      </div>

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="relative mx-auto flex min-h-[3.75rem] sm:min-h-16 max-w-screen-xl items-center justify-center px-3 sm:px-4 pt-1">
          <button
            type="button"
            onClick={() => setRequestMode(false)}
            aria-label="Voltar ao início"
            className={cn(
              "pointer-events-auto absolute left-3 sm:left-4 top-6 sm:top-7",
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              "border border-border bg-card/95 shadow-lg backdrop-blur-sm",
              "text-foreground transition-colors hover:bg-accent"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="pointer-events-none flex max-w-[58%] sm:max-w-[50%] items-center justify-center px-[3.25rem] sm:px-20 pt-1">
            <AppLogoMark variant="onMap" />
          </div>

          <div className="pointer-events-auto absolute right-3 sm:right-4 top-6 sm:top-7 flex items-center gap-2">
            {canUsePrivateUserApi ? (
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden",
                  "border border-border bg-card/95 shadow-lg backdrop-blur-sm"
                )}
              >
                <NotificationCenter />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setLocation(showAdminPanel ? "/admin" : "/profile")}
              aria-label={showAdminPanel ? "Central operacional" : "Meu perfil"}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                "border border-border bg-card/95 shadow-lg backdrop-blur-sm",
                "text-foreground transition-colors hover:bg-accent"
              )}
            >
              {showAdminPanel ? (
                <Settings className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Card - Address Input & Vehicle Selection */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Calculating overlay */}
        {calculating && (
          <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-card rounded-2xl p-6 shadow-2xl border border-border text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <MapPin className="absolute inset-0 m-auto w-7 h-7 text-primary" />
              </div>
              <p className="text-foreground font-semibold">Calculando rota...</p>
            </div>
          </div>
        )}

        <div className="bg-background rounded-t-3xl border-t border-border shadow-2xl">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          <div className="px-4 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-bold text-lg">
                  Para onde, {user?.name?.split(" ")[0]}?
                </p>
                <p className="text-muted-foreground text-sm">Solicite sua corrida agora</p>
              </div>
            </div>

            {/* Address Inputs with Autocomplete */}
            <div className="space-y-2">
              {/* Origin */}
              <div className="relative">
                <AddressAutocomplete
                  value={originAddress}
                  onChange={(val) => { setOriginAddress(val); setOriginPlaceId(""); if (routeCalculated) clearRoute(); }}
                  onSelect={(result) => {
                    setOriginAddress(result.address);
                    setOriginPlaceId(result.placeId);
                    if (routeCalculated) clearRoute();
                  }}
                  onConfirm={(address) => {
                    const placeId = resolveLocalPlaceId(address, originPlaceId || undefined);
                    if (placeId) setOriginPlaceId(placeId);
                    addAddressHistory(FUI_HISTORY_ORIGIN_KEY, { address, placeId });
                    setOriginHistory(loadAddressHistory(FUI_HISTORY_ORIGIN_KEY));
                  }}
                  placeholder={passengerLocation.isLocating ? "Obtendo sua localização..." : "Onde você está?"}
                  icon={<div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-300" />}
                  historyItems={originHistory}
                  savedAddresses={savedAddresses}
                  locationBias={locationBias}
                />
                {(passengerLocation.status === "denied" || passengerLocation.status === "error") && (
                  <button
                    type="button"
                    onClick={() => void passengerLocation.retry()}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-[#F39200] hover:text-[#F39200]/80"
                    aria-label="Usar minha localização"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Connecting line */}
              <div className="flex items-center pl-[18px]">
                <div className="w-[2px] h-2 bg-border" />
              </div>

              {/* Destination */}
              <AddressAutocomplete
                value={destinationAddress}
                onChange={(val) => { setDestinationAddress(val); setDestPlaceId(""); if (routeCalculated) clearRoute(); }}
                onSelect={(result) => {
                  setDestinationAddress(result.address);
                  setDestPlaceId(result.placeId);
                  if (routeCalculated) clearRoute();
                }}
                onConfirm={(address) => {
                  const placeId = resolveLocalPlaceId(address, destPlaceId || undefined);
                  if (placeId) setDestPlaceId(placeId);
                  addAddressHistory(FUI_HISTORY_DESTINATION_KEY, { address, placeId });
                  setDestinationHistory(loadAddressHistory(FUI_HISTORY_DESTINATION_KEY));
                }}
                placeholder="Para onde vai?"
                icon={<div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/40" />}
                historyItems={destinationHistory}
                savedAddresses={savedAddresses}
                locationBias={locationBias}
              />
            </div>

            {/* Vehicle Type Selection */}
            {(originAddress || destinationAddress) && (
              <div className="flex gap-2">
                {vehicleOptions.map((v) => {
                  const isSelected = vehicleType === v.type;
                  return (
                    <button
                      key={v.type}
                      onClick={() => {
                        setVehicleType(v.type);
                        if (routeCalculated && distance > 0) {
                          const nextPrice = resolvePriceForVehicle(v.type, distance, duration);
                          if (nextPrice != null) setEstimatedPrice(nextPrice);
                        }
                      }}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 py-2.5",
                        fuiSelectedTile(isSelected)
                      )}
                    >
                      <v.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Payment Method */}
            {routeCalculated && estimatedPrice !== null && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Forma de Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl py-3 px-2",
                      fuiSelectedTile(paymentMethod === "cash")
                    )}
                  >
                    <DollarSign className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Dinheiro</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("pix")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl py-3 px-2",
                      fuiSelectedTile(paymentMethod === "pix")
                    )}
                  >
                    <Smartphone className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">PIX</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl py-3 px-2",
                      fuiSelectedTile(paymentMethod === "card")
                    )}
                  >
                    <CreditCard className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Cartão</span>
                  </button>
                </div>
              </div>
            )}

            {/* Route Info */}
            {routeCalculated && estimatedPrice !== null && (
              <div className={cn(fuiSurface.price, "p-4")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Distância</p>
                      <p className="text-foreground font-semibold">{(distance / 1000).toFixed(1)} km</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Tempo</p>
                      <p className="text-foreground font-semibold">{Math.round(duration / 60)} min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estimativa</p>
                    <p className={cn(fuiBrand.text, "font-bold text-xl")}>
                      R$ {(estimatedPrice / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            {!routeCalculated ? (
              <Button
                onClick={handleCalculateRoute}
                disabled={!originAddress || !destinationAddress || calculating}
                className={cn("w-full py-6 font-bold text-base rounded-xl shadow-lg shadow-primary/20", fuiBrand.btn)}
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Calcular Rota
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={clearRoute}
                  variant="outline"
                  className="flex-1 py-6 border-border text-muted-foreground hover:bg-card rounded-xl"
                >
                  Alterar
                </Button>
                <Button
                  onClick={handleRequestRide}
                  disabled={requesting || requestRide.isPending}
                  className={cn("flex-[2] py-6 font-bold text-base rounded-xl shadow-lg shadow-primary/20", fuiBrand.btn)}
                >
                  {requesting || requestRide.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Buscando motorista...
                    </>
                  ) : (
                    <>
                      Solicitar Corrida
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      ) : (
        <>
          <PassengerDashboardHeader
            onMenuClick={() => setSidebarOpen(true)}
            onProfileClick={() => setLocation(showAdminPanel ? "/admin" : "/profile")}
            isAdmin={showAdminPanel}
            canUsePrivateUserApi={canUsePrivateUserApi}
          />

          <main className="mx-auto max-w-screen-xl space-y-6 px-4 pb-10 pt-2">
            <PassengerGreeting name={dashboard.displayUser?.name} />

            {dashboard.activeRide ? (
              <PassengerActiveRideCard
                ride={dashboard.activeRide}
                onViewDetails={() => setLocation(`/ride/${dashboard.activeRide!.id}`)}
              />
            ) : (
              <PassengerPrimaryActionCard
                onRequestRide={() => openRequestFlow()}
                onScheduleRide={() => setLocation("/request-ride")}
              />
            )}

            <PassengerQuickActions
              hasHome={!!dashboard.homeAddress}
              hasWork={!!dashboard.workAddress}
              hasLastRide={!!dashboard.lastRide}
              onHome={() =>
                dashboard.homeAddress &&
                openRequestFlow({ destination: dashboard.homeAddress.address })
              }
              onWork={() =>
                dashboard.workAddress &&
                openRequestFlow({ destination: dashboard.workAddress.address })
              }
              onLastRide={() =>
                dashboard.lastRide &&
                openRequestFlow({
                  origin: dashboard.lastRide.originAddress,
                  destination: dashboard.lastRide.destinationAddress,
                })
              }
              onSavedAddresses={() => setLocation("/saved-addresses")}
              onHistory={() => setLocation("/ride-history")}
              onFavorites={() => setLocation("/favorite-drivers")}
            />

            <PassengerSummaryCards summary={dashboard.summary} />

            <PassengerRecentRides
              rides={dashboard.recentRides}
              onViewAll={() => setLocation("/ride-history")}
              onRequestFirst={() => openRequestFlow()}
              onRepeat={(ride) => repeatRide(ride, setLocation)}
            />

            <PassengerSavedAddressesPanel
              addresses={dashboard.savedAddresses}
              onUseAddress={(address) => openRequestFlow({ destination: address })}
              onManage={() => setLocation("/saved-addresses")}
            />
          </main>
        </>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[min(20rem,88vw)] bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="px-4 pt-3.5 pb-3 border-b border-border/80 shrink-0 bg-gradient-to-b from-primary/[0.07] via-primary/[0.02] to-transparent">
              <div className="flex items-center justify-between mb-2.5">
                {WL.logoUrl ? (
                  <img src={WL.logoUrl} alt={WL.appName} className="h-6 w-auto object-contain" />
                ) : (
                  <span className="text-base font-bold tracking-tight text-primary">{WL.appName}</span>
                )}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 -mr-1.5 text-muted-foreground hover:text-foreground rounded-md"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/85 ring-2 ring-primary/25 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
                  {dashboard.displayUser?.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate leading-tight">
                    {dashboard.displayUser?.name || "Usuário"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-snug mt-0.5">
                    {dashboard.displayUser?.email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-0.5">
              {[
                { icon: Car, label: "Solicitar Corrida", action: () => openRequestFlow() },
                { icon: History, label: "Histórico de Corridas", path: "/ride-history" },
                { icon: Calendar, label: "Corridas Agendadas", path: "/scheduled-rides" },
                { icon: MapPin, label: "Endereços Salvos", path: "/saved-addresses" },
                { icon: User, label: "Meu Perfil", path: "/profile" },
                { icon: Shield, label: "Contatos de Emergência", path: "/emergency-contacts" },
              ].map((item) => {
                const active = "path" in item && item.path ? isSidebarPathActive(item.path) : false;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSidebarOpen(false);
                      if ("action" in item && item.action) item.action();
                      else if ("path" in item && item.path) setLocation(item.path);
                    }}
                    className={sidebarNavClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className={sidebarIconClass(active)} strokeWidth={2} />
                    <span className="text-left leading-tight">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-border my-2" />

              {[
                { icon: Heart, label: "Motoristas Favoritos", path: "/favorite-drivers" },
                { icon: Package, label: "Fui! Entregas", path: "/delivery" },
                { icon: Truck, label: "Fui Utilitários", path: "/utilities" },
                { icon: Users, label: "Indique e Ganhe", path: "/referrals" },
              ].map((item) => {
                const active = isSidebarPathActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => { setSidebarOpen(false); setLocation(item.path); }}
                    className={sidebarNavClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className={sidebarIconClass(active)} strokeWidth={2} />
                    <span className="text-left leading-tight">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-border my-2" />

              <button
                onClick={() => { setSidebarOpen(false); setLocation("/become-driver"); }}
                className={sidebarNavClass(isSidebarPathActive("/become-driver"))}
                aria-current={isSidebarPathActive("/become-driver") ? "page" : undefined}
              >
                <Briefcase className={sidebarIconClass(isSidebarPathActive("/become-driver"))} strokeWidth={2} />
                <span className="text-left leading-tight">Quero Ser Motorista</span>
              </button>

              {showAdminPanel && (
                <button
                  onClick={() => { setSidebarOpen(false); setLocation("/admin"); }}
                  className={sidebarNavClass(location.startsWith("/admin"))}
                  aria-current={location.startsWith("/admin") ? "page" : undefined}
                >
                  <Settings className={sidebarIconClass(location.startsWith("/admin"))} strokeWidth={2} />
                  <span className="text-left leading-tight">Central Operacional</span>
                </button>
              )}

              {(user?.role === "driver" || user?.role === "admin" || myDriverProfile) && (
                <button
                  onClick={() => { setSidebarOpen(false); setLocation("/driver-dashboard"); }}
                  className={sidebarNavClass(isSidebarPathActive("/driver-dashboard"))}
                  aria-current={isSidebarPathActive("/driver-dashboard") ? "page" : undefined}
                >
                  <Car className={sidebarIconClass(isSidebarPathActive("/driver-dashboard"))} strokeWidth={2} />
                  <span className="text-left leading-tight">Dashboard Motorista</span>
                </button>
              )}

              <div className="border-t border-border my-2" />

              <button
                onClick={async () => { await logout(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2.5 min-h-11 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors border-l-2 border-transparent"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <span className="text-left leading-tight">Sair</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// VISITOR HOME: Landing Page
// ============================================

function VisitorHome() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/request-ride");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-card/95 backdrop-blur-md border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {WL.logoUrl ? (
                <img src={WL.logoUrl} alt={`${WL.appName} - Mobilidade Urbana em ${WL.city}`} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-primary">{WL.appName}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/request-ride")} className="hidden md:flex">
  Entrar
</Button>
              <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-semibold text-primary">
                <Zap className="w-4 h-4" />
                Mobilidade urbana em {WL.city}
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Transporte e mobilidade urbana em{" "}
                <span className="text-primary">{WL.city}</span> com{" "}
                <span className="text-primary">preços populares</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                O {WL.appName} é o aplicativo de transporte urbano que conecta você aos melhores motoristas de {WL.city}. 
                Solicite corridas de moto, carro, van ou utilitário com segurança, rapidez e preços justos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group"
                  onClick={handleGetStarted}
                >
                  Solicitar Corrida
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10"
                  onClick={() => setLocation("/become-driver")}
                >
                  Quero Ser Motorista
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Corridas realizadas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.8★</div>
                  <div className="text-sm text-muted-foreground">Avaliação média</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Motoristas ativos</div>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[600px] rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center animate-float">
                      <Car className="w-16 h-16 text-primary-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">Seu motorista a caminho!</p>
                  </div>
                </div>
                <div className="absolute top-20 left-10 p-4 bg-card border border-border rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">2 min</div>
                      <div className="text-xs text-muted-foreground">Tempo de espera</div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-20 right-10 p-4 bg-card border border-border rounded-xl shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">R$ 8,50</div>
                      <div className="text-xs text-muted-foreground">Preço justo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Por que escolher o <span className="text-primary">{WL.appName}</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologia, segurança e economia em uma única plataforma de mobilidade urbana
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Segurança Garantida", description: "Motoristas verificados e corridas rastreadas em tempo real via GPS" },
              { icon: DollarSign, title: "Preços Justos", description: "Tarifas transparentes e preços populares, sem surpresas" },
              { icon: Clock, title: "Rapidez", description: "Encontre um motorista próximo em segundos" },
              { icon: Star, title: "Motoristas 5 Estrelas", description: "Profissionais avaliados e comprometidos" },
              { icon: Smartphone, title: "Fácil de Usar", description: "Interface intuitiva para solicitar corridas em poucos toques" },
              { icon: Heart, title: "Suporte Local", description: "Atendimento dedicado para passageiros e motoristas" }
            ].map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-1 group">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Escolha o veículo ideal
            </h2>
            <p className="text-xl text-muted-foreground">
              Diferentes opções de transporte para cada necessidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bike, name: "Moto", desc: "Rápido e econômico", color: "from-orange-500 to-red-500" },
              { icon: Car, name: "Carro", desc: "Confortável e seguro", color: "from-primary to-orange-600" },
              { icon: Users, name: "Van", desc: "Espaçoso para grupos", color: "from-orange-600 to-yellow-600" },
              { icon: Package, name: "Utilitário", desc: "Frete e mudanças", color: "from-yellow-600 to-orange-500" }
            ].map((vehicle, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-2 group cursor-pointer">
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${vehicle.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <vehicle.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{vehicle.name}</h3>
                  <p className="text-muted-foreground">{vehicle.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/10 via-card to-primary/5">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-none shadow-2xl shadow-primary/20">
            <CardContent className="p-12 md:p-16 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
                Pronto para sua corrida?
              </h2>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Faça sua primeira corrida agora no {WL.appName}!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg group"
                  onClick={handleGetStarted}
                >
                  Solicitar Corrida Agora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10"
                  onClick={() => setLocation("/become-driver")}
                >
                  Seja um Motorista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              {WL.logoUrl ? (
                <img src={WL.logoUrl} alt={WL.appName} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-primary">{WL.appName}</span>
              )}
              <p className="text-muted-foreground">
                Transporte e mobilidade urbana em {WL.city}.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Passageiros</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/request-ride" className="hover:text-primary transition-colors">Solicitar Corrida</a></li>
                <li><a href="/scheduled-rides" className="hover:text-primary transition-colors">Corridas Agendadas</a></li>
                <li><a href="/ride-history" className="hover:text-primary transition-colors">Histórico</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Motoristas</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/become-driver" className="hover:text-primary transition-colors">Seja Motorista</a></li>
                <li><a href="/driver-dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/emergency-contacts" className="hover:text-primary transition-colors">Emergência</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {WL.appName} Mobilidade Urbana - {WL.city}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// MAIN HOME COMPONENT
// ============================================

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <LoggedInHome />;
  }

  return <VisitorHome />;
}
