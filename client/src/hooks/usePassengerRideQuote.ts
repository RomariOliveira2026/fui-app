import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { DemoVehicleType } from "@shared/demoPricing";
import type { CategoryQuote } from "@shared/rideQuote";
import { pickCategoryQuote } from "@shared/rideQuote";
import type { IntermediateStopInput } from "@shared/passengerPremium";

export type PassengerRideQuoteState = {
  loading: boolean;
  ready: boolean;
  error: string | null;
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  estimatedPrice: number | null;
  categoryQuotes: CategoryQuote[];
  originCoords: { lat: number; lng: number } | null;
  destCoords: { lat: number; lng: number } | null;
  routePath: Array<{ lat: number; lng: number }> | null;
  overviewPolyline: string | null;
};

const EMPTY_QUOTE: PassengerRideQuoteState = {
  loading: false,
  ready: false,
  error: null,
  distance: 0,
  duration: 0,
  distanceText: "",
  durationText: "",
  estimatedPrice: null,
  categoryQuotes: [],
  originCoords: null,
  destCoords: null,
  routePath: null,
  overviewPolyline: null,
};

type UsePassengerRideQuoteInput = {
  originAddress: string;
  destinationAddress: string;
  vehicleType: DemoVehicleType;
  originPlaceId?: string;
  destinationPlaceId?: string;
  originLat?: string;
  originLng?: string;
  intermediateStops?: IntermediateStopInput[];
  enabled?: boolean;
  debounceMs?: number;
};

export function usePassengerRideQuote(input: UsePassengerRideQuoteInput) {
  const {
    originAddress,
    destinationAddress,
    vehicleType,
    originPlaceId,
    destinationPlaceId,
    originLat,
    originLng,
    intermediateStops,
    enabled = true,
    debounceMs = 900,
  } = input;

  const [state, setState] = useState<PassengerRideQuoteState>(EMPTY_QUOTE);
  const mutation = trpc.maps.calculatePassengerRoute.useMutation();
  const requestIdRef = useRef(0);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setState(EMPTY_QUOTE);
  }, []);

  const fetchQuote = useCallback(async () => {
    const origin = originAddress.trim();
    const destination = destinationAddress.trim();
    if (origin.length < 4 || destination.length < 4) {
      reset();
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await mutation.mutateAsync({
        originAddress: origin,
        destinationAddress: destination,
        vehicleType,
        originPlaceId,
        destinationPlaceId,
        originLat,
        originLng,
        intermediateStops:
          intermediateStops && intermediateStops.length > 0 ? intermediateStops : undefined,
        allowDemoFallback: false,
      });

      if (requestId !== requestIdRef.current) return;

      const selectedQuote =
        pickCategoryQuote(result.categoryQuotes, vehicleType) ??
        result.categoryQuotes.find((q) => q.vehicleType === vehicleType);

      setState({
        loading: false,
        ready: true,
        error: null,
        distance: result.distance,
        duration: result.duration,
        distanceText: result.distanceText,
        durationText: result.durationText,
        estimatedPrice: selectedQuote?.estimatedPrice ?? result.estimatedPrice,
        categoryQuotes: result.categoryQuotes,
        originCoords: { lat: result.origin.lat, lng: result.origin.lng },
        destCoords: { lat: result.destination.lat, lng: result.destination.lng },
        routePath: result.routePath,
        overviewPolyline: result.overviewPolyline,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState({
        ...EMPTY_QUOTE,
        error: error instanceof Error ? error.message : "Não foi possível calcular a rota",
      });
    }
  }, [
    destinationAddress,
    destinationPlaceId,
    intermediateStops,
    mutation,
    originAddress,
    originLat,
    originLng,
    originPlaceId,
    reset,
    vehicleType,
  ]);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const origin = originAddress.trim();
    const destination = destinationAddress.trim();
    if (origin.length < 4 || destination.length < 4) {
      reset();
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchQuote();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [
    debounceMs,
    destinationAddress,
    destinationPlaceId,
    enabled,
    fetchQuote,
    originAddress,
    originPlaceId,
    originLat,
    originLng,
    intermediateStops,
    vehicleType,
  ]);

  const priceForVehicle = useCallback(
    (type: DemoVehicleType) => {
      const quote = pickCategoryQuote(state.categoryQuotes, type);
      return quote?.estimatedPrice ?? null;
    },
    [state.categoryQuotes]
  );

  return {
    ...state,
    refetch: fetchQuote,
    reset,
    priceForVehicle,
  };
}
