import { cn } from "@/lib/utils";
import { premiumCardClass, premiumCardHoverClass } from "./landingUi";
import type { LandingScreen } from "./licenseLandingContent";

type LandingScreenMockupProps = {
  screen: LandingScreen;
  className?: string;
};

function MockupContent({ variant }: { variant: LandingScreen["variant"] }) {
  if (variant === "passenger") {
    return (
      <div className="space-y-2.5 p-3">
        <div className="relative h-28 rounded-xl bg-gradient-to-br from-primary/30 via-primary/10 to-background/50 border border-primary/15 overflow-hidden">
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
      <div className="space-y-2 p-3">
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
      <div className="space-y-2 p-3">
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
      <div className="space-y-2 p-3">
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
      <div className="space-y-2 p-3">
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
      <div className="space-y-2 p-3">
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
    <div className="space-y-2 p-3">
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

export default function LandingScreenMockup({ screen, className }: LandingScreenMockupProps) {
  const featured = screen.featured;

  return (
    <div
      className={cn(
        premiumCardClass,
        premiumCardHoverClass,
        "group relative overflow-hidden",
        featured && "lg:min-h-[320px]",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", screen.accent)} />
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className={cn("relative", featured ? "p-5 sm:p-6" : "p-4 sm:p-5")}>
        <div className="mb-4">
          <p className={cn("font-semibold text-foreground", featured ? "text-base" : "text-sm")}>
            {screen.title}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground/90 mt-1 leading-relaxed">
            {screen.subtitle}
          </p>
        </div>

        <div className={cn("mx-auto w-full", featured ? "max-w-[240px]" : "max-w-[200px]")}>
          <div className="rounded-[1.85rem] border-2 border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
            <div className="rounded-[1.5rem] overflow-hidden bg-background ring-1 ring-white/5">
              <div className="flex justify-center py-2 bg-white/[0.02]">
                <div className="h-1 w-12 rounded-full bg-white/15" />
              </div>
              <MockupContent variant={screen.variant} />
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] sm:text-xs text-muted-foreground/75 text-center tracking-wide uppercase">
          {screen.caption}
        </p>
      </div>
    </div>
  );
}
