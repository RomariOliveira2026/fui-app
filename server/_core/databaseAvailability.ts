import { sql } from "drizzle-orm";
import { ENV } from "./env";
import { isDemoPassenger } from "./demoUser";
import { getDb } from "../db";

let probeCache: { ok: boolean; checkedAt: number } | null = null;
const PROBE_TTL_MS = 15_000;

/** Test-only: clears cached DB probe result. */
export function resetDatabaseProbeCacheForTests(): void {
  probeCache = null;
}

/** True when Drizzle can run a trivial query (MySQL up + reachable). */
export async function isDatabaseQueryable(): Promise<boolean> {
  const now = Date.now();
  if (probeCache && now - probeCache.checkedAt < PROBE_TTL_MS) {
    return probeCache.ok;
  }

  const db = await getDb();
  if (!db) {
    probeCache = { ok: false, checkedAt: now };
    return false;
  }

  try {
    await db.execute(sql`SELECT 1`);
    probeCache = { ok: true, checkedAt: now };
    return true;
  } catch (error) {
    console.warn("[Database] Health probe failed:", error);
    probeCache = { ok: false, checkedAt: now };
    return false;
  }
}

/** Demo/in-memory store when passageiro demo or dev local sem MySQL operacional. */
export async function shouldUseDemoDataStore(
  user?: { openId: string; role?: string } | null
): Promise<boolean> {
  if (user && isDemoPassenger(user)) return true;
  if (ENV.isProduction) return false;
  return !(await isDatabaseQueryable());
}

/** Admin modules may fall back to demo payloads in dev/beta when DB is unavailable. */
export function canFallbackToDemoAdminData(user: {
  role: string;
  openId: string;
}): boolean {
  if (isDemoPassenger(user)) return true;
  if (ENV.betaDemo) return true;
  return !ENV.isProduction;
}
