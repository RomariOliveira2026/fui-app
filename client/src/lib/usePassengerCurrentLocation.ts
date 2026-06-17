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
  /** Quando true, solicita GPS automaticamente ao montar/habilitar. */
  enabled?: boolean;
};

type RequestLocationOptions = {
  /** Ignora posição em cache do navegador e força leitura nova. */
  forceFresh?: boolean;
};

export function usePassengerCurrentLocation(options: UsePassengerCurrentLocationOptions = {}) {
  const autoEnabled = options.enabled ?? false;
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<PassengerLocationStatus>("idle");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const requestLocation = useCallback(
    async (requestOptions?: RequestLocationOptions) => {
      const runId = ++runIdRef.current;
      setErrorMessage(null);
      setAddress(null);
      setPlaceId(null);
      setCoords(null);
      setAccuracyMeters(null);

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
            timeout: 15_000,
            maximumAge: 0,
          });
        });

        if (runId !== runIdRef.current) return;

        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracy = Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : null;

        setCoords(nextCoords);
        setAccuracyMeters(accuracy);
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
    },
    [utils]
  );

  useEffect(() => {
    if (!autoEnabled) {
      runIdRef.current += 1;
      return;
    }

    void requestLocation({ forceFresh: true });
  }, [autoEnabled, requestLocation]);

  return {
    coords,
    address,
    placeId,
    accuracyMeters,
    status,
    errorMessage,
    isLocating: status === "locating" || status === "geocoding",
    requestLocation,
    /** @deprecated use requestLocation */
    retry: () => requestLocation({ forceFresh: true }),
  };
}
