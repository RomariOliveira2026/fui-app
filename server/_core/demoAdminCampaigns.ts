import type {
  CampaignAnalyticsSummary,
  CampaignCreative,
  CampaignInput,
  CampaignStatus,
  HomeMediaSlot,
  MediaCampaign,
  MediaPartner,
  MediaPlacement,
  PartnerInput,
  PartnerStatus,
} from "@shared/adminCampaigns";
import { PREMIUM_PLACEMENTS } from "@shared/adminCampaigns";
import { ENV } from "./env";

const partners = new Map<number, MediaPartner>();
const campaigns = new Map<number, MediaCampaign>();
const events: Array<{
  campaignId: number;
  creativeId: number;
  partnerId: number;
  eventType: "impression" | "click";
  placement: MediaPlacement;
  city?: string;
  userId?: number;
  createdAt: string;
}> = [];

let nextPartnerId = 820_001;
let nextCampaignId = 830_001;
let nextCreativeId = 840_001;
let seeded = false;

function nowIso(): string {
  return new Date().toISOString();
}

function seedDemoCampaigns(): void {
  if (seeded || ENV.isProduction) return;
  seeded = true;
  if (partners.size > 0) return;

  const appCity = ENV.appCity.trim() || "Itabaiana";
  const partnerSamples: PartnerInput[] = [
    {
      name: "Restaurante Sabor da Terra",
      brandLabel: "Sabor da Terra",
      contactName: "Maria Oliveira",
      contactEmail: "contato@sabordaterra.local",
      contactWhatsapp: "79999990001",
      city: appCity,
      state: "SE",
      category: "food",
      status: "active",
      notes: "Parceiro piloto BuilderTudo — cardápio executivo",
    },
    {
      name: "Auto Center Premium",
      brandLabel: "Auto Center",
      contactName: "João Santos",
      contactWhatsapp: "79999990002",
      city: "Aracaju",
      state: "SE",
      category: "services",
      status: "active",
    },
    {
      name: "Moda Center Socorro",
      brandLabel: "Moda Center",
      city: "Nossa Senhora do Socorro",
      state: "SE",
      category: "retail",
      status: "active",
    },
  ];

  for (const sample of partnerSamples) {
    createDemoPartner(sample);
  }

  const p1 = Array.from(partners.values())[0];
  const p2 = Array.from(partners.values())[1];
  if (!p1 || !p2) return;

  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();
  end.setDate(end.getDate() + 45);

  createDemoCampaign({
    partnerId: p1.id,
    name: "Almoço Executivo — 20% OFF",
    category: "food",
    status: "active",
    targetCities: [appCity, "Aracaju"],
    budgetCents: 150_000,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    creatives: [
      {
        placement: "home_hero",
        headline: "Almoço executivo com 20% OFF",
        subheadline: `Peça pelo ${p1.brandLabel ?? p1.name} — parceiro Fui! em ${appCity}`,
        ctaLabel: "Ver oferta",
        actionUrl: "/request-ride",
        accentColor: "#F39200",
        sortOrder: 0,
      },
      {
        placement: "home_card",
        headline: "Delivery parceiro",
        subheadline: "Peça e peça corrida na sequência",
        ctaLabel: "Explorar",
        actionUrl: "/delivery",
        accentColor: "#E85D04",
        sortOrder: 1,
      },
    ],
  });

  createDemoCampaign({
    partnerId: p2.id,
    name: "Revisão Completa — R$ 49",
    category: "services",
    status: "active",
    targetCities: ["Aracaju", "Lagarto"],
    budgetCents: 80_000,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    creatives: [
      {
        placement: "home_strip",
        headline: "Revisão completa por R$ 49",
        subheadline: "Auto Center Premium — parceiro oficial",
        ctaLabel: "Agendar",
        actionUrl: "/utilities",
        accentColor: "#2563EB",
        sortOrder: 0,
      },
    ],
  });
}

export function ensureDemoCampaignSeeds(): void {
  seedDemoCampaigns();
}

export function getDemoPartners(): MediaPartner[] {
  ensureDemoCampaignSeeds();
  return Array.from(partners.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getDemoCampaigns(): MediaCampaign[] {
  ensureDemoCampaignSeeds();
  return Array.from(campaigns.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function createDemoPartner(input: PartnerInput): MediaPartner {
  const ts = nowIso();
  const partner: MediaPartner = {
    id: nextPartnerId++,
    name: input.name,
    brandLabel: input.brandLabel,
    contactName: input.contactName,
    contactEmail: input.contactEmail || undefined,
    contactWhatsapp: input.contactWhatsapp,
    city: input.city,
    state: input.state,
    category: input.category,
    status: input.status,
    notes: input.notes,
    createdAt: ts,
    updatedAt: ts,
  };
  partners.set(partner.id, partner);
  return partner;
}

export function updateDemoPartner(
  id: number,
  patch: Partial<PartnerInput> & { status?: PartnerStatus }
): MediaPartner | null {
  const current = partners.get(id);
  if (!current) return null;
  const updated: MediaPartner = {
    ...current,
    ...patch,
    contactEmail: patch.contactEmail === "" ? undefined : patch.contactEmail ?? current.contactEmail,
    updatedAt: nowIso(),
  };
  partners.set(id, updated);
  return updated;
}

function mapCreatives(
  campaignId: number,
  inputs: CampaignInput["creatives"]
): CampaignCreative[] {
  return inputs.map((c, index) => ({
    id: nextCreativeId++,
    campaignId,
    placement: c.placement,
    headline: c.headline,
    subheadline: c.subheadline,
    ctaLabel: c.ctaLabel,
    actionUrl: c.actionUrl,
    imageUrl: c.imageUrl || undefined,
    accentColor: c.accentColor,
    sortOrder: c.sortOrder ?? index,
    isPremium: PREMIUM_PLACEMENTS.includes(c.placement),
  }));
}

export function createDemoCampaign(input: CampaignInput): MediaCampaign {
  const partner = partners.get(input.partnerId);
  if (!partner) throw new Error("Parceiro não encontrado");

  const ts = nowIso();
  const id = nextCampaignId++;
  const campaign: MediaCampaign = {
    id,
    partnerId: input.partnerId,
    name: input.name,
    category: input.category,
    status: input.status,
    targetCities: input.targetCities,
    budgetCents: input.budgetCents,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    creatives: mapCreatives(id, input.creatives),
    createdAt: ts,
    updatedAt: ts,
  };
  campaigns.set(id, campaign);
  return campaign;
}

export function updateDemoCampaign(
  id: number,
  patch: Partial<CampaignInput> & { status?: CampaignStatus }
): MediaCampaign | null {
  const current = campaigns.get(id);
  if (!current) return null;

  const creatives = patch.creatives
    ? mapCreatives(id, patch.creatives)
    : current.creatives;

  const updated: MediaCampaign = {
    ...current,
    ...patch,
    creatives,
    updatedAt: nowIso(),
  };
  campaigns.set(id, updated);
  return updated;
}

export function toggleDemoCampaignStatus(
  id: number,
  status: CampaignStatus
): MediaCampaign | null {
  const current = campaigns.get(id);
  if (!current) return null;
  current.status = status;
  current.updatedAt = nowIso();
  return current;
}

export function recordDemoCampaignEvent(payload: {
  campaignId: number;
  creativeId: number;
  partnerId: number;
  eventType: "impression" | "click";
  placement: MediaPlacement;
  city?: string;
  userId?: number;
}): void {
  events.unshift({ ...payload, createdAt: nowIso() });
  if (events.length > 5000) events.pop();
}

export function getDemoCampaignAnalytics(): CampaignAnalyticsSummary {
  ensureDemoCampaignSeeds();
  const byKey = new Map<
    string,
    { campaignId: number; placement: MediaPlacement; impressions: number; clicks: number }
  >();

  for (const e of events) {
    const key = `${e.campaignId}:${e.placement}`;
    const row = byKey.get(key) ?? {
      campaignId: e.campaignId,
      placement: e.placement,
      impressions: 0,
      clicks: 0,
    };
    if (e.eventType === "impression") row.impressions++;
    else row.clicks++;
    byKey.set(key, row);
  }

  const byCampaign: CampaignAnalyticsSummary["byCampaign"] = [];
  for (const row of Array.from(byKey.values())) {
    const campaign = campaigns.get(row.campaignId);
    const partner = campaign ? partners.get(campaign.partnerId) : undefined;
    const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;
    byCampaign.push({
      campaignId: row.campaignId,
      campaignName: campaign?.name ?? "—",
      partnerName: partner?.brandLabel ?? partner?.name ?? "—",
      placement: row.placement,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr,
    });
  }

  const placementAgg = new Map<MediaPlacement, { impressions: number; clicks: number }>();
  for (const row of byCampaign) {
    const agg = placementAgg.get(row.placement) ?? { impressions: 0, clicks: 0 };
    agg.impressions += row.impressions;
    agg.clicks += row.clicks;
    placementAgg.set(row.placement, agg);
  }

  const totalImpressions = events.filter((e) => e.eventType === "impression").length;
  const totalClicks = events.filter((e) => e.eventType === "click").length;

  return {
    totalImpressions,
    totalClicks,
    overallCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    activeCampaigns: getDemoCampaigns().filter((c) => c.status === "active").length,
    activePartners: getDemoPartners().filter((p) => p.status === "active").length,
    byCampaign,
    byPlacement: Array.from(placementAgg.entries()).map(([placement, agg]) => ({
      placement,
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr: agg.impressions > 0 ? agg.clicks / agg.impressions : 0,
    })),
  };
}

export function getDemoHomeMedia(city: string, category?: string): HomeMediaSlot[] {
  ensureDemoCampaignSeeds();
  const now = Date.now();
  const normalizedCity = city.trim().toLowerCase();

  const active = getDemoCampaigns().filter((c) => {
    if (c.status !== "active") return false;
    const start = new Date(c.startsAt).getTime();
    const end = new Date(c.endsAt).getTime();
    if (now < start || now > end) return false;
    if (category && c.category !== category) return false;
    if (c.targetCities.length === 0) return true;
    return c.targetCities.some((t) => t.trim().toLowerCase() === normalizedCity);
  });

  const slots: HomeMediaSlot[] = [];
  for (const campaign of active) {
    const partner = partners.get(campaign.partnerId);
    if (!partner || partner.status !== "active") continue;

    for (const creative of [...campaign.creatives].sort((a, b) => a.sortOrder - b.sortOrder)) {
      slots.push({
        placement: creative.placement,
        partnerId: campaign.partnerId,
        creative: {
          ...creative,
          partnerName: partner.brandLabel ?? partner.name,
          campaignName: campaign.name,
          category: campaign.category,
        },
      });
    }
  }

  return slots;
}

export function hydrateDemoCampaignState(payload: {
  partners?: MediaPartner[];
  campaigns?: MediaCampaign[];
}): void {
  if (payload.partners?.length) {
    for (const p of payload.partners) {
      partners.set(p.id, p);
      if (p.id >= nextPartnerId) nextPartnerId = p.id + 1;
    }
  }
  if (payload.campaigns?.length) {
    for (const c of payload.campaigns) {
      campaigns.set(c.id, c);
      if (c.id >= nextCampaignId) nextCampaignId = c.id + 1;
      for (const cr of c.creatives) {
        if (cr.id >= nextCreativeId) nextCreativeId = cr.id + 1;
      }
    }
  }
  seeded = true;
}

export function resetDemoCampaignsForTests(): void {
  partners.clear();
  campaigns.clear();
  events.length = 0;
  nextPartnerId = 820_001;
  nextCampaignId = 830_001;
  nextCreativeId = 840_001;
  seeded = false;
}
