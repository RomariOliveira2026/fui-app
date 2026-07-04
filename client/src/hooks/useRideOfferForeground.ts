import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { onForegroundMessage } from "@/lib/firebase-config";
import {
  emitRideOfferEvent,
  parseRideOfferPayload,
  RIDE_OFFER_EVENT,
  type RideOfferEventDetail,
} from "@/lib/rideOfferEvents";

type UseRideOfferForegroundOptions = {
  enabled?: boolean;
  onRideOffer?: (detail: RideOfferEventDetail) => void;
  playAlert?: () => void;
};

/** Handler unificado para ofertas em foreground (FCM + evento interno). */
export function useRideOfferForeground(options: UseRideOfferForegroundOptions = {}) {
  const { enabled = true, onRideOffer, playAlert } = options;
  const utils = trpc.useUtils();
  const onRideOfferRef = useRef(onRideOffer);
  const playAlertRef = useRef(playAlert);
  onRideOfferRef.current = onRideOffer;
  playAlertRef.current = playAlert;

  useEffect(() => {
    if (!enabled) return;

    const handleOffer = (detail: RideOfferEventDetail) => {
      void utils.ride.available.invalidate();
      playAlertRef.current?.();
      onRideOfferRef.current?.(detail);
    };

    const onCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<RideOfferEventDetail>).detail;
      handleOffer(detail ?? {});
    };

    window.addEventListener(RIDE_OFFER_EVENT, onCustomEvent);

    const unsubscribe = onForegroundMessage((payload) => {
      const detail = parseRideOfferPayload(
        payload.data as Record<string, string | undefined> | undefined
      );
      if (!detail) return;
      emitRideOfferEvent(detail);
      handleOffer(detail);
    });

    return () => {
      window.removeEventListener(RIDE_OFFER_EVENT, onCustomEvent);
      unsubscribe?.();
    };
  }, [enabled, utils.ride.available]);
}
