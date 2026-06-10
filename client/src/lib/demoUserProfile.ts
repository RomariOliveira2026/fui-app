/** Perfil do passageiro demo — persistência local (sem tabela users). */

export const FUI_DEMO_USER_PROFILE_KEY = "fui_demo_user_profile";

export type DemoUserProfileSnapshot = {
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export function loadDemoUserProfile(): DemoUserProfileSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUI_DEMO_USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUserProfileSnapshot;
  } catch {
    return null;
  }
}

export function saveDemoUserProfile(patch: DemoUserProfileSnapshot): DemoUserProfileSnapshot {
  const current = loadDemoUserProfile() ?? {};
  const next = { ...current, ...patch };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(FUI_DEMO_USER_PROFILE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  return next;
}

export function mergeDemoUserProfile<T extends DemoUserProfileSnapshot>(
  user: T
): T {
  const stored = loadDemoUserProfile();
  if (!stored) return user;
  return {
    ...user,
    name: stored.name ?? user.name,
    phone: stored.phone ?? user.phone,
    avatarUrl: stored.avatarUrl ?? user.avatarUrl,
  };
}
