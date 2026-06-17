import { describe, expect, it } from "vitest";
import {
  DEMO_DRIVER_SPEED_KMH,
  estimateTravelSeconds,
  formatEtaFromSeconds,
  getPassengerDriverEta,
} from "@shared/driverTracking";

describe("driverTracking ETA", () => {
  it("não fica preso em 2 min para ~850 m", () => {
    const seconds = estimateTravelSeconds(850, DEMO_DRIVER_SPEED_KMH);
    expect(seconds).toBeGreaterThan(60);
    expect(seconds).toBeLessThan(150);

    const display = formatEtaFromSeconds(seconds, 850);
    expect(display.headline).toMatch(/^\d:\d{2}$/);
    expect(display.unit).toBe("");
  });

  it("usa etaSecondsRemaining do servidor quando informado", () => {
    const eta = getPassengerDriverEta(
      {
        driverId: 1,
        status: "accepted",
        originLat: "-10.685",
        originLng: "-37.425",
        destinationLat: "-10.688",
        destinationLng: "-37.422",
        driverCurrentLat: "-10.692",
        driverCurrentLng: "-37.430",
      },
      "to_pickup",
      null,
      94
    );

    expect(eta?.seconds).toBe(94);
    expect(eta?.headline).toBe("1:34");
  });

  it("diminui ETA conforme distância cai", () => {
    const far = formatEtaFromSeconds(estimateTravelSeconds(800, DEMO_DRIVER_SPEED_KMH), 800);
    const near = formatEtaFromSeconds(estimateTravelSeconds(400, DEMO_DRIVER_SPEED_KMH), 400);
    expect(near.seconds).toBeLessThan(far.seconds);
  });
});
