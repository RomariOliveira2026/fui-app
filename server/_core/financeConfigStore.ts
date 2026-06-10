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
import { isDemoPassenger } from "./demoUser";
import * as db from "../db";

let memoryCache: PlatformFinanceConfig | null = null;

export async function loadFinanceConfig(
  user?: { openId: string; role?: string }
): Promise<PlatformFinanceConfig> {
  const dbInstance = await db.getDb();
  const useDemoStore =
    !dbInstance || (user && !ENV.isProduction && isDemoPassenger(user));

  if (useDemoStore) {
    memoryCache = getDemoFinanceConfig();
    return memoryCache;
  }

  const fromDb = await db.getPlatformFinanceConfig();
  if (fromDb) {
    memoryCache = fromDb;
    return fromDb;
  }

  const defaults = buildDefaultFinanceConfig(ENV.platformFeePercent);
  await db.upsertPlatformFinanceConfig(defaults);
  memoryCache = defaults;
  return defaults;
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
  const dbInstance = await db.getDb();
  const useDemoStore =
    !dbInstance || (user && !ENV.isProduction && isDemoPassenger(user));

  if (useDemoStore) {
    const next = updateDemoFinanceConfig(patch);
    memoryCache = next;
    return next;
  }

  const current = await loadFinanceConfig(user);
  const next = mergeFinanceConfig(current, patch);
  await db.upsertPlatformFinanceConfig(next);
  memoryCache = next;
  return next;
}
