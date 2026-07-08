import {
  buildDefaultFinanceConfig,
  mergeFinanceConfig,
  type PlatformFinanceConfig,
} from "@shared/adminFinance";
import { ENV } from "./env";
import {
  getDemoFinanceConfig,
  updateDemoFinanceConfig,
} from "./demoAdminFinance";
import { isDatabaseQueryable, shouldUseDemoDataStore } from "./databaseAvailability";
import * as db from "../db";

let memoryCache: PlatformFinanceConfig | null = null;

function defaultFinanceConfig(): PlatformFinanceConfig {
  return buildDefaultFinanceConfig(ENV.platformFeePercent);
}

export async function loadFinanceConfig(
  user?: { openId: string; role?: string }
): Promise<PlatformFinanceConfig> {
  if (await shouldUseDemoDataStore(user)) {
    memoryCache = getDemoFinanceConfig();
    return memoryCache;
  }

  const dbQueryable = await isDatabaseQueryable();
  if (!dbQueryable) {
    const fallback = memoryCache ?? defaultFinanceConfig();
    memoryCache = fallback;
    return fallback;
  }

  try {
    const fromDb = await db.getPlatformFinanceConfig();
    if (fromDb) {
      const normalized = mergeFinanceConfig(defaultFinanceConfig(), fromDb);
      memoryCache = normalized;
      return normalized;
    }

    const defaults = defaultFinanceConfig();
    await db.upsertPlatformFinanceConfig(defaults);
    memoryCache = defaults;
    return defaults;
  } catch (error) {
    console.warn("[financeConfig] DB read failed:", error);
    const fallback = memoryCache ?? defaultFinanceConfig();
    memoryCache = fallback;
    return fallback;
  }
}

export function getFinanceConfigSync(): PlatformFinanceConfig {
  if (memoryCache) return memoryCache;
  if (!ENV.isProduction) return getDemoFinanceConfig();
  return buildDefaultFinanceConfig(ENV.platformFeePercent);
}

export async function saveFinanceConfig(
  patch: Partial<PlatformFinanceConfig>,
  user?: { openId: string; role?: string }
): Promise<PlatformFinanceConfig> {
  if (await shouldUseDemoDataStore(user)) {
    const next = updateDemoFinanceConfig(patch);
    memoryCache = next;
    return next;
  }

  const current = await loadFinanceConfig(user);
  const next = mergeFinanceConfig(current, patch);
  memoryCache = next;

  if (await isDatabaseQueryable()) {
    try {
      await db.upsertPlatformFinanceConfig(next);
    } catch (error) {
      console.warn("[financeConfig] DB write failed:", error);
    }
  }

  return next;
}
