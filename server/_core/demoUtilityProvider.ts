import type { UtilityProviderProfile } from "@shared/utilityProvider";
import { buildDefaultUtilityProviderProfile } from "@shared/utilityProvider";

const profiles = new Map<number, UtilityProviderProfile>();

export function hydrateDemoUtilityProviderProfiles(entries: UtilityProviderProfile[]): void {
  for (const p of entries) {
    profiles.set(p.driverId, { ...p });
  }
}

/** Apenas testes — limpa perfis demo de prestadores utilitários. */
export function resetDemoUtilityProviderProfilesForTests(): void {
  profiles.clear();
}

export function exportDemoUtilityProviderProfiles(): UtilityProviderProfile[] {
  return Array.from(profiles.values());
}

export function getDemoUtilityProviderProfile(driverId: number): UtilityProviderProfile {
  const existing = profiles.get(driverId);
  if (existing) return existing;
  const created = buildDefaultUtilityProviderProfile(driverId);
  profiles.set(driverId, created);
  return created;
}

export function updateDemoUtilityProviderProfile(
  driverId: number,
  patch: Partial<UtilityProviderProfile>
): UtilityProviderProfile {
  const current = getDemoUtilityProviderProfile(driverId);
  const updated = { ...current, ...patch, driverId };
  profiles.set(driverId, updated);
  return updated;
}
