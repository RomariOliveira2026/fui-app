import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation, DollarSign, Bike, Car as CarIcon, Truck, Tag, X, Home, Briefcase, Star, Smartphone, CreditCard, Package, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { RequestRideMap } from "@/components/RequestRideMap";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  addAddressHistory,
  FUI_HISTORY_DESTINATION_KEY,
  FUI_HISTORY_ORIGIN_KEY,
  loadAddressHistory,
  type AddressHistoryItem,
} from "@/lib/addressHistory";
import AppHeader from "@/components/AppHeader";
import { ScheduleRideDialog, type ScheduleRideResult } from "@/components/ScheduleRideDialog";
import ThirdPartyRideFields from "@/components/passenger/ThirdPartyRideFields";
import IntermediateStopsFields from "@/components/passenger/IntermediateStopsFields";
import {
  loadRidePrefill,
  clearRidePrefill,
  discardInvalidRidePrefill,
  isCompleteRidePrefill,
  MIN_RIDE_PREFILL_ADDRESS_LENGTH,
} from "@/lib/ridePrefill";
import type { BookedForThirdParty, IntermediateStop, IntermediateStopInput } from "@shared/passengerPremium";
import { estimateDemoRidePriceCents } from "@shared/demoPricing";
import { useSavedAddresses } from "@/lib/useSavedAddresses";
import { isLocalDemoDev, isDemoAppClient } from "@/lib/demoMode";
import { usePassengerCurrentLocation } from "@/lib/usePassengerCurrentLocation";
import { useDemoFleetDrivers } from "@/lib/useDemoFleetDrivers";
import { fetchRouteWithDemoFallback } from "@/lib/demoRoute";
import { getRideFlowErrorMessage } from "@/lib/rideFlowErrors";
import {
  persistRideAddressHistory,
  resolveLocalPlaceId,
  simulateLocalRideRequest,
} from "@/lib/requestRideLocal";
import {
  persistDemoRideAfterRequest,
  persistDemoRideFromServer,
} from "@/lib/useDemoRideHydration";
import { syncDemoRecurringSchedulesFromServer } from "@/lib/demoRecurringStorage";
import { fuiBrand, fuiRoute, fuiSelectedTile, fuiSurface } from "@/lib/fuiTheme";
import { formatAddressForGeocoding } from "@shared/mapDefaults";
import {
  hasCityConflictBetweenAddresses,
  pickResolvedAddressLabel,
} from "@shared/addressGeocoding";
import { findSergipeKnownPlaceByPlaceId } from "@shared/sergipeKnownPlaces";
import {
  getDefaultOriginSelection,
  seedDefaultOriginHistory,
} from "@/lib/defaultOriginAddress";
import { getDefaultPassengerHome } from "@shared/defaultHomeAddress";
import { WL } from "@/whitelabel";
import StatusPanel from "@/components/fui/StatusPanel";
import RideCategoryCompare from "@/components/ride/RideCategoryCompare";
import RideRequestSummary from "@/components/ride/RideRequestSummary";
import { usePassengerRideQuote } from "@/hooks/usePassengerRideQuote";

export default function RequestRide() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [vehicleType, setVehicleType] = useState<"moto" | "carro" | "van" | "utilitario">("carro");
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("cash");
  
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routePolylineEncoded, setRoutePolylineEncoded] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const [intermediateStops, setIntermediateStops] = useState<IntermediateStopInput[]>([]);
  const [resolvedIntermediateStops, setResolvedIntermediateStops] = useState<IntermediateStop[]>([]);
  const [thirdPartyEnabled, setThirdPartyEnabled] = useState(false);
  const [bookedFor, setBookedFor] = useState<BookedForThirdParty>({ name: "", phone: "" });
  const prefillAppliedRef = useRef(false);
  const originFromGpsRef = useRef(false);
  const lowAccuracyWarnedRef = useRef(false);
  const [autoLocateOrigin, setAutoLocateOrigin] = useState(false);
  
  // Carpool fields
  const [isShared, setIsShared] = useState(false);
  const [maxPassengers, setMaxPassengers] = useState(2);
  const [pricePerPassenger, setPricePerPassenger] = useState<number | null>(null);
  
  // Freight-specific fields
  const [cargoWeight, setCargoWeight] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [needsHelpers, setNeedsHelpers] = useState(false);
  const [numberOfHelpers, setNumberOfHelpers] = useState(0);
  
  // Place IDs for Google Maps
  const [originPlaceId, setOriginPlaceId] = useState("");
  const [destPlaceId, setDestPlaceId] = useState("");
  const [originHistory, setOriginHistory] = useState<AddressHistoryItem[]>([]);
  const [destinationHistory, setDestinationHistory] = useState<AddressHistoryItem[]>([]);

  const originPlaceIdRef = useRef(originPlaceId);
  const destPlaceIdRef = useRef(destPlaceId);
  useEffect(() => {
    originPlaceIdRef.current = originPlaceId;
  }, [originPlaceId]);
  useEffect(() => {
    destPlaceIdRef.current = destPlaceId;
  }, [destPlaceId]);

  const syncHistoryFromStorage = () => {
    setOriginHistory(loadAddressHistory(FUI_HISTORY_ORIGIN_KEY));
    setDestinationHistory(loadAddressHistory(FUI_HISTORY_DESTINATION_KEY));
  };

  const recordOriginHistory = (address: string, placeId?: string) => {
    const next = addAddressHistory(FUI_HISTORY_ORIGIN_KEY, { address, placeId });
    setOriginHistory(next);
  };

  const recordDestinationHistory = (address: string, placeId?: string) => {
    const next = addAddressHistory(FUI_HISTORY_DESTINATION_KEY, { address, placeId });
    setDestinationHistory(next);
  };

  const resolveDemoPlaceIdForHistory = (address: string, currentPlaceId?: string) =>
    resolveLocalPlaceId(address, currentPlaceId);

  const sanitizePlaceIdForAddress = (address: string, placeId?: string) => {
    if (!placeId) return undefined;
    const sergipe = findSergipeKnownPlaceByPlaceId(placeId);
    if (sergipe && hasCityConflictBetweenAddresses(address, sergipe.displayName)) {
      return undefined;
    }
    return placeId;
  };

  const clearRouteCalculation = () => {
    routeReadyRef.current = false;
    estimatedPriceRef.current = null;
    distanceRef.current = 0;
    durationRef.current = 0;
    setRouteCalculated(false);
    setEstimatedPrice(null);
    setDistance(0);
    setDuration(0);
    setOriginCoords(null);
    setDestCoords(null);
    setRoutePolylineEncoded(null);
    setRoutePath(null);
    originCoordsRef.current = null;
    destCoordsRef.current = null;
    setPricePerPassenger(null);
    setCouponCode("");
    setAppliedCoupon(null);
    setResolvedIntermediateStops([]);
  };

  const activeIntermediateStopsForQuote = useMemo(
    () => intermediateStops.filter((s) => s.address.trim().length >= 2),
    [intermediateStops]
  );

  // Store coordinates and route snapshot for ride request (refs = leitura síncrona)
  const originCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const routeReadyRef = useRef(false);
  const estimatedPriceRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const durationRef = useRef(0);

  const shouldAutoLocate = autoLocateOrigin && !originAddress.trim();
  const passengerLocation = usePassengerCurrentLocation({ enabled: shouldAutoLocate });
  const fleetMapCenter = passengerLocation.coords ?? originCoords;
  const nearbyDemoDrivers = useDemoFleetDrivers(fleetMapCenter);

  const handleUseCurrentLocation = () => {
    setAutoLocateOrigin(true);
    originFromGpsRef.current = true;
    lowAccuracyWarnedRef.current = false;
    clearRouteCalculation();
    setOriginAddress("");
    setOriginPlaceId("");
    originPlaceIdRef.current = "";
    void passengerLocation.requestLocation({ forceFresh: true });
  };

  const utils = trpc.useUtils();

  useLayoutEffect(() => {
    discardInvalidRidePrefill();
  }, []);

  useEffect(() => {
    setOriginHistory(seedDefaultOriginHistory());
    setDestinationHistory(loadAddressHistory(FUI_HISTORY_DESTINATION_KEY));

    const prefill = loadRidePrefill();
    if (prefill && isCompleteRidePrefill(prefill)) return;

    const defaults = getDefaultOriginSelection();
    originFromGpsRef.current = false;
    setOriginAddress(defaults.address);
    setOriginPlaceId(defaults.placeId);
    originPlaceIdRef.current = defaults.placeId;
    originCoordsRef.current = defaults.coords;
    setOriginCoords(defaults.coords);
  }, []);

  useEffect(() => {
    if (!autoLocateOrigin || passengerLocation.status !== "ready") return;
    if (!passengerLocation.address || !passengerLocation.coords) return;

    setOriginAddress(passengerLocation.address);
    if (passengerLocation.placeId) {
      setOriginPlaceId(passengerLocation.placeId);
      originPlaceIdRef.current = passengerLocation.placeId;
    }
    originFromGpsRef.current = true;
  }, [
    autoLocateOrigin,
    passengerLocation.status,
    passengerLocation.address,
    passengerLocation.placeId,
    passengerLocation.coords,
  ]);

  useEffect(() => {
    if (!autoLocateOrigin || passengerLocation.status !== "ready" || !passengerLocation.coords) {
      return;
    }
    originCoordsRef.current = passengerLocation.coords;
    setOriginCoords(passengerLocation.coords);
  }, [autoLocateOrigin, passengerLocation.status, passengerLocation.coords]);

  useEffect(() => {
    if (passengerLocation.status !== "ready" || lowAccuracyWarnedRef.current) return;
    const accuracy = passengerLocation.accuracyMeters;
    if (accuracy != null && accuracy > 800) {
      lowAccuracyWarnedRef.current = true;
      toast.warning("Localização aproximada — confira o endereço exibido.");
    }
  }, [passengerLocation.status, passengerLocation.accuracyMeters]);

  useEffect(() => {
    if (passengerLocation.status !== "denied" && passengerLocation.status !== "error") return;
    toast.error(
      passengerLocation.errorMessage ??
        "Permissão de localização negada. Digite sua origem manualmente."
    );
  }, [passengerLocation.status, passengerLocation.errorMessage]);

  const { data: mapsConfigured } = trpc.maps.isConfigured.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const useOsmRouting = isDemoAppClient() || isLocalDemoDev() || mapsConfigured !== true;

  const { data: pricing } = trpc.pricing.getAll.useQuery();
  const { savedAddresses } = useSavedAddresses();
  
  const validateCouponMutation = trpc.coupon.validate.useQuery(
    {
      code: couponCode,
      rideValue: estimatedPrice || 0,
      vehicleType,
    },
    {
      enabled: false,
    }
  );

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error("Digite um código de cupom");
      return;
    }
    if (!estimatedPrice) {
      toast.error("Calcule o preço primeiro");
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await validateCouponMutation.refetch();
      if (result.data) {
        setAppliedCoupon(result.data);
        toast.success(`Cupom aplicado! Desconto de R$ ${(result.data.discountAmount / 100).toFixed(2)}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Cupom inválido");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    toast.info("Cupom removido");
  };

  const scheduleRide = trpc.scheduling.scheduleRide.useMutation();

  const requestRide = trpc.ride.request.useMutation();
  const calculatePassengerRouteMutation = trpc.maps.calculatePassengerRoute.useMutation();

  const rideQuote = usePassengerRideQuote({
    originAddress,
    destinationAddress,
    vehicleType,
    originPlaceId: originPlaceIdRef.current || originPlaceId || undefined,
    destinationPlaceId: destPlaceIdRef.current || destPlaceId || undefined,
    originLat:
      originFromGpsRef.current && originCoordsRef.current
        ? String(originCoordsRef.current.lat)
        : undefined,
    originLng:
      originFromGpsRef.current && originCoordsRef.current
        ? String(originCoordsRef.current.lng)
        : undefined,
    intermediateStops:
      activeIntermediateStopsForQuote.length > 0 ? activeIntermediateStopsForQuote : undefined,
    enabled: true,
    allowDemoFallback: isDemoAppClient() || useOsmRouting,
  });

  useEffect(() => {
    if (rideQuote.loading && !rideQuote.ready) {
      setRouteCalculated(false);
    }
  }, [rideQuote.loading, rideQuote.ready]);

  useEffect(() => {
    if (!rideQuote.ready) return;

    if (rideQuote.originCoords) {
      originCoordsRef.current = rideQuote.originCoords;
      setOriginCoords(rideQuote.originCoords);
    }
    if (rideQuote.destCoords) {
      destCoordsRef.current = rideQuote.destCoords;
      setDestCoords(rideQuote.destCoords);
    }
    setRoutePath(rideQuote.routePath);
    setRoutePolylineEncoded(rideQuote.overviewPolyline);
    setDistance(rideQuote.distance);
    setDuration(rideQuote.duration);
    distanceRef.current = rideQuote.distance;
    durationRef.current = rideQuote.duration;
    estimatedPriceRef.current = rideQuote.estimatedPrice;
    routeReadyRef.current = true;
    setEstimatedPrice(rideQuote.estimatedPrice);
    setRouteCalculated(true);
  }, [
    rideQuote.ready,
    rideQuote.originCoords,
    rideQuote.destCoords,
    rideQuote.routePath,
    rideQuote.overviewPolyline,
    rideQuote.distance,
    rideQuote.duration,
    rideQuote.estimatedPrice,
  ]);

  useEffect(() => {
    if (!rideQuote.ready) return;
    const nextPrice = rideQuote.priceForVehicle(vehicleType);
    if (nextPrice != null) {
      setEstimatedPrice(nextPrice);
      estimatedPriceRef.current = nextPrice;
    }
  }, [vehicleType, rideQuote.ready, rideQuote.categoryQuotes, rideQuote.priceForVehicle]);

  useEffect(() => {
    if (!rideQuote.error) return;
    if (
      originAddress.trim().length >= MIN_RIDE_PREFILL_ADDRESS_LENGTH &&
      destinationAddress.trim().length >= MIN_RIDE_PREFILL_ADDRESS_LENGTH
    ) {
      toast.error(rideQuote.error);
    }
  }, [rideQuote.error, originAddress, destinationAddress]);

  const applyPassengerRouteResult = (
    result: Awaited<ReturnType<typeof calculatePassengerRouteMutation.mutateAsync>>,
    userAddresses?: {
      origin?: string;
      destination?: string;
      originTrustedPlace?: boolean;
      destinationTrustedPlace?: boolean;
    }
  ) => {
    const typedOrigin = (userAddresses?.origin ?? originAddress).trim();
    const typedDestination = (userAddresses?.destination ?? destinationAddress).trim();

    const originLabel = userAddresses?.originTrustedPlace
      ? pickResolvedAddressLabel(typedOrigin, result.origin.displayName, {
          trustedPlaceSelection: true,
        })
      : typedOrigin || result.origin.displayName;

    const destinationLabel = userAddresses?.destinationTrustedPlace
      ? pickResolvedAddressLabel(typedDestination, result.destination.displayName, {
          trustedPlaceSelection: true,
        })
      : pickResolvedAddressLabel(typedDestination, result.destination.displayName);

    if (result.origin.placeId && !hasCityConflictBetweenAddresses(originLabel, result.origin.displayName)) {
      originPlaceIdRef.current = result.origin.placeId;
      setOriginPlaceId(result.origin.placeId);
    } else {
      originPlaceIdRef.current = "";
      setOriginPlaceId("");
    }
    if (
      result.destination.placeId &&
      !hasCityConflictBetweenAddresses(destinationLabel, result.destination.displayName)
    ) {
      destPlaceIdRef.current = result.destination.placeId;
      setDestPlaceId(result.destination.placeId);
    } else {
      destPlaceIdRef.current = "";
      setDestPlaceId("");
    }

    setOriginAddress(originLabel);
    setDestinationAddress(destinationLabel);

    const { originHistory: nextOriginHistory, destinationHistory: nextDestHistory } =
      persistRideAddressHistory(
        originLabel,
        destinationLabel,
        originPlaceIdRef.current || undefined,
        destPlaceIdRef.current || undefined
      );
    setOriginHistory(nextOriginHistory);
    setDestinationHistory(nextDestHistory);

    const startCoords = { lat: result.origin.lat, lng: result.origin.lng };
    const endCoords = { lat: result.destination.lat, lng: result.destination.lng };

    originCoordsRef.current = startCoords;
    destCoordsRef.current = endCoords;
    distanceRef.current = result.distance;
    durationRef.current = result.duration;
    estimatedPriceRef.current = result.estimatedPrice;
    routeReadyRef.current = true;

    setOriginCoords(startCoords);
    setDestCoords(endCoords);
    setRoutePath(result.routePath);
    setRoutePolylineEncoded(result.overviewPolyline);
    setDistance(result.distance);
    setDuration(result.duration);
    setEstimatedPrice(result.estimatedPrice);
    setRouteCalculated(true);

    if (result.intermediateStops?.length) {
      setResolvedIntermediateStops(
        result.intermediateStops.map((stop) => ({
          address: stop.displayName,
          lat: String(stop.lat),
          lng: String(stop.lng),
          placeId: stop.placeId,
        }))
      );
    } else {
      setResolvedIntermediateStops([]);
    }

    if (isShared && maxPassengers > 1) {
      setPricePerPassenger(Math.floor(result.estimatedPrice / maxPassengers));
    }

    setCouponCode("");
    setAppliedCoupon(null);

    if (result.usedDemoLocationFallback) {
      toast.warning("Algum endereço usou fallback local — confira origem e destino no mapa.");
    }

    toast.success(`Rota calculada: ${result.distanceText} - ${result.durationText}`);
  };

  useEffect(() => {
    const prefill = loadRidePrefill();
    if (!prefill || prefillAppliedRef.current || !isCompleteRidePrefill(prefill)) return;
    prefillAppliedRef.current = true;
    setAutoLocateOrigin(false);
    clearRidePrefill();

    setOriginAddress(prefill.originAddress);
    setDestinationAddress(prefill.destinationAddress);
    if (prefill.vehicleType) setVehicleType(prefill.vehicleType);

    const runPrefill = async () => {
      const origin = prefill.originAddress.trim();
      const destination = prefill.destinationAddress.trim();
      if (
        origin.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH ||
        destination.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH
      ) {
        return;
      }

      setCalculating(true);
      try {
        const result = await calculatePassengerRouteMutation.mutateAsync({
          originAddress: origin,
          destinationAddress: destination,
          vehicleType: prefill.vehicleType ?? vehicleType,
        });
        applyPassengerRouteResult(result, {
          origin,
          destination,
          originTrustedPlace: false,
          destinationTrustedPlace: false,
        });
        toast.success("Corrida repetida — origem e destino preenchidos");
      } catch (error) {
        toast.error(getRideFlowErrorMessage(error));
      } finally {
        setCalculating(false);
      }
    };

    void runPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculatePrice = async () => {
    if (!originAddress.trim() || !destinationAddress.trim()) {
      toast.error("Preencha origem e destino");
      return;
    }

    setCalculating(true);

    const originTrimmed = originAddress.trim();
    const destTrimmed = destinationAddress.trim();

    try {
      if (useOsmRouting) {
        const safeOriginPlaceId = sanitizePlaceIdForAddress(
          originTrimmed,
          originPlaceIdRef.current || undefined
        );
        const safeDestPlaceId = sanitizePlaceIdForAddress(
          destTrimmed,
          destPlaceIdRef.current || undefined
        );

        const result = await calculatePassengerRouteMutation.mutateAsync({
          originAddress: originTrimmed,
          destinationAddress: destTrimmed,
          vehicleType,
          originPlaceId: safeOriginPlaceId,
          destinationPlaceId: safeDestPlaceId,
          originLat:
            originFromGpsRef.current && originCoordsRef.current
              ? String(originCoordsRef.current.lat)
              : undefined,
          originLng:
            originFromGpsRef.current && originCoordsRef.current
              ? String(originCoordsRef.current.lng)
              : undefined,
          intermediateStops: activeIntermediateStopsForQuote.length ? activeIntermediateStopsForQuote : undefined,
        });
        applyPassengerRouteResult(result, {
          origin: originTrimmed,
          destination: destTrimmed,
          originTrustedPlace: Boolean(safeOriginPlaceId),
          destinationTrustedPlace: Boolean(safeDestPlaceId),
        });
        return;
      }

      const originPlace = sanitizePlaceIdForAddress(originTrimmed, originPlaceIdRef.current || undefined);
      const destPlace = sanitizePlaceIdForAddress(destTrimmed, destPlaceIdRef.current || undefined);
      const origin = originPlace
        ? `place_id:${originPlace}`
        : formatAddressForGeocoding(originTrimmed, WL.city || undefined);
      const dest = destPlace
        ? `place_id:${destPlace}`
        : formatAddressForGeocoding(destTrimmed, WL.city || undefined);

      recordOriginHistory(originTrimmed, originPlace || undefined);
      recordDestinationHistory(destTrimmed, destPlace || undefined);

      const route = await fetchRouteWithDemoFallback(
        () => utils.maps.directions.fetch({ origin, destination: dest }),
        origin,
        dest,
        false
      );
      setRoutePath(null);

      if (!route) {
        toast.error("Não foi possível calcular a rota. Verifique os endereços.");
        return;
      }

      const startCoords = {
        lat: Number(route.startLocation.lat),
        lng: Number(route.startLocation.lng),
      };
      const endCoords = {
        lat: Number(route.endLocation.lat),
        lng: Number(route.endLocation.lng),
      };

      originCoordsRef.current = startCoords;
      destCoordsRef.current = endCoords;
      setOriginCoords(startCoords);
      setDestCoords(endCoords);
      setRoutePolylineEncoded(route.overviewPolyline ?? null);
      setDistance(route.distance.value);
      setDuration(route.duration.value);
      distanceRef.current = route.distance.value;
      durationRef.current = route.duration.value;

      const vehiclePricing = pricing?.find((p: any) => p.vehicleType === vehicleType);
      if (!vehiclePricing) {
        toast.error("Erro ao calcular preço");
        return;
      }

      const centralEstimate = estimateDemoRidePriceCents(
        vehicleType,
        route.distance.value,
        route.duration.value
      );
      const roundedPrice = Math.max(
        centralEstimate.estimatedPrice,
        Math.round(vehiclePricing.minimumPrice ?? 0)
      );

      estimatedPriceRef.current = roundedPrice;
      routeReadyRef.current = true;
      setEstimatedPrice(roundedPrice);
      setRouteCalculated(true);

      if (isShared && maxPassengers > 1) {
        setPricePerPassenger(Math.floor(roundedPrice / maxPassengers));
      }

      setCouponCode("");
      setAppliedCoupon(null);

      toast.success(`Rota calculada: ${route.distance.text} - ${route.duration.text}`);
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error(getRideFlowErrorMessage(error));
    } finally {
      setCalculating(false);
    }
  };

  const handleRequestRide = async () => {
    const price = estimatedPriceRef.current ?? estimatedPrice;
    const dist = distanceRef.current || distance;
    const dur = durationRef.current || duration;
    const isReady = routeReadyRef.current || routeCalculated || rideQuote.ready;

    if (!isReady || !price || price <= 0 || dist <= 0 || dur <= 0) {
      toast.error("Calcule o preço primeiro");
      return;
    }

    if (!originAddress.trim() || !destinationAddress.trim()) {
      toast.error("Preencha origem e destino");
      return;
    }

    const start = originCoordsRef.current ?? originCoords;
    const end = destCoordsRef.current ?? destCoords;
    if (!start || !end) {
      toast.error("Calcule a rota primeiro");
      return;
    }

    if (thirdPartyEnabled) {
      if (!bookedFor.name.trim() || bookedFor.phone.trim().length < 8) {
        toast.error("Preencha nome e telefone do passageiro");
        return;
      }
    }

    const payload = {
      vehicleType,
      originAddress,
      originLat: String(start.lat),
      originLng: String(start.lng),
      destinationAddress,
      destinationLat: String(end.lat),
      destinationLng: String(end.lng),
      distance: dist,
      duration: dur,
      estimatedPrice: price,
      paymentMethod,
      isShared,
      maxPassengers: isShared ? maxPassengers : undefined,
      isFreight: vehicleType === "utilitario",
      cargoWeight: vehicleType === "utilitario" && cargoWeight ? parseInt(cargoWeight) : undefined,
      cargoType: vehicleType === "utilitario" ? cargoType : undefined,
      cargoDescription: vehicleType === "utilitario" ? cargoDescription : undefined,
      needsHelpers: vehicleType === "utilitario" ? needsHelpers : undefined,
      numberOfHelpers: vehicleType === "utilitario" && needsHelpers ? numberOfHelpers : undefined,
      bookedFor: thirdPartyEnabled ? bookedFor : undefined,
      intermediateStops:
        resolvedIntermediateStops.length > 0 ? resolvedIntermediateStops : undefined,
    };

    try {
      const data = await requestRide.mutateAsync(payload);
      await persistDemoRideAfterRequest(
        (input) => utils.client.ride.hydrateDemoState.mutate(input as never),
        data.rideId,
        (data as { demoRide?: import("../../../drizzle/schema").Ride }).demoRide
      );
      if (isLocalDemoDev() || paymentMethod === "cash") {
        toast.success("Corrida solicitada! Buscando motoristas...");
        setLocation(`/ride/${data.rideId}`);
      } else {
        toast.success("Corrida solicitada! Redirecionando para o pagamento...");
        setLocation(`/payment/${data.rideId}`);
      }
    } catch (error) {
      if (isLocalDemoDev()) {
        const rideId = simulateLocalRideRequest(payload);
        toast.success("Corrida solicitada (demo local)!");
        setLocation(`/ride/${rideId}`);
        return;
      }
      toast.error(getRideFlowErrorMessage(error));
    }
  };

  const handleScheduleRide = async ({ scheduledFor, recurrenceRule }: ScheduleRideResult) => {
    const price = estimatedPriceRef.current ?? estimatedPrice;
    const dist = distanceRef.current || distance;
    const dur = durationRef.current || duration;
    const isReady = routeReadyRef.current || routeCalculated || rideQuote.ready;

    if (!isReady || !price || price <= 0) {
      toast.error("Calcule o preço primeiro");
      return;
    }

    const start = originCoordsRef.current ?? originCoords;
    const end = destCoordsRef.current ?? destCoords;
    if (!start || !end) {
      toast.error("Calcule a rota primeiro");
      return;
    }

    if (thirdPartyEnabled) {
      if (!bookedFor.name.trim() || bookedFor.phone.trim().length < 8) {
        toast.error("Preencha nome e telefone do passageiro");
        return;
      }
    }

    const payload = {
      vehicleType,
      originAddress,
      originLat: start.lat,
      originLng: start.lng,
      destinationAddress,
      destinationLat: end.lat,
      destinationLng: end.lng,
      scheduledFor,
      paymentMethod,
      couponCode: appliedCoupon ? couponCode : undefined,
      estimatedPrice: price,
      distance: dist,
      duration: dur,
      bookedFor: thirdPartyEnabled ? bookedFor : undefined,
      intermediateStops:
        resolvedIntermediateStops.length > 0 ? resolvedIntermediateStops : undefined,
      recurrenceRule,
    };

    try {
      const result = await scheduleRide.mutateAsync(payload);
      const recurrenceMsg = result.recurringScheduleId
        ? " Série recorrente registrada (demo)."
        : "";
      toast.success(`Corrida agendada com sucesso!${recurrenceMsg} Acompanhe em 'Corridas Agendadas'`);
      if (isLocalDemoDev() && result.rideId) {
        try {
          const created = await utils.ride.getById.fetch({ rideId: result.rideId });
          persistDemoRideFromServer(created);
        } catch {
          // ignore
        }
        try {
          const recurring = await utils.scheduling.getRecurringSchedules.fetch();
          syncDemoRecurringSchedulesFromServer(recurring as never);
        } catch {
          // ignore
        }
      }
      setShowSchedule(false);
    } catch (error) {
      if (!isLocalDemoDev()) {
        const message =
          error instanceof Error && error.message === "Failed to fetch"
            ? "Não foi possível contactar o servidor. Verifique se o backend está rodando."
            : error instanceof Error
              ? error.message
              : "Erro ao agendar corrida";
        toast.error(message);
        return;
      }

      toast.success("Corrida agendada (demo local)!");
      setShowSchedule(false);
    }
  };

  const openScheduleDialog = () => {
    const price = estimatedPriceRef.current ?? estimatedPrice;
    const isReady = routeReadyRef.current || routeCalculated || rideQuote.ready;
    if (!isReady || !price || price <= 0) {
      toast.error("Calcule o preço primeiro");
      return;
    }
    setShowSchedule(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Solicitar Corrida" />
      
      {/* Loading Overlay */}
      {((rideQuote.loading && !rideQuote.ready) || calculating) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center border border-border">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <MapPin className="absolute inset-0 m-auto w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Calculando sua rota...</h3>
            <p className="text-muted-foreground">Buscando o melhor caminho para você</p>
          </div>
        </div>
      )}
      
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Solicitar Corrida</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Informe origem e destino — o preço e a rota aparecem automaticamente
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1fr_1fr] lg:items-start lg:gap-8">
          <div className="space-y-6 order-2 lg:order-1">
            <Card className="border-border bg-card">
              <CardContent className="space-y-6 pt-6">
            {/* Origin */}
            <div className="space-y-2">
              <Label>
                <MapPin className={`w-4 h-4 inline mr-2 ${fuiRoute.originIcon}`} />
                Origem
              </Label>
              <div className="relative">
                <AddressAutocomplete
                  value={originAddress}
                  onChange={(val) => {
                    originFromGpsRef.current = false;
                    setAutoLocateOrigin(false);
                    setOriginAddress(val);
                    setOriginPlaceId("");
                    originPlaceIdRef.current = "";
                    clearRouteCalculation();
                  }}
                  onSelect={(result) => {
                    originFromGpsRef.current = false;
                    setAutoLocateOrigin(false);
                    clearRouteCalculation();
                    setOriginAddress(result.address);
                    setOriginPlaceId(result.placeId);
                    originPlaceIdRef.current = result.placeId;
                    if (result.lat != null && result.lng != null) {
                      const coords = { lat: result.lat, lng: result.lng };
                      originCoordsRef.current = coords;
                      setOriginCoords(coords);
                    }
                    recordOriginHistory(result.address, result.placeId);
                    void rideQuote.refetch({
                      originAddress: result.address,
                      originPlaceId: result.placeId,
                      destinationAddress: destinationAddress.trim(),
                      destinationPlaceId: destPlaceIdRef.current || undefined,
                    });
                  }}
                  onConfirm={(address) => {
                    if (originFromGpsRef.current && originPlaceIdRef.current) {
                      recordOriginHistory(address, originPlaceIdRef.current);
                      return;
                    }
                    const placeId = resolveDemoPlaceIdForHistory(
                      address,
                      originPlaceIdRef.current || undefined
                    );
                    if (placeId && !originPlaceIdRef.current) {
                      setOriginPlaceId(placeId);
                      originPlaceIdRef.current = placeId;
                    }
                    recordOriginHistory(address, placeId);
                  }}
                  placeholder={
                    passengerLocation.isLocating
                      ? "Obtendo sua localização..."
                      : "De onde você está?"
                  }
                  icon={<MapPin className={`w-4 h-4 ${fuiRoute.originIcon}`} />}
                  historyItems={originHistory}
                  savedAddresses={savedAddresses}
                  prioritySuggestions={[
                    {
                      address: getDefaultPassengerHome(WL.city).address,
                      placeId: getDefaultPassengerHome(WL.city).placeId,
                    },
                  ]}
                  locationBias={passengerLocation.coords ?? originCoords}
                  disabled={passengerLocation.isLocating}
                />
                {!passengerLocation.isLocating && (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 z-10"
                    aria-label="Usar minha localização"
                    title="Usar minha localização"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                )}
                {passengerLocation.isLocating && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label>
                <Navigation className={`w-4 h-4 inline mr-2 ${fuiRoute.destinationIcon}`} />
                Destino
              </Label>
              <AddressAutocomplete
                value={destinationAddress}
                onChange={(val) => {
                  setDestinationAddress(val);
                  setDestPlaceId("");
                  destPlaceIdRef.current = "";
                  clearRouteCalculation();
                }}
                onSelect={(result) => {
                  clearRouteCalculation();
                  setDestinationAddress(result.address);
                  setDestPlaceId(result.placeId);
                  destPlaceIdRef.current = result.placeId;
                  recordDestinationHistory(result.address, result.placeId);
                  syncHistoryFromStorage();
                  void rideQuote.refetch({
                    originAddress: originAddress.trim(),
                    originPlaceId: originPlaceIdRef.current || undefined,
                    destinationAddress: result.address,
                    destinationPlaceId: result.placeId,
                  });
                }}
                onConfirm={(address) => {
                  const placeId = resolveDemoPlaceIdForHistory(
                    address,
                    destPlaceIdRef.current || undefined
                  );
                  if (placeId && !destPlaceIdRef.current) {
                    setDestPlaceId(placeId);
                    destPlaceIdRef.current = placeId;
                  }
                  recordDestinationHistory(address, placeId);
                  syncHistoryFromStorage();
                }}
                placeholder="Digite o endereço de destino"
                icon={<Navigation className={`w-4 h-4 ${fuiRoute.destinationIcon}`} />}
                historyItems={destinationHistory}
                savedAddresses={savedAddresses}
                locationBias={passengerLocation.coords ?? originCoords}
              />
            </div>

            <IntermediateStopsFields
              stops={intermediateStops}
              onChange={(next) => {
                setIntermediateStops(next);
                clearRouteCalculation();
              }}
              onStopsCleared={clearRouteCalculation}
              locationBias={passengerLocation.coords ?? originCoords}
            />

            <ThirdPartyRideFields
              enabled={thirdPartyEnabled}
              onEnabledChange={setThirdPartyEnabled}
              value={bookedFor}
              onChange={setBookedFor}
            />

            <RideCategoryCompare
              selected={vehicleType}
              onSelect={setVehicleType}
              quotes={rideQuote.categoryQuotes}
              loading={rideQuote.loading}
              disabled={!originAddress.trim() || !destinationAddress.trim()}
            />

            {/* Carpool / Shared Ride Section */}
            {vehicleType !== "moto" && (
              <div className={`space-y-4 p-4 ${fuiSurface.muted} border-primary/25 border-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isShared"
                      checked={isShared}
                      onChange={(e) => {
                        setIsShared(e.target.checked);
                        if (!e.target.checked) {
                          setPricePerPassenger(null);
                        }
                      }}
                      className="w-4 h-4 text-primary rounded focus:ring-primary/40"
                    />
                    <Label htmlFor="isShared" className="font-semibold text-primary cursor-pointer">
                      Aceitar compartilhar corrida (Carpool)
                    </Label>
                  </div>
                  {isShared && pricePerPassenger && (
                    <span className="text-sm font-medium text-emerald-400">
                      Economia: R$ {((estimatedPrice || 0) - pricePerPassenger) / 100} por pessoa
                    </span>
                  )}
                </div>
                
                {isShared && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Compartilhe a corrida com outros passageiros indo para a mesma região e divida o custo!
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxPassengers">Número máximo de passageiros (incluindo você)</Label>
                      <select
                        id="maxPassengers"
                        value={maxPassengers}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setMaxPassengers(value);
                          if (estimatedPrice) {
                            setPricePerPassenger(Math.floor(estimatedPrice / value));
                          }
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md fui-input-focus"
                      >
                        <option value="2">2 passageiros</option>
                        <option value="3">3 passageiros</option>
                        <option value="4">4 passageiros</option>
                      </select>
                    </div>
                    
                    {pricePerPassenger && (
                      <div className="bg-background p-3 rounded-md border border-border">
                        <p className="text-sm text-muted-foreground">Preço original: <span className="line-through">R$ {(estimatedPrice || 0) / 100}</span></p>
                        <p className={`text-lg font-bold ${fuiBrand.text}`}>Preço por pessoa: R$ {pricePerPassenger / 100}</p>
                        <p className="text-xs text-muted-foreground mt-1">* Preço final pode variar se mais passageiros entrarem</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Freight-specific fields */}
            {vehicleType === "utilitario" && (
              <div className="space-y-4 p-4 bg-muted rounded-lg border-2 border-[#D46A03]/30">
                <h3 className={`font-semibold ${fuiBrand.text} flex items-center gap-2`}>
                  <Package className="w-5 h-5" />
                  Informações do Frete
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargoWeight">Peso da Carga (kg)</Label>
                    <Input
                      id="cargoWeight"
                      type="number"
                      placeholder="Ex: 50"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value)}
                      className=""
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cargoType">Tipo de Carga</Label>
                    <select
                      id="cargoType"
                      value={cargoType}
                      onChange={(e) => setCargoType(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fui-input-focus"
                    >
                      <option value="">Selecione</option>
                      <option value="mudanca">Mudança</option>
                      <option value="entrega">Entrega</option>
                      <option value="materiais">Materiais de Construção</option>
                      <option value="moveis">Móveis</option>
                      <option value="eletrodomesticos">Eletrodomésticos</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cargoDescription">Descrição da Carga (opcional)</Label>
                  <textarea
                    id="cargoDescription"
                    placeholder="Descreva o que precisa transportar..."
                    value={cargoDescription}
                    onChange={(e) => setCargoDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md fui-input-focus"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsHelpers}
                      onChange={(e) => {
                        setNeedsHelpers(e.target.checked);
                        if (!e.target.checked) setNumberOfHelpers(0);
                      }}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary/40"
                    />
                    <span className="font-medium">Preciso de ajudantes para carga/descarga</span>
                  </label>
                  
                  {needsHelpers && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="numberOfHelpers">Número de Ajudantes</Label>
                      <select
                        id="numberOfHelpers"
                        value={numberOfHelpers}
                        onChange={(e) => setNumberOfHelpers(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md fui-input-focus"
                      >
                        <option value="0">Selecione</option>
                        <option value="1">1 ajudante</option>
                        <option value="2">2 ajudantes</option>
                        <option value="3">3 ajudantes</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-3 gap-3">
                <label
                  className={`flex flex-col items-center justify-center p-4 transition-colors cursor-pointer ${fuiSelectedTile(paymentMethod === "cash")}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="sr-only"
                  />
                  <DollarSign className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Dinheiro</span>
                </label>
                <label
                  className={`flex flex-col items-center justify-center p-4 transition-colors cursor-pointer ${fuiSelectedTile(paymentMethod === "pix")}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pix"
                    checked={paymentMethod === "pix"}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="sr-only"
                  />
                  <Smartphone className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">PIX</span>
                </label>
                <label
                  className={`flex flex-col items-center justify-center p-4 transition-colors cursor-pointer ${fuiSelectedTile(paymentMethod === "card")}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="sr-only"
                  />
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Cartão</span>
                </label>
              </div>
            </div>

            {!useOsmRouting && (
              <Button
                onClick={calculatePrice}
                variant="outline"
                className={`w-full ${fuiBrand.btnOutline}`}
                disabled={!originAddress || !destinationAddress || calculating}
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculando rota...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Atualizar preço e rota
                  </>
                )}
              </Button>
            )}

            {/* Coupon Input */}
            {estimatedPrice !== null && (
              <div className="space-y-2">
                <Label htmlFor="coupon">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Cupom de Desconto
                </Label>
                {appliedCoupon ? (
                  <StatusPanel
                    variant="success"
                    compact
                    icon={<Tag className="w-5 h-5" />}
                    title={couponCode}
                    description={`Desconto: -R$ ${(appliedCoupon.discountAmount / 100).toFixed(2)}`}
                    action={
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveCoupon}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    }
                  />
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className=""
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      variant="outline"
                      disabled={validatingCoupon || !couponCode}
                      className=""
                    >
                      {validatingCoupon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Aplicar"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Price Display — cupom aplicado (resumo principal fica no painel do mapa) */}
            {appliedCoupon && estimatedPrice !== null && (
              <Card className={fuiSurface.price}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Preço Final com cupom</p>
                    <div>
                      <p className="text-xl text-muted-foreground line-through">
                        R$ {(estimatedPrice / 100).toFixed(2)}
                      </p>
                      <p className={`text-3xl font-bold ${fuiBrand.text}`}>
                        R$ {(appliedCoupon.finalPrice / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-emerald-400 mt-1">
                        Economia: R$ {(appliedCoupon.discountAmount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleRequestRide}
                className={`flex-1 ${fuiBrand.btn}`}
                size="lg"
                disabled={
                  (!routeCalculated && !rideQuote.ready) ||
                  estimatedPrice == null ||
                  estimatedPrice <= 0 ||
                  requestRide.isPending
                }
              >
                {requestRide.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  "Solicitar Corrida"
                )}
              </Button>
              
              <Button
                onClick={openScheduleDialog}
                variant="outline"
                size="lg"
                className={fuiBrand.btnOutline}
                disabled={
                  (!routeCalculated && !rideQuote.ready) ||
                  estimatedPrice == null ||
                  estimatedPrice <= 0 ||
                  scheduleRide.isPending
                }
              >
                <Clock className="w-4 h-4 mr-2" />
                Agendar
              </Button>
            </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 order-1 lg:order-2 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <Card className="flex flex-col overflow-hidden border-border bg-card lg:flex-1 lg:min-h-0">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-base font-semibold">Mapa da Rota</CardTitle>
                <CardDescription>
                  Visualize origem, destino e motoristas próximos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 lg:flex lg:flex-1 lg:min-h-0">
                <RequestRideMap
                  className="h-[300px] sm:h-[380px] lg:h-full lg:min-h-0 w-full rounded-none border-0"
                  origin={originCoords}
                  destination={destCoords}
                  vehicleType={vehicleType}
                  routePath={routePath}
                  encodedPolyline={routePolylineEncoded}
                  nearbyDrivers={nearbyDemoDrivers}
                />
              </CardContent>
            </Card>

            <RideRequestSummary
              className="shrink-0"
              origin={originAddress}
              destination={destinationAddress}
              vehicleType={vehicleType}
              estimatedPrice={
                appliedCoupon ? appliedCoupon.finalPrice : estimatedPrice
              }
              distanceM={distance}
              durationS={duration}
              loading={rideQuote.loading}
              error={rideQuote.error}
              onRetry={() => void rideQuote.refetch()}
            />
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      {showSchedule && (
        <ScheduleRideDialog
          origin={originAddress}
          destination={destinationAddress}
          vehicleType={vehicleType}
          estimatedPrice={(estimatedPriceRef.current ?? estimatedPrice) || 0}
          onSchedule={handleScheduleRide}
          trigger={
            <Button
              className="hidden"
              ref={(el) => { if (el && showSchedule) el.click(); }}
            />
          }
        />
      )}
    </div>
  );
}
