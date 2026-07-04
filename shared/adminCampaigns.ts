import { z } from "zod";

/** Espaços premium de mídia no app (BuilderTudo / Fui monetização). */
export const MEDIA_PLACEMENTS = [
  "home_hero",
  "home_card",
  "home_strip",
  "ride_waiting",
] as const;

export type MediaPlacement = (typeof MEDIA_PLACEMENTS)[number];

export const MEDIA_PLACEMENT_LABELS: Record<MediaPlacement, string> = {
  home_hero: "Home — Destaque Hero",
  home_card: "Home — Card Premium",
  home_strip: "Home — Faixa Comercial",
  ride_waiting: "Corrida — Aguardando motorista",
};

export const PREMIUM_PLACEMENTS: MediaPlacement[] = [
  "home_hero",
  "home_card",
  "ride_waiting",
];

export const CAMPAIGN_CATEGORIES = [
  "food",
  "retail",
  "services",
  "mobility",
  "events",
  "local_business",
  "corporate",
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

export const CAMPAIGN_CATEGORY_LABELS: Record<CampaignCategory, string> = {
  food: "Alimentação",
  retail: "Varejo",
  services: "Serviços",
  mobility: "Mobilidade",
  events: "Eventos",
  local_business: "Comércio local",
  corporate: "Corporativo",
};

export const PARTNER_STATUSES = ["prospect", "active", "paused"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const CAMPAIGN_STATUSES = ["draft", "scheduled", "active", "paused", "ended"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_EVENT_TYPES = ["impression", "click"] as const;
export type CampaignEventType = (typeof CAMPAIGN_EVENT_TYPES)[number];

export type MediaPartner = {
  id: number;
  name: string;
  brandLabel?: string;
  contactName?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  city: string;
  state: string;
  category: CampaignCategory;
  status: PartnerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignCreative = {
  id: number;
  campaignId: number;
  placement: MediaPlacement;
  headline: string;
  subheadline?: string;
  ctaLabel: string;
  actionUrl: string;
  imageUrl?: string;
  accentColor?: string;
  sortOrder: number;
  isPremium: boolean;
};

export type MediaCampaign = {
  id: number;
  partnerId: number;
  name: string;
  category: CampaignCategory;
  status: CampaignStatus;
  targetCities: string[];
  budgetCents?: number;
  startsAt: string;
  endsAt: string;
  creatives: CampaignCreative[];
  createdAt: string;
  updatedAt: string;
};

export type HomeMediaSlot = {
  placement: MediaPlacement;
  partnerId: number;
  creative: CampaignCreative & {
    partnerName: string;
    campaignName: string;
    category: CampaignCategory;
  };
};

export type CampaignAnalyticsRow = {
  campaignId: number;
  campaignName: string;
  partnerName: string;
  placement: MediaPlacement;
  impressions: number;
  clicks: number;
  ctr: number;
};

export type CampaignAnalyticsSummary = {
  totalImpressions: number;
  totalClicks: number;
  overallCtr: number;
  activeCampaigns: number;
  activePartners: number;
  byCampaign: CampaignAnalyticsRow[];
  byPlacement: Array<{
    placement: MediaPlacement;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
};

export const partnerInputSchema = z.object({
  name: z.string().trim().min(2),
  brandLabel: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactWhatsapp: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2).max(2).transform((v) => v.toUpperCase()),
  category: z.enum(CAMPAIGN_CATEGORIES),
  status: z.enum(PARTNER_STATUSES).default("prospect"),
  notes: z.string().trim().max(2000).optional(),
});

export const creativeInputSchema = z.object({
  placement: z.enum(MEDIA_PLACEMENTS),
  headline: z.string().trim().min(2).max(120),
  subheadline: z.string().trim().max(200).optional(),
  ctaLabel: z.string().trim().min(2).max(40),
  actionUrl: z.string().trim().min(1),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  accentColor: z.string().trim().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const campaignInputSchema = z.object({
  partnerId: z.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  category: z.enum(CAMPAIGN_CATEGORIES),
  status: z.enum(CAMPAIGN_STATUSES).default("draft"),
  targetCities: z.array(z.string().trim().min(2)).default([]),
  budgetCents: z.number().int().min(0).optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  creatives: z.array(creativeInputSchema).min(1),
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;
export type CampaignInput = z.infer<typeof campaignInputSchema>;
