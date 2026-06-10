import type { FinancialLedgerEntry } from "@shared/financialLedger";

const DEMO_LEDGER_ID_START = 960_001;
const entries = new Map<string, FinancialLedgerEntry>();
let nextId = DEMO_LEDGER_ID_START;

function entryKey(entityType: string, entityId: number): string {
  return `${entityType}:${entityId}`;
}

export function isDemoLedgerId(id: number): boolean {
  return id >= DEMO_LEDGER_ID_START;
}

export function recordDemoLedgerEntry(
  input: Omit<FinancialLedgerEntry, "id">
): FinancialLedgerEntry {
  const key = entryKey(input.entityType, input.entityId);
  const existing = entries.get(key);
  if (existing) return existing;

  const entry: FinancialLedgerEntry = { ...input, id: nextId++ };
  entries.set(key, entry);
  return entry;
}

export function getDemoLedgerEntriesForDriver(driverId: number): FinancialLedgerEntry[] {
  return Array.from(entries.values())
    .filter((e) => e.driverId === driverId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function getAllDemoLedgerEntries(): FinancialLedgerEntry[] {
  return Array.from(entries.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

export function hydrateDemoLedgerEntries(rows: FinancialLedgerEntry[]): void {
  for (const row of rows) {
    const key = entryKey(row.entityType, row.entityId);
    if (!entries.has(key)) {
      entries.set(key, row);
      if (row.id >= nextId) nextId = row.id + 1;
    }
  }
}
