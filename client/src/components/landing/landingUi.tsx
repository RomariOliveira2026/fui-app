import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_CONTACT, LANDING_WHATSAPP_MESSAGES, landingWhatsAppUrl, openLandingWhatsApp } from "./landingContact";
import { scrollToLeadSection } from "./scrollToLeadSection";

export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <Sparkles className="h-3 w-3 opacity-75" />
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  className,
  centered,
}: {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <h2
      className={cn(
        "text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem] xl:text-[2.35rem] font-bold tracking-[-0.025em] text-foreground leading-[1.12]",
        centered && "mx-auto",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function SectionLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-4 text-[0.9375rem] sm:text-base text-muted-foreground/85 leading-snug sm:leading-relaxed max-w-2xl",
        className
      )}
    >
      {children}
    </p>
  );
}

export function SectionDivider() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  );
}

type SectionTint = "default" | "muted" | "accent" | "warm";

export function LandingSection({
  id,
  children,
  className,
  tint = "default",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tint?: SectionTint;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6",
        id && "scroll-mt-[5.5rem]",
        tint === "muted" && "bg-white/[0.015] border-y border-white/[0.06]",
        tint === "accent" &&
          "bg-gradient-to-b from-primary/[0.05] via-primary/[0.012] to-transparent border-y border-primary/[0.08]",
        tint === "warm" &&
          "bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.02] border-y border-primary/[0.08]",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export const premiumCardClass =
  "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.008] backdrop-blur-sm shadow-[0_10px_36px_-22px_rgba(0,0,0,0.55)] transition-all duration-300";

export const premiumCardHoverClass =
  "hover:border-primary/20 hover:shadow-[0_14px_44px_-18px_rgba(249,146,0,0.14)] hover:-translate-y-0.5";

/** Espaço padrão entre cabeçalho de seção e conteúdo */
export const sectionContentMt = "mt-9 sm:mt-10";

/** Destaque comercial laranja dentro de seções */
export const sectionHighlightText =
  "text-base sm:text-lg font-semibold text-primary leading-snug max-w-2xl";

export function PremiumCard({
  children,
  className,
  hover = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={cn(premiumCardClass, hover && premiumCardHoverClass, className)}>
      {children}
    </div>
  );
}

type CtaVariant = "primary" | "secondary" | "outline" | "ghost";
type CtaSize = "default" | "compact";

export function LandingCta({
  variant = "primary",
  size = "default",
  children,
  message,
  href,
  className,
  showArrow,
  scrollToLead,
  onClick,
}: {
  variant?: CtaVariant;
  size?: CtaSize;
  children: ReactNode;
  /** Mensagem pré-preenchida para WhatsApp */
  message?: string;
  href?: string;
  className?: string;
  showArrow?: boolean;
  /** Rola até o formulário de captação */
  scrollToLead?: boolean;
  onClick?: () => void;
}) {
  const variantClass =
    variant === "primary"
      ? size === "compact"
        ? "bg-primary text-primary-foreground hover:bg-primary/92 shadow-sm shadow-primary/12 hover:shadow-md hover:shadow-primary/18 border border-primary/12"
        : "bg-primary text-primary-foreground hover:bg-primary/92 shadow-lg shadow-primary/25 hover:shadow-primary/35 border border-primary/20"
      : variant === "outline"
        ? "border-white/15 bg-white/[0.03] text-foreground hover:bg-white/[0.06] hover:border-white/25 shadow-none"
        : variant === "ghost"
          ? "border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/85";

  const sizeClass =
    size === "compact"
      ? "h-9 sm:h-10 rounded-full px-4 sm:px-5 text-xs sm:text-[13px] font-semibold"
      : "h-11 sm:h-12 rounded-full px-6 sm:px-7 text-sm sm:text-[0.9375rem] font-semibold";

  const content = (
    <>
      {children}
      {showArrow ? (
        <ArrowRight
          className={cn(size === "compact" ? "h-3.5 w-3.5" : "h-4 w-4", "opacity-80 shrink-0")}
        />
      ) : null}
    </>
  );

  const buttonClass = cn(sizeClass, variantClass, className);
  const buttonSize = size === "compact" ? "default" : "lg";

  if (scrollToLead) {
    return (
      <Button
        type="button"
        size={buttonSize}
        className={buttonClass}
        onClick={() => {
          scrollToLeadSection();
          onClick?.();
        }}
      >
        {content}
      </Button>
    );
  }

  if (message) {
    const waUrl = landingWhatsAppUrl(message);
    if (waUrl) {
      return (
        <Button size={buttonSize} className={buttonClass} asChild>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={onClick}>
            {content}
          </a>
        </Button>
      );
    }
    return (
      <Button
        type="button"
        size={buttonSize}
        className={buttonClass}
        onClick={() => {
          if (!openLandingWhatsApp(message)) scrollToLeadSection();
          onClick?.();
        }}
      >
        {content}
      </Button>
    );
  }

  if (href) {
    return (
      <Button size={buttonSize} className={buttonClass} asChild>
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button
      size={buttonSize}
      className={buttonClass}
      asChild
    >
      <a
        href={`mailto:${LANDING_CONTACT.email}?subject=Interesse%20no%20Fui%20Licenciamento`}
        onClick={onClick}
      >
        {content}
      </a>
    </Button>
  );
}

export function CtaBand({
  title,
  subtitle,
  secondaryWhatsappMessage,
}: {
  title: string;
  subtitle: string;
  /** Se omitido, usa mensagem de demonstração */
  secondaryWhatsappMessage?: string;
}) {
  return (
    <FadeIn>
      <div className="relative overflow-hidden rounded-2xl border border-primary/12 bg-gradient-to-r from-primary/[0.06] via-card/40 to-background px-5 py-5 sm:px-7 sm:py-6 shadow-[0_8px_32px_-20px_rgba(0,0,0,0.42)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.68_0.18_55/0.08),transparent_52%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="min-w-0 max-w-lg">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/75">
              Potencial comercial
            </p>
            <h3 className="mt-1.5 text-base sm:text-lg font-bold tracking-[-0.02em] leading-snug">
              {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground/80 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <LandingCta scrollToLead showArrow size="compact">
              Solicitar proposta
            </LandingCta>
            <LandingCta
              variant="outline"
              size="compact"
              message={secondaryWhatsappMessage || LANDING_WHATSAPP_MESSAGES.demo}
            >
              Agendar demo
            </LandingCta>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export function HighlightPhrase({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-primary via-primary to-amber-400 bg-clip-text text-transparent">
      {children}
    </span>
  );
}
