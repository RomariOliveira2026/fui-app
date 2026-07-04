import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Ride } from "../drizzle/schema";
import { pathTotalMeters } from "@shared/routeAnimation";

vi.mock("./osrmRoute", () => ({
  calculateDrivingRouteWithOsrm: vi.fn(),
}));

import { calculateDrivingRouteWithOsrm } from "./osrmRoute";
import { encodeDemoPolyline } from "@shared/demoMaps";
import {
  clearDemoRoutePath,
  ensureDemoRoutePath,
  getDemoRouteSnapshotFields,
  getDemoTripPath,
  getDemoTripPathSource,
  hydrateDemoRouteFromSnapshot,
} from "./_core/demoRoutePaths";

const mockOsrm = calculateDrivingRouteWithOsrm as ReturnType<typeof vi.fn>;

function sampleRide(): Ride {
  return {
    id: 900099,
    passengerId: 1,
    driverId: null,
    vehicleId: null,
    vehicleType: "carro",
    originAddress: "Centro",
    originLat: "-10.685",
    originLng: "-37.425",
    destinationAddress: "Hospital",
    destinationLat: "-10.688",
    destinationLng: "-37.422",
    status: "requested",
    paymentMethod: "cash",
    paymentStatus: "paid",
  } as Ride;
}

describe("demoRoutePaths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDemoRoutePath(900099);
  });

  it("aguarda OSRM e cacheia rota real antes da simulação", async () => {
    const ride = sampleRide();
    const osrmPath = [
      { lat: -10.685, lng: -37.425 },
      { lat: -10.686, lng: -37.424 },
      { lat: -10.687, lng: -37.423 },
      { lat: -10.688, lng: -37.422 },
    ];

    mockOsrm.mockResolvedValueOnce({
      distance: { text: "1.2 km", value: 1200 },
      duration: { text: "3 min", value: 180 },
      startLocation: osrmPath[0],
      endLocation: osrmPath[osrmPath.length - 1],
      overviewPolyline: "",
      routePath: osrmPath,
      usedHaversineFallback: false,
    });

    const path = await ensureDemoRoutePath(ride);
    expect(getDemoTripPathSource(ride.id)).toBe("osrm");
    expect(path.length).toBeGreaterThan(3);
    expect(pathTotalMeters(path)).toBeGreaterThan(200);
  });

  it("getDemoTripPath usa cache OSRM após ensure", async () => {
    const ride = sampleRide();
    mockOsrm.mockResolvedValueOnce({
      distance: { text: "1 km", value: 1000 },
      duration: { text: "2 min", value: 120 },
      startLocation: { lat: -10.685, lng: -37.425 },
      endLocation: { lat: -10.688, lng: -37.422 },
      overviewPolyline: "",
      routePath: [
        { lat: -10.685, lng: -37.425 },
        { lat: -10.6865, lng: -37.4235 },
        { lat: -10.688, lng: -37.422 },
      ],
      usedHaversineFallback: false,
    });

    await ensureDemoRoutePath(ride);
    const cached = getDemoTripPath(ride);
    expect(cached.length).toBeGreaterThan(2);
    expect(getDemoTripPathSource(ride.id)).toBe("osrm");
  });

  it("reidrata rota OSRM do snapshot (Vercel/serverless)", () => {
    const ride = sampleRide();
    const osrmPath = [
      { lat: -10.685, lng: -37.425 },
      { lat: -10.686, lng: -37.424 },
      { lat: -10.688, lng: -37.422 },
    ];
    const polyline = encodeDemoPolyline(osrmPath);

    hydrateDemoRouteFromSnapshot({
      ...ride,
      demoRoutePolyline: polyline,
      tripPathSource: "osrm",
    });

    expect(getDemoTripPathSource(ride.id)).toBe("osrm");
    expect(getDemoTripPath(ride).length).toBeGreaterThan(2);
    expect(getDemoRouteSnapshotFields(ride.id).demoRoutePolyline).toBe(polyline);
  });
});
