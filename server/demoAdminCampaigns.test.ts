import { describe, it, expect, beforeEach } from "vitest";
import {
  createDemoCampaign,
  createDemoPartner,
  getDemoCampaignAnalytics,
  getDemoHomeMedia,
  recordDemoCampaignEvent,
  resetDemoCampaignsForTests,
} from "./_core/demoAdminCampaigns";

describe("demoAdminCampaigns", () => {
  beforeEach(() => {
    resetDemoCampaignsForTests();
  });

  it("seeds partners and returns home media for target city", () => {
    const slots = getDemoHomeMedia("Itabaiana");
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((s) => s.placement === "home_hero")).toBe(true);
  });

  it("filters campaigns by city targeting", () => {
    const partner = createDemoPartner({
      name: "Test Partner",
      city: "Lagarto",
      state: "SE",
      category: "retail",
      status: "active",
    });
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 86400000).toISOString();
    createDemoCampaign({
      partnerId: partner.id,
      name: "Lagarto only",
      category: "retail",
      status: "active",
      targetCities: ["Lagarto"],
      startsAt: start,
      endsAt: end,
      creatives: [
        {
          placement: "home_strip",
          headline: "Oferta Lagarto",
          ctaLabel: "Ver",
          actionUrl: "/request-ride",
          sortOrder: 0,
        },
      ],
    });

    expect(getDemoHomeMedia("Lagarto").some((s) => s.creative.headline.includes("Lagarto"))).toBe(
      true
    );
    expect(getDemoHomeMedia("Recife").some((s) => s.creative.headline.includes("Lagarto"))).toBe(
      false
    );
  });

  it("records impression and click analytics", () => {
    const slots = getDemoHomeMedia("Itabaiana");
    const slot = slots[0]!;
    recordDemoCampaignEvent({
      campaignId: slot.creative.campaignId,
      creativeId: slot.creative.id,
      partnerId: slot.partnerId,
      eventType: "impression",
      placement: slot.placement,
    });
    recordDemoCampaignEvent({
      campaignId: slot.creative.campaignId,
      creativeId: slot.creative.id,
      partnerId: slot.partnerId,
      eventType: "click",
      placement: slot.placement,
    });
    const analytics = getDemoCampaignAnalytics();
    expect(analytics.totalImpressions).toBeGreaterThanOrEqual(1);
    expect(analytics.totalClicks).toBeGreaterThanOrEqual(1);
  });
});
