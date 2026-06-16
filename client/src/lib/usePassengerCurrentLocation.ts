import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

export type PassengerLocationStatus =
  | "idle"
  | "locating"
  | "geocoding"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

type Coords = { lat: number; lng: number };

type UsePassengerCurrentLocationOptions = {
  /** Quando false, não solicita GPS. */
  enabled?: boolean;
};

export function usePassengerCurrentLocation(options: UsePassengerCurrentLocationOptions = {}) {
  const enabled = options.enabled ?? true;
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<PassengerLocationStatus>("idle");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const fetchCurrentLocation = useCallback(async () => {
    if (!enabled) return;

    const runId = ++runIdRef.current;
    setErrorMessage(null);

    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      setErrorMessage("Seu dispositivo não suporta localização.");
      return;
    }

    setStatus("locating");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
        });
      });

      if (runId !== runIdRef.current) return;

      const nextCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(nextCoords);
      setStatus("geocoding");

      const geocoded = await utils.maps.geocode.fetch({
        latlng: `${nextCoords.lat},${nextCoords.lng}`,
      });

      if (runId !== runIdRef.current) return;

      if (geocoded) {
        setAddress(geocoded.formattedAddress);
        setPlaceId(geocoded.placeId ?? null);
      } else {
        setAddress(`${nextCoords.lat.toFixed(5)}, ${nextCoords.lng.toFixed(5)}`);
        setPlaceId(`coord:${nextCoords.lat},${nextCoords.lng}`);
      }

      setStatus("ready");
    } catch (error) {
      if (runId !== runIdRef.current) return;

      const geoError = error as GeolocationPositionError | undefined;
      if (geoError?.code === geoError?.PERMISSION_DENIED) {
        setStatus("denied");
        setErrorMessage("Permissão de localização negada. Ative no navegador ou digite o endereço.");
        return;
      }

      setStatus("error");
      setErrorMessage("Não foi possível obter sua localização. Tente novamente.");
    }
  }, [enabled, utils]);

  useEffect(() => {
    if (!enabled) {
      runIdRef.current += 1;
      setStatus("idle");
      return;
    }

    void fetchCurrentLocation();
  }, [enabled, fetchCurrentLocation]);

  return {
    coords,
    address,
    placeId,
    status,
    errorMessage,
    isLocating: status === "locating" || status === "geocoding",
    retry: fetchCurrentLocation,
  };
}
