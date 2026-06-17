export type AcquiredGeolocation = {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  samples: number;
};

type AcquireOptions = {
  timeoutMs?: number;
  targetAccuracyMeters?: number;
};

/** Coleta a melhor leitura GPS disponível (watchPosition + menor accuracy). */
export function acquireBestGeolocationPosition(
  options?: AcquireOptions
): Promise<AcquiredGeolocation> {
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const targetAccuracyMeters = options?.targetAccuracyMeters ?? 80;

  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }

    let best: GeolocationPosition | null = null;
    let samples = 0;
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      fn();
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        samples += 1;
        const accuracy = position.coords.accuracy;
        if (
          !best ||
          (Number.isFinite(accuracy) &&
            (!Number.isFinite(best.coords.accuracy) || accuracy < best.coords.accuracy))
        ) {
          best = position;
        }

        if (Number.isFinite(accuracy) && accuracy <= targetAccuracyMeters) {
          finish(() =>
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracyMeters: accuracy,
              samples,
            })
          );
        }
      },
      (error) => finish(() => reject(error)),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: timeoutMs,
      }
    );

    const timer = window.setTimeout(() => {
      if (!best) {
        finish(() => reject(new Error("timeout")));
        return;
      }
      finish(() =>
        resolve({
          lat: best!.coords.latitude,
          lng: best!.coords.longitude,
          accuracyMeters: Number.isFinite(best!.coords.accuracy)
            ? best!.coords.accuracy
            : null,
          samples,
        })
      );
    }, timeoutMs);
  });
}
