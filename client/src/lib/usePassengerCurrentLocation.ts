import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { acquireBestGeolocationPosition } from "@/lib/acquireGeolocation";
import { isNearOperationalCenter } from "@shared/mapDefaults";
import { isGenericCityCentroidLabel } from "@shared/formatNominatimAddress";

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

const PRECISE_ACCURACY_M = 80;

function isImpreciseCentroid(coords: Coords, accuracyMeters: number | null): boolean {
  if (!isNearOperationalCenter(coords.lat, coords.lng)) return false;
  if (accuracyMeters == null) return true;
  return accuracyMeters > PRECISE_ACCURACY_M;
}

function shouldRejectGpsAddress(
  formattedAddress: string | null | undefined,
  isCoarse: boolean
): boolean {
  return isCoarse || isGenericCityCentroidLabel(formattedAddress);
}

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
    async (_requestOptions?: RequestLocationOptions) => {
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
        const acquired = await acquireBestGeolocationPosition({
          timeoutMs: 12_000,
          targetAccuracyMeters: 60,
        });

        if (runId !== runIdRef.current) return;

        const nextCoords = { lat: acquired.lat, lng: acquired.lng };
        const accuracy = acquired.accuracyMeters;

        console.info("[Fui:location] gps", {
          lat: nextCoords.lat,
          lng: nextCoords.lng,
          accuracyMeters: accuracy,
          samples: acquired.samples,
          nearOperationalCenter: isNearOperationalCenter(nextCoords.lat, nextCoords.lng),
        });

        if (isImpreciseCentroid(nextCoords, accuracy)) {
          setStatus("error");
          setErrorMessage(
            "Localização imprecisa (centro da cidade). Ative o GPS no celular e tente novamente ao ar livre."
          );
          return;
        }

        setCoords(nextCoords);
        setAccuracyMeters(accuracy);
        setStatus("geocoding");

        const geocoded = await utils.maps.geocode.fetch(
          { latlng: `${nextCoords.lat},${nextCoords.lng}` },
          { staleTime: 0 }
        );

        if (runId !== runIdRef.current) return;

        const isCoarse = Boolean((geocoded as { isCoarse?: boolean } | null)?.isCoarse);

        console.info("[Fui:location] reverse", {
          lat: nextCoords.lat,
          lng: nextCoords.lng,
          formattedAddress: geocoded?.formattedAddress,
          isCoarse,
        });

        if (
          geocoded &&
          shouldRejectGpsAddress(geocoded.formattedAddress, isCoarse)
        ) {
          setStatus("error");
          setErrorMessage(
            "Não foi possível identificar seu endereço com precisão. Ative o GPS no celular ou digite a origem."
          );
          return;
        }

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
    if (!autoEnabled) return;
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
    retry: () => requestLocation({ forceFresh: true }),
  };
}
