import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isDemoAppClient } from "@/lib/demoMode";
import { mergeDemoUserProfile } from "@/lib/demoUserProfile";
import { useSavedAddresses } from "@/lib/useSavedAddresses";
import { useDemoRideHydration } from "@/lib/useDemoRideHydration";
import { useBetaDemoRuntime } from "@/lib/useBetaDemoRuntime";
import {
  PORTFOLIO_PASSENGER_SUMMARY,
  PORTFOLIO_RECENT_RIDES,
  PORTFOLIO_SAVED_ADDRESSES,
} from "@/lib/passengerPortfolioDemoData";

export type PassengerSummary = {
  totalRides: number;
  totalSpent: number;
  totalSaved: number;
  scheduledCount: number;
};

export function usePassengerDashboardData() {
  const { user, canUsePrivateUserApi, isDemoUser } = useAuth();
  const { active: betaDemoActive } = useBetaDemoRuntime(false);
  const isDemo = isDemoAppClient() || isDemoUser || betaDemoActive;
  useDemoRideHydration();

  const displayUser = useMemo(
    () => (user ? mergeDemoUserProfile(user) : null),
    [user]
  );

  const { savedAddresses } = useSavedAddresses();

  const { data: activeRides } = trpc.ride.active.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000,
    retry: false,
  });

  const { data: recentRidesApi, isLoading: recentLoadingApi } =
    trpc.user.getRecentRides.useQuery(
      { limit: 5 },
      { enabled: !!user && canUsePrivateUserApi, retry: false }
    );

  const { data: statsApi, isLoading: statsLoadingApi } = trpc.user.getStats.useQuery(
    undefined,
    { enabled: !!user && canUsePrivateUserApi, retry: false }
  );

  const activeRide = useMemo(() => {
    const list = activeRides ?? [];
    return list.find(
      (ride) =>
        ride.passengerId === (user?.id ?? 0) &&
        ["requested", "accepted", "in_progress"].includes(ride.status)
    );
  }, [activeRides, user?.id]);

  const recentRides = useMemo(() => {
    if (isDemo) {
      return PORTFOLIO_RECENT_RIDES;
    }
    return recentRidesApi ?? [];
  }, [isDemo, recentRidesApi]);

  const lastRide = recentRides[0] ?? null;

  const summary = useMemo((): PassengerSummary => {
    if (isDemo) {
      return PORTFOLIO_PASSENGER_SUMMARY;
    }
    return {
      totalRides: statsApi?.totalRides ?? 0,
      totalSpent: statsApi?.totalSpent ?? 0,
      totalSaved: statsApi?.totalSaved ?? 0,
      scheduledCount: 0,
    };
  }, [isDemo, statsApi]);

  const portfolioSavedAddresses = isDemo ? PORTFOLIO_SAVED_ADDRESSES : savedAddresses;
  const homeAddress = portfolioSavedAddresses.find((a) => a.label === "home");
  const workAddress = portfolioSavedAddresses.find((a) => a.label === "work");

  return {
    displayUser,
    isDemo,
    activeRide,
    recentRides,
    lastRide,
    summary,
    savedAddresses: portfolioSavedAddresses,
    homeAddress,
    workAddress,
    isLoading: isDemo ? false : recentLoadingApi || statsLoadingApi,
  };
}
