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
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <Sparkles className="h-3 w-3 opacity-80" />
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
        "text-[1.65rem] sm:text-3xl lg:text-[2.35rem] font-bold tracking-[-0.02em] text-foreground leading-[1.15]",
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
        "mt-5 text-base sm:text-lg text-muted-foreground/90 leading-relaxed max-w-2xl",
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
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
        "relative py-24 sm:py-32 px-4 sm:px-6",
        id && "scroll-mt-[5.5rem]",
        tint === "muted" && "bg-white/[0.02] border-y border-white/[0.06]",
        tint === "accent" &&
          "bg-gradient-to-b from-primary/[0.07] via-primary/[0.02] to-transparent border-y border-primary/10",
        tint === "warm" &&
          "bg-gradient-to-br from-primary/[0.09] via-transparent to-primary/[0.03] border-y border-primary/10",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export const premiumCardClass =
  "rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] backdrop-blur-sm shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)] transition-all duration-300";

export const premiumCardHoverClass =
  "hover:border-primary/25 hover:shadow-[0_16px_48px_-16px_rgba(249,146,0,0.18)] hover:-translate-y-0.5";

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

export function LandingCta({
  variant = "primary",
  children,
  message,
  href,
  className,
  showArrow,
  scrollToLead,
  onClick,
}: {
  variant?: CtaVariant;
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
      ? "bg-primary text-primary-foreground hover:bg-primary/92 shadow-lg shadow-primary/25 hover:shadow-primary/35 border border-primary/20"
      : variant === "outline"
        ? "border-white/15 bg-white/[0.03] text-foreground hover:bg-white/[0.06] hover:border-white/25 shadow-none"
        : variant === "ghost"
          ? "border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/85";

  const content = (
    <>
      {children}
      {showArrow ? <ArrowRight className="h-4 w-4 opacity-80" /> : null}
    </>
  );

  const buttonClass = cn(
    "h-11 sm:h-12 rounded-full px-6 sm:px-7 text-sm sm:text-[0.9375rem] font-semibold",
    variantClass,
    className
  );

  if (scrollToLead) {
    return (
      <Button
        type="button"
        size="lg"
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
        <Button size="lg" className={buttonClass} asChild>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={onClick}>
            {content}
          </a>
        </Button>
      );
    }
    return (
      <Button
        type="button"
        size="lg"
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
      <Button size="lg" className={buttonClass} asChild>
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/[0.12] via-card/60 to-background px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.68_0.18_55/0.15),transparent_55%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <LandingCta scrollToLead showArrow>
              Quero levar o Fui para minha cidade
            </LandingCta>
            <LandingCta
              variant="outline"
              message={secondaryWhatsappMessage || LANDING_WHATSAPP_MESSAGES.demo}
            >
              Agendar demonstração
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
