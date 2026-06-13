import { cn } from "@/lib/utils";
import { premiumCardClass, premiumCardHoverClass } from "./landingUi";
import type { LandingScreen } from "./licenseLandingContent";

type LandingScreenMockupProps = {
  screen: LandingScreen;
  className?: string;
  /** Linha superior da grade (3 colunas) — mockup um pouco maior */
  featuredRow?: boolean;
};

function MockupContent({ variant, compact = false }: { variant: LandingScreen["variant"]; compact?: boolean }) {
  const pad = compact ? "p-2" : "p-2.5";
  const gap = compact ? "space-y-1.5" : "space-y-2";

  if (variant === "passenger") {
    return (
      <div className={cn(gap, pad)}>
        <div className={cn("relative rounded-xl bg-gradient-to-br from-primary/30 via-primary/10 to-background/50 border border-primary/15 overflow-hidden", compact ? "h-24" : "h-28")}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-background/85 backdrop-blur border border-white/10" />
            <div className="h-9 w-9 rounded-lg bg-primary shadow-lg shadow-primary/30" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded-lg bg-card/80 border border-white/8" />
          <div className="h-14 rounded-lg bg-card/80 border border-white/8" />
        </div>
        <div className="h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20" />
      </div>
    );
  }

  if (variant === "driver") {
    return (
      <div className={cn(gap, pad)}>
        <div className="flex gap-2">
          <div className="h-12 flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20" />
          <div className="h-12 flex-1 rounded-lg bg-primary/15 border border-primary/20" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg bg-card/70 border border-white/8 p-2"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-4/5 rounded bg-muted/40" />
              <div className="h-2 w-1/2 rounded bg-muted/25" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "admin") {
    return (
      <div className={cn(gap, pad)}>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-lg bg-blue-500/10 border border-blue-500/15" />
          ))}
        </div>
        <div className="h-24 rounded-xl bg-gradient-to-r from-blue-500/12 via-primary/10 to-transparent border border-white/8" />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-16 rounded-lg bg-card/70 border border-white/8" />
          <div className="h-16 rounded-lg bg-card/70 border border-white/8" />
        </div>
      </div>
    );
  }

  if (variant === "utility") {
    return (
      <div className={cn(gap, pad)}>
        <div className="h-16 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-end p-2">
          <div className="h-8 w-full rounded-lg bg-card/60" />
        </div>
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-card/70 border border-white/8" />
          ))}
        </div>
        <div className="h-9 rounded-full bg-amber-500/30 border border-amber-500/30" />
      </div>
    );
  }

  if (variant === "delivery") {
    return (
      <div className={cn(gap, pad)}>
        <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/15 p-2">
          <div className="h-8 w-8 rounded bg-violet-500/20" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-full rounded bg-muted/35" />
            <div className="h-2 w-2/3 rounded bg-muted/25" />
          </div>
        </div>
        <div className="h-24 rounded-xl bg-gradient-to-b from-violet-500/10 to-transparent border border-white/8" />
        <div className="h-8 rounded-lg bg-card/70 border border-white/8" />
      </div>
    );
  }

  if (variant === "finance") {
    return (
      <div className={cn(gap, pad)}>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 rounded-lg bg-rose-500/10 border border-rose-500/15" />
          <div className="h-12 rounded-lg bg-primary/10 border border-primary/15" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex justify-between items-center rounded-lg bg-card/60 border border-white/8 px-2 py-1.5"
          >
            <div className="h-2 w-1/3 rounded bg-muted/30" />
            <div className="h-2 w-1/4 rounded bg-primary/30" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(gap, pad)}>
      <div className="h-14 rounded-lg bg-cyan-500/10 border border-cyan-500/15" />
      <div className="h-28 rounded-xl bg-gradient-to-tr from-cyan-500/10 via-primary/5 to-transparent border border-white/8" />
      <div className="grid grid-cols-4 gap-1 items-end h-12">
        {[40, 65, 45, 80].map((h, i) => (
          <div key={i} className="rounded-t bg-primary/25" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function LandingScreenMockup({
  screen,
  className,
  featuredRow = false,
}: LandingScreenMockupProps) {
  const featured = featuredRow || screen.featured;

  return (
    <div
      className={cn(
        premiumCardClass,
        premiumCardHoverClass,
        "group relative overflow-hidden flex flex-col h-full",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-55", screen.accent)} />
      <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/8 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className={cn("relative flex flex-col flex-1", featured ? "p-4 sm:p-5" : "p-3.5 sm:p-4")}>
        <div className="mb-3">
          <p
            className={cn(
              "font-semibold text-foreground leading-snug",
              featured ? "text-sm sm:text-[0.9375rem]" : "text-[13px] sm:text-sm"
            )}
          >
            {screen.title}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 leading-snug line-clamp-2">
            {screen.subtitle}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className={cn("mx-auto w-full", featured ? "max-w-[200px] sm:max-w-[210px]" : "max-w-[168px] sm:max-w-[178px]")}>
            <div className="rounded-[1.65rem] border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-1 shadow-[0_14px_40px_-22px_rgba(0,0,0,0.62)]">
              <div className="rounded-[1.35rem] overflow-hidden bg-background ring-1 ring-white/[0.05]">
                <div className="flex justify-center py-1.5 bg-white/[0.02]">
                  <div className="h-1 w-10 rounded-full bg-white/15" />
                </div>
                <MockupContent variant={screen.variant} compact={!featured} />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground/65 text-center tracking-wide uppercase truncate">
          {screen.caption}
        </p>
      </div>
    </div>
  );
}
