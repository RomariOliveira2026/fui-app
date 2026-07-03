import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRideFlowErrorMessage, isRideInputValidationError } from "@/lib/rideFlowErrors";
import { MIN_RIDE_PREFILL_ADDRESS_LENGTH } from "@/lib/ridePrefill";
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

function buildQuoteSignature(input: {
  originAddress: string;
  destinationAddress: string;
  originPlaceId?: string;
  destinationPlaceId?: string;
  originLat?: string;
  originLng?: string;
  intermediateStops?: IntermediateStopInput[];
}): string {
  return JSON.stringify({
    origin: input.originAddress.trim(),
    destination: input.destinationAddress.trim(),
    originPlaceId: input.originPlaceId ?? "",
    destinationPlaceId: input.destinationPlaceId ?? "",
    originLat: input.originLat ?? "",
    originLng: input.originLng ?? "",
    stops: (input.intermediateStops ?? []).map((s) => ({
      address: s.address.trim(),
      placeId: s.placeId ?? "",
    })),
  });
}

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
  const { mutateAsync } = trpc.maps.calculatePassengerRoute.useMutation();
  const mutateAsyncRef = useRef(mutateAsync);
  mutateAsyncRef.current = mutateAsync;
  const requestIdRef = useRef(0);
  const vehicleTypeRef = useRef(vehicleType);
  vehicleTypeRef.current = vehicleType;

  const quoteSignature = useMemo(
    () =>
      buildQuoteSignature({
        originAddress,
        destinationAddress,
        originPlaceId,
        destinationPlaceId,
        originLat,
        originLng,
        intermediateStops,
      }),
    [
      originAddress,
      destinationAddress,
      originPlaceId,
      destinationPlaceId,
      originLat,
      originLng,
      intermediateStops,
    ]
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setState(EMPTY_QUOTE);
  }, []);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const parsed = JSON.parse(quoteSignature) as {
      origin: string;
      destination: string;
    };
    if (
      parsed.origin.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH ||
      parsed.destination.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH
    ) {
      reset();
      return;
    }

    const timer = window.setTimeout(() => {
      const origin = parsed.origin.trim();
      const destination = parsed.destination.trim();
      if (
        origin.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH ||
        destination.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH
      ) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setState((prev) => ({ ...prev, loading: true, error: null }));

      void mutateAsyncRef
        .current({
          originAddress: origin,
          destinationAddress: destination,
          vehicleType: vehicleTypeRef.current,
          originPlaceId: originPlaceId || undefined,
          destinationPlaceId: destinationPlaceId || undefined,
          originLat,
          originLng,
          intermediateStops:
            intermediateStops && intermediateStops.length > 0 ? intermediateStops : undefined,
          allowDemoFallback: false,
        })
        .then((result) => {
          if (requestId !== requestIdRef.current) return;

          const selectedQuote =
            pickCategoryQuote(result.categoryQuotes, vehicleTypeRef.current) ??
            result.categoryQuotes.find((q) => q.vehicleType === vehicleTypeRef.current);

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
        })
        .catch((error: unknown) => {
          if (requestId !== requestIdRef.current) return;
          if (isRideInputValidationError(error)) {
            setState(EMPTY_QUOTE);
            return;
          }
          setState({
            ...EMPTY_QUOTE,
            error: getRideFlowErrorMessage(error),
          });
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [
    debounceMs,
    enabled,
    quoteSignature,
    reset,
    originPlaceId,
    destinationPlaceId,
    originLat,
    originLng,
    intermediateStops,
  ]);

  const fetchQuote = useCallback(async () => {
    const origin = originAddress.trim();
    const destination = destinationAddress.trim();
    if (
      origin.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH ||
      destination.length < MIN_RIDE_PREFILL_ADDRESS_LENGTH
    ) {
      reset();
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await mutateAsyncRef.current({
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
      if (isRideInputValidationError(error)) {
        setState(EMPTY_QUOTE);
        return;
      }
      setState({
        ...EMPTY_QUOTE,
        error: getRideFlowErrorMessage(error),
      });
    }
  }, [
    destinationAddress,
    destinationPlaceId,
    intermediateStops,
    originAddress,
    originLat,
    originLng,
    originPlaceId,
    reset,
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
