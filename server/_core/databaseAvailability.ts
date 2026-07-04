import { sql } from "drizzle-orm";
import { ENV } from "./env";
import { isDemoPassenger } from "./demoUser";
import { getDb } from "../db";

let probeCache: { ok: boolean; checkedAt: number } | null = null;
let loggedProbeFailure = false;
const PROBE_TTL_MS = 15_000;

function probeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const cause = (error as { cause?: { sqlMessage?: string; message?: string } }).cause;
    if (cause?.sqlMessage) return cause.sqlMessage;
    if (cause?.message) return cause.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Test-only: clears cached DB probe result. */
export function resetDatabaseProbeCacheForTests(): void {
  probeCache = null;
  loggedProbeFailure = false;
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
    probeCache = { ok: false, checkedAt: now };
    if (!loggedProbeFailure) {
      loggedProbeFailure = true;
      const detail = probeErrorMessage(error);
      if (!ENV.isProduction) {
        console.info(
          `[Database] MySQL indisponível (${detail}) — usando stores demo em dev local`
        );
      } else {
        console.warn(`[Database] Health probe failed: ${detail}`);
      }
    }
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
