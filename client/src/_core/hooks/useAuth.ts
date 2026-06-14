import { getLoginUrl } from "@/const";
import {
  canUsePrivateUserApi,
  DEMO_PASSENGER_USER,
  isDemoLocalUser,
  isLocalDemoDev,
} from "@/lib/demoMode";
import { mergeDemoUserProfile } from "@/lib/demoUserProfile";
import { isLandingRoute } from "@/components/landing/landingRoutes";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const skipMeQuery =
    isLocalDemoDev() ||
    (typeof window !== "undefined" && isLandingRoute(window.location.pathname));

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !skipMeQuery,
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (!skipMeQuery) return;
    void utils.auth.me.cancel();
    utils.auth.me.setData(undefined, DEMO_PASSENGER_USER);
  }, [skipMeQuery, utils]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const baseUser = skipMeQuery ? DEMO_PASSENGER_USER : (meQuery.data ?? null);
    const user = baseUser && skipMeQuery ? mergeDemoUserProfile(baseUser) : baseUser;
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    const authUnavailable = !skipMeQuery && meQuery.isError;
    return {
      user: authUnavailable ? null : user,
      loading: skipMeQuery ? false : meQuery.isLoading || logoutMutation.isPending,
      error: skipMeQuery ? null : meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: authUnavailable ? false : Boolean(user),
    };
  }, [
    skipMeQuery,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    isDemoUser: isDemoLocalUser(state.user),
    canUsePrivateUserApi: canUsePrivateUserApi(state.user),
    refresh: () => meQuery.refetch(),
    logout,
  };
}
