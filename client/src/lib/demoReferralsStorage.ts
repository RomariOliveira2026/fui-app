import type { DemoReferralsSnapshot } from "@shared/demoReferrals";

export const FUI_DEMO_REFERRALS_KEY = "fui_demo_referrals";

export function loadDemoReferralsSnapshot(): DemoReferralsSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUI_DEMO_REFERRALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoReferralsSnapshot;
  } catch {
    return null;
  }
}

export function saveDemoReferralsSnapshot(snapshot: DemoReferralsSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_REFERRALS_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}
