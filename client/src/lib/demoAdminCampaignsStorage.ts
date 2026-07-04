import type { MediaCampaign, MediaPartner } from "@shared/adminCampaigns";

const STORAGE_KEY = "fui.demoAdminCampaigns.v1";

export type DemoAdminCampaignsSnapshot = {
  partners?: MediaPartner[];
  campaigns?: MediaCampaign[];
};

export function loadDemoAdminCampaignsSnapshot(): DemoAdminCampaignsSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoAdminCampaignsSnapshot;
  } catch {
    return null;
  }
}

export function saveDemoAdminCampaignsSnapshot(snapshot: DemoAdminCampaignsSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}
