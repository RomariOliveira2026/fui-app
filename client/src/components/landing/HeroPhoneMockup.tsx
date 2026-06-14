import {
  ArrowRight,
  Bike,
  Car,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WL } from "@/whitelabel";

function FuiAppScreen() {
  const services = [
    { label: "Carro", icon: Car, accent: "text-primary bg-primary/15 border-primary/20" },
    { label: "Moto", icon: Bike, accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Entrega", icon: Package, accent: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { label: "Frete", icon: Truck, accent: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  const quickStats = [
    { label: "Corridas", value: "Ativo" },
    { label: "Entregas", value: "Ativo" },
    { label: "Utilitários", value: "Ativo" },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1 text-[9px] text-muted-foreground/80">
        <span className="font-medium tabular-nums">9:41</span>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
        </div>
      </div>

      {/* Header — ícone e status, sem textos de marca/cidade */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/[0.06] bg-white/[0.02]">
        <img
          src={WL.iconUrl}
          alt=""
          className="h-6 w-6 rounded-md ring-1 ring-white/10 shrink-0"
        />
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 shrink-0">
          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
          <span className="text-[8px] font-medium text-emerald-400">Online</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 px-3 pt-1.5 pb-2 sm:pt-2 sm:pb-3 gap-1.5 sm:gap-2.5">
        {/* Map + search */}
        <div className="relative h-[6.25rem] sm:h-[7.5rem] lg:h-[8.25rem] shrink-0 rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/30 via-primary/10 to-background">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_55%)]" />

          {/* Route line */}
          <svg
            className="absolute inset-0 h-full w-full text-primary/70"
            viewBox="0 0 200 120"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M 30 90 Q 70 40 110 55 T 170 35"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 3"
            />
          </svg>

          <div className="absolute top-[58%] left-[14%] h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
          <div className="absolute top-[28%] right-[16%] h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/30" />

          <div className="absolute top-2 left-2 right-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-white/10 px-2.5 py-1.5 shadow-lg">
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[9px] text-muted-foreground truncate">
                Para onde vamos?
              </span>
            </div>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
            <div className="flex-1 rounded-lg bg-background/85 backdrop-blur border border-white/10 px-2 py-1">
              <p className="text-[8px] text-muted-foreground">Destino</p>
              <p className="text-[9px] font-medium truncate flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
                Centro da cidade
              </p>
            </div>
            <button
              type="button"
              className="h-8 w-8 shrink-0 rounded-lg bg-primary shadow-md shadow-primary/20 flex items-center justify-center"
              aria-hidden
            >
              <ArrowRight className="h-3.5 w-3.5 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Quick indicators */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 shrink-0">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-1.5 py-1.5 sm:py-2 text-center"
            >
              <p className="text-[8px] text-muted-foreground leading-tight">{stat.label}</p>
              <p className="text-[10px] font-bold text-primary mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-2 gap-1 sm:gap-1.5 shrink-0">
          {services.map(({ label, icon: Icon, accent }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-xl border px-1.5 sm:px-2 py-1.5 sm:py-2",
                accent
              )}
            >
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-background/40">
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold">{label}</span>
            </div>
          ))}
        </div>

        {/* Main CTA — fixo no rodapé da tela (evita corte no mobile) */}
        <div className="shrink-0 mt-auto pt-0.5 sm:pt-1">
          <div className="rounded-full bg-gradient-to-r from-primary to-primary/85 py-1.5 sm:py-2 text-center shadow-sm shadow-primary/12">
            <span className="text-[9px] sm:text-[10px] font-semibold text-primary-foreground tracking-wide">
              Solicitar agora
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

type HeroPhoneMockupProps = {
  className?: string;
};

export default function HeroPhoneMockup({ className }: HeroPhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[10.25rem] sm:max-w-[11.5rem] lg:max-w-[15.5rem] xl:max-w-[16rem]",
        className
      )}
    >
      <div
        className={cn(
          "relative mx-auto",
          "rotate-0 lg:rotate-[9deg]",
          "origin-center lg:origin-[center_54%] motion-reduce:rotate-0",
          "will-change-transform"
        )}
      >
        {/* Ambient glow — muito sutil, acompanha a inclinação */}
        <div
          className="pointer-events-none absolute -inset-2 sm:-inset-2.5 lg:-inset-3 rounded-[2.25rem] bg-gradient-to-br from-primary/[0.05] via-primary/[0.015] to-transparent blur-[1.75rem] opacity-20 lg:opacity-30"
          aria-hidden
        />

        {/* Phone frame */}
        <div
          className={cn(
            "relative z-10 animate-float-gentle motion-reduce:animate-none",
            "rounded-[1.95rem] sm:rounded-[2.35rem] lg:rounded-[2.5rem]",
            "border-[2px] sm:border-[2.5px] border-zinc-600/50",
            "bg-gradient-to-b from-zinc-700/75 via-zinc-900 to-zinc-950",
            "p-[3px] sm:p-[4.5px]",
            "shadow-[0_14px_36px_-24px_rgba(0,0,0,0.78),0_0_20px_-28px_rgba(249,146,0,0.05)] lg:shadow-[0_20px_52px_-28px_rgba(0,0,0,0.82),0_0_24px_-30px_rgba(249,146,0,0.06)]",
            "ring-1 ring-white/[0.06]"
          )}
        >
        {/* Side buttons */}
        <div
          className="absolute -left-[2px] top-[22%] h-8 w-[3px] rounded-l bg-zinc-600/70"
          aria-hidden
        />
        <div
          className="absolute -left-[2px] top-[32%] h-12 w-[3px] rounded-l bg-zinc-600/70"
          aria-hidden
        />
        <div
          className="absolute -right-[2px] top-[28%] h-14 w-[3px] rounded-r bg-zinc-600/70"
          aria-hidden
        />

        <div className="relative rounded-[1.9rem] sm:rounded-[2.05rem] overflow-hidden bg-background ring-1 ring-white/[0.05]">
          {/* Dynamic island */}
          <div className="absolute top-1.5 left-1/2 z-30 -translate-x-1/2 h-[14px] w-[58px] rounded-full bg-black/95 ring-1 ring-white/10" />

          {/* Screen */}
          <div className="relative aspect-[9/19.5] min-h-[13.5rem] sm:min-h-[14.5rem] lg:min-h-[19.25rem]">
            <FuiAppScreen />

            {/* Subtle glass reflection */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
