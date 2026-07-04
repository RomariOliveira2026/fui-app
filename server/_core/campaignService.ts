import type {
  CampaignAnalyticsSummary,
  CampaignEventType,
  HomeMediaSlot,
  MediaCampaign,
  MediaPartner,
  MediaPlacement,
} from "@shared/adminCampaigns";
import { buildDomainReadinessReport } from "@shared/domainConfig";
import { ENV } from "./env";
import { shouldUseDemoDataStore } from "./databaseAvailability";
import {
  createDemoCampaign,
  createDemoPartner,
  getDemoCampaignAnalytics,
  getDemoCampaigns,
  getDemoHomeMedia,
  getDemoPartners,
  recordDemoCampaignEvent,
  toggleDemoCampaignStatus,
  updateDemoCampaign,
  updateDemoPartner,
} from "./demoAdminCampaigns";
import type { CampaignInput, PartnerInput } from "@shared/adminCampaigns";
import type { CampaignStatus } from "@shared/adminCampaigns";
import * as db from "../db";

export async function listMediaPartners(
  user?: { openId: string; role?: string }
): Promise<MediaPartner[]> {
  if (await shouldUseDemoDataStore(user)) {
    return getDemoPartners();
  }
  try {
    return await db.getMediaPartners();
  } catch (error) {
    console.warn("[campaignService] listMediaPartners fallback:", error);
    return getDemoPartners();
  }
}

export async function createMediaPartner(
  input: PartnerInput,
  user?: { openId: string; role?: string }
): Promise<MediaPartner> {
  if (await shouldUseDemoDataStore(user)) {
    return createDemoPartner(input);
  }
  return db.createMediaPartner(input);
}

export async function patchMediaPartner(
  id: number,
  patch: Partial<PartnerInput>,
  user?: { openId: string; role?: string }
): Promise<MediaPartner | null> {
  if (await shouldUseDemoDataStore(user)) {
    return updateDemoPartner(id, patch);
  }
  return db.updateMediaPartner(id, patch);
}

export async function listMediaCampaigns(
  user?: { openId: string; role?: string }
): Promise<MediaCampaign[]> {
  if (await shouldUseDemoDataStore(user)) {
    return getDemoCampaigns();
  }
  try {
    return await db.getMediaCampaigns();
  } catch (error) {
    console.warn("[campaignService] listMediaCampaigns fallback:", error);
    return getDemoCampaigns();
  }
}

export async function createMediaCampaign(
  input: CampaignInput,
  user?: { openId: string; role?: string }
): Promise<MediaCampaign> {
  if (await shouldUseDemoDataStore(user)) {
    return createDemoCampaign(input);
  }
  return db.createMediaCampaign(input);
}

export async function patchMediaCampaign(
  id: number,
  patch: Partial<CampaignInput> & { status?: CampaignStatus },
  user?: { openId: string; role?: string }
): Promise<MediaCampaign | null> {
  if (await shouldUseDemoDataStore(user)) {
    return updateDemoCampaign(id, patch);
  }
  return db.updateMediaCampaign(id, patch);
}

export async function setMediaCampaignStatus(
  id: number,
  status: CampaignStatus,
  user?: { openId: string; role?: string }
): Promise<MediaCampaign | null> {
  if (await shouldUseDemoDataStore(user)) {
    return toggleDemoCampaignStatus(id, status);
  }
  return db.updateMediaCampaignStatus(id, status);
}

export async function getCampaignAnalyticsSummary(
  user?: { openId: string; role?: string }
): Promise<CampaignAnalyticsSummary> {
  if (await shouldUseDemoDataStore(user)) {
    return getDemoCampaignAnalytics();
  }
  try {
    return await db.getCampaignAnalyticsSummary();
  } catch (error) {
    console.warn("[campaignService] analytics fallback:", error);
    return getDemoCampaignAnalytics();
  }
}

export async function getHomeMediaSlots(options: {
  city?: string;
  category?: string;
}): Promise<HomeMediaSlot[]> {
  const city = options.city?.trim() || ENV.appCity.trim() || "Brasil";
  if (await shouldUseDemoDataStore()) {
    return getDemoHomeMedia(city, options.category);
  }
  try {
    return await db.getActiveHomeMedia(city, options.category);
  } catch (error) {
    console.warn("[campaignService] home media fallback:", error);
    return getDemoHomeMedia(city, options.category);
  }
}

export async function trackCampaignEvent(payload: {
  campaignId: number;
  creativeId: number;
  partnerId: number;
  eventType: CampaignEventType;
  placement: MediaPlacement;
  city?: string;
  userId?: number;
}): Promise<void> {
  if (await shouldUseDemoDataStore()) {
    recordDemoCampaignEvent(payload);
    return;
  }
  try {
    await db.insertCampaignEvent(payload);
  } catch (error) {
    console.warn("[campaignService] track event fallback:", error);
    recordDemoCampaignEvent(payload);
  }
}

export function getDomainReadinessForAdmin(): ReturnType<typeof buildDomainReadinessReport> {
  return buildDomainReadinessReport({
    envUrl: ENV.appUrl || process.env.VITE_APP_URL,
    allowPreviewHost: process.env.VITE_ALLOW_PREVIEW_HOST === "true",
    hasDatabase: !!ENV.databaseUrl,
    hasOAuth: !!ENV.oAuthServerUrl && !!ENV.appId,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
  });
}
