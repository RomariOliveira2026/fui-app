import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { isDemoAppClient } from "@/lib/demoMode";
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

/**
 * Corridas demo na Vercel: GET getById pode cair em outra instância serverless sem memória.
 * Este hook envia o snapshot via POST a cada poll — padrão confiável para demo serverless.
 */
export function useDemoRideDetails(
  rideId: number,
  options: UseDemoRideDetailsOptions = {}
) {
  const { enabled = true, refetchInterval = false } = options;
  const useDemoFetch = isDemoAppClient() && isDemoRideIdClient(rideId) && enabled;

  const [data, setData] = useState<DemoRideClientPayload | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(useDemoFetch);
  const [hasLocalSnapshot, setHasLocalSnapshot] = useState(
    () => !!getDemoRideSnapshot(rideId)
  );

  const fetchMutation = trpc.ride.fetchDemoRideDetails.useMutation();
  const inFlightRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!useDemoFetch || inFlightRef.current) return;
    inFlightRef.current = true;

    const snapshot = getDemoRideSnapshot(rideId);
    setHasLocalSnapshot(!!snapshot);

    try {
      const result = await fetchMutation.mutateAsync({
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
  }, [fetchMutation, rideId, useDemoFetch]);

  useEffect(() => {
    if (!useDemoFetch) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void refetch();
  }, [refetch, useDemoFetch]);

  useEffect(() => {
    if (!useDemoFetch || !refetchInterval || refetchInterval <= 0) return;
    const timer = window.setInterval(() => {
      void refetch();
    }, refetchInterval);
    return () => window.clearInterval(timer);
  }, [refetch, refetchInterval, useDemoFetch]);

  return {
    data: useDemoFetch ? data : undefined,
    error: useDemoFetch ? error : undefined,
    isLoading: useDemoFetch ? isLoading : false,
    isError: useDemoFetch ? error != null : false,
    refetch,
    hasLocalSnapshot,
    usesDemoFetch: useDemoFetch,
  };
}
