import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getDemoRideSnapshot } from "@/lib/demoRideStorage";
import {
  isDemoRideIdClient,
  persistDemoRideFromServer,
} from "@/lib/useDemoRideHydration";
import type { DemoRideClientPayload } from "../../../server/_core/demoRideClientMeta";

type UseDemoRideDetailsOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

function readSnapshotPayload(rideId: number): DemoRideClientPayload | null {
  const snapshot = getDemoRideSnapshot(rideId);
  return snapshot ? (snapshot as DemoRideClientPayload) : null;
}

/**
 * Corridas demo na Vercel: GET getById pode cair em outra instância serverless sem memória.
 * Este hook envia o snapshot via POST a cada poll — padrão confiável para demo serverless.
 */
export function useDemoRideDetails(
  rideId: number,
  options: UseDemoRideDetailsOptions = {}
) {
  const { enabled = true, refetchInterval = false } = options;
  const useDemoFetch = isDemoRideIdClient(rideId) && enabled;

  const [data, setData] = useState<DemoRideClientPayload | null>(() =>
    useDemoFetch ? readSnapshotPayload(rideId) : null
  );
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(
    () => useDemoFetch && !readSnapshotPayload(rideId)
  );
  const [hasLocalSnapshot, setHasLocalSnapshot] = useState(
    () => !!getDemoRideSnapshot(rideId)
  );

  const utils = trpc.useUtils();
  const inFlightRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!useDemoFetch || inFlightRef.current) return;
    inFlightRef.current = true;

    const snapshot = getDemoRideSnapshot(rideId);
    setHasLocalSnapshot(!!snapshot);

    try {
      const result = await utils.client.ride.fetchDemoRideDetails.mutate({
        rideId,
        demoSnapshot: snapshot ?? undefined,
      });
      persistDemoRideFromServer(result as never);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [rideId, useDemoFetch, utils.client.ride.fetchDemoRideDetails]);

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!useDemoFetch) {
      setIsLoading(false);
      return;
    }

    const snapshot = readSnapshotPayload(rideId);
    if (snapshot) {
      setData((prev) => prev ?? snapshot);
      setHasLocalSnapshot(true);
      setIsLoading(false);
    }

    void refetchRef.current();
  }, [rideId, useDemoFetch]);

  useEffect(() => {
    if (!useDemoFetch || !refetchInterval || refetchInterval <= 0) return;
    const timer = window.setInterval(() => {
      void refetchRef.current();
    }, refetchInterval);
    return () => window.clearInterval(timer);
  }, [refetchInterval, useDemoFetch]);

  return {
    data: useDemoFetch ? data : undefined,
    error: useDemoFetch ? error : undefined,
    isLoading: useDemoFetch ? isLoading && !data : false,
    isError: useDemoFetch ? error != null && !data : false,
    refetch,
    hasLocalSnapshot,
    usesDemoFetch: useDemoFetch,
  };
}
