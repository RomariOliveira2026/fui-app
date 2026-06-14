import { describe, expect, it, vi, afterEach } from "vitest";
import { DEMO_PASSENGER_OPEN_ID } from "@shared/const";
import {
  canDemoPassengerUseAdminModules,
  isDemoPassenger,
} from "./_core/demoUser";

describe("canDemoPassengerUseAdminModules", () => {
  const demoUser = { openId: DEMO_PASSENGER_OPEN_ID };

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("permite demo em dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BETA_DEMO", "");
    expect(canDemoPassengerUseAdminModules(demoUser)).toBe(true);
  });

  it("bloqueia demo em produção sem beta", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETA_DEMO", "");
    expect(canDemoPassengerUseAdminModules(demoUser)).toBe(false);
  });

  it("permite demo em produção com BETA_DEMO=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETA_DEMO", "true");
    expect(canDemoPassengerUseAdminModules(demoUser)).toBe(true);
  });

  it("isDemoPassenger reconhece openId demo", () => {
    expect(isDemoPassenger(demoUser)).toBe(true);
    expect(isDemoPassenger({ openId: "other" })).toBe(false);
  });
});
