import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { WL } from "@/whitelabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_CATEGORY_LABELS,
  MEDIA_PLACEMENT_LABELS,
  type HomeMediaSlot,
  type MediaPlacement,
} from "@shared/adminCampaigns";
import { ChevronRight, Sparkles } from "lucide-react";

type PassengerMediaCampaignsProps = {
  className?: string;
  compact?: boolean;
};

function pickByPlacement(slots: HomeMediaSlot[], placement: MediaPlacement) {
  return slots.find((s) => s.placement === placement);
}

function pickCards(slots: HomeMediaSlot[]) {
  return slots.filter((s) => s.placement === "home_card").slice(0, 2);
}

export default function PassengerMediaCampaigns({
  className,
  compact = false,
}: PassengerMediaCampaignsProps) {
  const [, setLocation] = useLocation();
  const city = WL.city?.trim() || "Brasil";
  const trackedRef = useRef(new Set<string>());

  const { data: slots = [] } = trpc.campaigns.getHomeMedia.useQuery(
    { city },
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );

  const trackImpression = trpc.campaigns.trackImpression.useMutation();
  const trackClick = trpc.campaigns.trackClick.useMutation();
  const trackImpressionRef = useRef(trackImpression.mutate);
  trackImpressionRef.current = trackImpression.mutate;

  const hero = useMemo(() => pickByPlacement(slots, "home_hero"), [slots]);
  const strip = useMemo(() => pickByPlacement(slots, "home_strip"), [slots]);
  const cards = useMemo(() => pickCards(slots), [slots]);

  useEffect(() => {
    for (const slot of slots) {
      const key = `${slot.creative.campaignId}:${slot.creative.id}:${slot.placement}`;
      if (trackedRef.current.has(key)) continue;
      trackedRef.current.add(key);
      trackImpressionRef.current({
        campaignId: slot.creative.campaignId,
        creativeId: slot.creative.id,
        partnerId: slot.partnerId,
        placement: slot.placement,
        city,
      });
    }
  }, [slots, city]);

  if (!hero && !strip && cards.length === 0) return null;

  const handleClick = (slot: HomeMediaSlot) => {
    trackClick.mutate({
      campaignId: slot.creative.campaignId,
      creativeId: slot.creative.id,
      partnerId: slot.partnerId,
      placement: slot.placement,
      city,
    });
    const url = slot.creative.actionUrl;
    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setLocation(url.startsWith("/") ? url : `/${url}`);
  };

  return (
    <section className={cn("space-y-3", className)} aria-label="Parceiros e ofertas">
      {hero ? (
        <button
          type="button"
          onClick={() => handleClick(hero)}
          className={cn(
            "group relative w-full overflow-hidden rounded-2xl border border-primary/25 text-left",
            "bg-gradient-to-br from-primary/15 via-card to-card shadow-lg shadow-primary/5",
            "transition hover:border-primary/40 hover:shadow-primary/10",
            compact ? "p-4" : "p-5 sm:p-6"
          )}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at top right, ${hero.creative.accentColor ?? "#F39200"}55, transparent 55%)`,
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Parceiro premium
                </Badge>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {hero.creative.partnerName}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {hero.creative.headline}
              </h2>
              {hero.creative.subheadline ? (
                <p className="text-sm text-muted-foreground max-w-xl">{hero.creative.subheadline}</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground/80">
                {MEDIA_PLACEMENT_LABELS.home_hero} · {CAMPAIGN_CATEGORY_LABELS[hero.creative.category]}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
              {hero.creative.ctaLabel}
              <ChevronRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </button>
      ) : null}

      {cards.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((slot) => (
            <button
              key={`${slot.creative.id}-${slot.placement}`}
              type="button"
              onClick={() => handleClick(slot)}
              className="group rounded-xl border border-border/70 bg-card/60 p-4 text-left hover:border-primary/30 hover:bg-card transition"
            >
              <p className="text-[11px] text-primary font-medium mb-1">{slot.creative.partnerName}</p>
              <p className="font-semibold text-sm text-foreground">{slot.creative.headline}</p>
              {slot.creative.subheadline ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{slot.creative.subheadline}</p>
              ) : null}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                {slot.creative.ctaLabel}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {strip ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{strip.creative.partnerName}</p>
            <p className="text-sm font-medium text-foreground truncate">{strip.creative.headline}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleClick(strip)}>
            {strip.creative.ctaLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
