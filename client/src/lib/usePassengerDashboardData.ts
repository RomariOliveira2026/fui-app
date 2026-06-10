import { useMemo } from "react";
import type { Ride } from "../../../drizzle/schema";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { mergeDemoUserProfile } from "@/lib/demoUserProfile";
import { loadDemoRides } from "@/lib/demoRideStorage";
import { useSavedAddresses } from "@/lib/useSavedAddresses";
import { useDemoRideHydration } from "@/lib/useDemoRideHydration";

export type PassengerSummary = {
  totalRides: number;
  totalSpent: number;
  totalSaved: number;
  scheduledCount: number;
};

function computeDemoSummary(rides: Ride[]): PassengerSummary {
  const completed = rides.filter((r) => r.status === "completed");
  const totalSpent = completed.reduce(
    (sum, r) => sum + (r.finalPrice ?? r.estimatedPrice ?? 0),
    0
  );
  const scheduledCount = rides.filter(
    (r) => r.isScheduled === "yes" && r.status !== "cancelled" && r.status !== "completed"
  ).length;

  return {
    totalRides: completed.length,
    totalSpent,
    totalSaved: Math.round(totalSpent * 0.08),
    scheduledCount,
  };
}

export function usePassengerDashboardData() {
  const { user, canUsePrivateUserApi, isDemoUser } = useAuth();
  const isDemo = isLocalDemoDev() || isDemoUser;
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

  const demoRides = useMemo(() => (isDemo ? loadDemoRides() : []), [isDemo, activeRides]);

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
      return demoRides
        .filter((r) => r.status !== "cancelled")
        .slice(0, 5);
    }
    return recentRidesApi ?? [];
  }, [isDemo, demoRides, recentRidesApi]);

  const lastRide = recentRides[0] ?? null;

  const summary = useMemo((): PassengerSummary => {
    if (isDemo) {
      return computeDemoSummary(demoRides);
    }
    return {
      totalRides: statsApi?.totalRides ?? 0,
      totalSpent: statsApi?.totalSpent ?? 0,
      totalSaved: statsApi?.totalSaved ?? 0,
      scheduledCount: 0,
    };
  }, [isDemo, demoRides, statsApi]);

  const homeAddress = savedAddresses.find((a) => a.label === "home");
  const workAddress = savedAddresses.find((a) => a.label === "work");

  return {
    displayUser,
    isDemo,
    activeRide,
    recentRides,
    lastRide,
    summary,
    savedAddresses,
    homeAddress,
    workAddress,
    isLoading: isDemo ? false : recentLoadingApi || statsLoadingApi,
  };
}
