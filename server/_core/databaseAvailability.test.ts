import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../db";
import {
  canFallbackToDemoAdminData,
  isDatabaseQueryable,
  resetDatabaseProbeCacheForTests,
  shouldUseDemoDataStore,
} from "./databaseAvailability";
import { DEMO_PASSENGER_OPEN_ID } from "@shared/const";

describe("databaseAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    resetDatabaseProbeCacheForTests();
  });

  it("returns false when getDb is null", async () => {
    vi.mocked(getDb).mockResolvedValue(null as never);
    await expect(isDatabaseQueryable()).resolves.toBe(false);
  });

  it("returns true when SELECT 1 succeeds", async () => {
    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
    } as never);
    await expect(isDatabaseQueryable()).resolves.toBe(true);
  });

  it("returns false when SELECT 1 throws", async () => {
    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    } as never);
    await expect(isDatabaseQueryable()).resolves.toBe(false);
  });

  it("shouldUseDemoDataStore for demo passenger in dev", async () => {
    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
    } as never);
    await expect(
      shouldUseDemoDataStore({ openId: DEMO_PASSENGER_OPEN_ID, role: "passenger" })
    ).resolves.toBe(true);
  });

  it("shouldUseDemoDataStore when dev and DB probe fails", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockRejectedValue(new Error("Failed query")),
    } as never);
    await expect(
      shouldUseDemoDataStore({ openId: "admin-local", role: "admin" })
    ).resolves.toBe(true);
  });

  it("canFallbackToDemoAdminData in local dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(
      canFallbackToDemoAdminData({ openId: "admin-local", role: "admin" })
    ).toBe(true);
  });
});
