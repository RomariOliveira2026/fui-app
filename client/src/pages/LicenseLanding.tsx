import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  Mail,
  Menu,
  Shield,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { WL } from "@/whitelabel";
import LandingScreenMockup from "@/components/landing/LandingScreenMockup";
import ComercialLeadForm from "@/components/landing/ComercialLeadForm";
import WhatsAppCTAButton from "@/components/landing/WhatsAppCTAButton";
import {
  LANDING_CONTACT,
  LANDING_WHATSAPP_MESSAGES,
} from "@/components/landing/landingContact";
import {
  CtaBand,
  FadeIn,
  HighlightPhrase,
  LandingCta,
  LandingSection,
  PremiumCard,
  SectionDivider,
  SectionLabel,
  SectionLead,
  SectionTitle,
} from "@/components/landing/landingUi";
import {
  DIFFERENTIALS,
  HERO_MICROCOPY,
  IMPLANTATION_STEPS,
  LANDING_FAQ,
  LANDING_MODULES,
  LANDING_NAV,
  LANDING_PLANS,
  LANDING_SCREENS,
  LANDING_STATS,
  PAIN_POINTS,
  REVENUE_STREAMS,
  SOLUTION_ITEMS,
  STRATEGIC_CITIES,
  TARGET_PROFILES,
} from "@/components/landing/licenseLandingContent";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LicenseLanding() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const title = "Fui — Licenciamento e Implantação para sua cidade";
    const description =
      "Plataforma completa de mobilidade, entregas e utilitários para operação local. Licenciamento, implantação e múltiplas fontes de receita para a sua cidade.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const previousContent = meta?.getAttribute("content") ?? "";
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = WL.pageTitle;
      if (meta) meta.setAttribute("content", previousContent);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/25">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,oklch(0.68_0.18_55/0.16),transparent_65%)]" />
        <div className="absolute top-[20%] -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-[10%] -right-40 h-[28rem] w-[28rem] rounded-full bg-primary/[0.06] blur-3xl" />
      </div>

      {/* Header */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)]"
            : "bg-gradient-to-b from-background/80 to-transparent"
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#hero" className="flex items-center shrink-0" onClick={closeNav}>
            <img src={WL.logoUrl} alt="Fui" className="h-8 w-auto" />
          </a>

          <nav className="hidden lg:flex items-center gap-0.5">
            {LANDING_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="relative px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/[0.04] after:absolute after:bottom-1 after:left-3.5 after:right-3.5 after:h-px after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2.5">
            <LandingCta
              variant="outline"
              message={LANDING_WHATSAPP_MESSAGES.demo}
              className="h-10 px-5 text-[13px]"
            >
              Agendar demonstração
            </LandingCta>
            <LandingCta scrollToLead onClick={closeNav} className="h-10 px-5 text-[13px]">
              Quero o Fui
            </LandingCta>
          </div>

          <button
            type="button"
            className="lg:hidden p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-colors"
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? "Fechar menu" : "Abrir menu"}
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen ? (
          <div className="lg:hidden border-t border-white/[0.06] bg-background/98 backdrop-blur-2xl px-4 py-5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {LANDING_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full text-left px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/[0.04] transition-colors"
                onClick={() => {
                  scrollToSection(item.id);
                  closeNav();
                }}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-2.5 border-t border-white/[0.06] mt-2">
              <LandingCta variant="outline" message={LANDING_WHATSAPP_MESSAGES.demo} className="w-full">
                Agendar demonstração
              </LandingCta>
              <LandingCta scrollToLead onClick={closeNav} className="w-full">
                Quero levar o Fui para minha cidade
              </LandingCta>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero */}
        <section id="hero" className="relative pt-[7.5rem] pb-28 sm:pt-36 sm:pb-32 px-4 sm:px-6 scroll-mt-[5.5rem]">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-20 items-center">
              <FadeIn>
                <SectionLabel>Licenciamento Fui</SectionLabel>

                <h1 className="mt-5 text-[2rem] sm:text-4xl lg:text-[3.15rem] xl:text-[3.35rem] font-bold tracking-[-0.03em] leading-[1.08]">
                  Leve uma plataforma completa de{" "}
                  <HighlightPhrase>mobilidade, entregas e utilitários</HighlightPhrase>{" "}
                  <span className="block sm:inline">para a sua cidade.</span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-foreground/85 leading-relaxed max-w-xl font-medium">
                  Solução robusta para operar corridas, entregas, fretes, mudanças e gestão
                  operacional local — com alto potencial de faturamento.
                </p>
                <p className="mt-4 text-sm sm:text-[0.9375rem] text-muted-foreground/90 leading-relaxed max-w-xl">
                  Estruture uma operação local forte: marca própria, controle administrativo,
                  múltiplas fontes de receita e base pronta para crescer na sua região.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <LandingCta scrollToLead showArrow className="sm:min-w-[260px]">
                    Quero levar o Fui para minha cidade
                  </LandingCta>
                  <LandingCta variant="outline" message={LANDING_WHATSAPP_MESSAGES.demo}>
                    Agendar demonstração
                  </LandingCta>
                </div>

                <div className="mt-4">
                  <WhatsAppCTAButton
                    message={LANDING_WHATSAPP_MESSAGES.city}
                    variant="ghost"
                    className="h-10 px-0 text-sm text-muted-foreground hover:text-primary"
                  >
                    Ou falar agora pelo WhatsApp
                  </WhatsAppCTAButton>
                </div>

                <div className="mt-10 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                  {HERO_MICROCOPY.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-[13px] text-muted-foreground/90"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <Check className="h-3 w-3 text-primary" />
                      </span>
                      {item}
                    </span>
                  ))}
                </div>
              </FadeIn>

              <FadeIn className="relative lg:pl-4 mt-10 lg:mt-0">
                <div className="relative mx-auto max-w-[22rem] lg:max-w-none pb-10 sm:pb-0">
                  <div className="absolute -inset-6 rounded-[2.75rem] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent blur-3xl opacity-80" />

                  <PremiumCard hover={false} className="relative p-3 sm:p-4 border-primary/15 shadow-[0_24px_80px_-24px_rgba(249,146,0,0.35)]">
                    <div className="rounded-[1.65rem] overflow-hidden bg-background border border-white/[0.06]">
                      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="flex items-center gap-2.5">
                          <img src={WL.iconUrl} alt="" className="h-8 w-8 rounded-xl ring-1 ring-white/10" />
                          <div>
                            <p className="text-xs font-semibold">Plataforma Fui</p>
                            <p className="text-[10px] text-muted-foreground">Operação multi-serviço</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-medium text-emerald-400">Online</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3.5">
                        <div className="relative h-40 rounded-2xl bg-gradient-to-br from-primary/35 via-primary/12 to-background border border-primary/20 overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.14),transparent_50%)]" />
                          <div className="absolute top-3 left-3 rounded-lg bg-background/80 backdrop-blur px-2.5 py-1.5 text-[10px] border border-white/10">
                            Mapa · Corridas · Entregas
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                            <div className="h-10 flex-1 rounded-xl bg-background/90 backdrop-blur border border-white/10" />
                            <div className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {["Corridas", "Entregas", "Utilitários"].map((label) => (
                            <div
                              key={label}
                              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center"
                            >
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                              <p className="text-sm font-bold text-primary mt-1">Ativo</p>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Capacidade operacional</span>
                            <span className="text-primary font-semibold">Alta</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-primary via-primary to-amber-400/80" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </PremiumCard>

                  <div className="absolute -bottom-5 -left-3 sm:-left-7 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl px-5 py-3.5 shadow-2xl">
                    <p className="text-2xl font-bold text-primary tabular-nums">8+</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Módulos integrados</p>
                  </div>
                  <div className="absolute -top-3 -right-2 sm:-right-7 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl px-5 py-3.5 shadow-2xl">
                    <p className="text-2xl font-bold text-foreground tabular-nums">7</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Fontes de receita</p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/[0.06] bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {LANDING_STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left lg:pl-4 lg:border-l lg:border-white/[0.06] first:lg:border-l-0 first:lg:pl-0">
                  <p className="text-3xl sm:text-[2.5rem] font-bold text-primary tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground/90 mt-1.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dor do mercado */}
        <LandingSection id="mercado">
          <FadeIn className="max-w-3xl">
            <SectionLabel>Dor do mercado</SectionLabel>
            <SectionTitle className="mt-5">
              Muitas cidades ainda operam mobilidade e logística urbana de forma limitada, dispersa
              e sem controle local.
            </SectionTitle>
            <SectionLead>
              Transporte urbano, entregas, fretes e mudanças ainda funcionam de forma fragmentada,
              informal ou dependente de plataformas externas que não priorizam a realidade da
              cidade.
            </SectionLead>
          </FadeIn>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PAIN_POINTS.map((point) => (
              <FadeIn key={point.title}>
                <PremiumCard className="h-full p-6 border-red-500/10 bg-gradient-to-b from-red-500/[0.04] to-transparent hover:border-red-500/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/15 mb-5">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground leading-snug">{point.title}</p>
                </PremiumCard>
              </FadeIn>
            ))}
          </div>
        </LandingSection>

        <SectionDivider />

        {/* Solução */}
        <LandingSection id="solucao" tint="muted">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            <FadeIn>
              <SectionLabel>O Fui como solução</SectionLabel>
              <SectionTitle className="mt-5">
                Uma plataforma local, moderna e multi-serviços — pronta para operação real.
              </SectionTitle>
              <SectionLead>
                O Fui não é apenas um aplicativo de corrida. Foi construído para operar, em uma
                única estrutura, diferentes frentes de mobilidade e logística urbana — com experiência
                sólida para o usuário e gestão robusta para o operador local.
              </SectionLead>
              <p className="mt-8 text-lg sm:text-xl font-semibold text-primary leading-snug max-w-lg">
                Mais do que um app. Uma operação digital pronta para escalar em sua cidade.
              </p>
            </FadeIn>

            <FadeIn>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOLUTION_ITEMS.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3.5 text-sm font-medium"
                  >
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </LandingSection>

        {/* Módulos */}
        <LandingSection id="modulos">
          <FadeIn className="text-center max-w-3xl mx-auto">
            <SectionLabel>Módulos</SectionLabel>
            <SectionTitle className="mt-5 centered">
              Uma plataforma completa, com módulos pensados para operação real.
            </SectionTitle>
            <SectionLead className="mx-auto">
              Cada módulo foi desenhado para funcionar de forma integrada — do app do passageiro à
              inteligência operacional.
            </SectionLead>
          </FadeIn>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {LANDING_MODULES.map((mod) => (
              <FadeIn key={mod.name}>
                <PremiumCard className="group h-full p-6 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 mb-5 group-hover:bg-primary/18 transition-colors">
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground text-[0.9375rem]">{mod.name}</h3>
                  <p className="mt-2.5 text-sm text-muted-foreground/90 leading-relaxed">
                    {mod.description}
                  </p>
                </PremiumCard>
              </FadeIn>
            ))}
          </div>
        </LandingSection>

        {/* Monetização */}
        <LandingSection id="monetizacao" tint="accent">
          <FadeIn className="max-w-3xl">
            <SectionLabel>Monetização</SectionLabel>
            <SectionTitle className="mt-5">Múltiplas fontes de receita. Um só ecossistema.</SectionTitle>
            <SectionLead>
              O Fui foi construído para não depender de uma única frente de faturamento — ampliando
              o potencial de resultado da operação local.
            </SectionLead>
          </FadeIn>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {REVENUE_STREAMS.map((stream, i) => (
              <FadeIn key={stream}>
                <div className="flex items-center gap-3.5 rounded-xl border border-primary/15 bg-background/50 backdrop-blur-sm px-4 py-4 hover:border-primary/25 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary text-xs font-bold tabular-nums ring-1 ring-primary/15">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="text-sm font-medium leading-snug">{stream}</span>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-12">
            <p className="text-center text-lg sm:text-xl font-semibold text-primary max-w-2xl mx-auto leading-snug">
              Várias avenidas de monetização desde o primeiro dia de operação.
            </p>
          </FadeIn>

          <div className="mt-14">
            <CtaBand
              title="Quer entender o potencial de faturamento na sua cidade?"
              subtitle="Agende uma demonstração e veja como o Fui estrutura receita em mobilidade, entregas e utilitários."
              secondaryWhatsappMessage={LANDING_WHATSAPP_MESSAGES.demo}
            />
          </div>
        </LandingSection>

        {/* Para quem é */}
        <LandingSection id="para-quem">
          <FadeIn className="max-w-3xl">
            <SectionLabel>Para quem é</SectionLabel>
            <SectionTitle className="mt-5">
              Ideal para quem quer liderar uma operação local com marca própria e potencial de
              escala.
            </SectionTitle>
          </FadeIn>

          <div className="mt-12 grid sm:grid-cols-2 gap-3 sm:gap-4">
            {TARGET_PROFILES.map((profile) => (
              <FadeIn key={profile}>
                <div className="flex items-start gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4 hover:border-primary/15 transition-colors">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm font-medium leading-relaxed">{profile}</span>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-10 text-center">
            <p className="text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
              Se você quer dominar uma operação local com estrutura digital própria, o Fui foi feito
              para esse jogo.
            </p>
          </FadeIn>
        </LandingSection>

        {/* Diferenciais */}
        <LandingSection id="diferenciais" tint="muted">
          <FadeIn className="text-center max-w-3xl mx-auto">
            <SectionLabel>Diferenciais</SectionLabel>
            <SectionTitle className="mt-5 centered">Por que o Fui se destaca?</SectionTitle>
          </FadeIn>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {DIFFERENTIALS.map((diff) => (
              <FadeIn key={diff.title}>
                <PremiumCard className="flex items-start gap-4 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                    <diff.icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold leading-snug pt-2.5">{diff.title}</p>
                </PremiumCard>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-12 text-center">
            <p className="text-lg sm:text-xl text-primary font-semibold max-w-2xl mx-auto leading-snug">
              Enquanto muitos enxergam apenas transporte, o Fui já nasce como plataforma urbana
              completa.
            </p>
          </FadeIn>
        </LandingSection>

        {/* Prova visual — bento grid */}
        <LandingSection id="produto">
          <FadeIn className="max-w-3xl">
            <SectionLabel>Prova visual</SectionLabel>
            <SectionTitle className="mt-5">
              Plataforma real, com estrutura desenvolvida e pronta para apresentação comercial.
            </SectionTitle>
            <SectionLead>
              Não é uma ideia no papel. São módulos funcionais, painéis operacionais e base
              concreta para implantação local — prontos para demonstração ao vivo.
            </SectionLead>
          </FadeIn>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
            {LANDING_SCREENS.map((screen) => (
              <FadeIn
                key={screen.title}
                className={cn(
                  screen.featured ? "sm:col-span-2 lg:col-span-4" : "sm:col-span-1 lg:col-span-3"
                )}
              >
                <LandingScreenMockup screen={screen} className="h-full" />
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <LandingCta message={LANDING_WHATSAPP_MESSAGES.demo} showArrow>
              Ver demonstração ao vivo
            </LandingCta>
            <LandingCta variant="outline" scrollToLead>
              Solicitar proposta comercial
            </LandingCta>
          </FadeIn>
        </LandingSection>

        <SectionDivider />

        {/* Implantação */}
        <LandingSection id="implantacao" tint="muted">
          <FadeIn className="max-w-3xl">
            <SectionLabel>Implantação</SectionLabel>
            <SectionTitle className="mt-5">
              Da apresentação à operação local: um processo claro, estruturado e acompanhado.
            </SectionTitle>
          </FadeIn>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {IMPLANTATION_STEPS.map((step, i) => (
              <FadeIn key={step.step}>
                <PremiumCard className="h-full p-6 relative">
                  {i < IMPLANTATION_STEPS.length - 1 ? (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                  ) : null}
                  <span className="text-[2.75rem] font-bold text-primary/25 leading-none tabular-nums">
                    {step.step}
                  </span>
                  <h3 className="mt-3 font-semibold text-[0.9375rem]">{step.title}</h3>
                  <p className="mt-2.5 text-sm text-muted-foreground/90 leading-relaxed">
                    {step.description}
                  </p>
                </PremiumCard>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-12 text-center max-w-2xl mx-auto">
            <p className="text-muted-foreground/90 leading-relaxed">
              A proposta do Fui não é entregar software. É estruturar uma operação local com
              capacidade real de crescimento.
            </p>
          </FadeIn>
        </LandingSection>

        {/* Planos */}
        <LandingSection id="planos">
          <FadeIn className="text-center max-w-3xl mx-auto">
            <SectionLabel>Modelo comercial</SectionLabel>
            <SectionTitle className="mt-5 centered">
              Modelos de contratação para diferentes perfis de operação.
            </SectionTitle>
            <SectionLead className="mx-auto">
              Implantação, licença, suporte e possibilidade de exclusividade territorial — conforme
              o perfil e a ambição da sua operação.
            </SectionLead>
          </FadeIn>

          <div className="mt-14 grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
            {LANDING_PLANS.map((plan) => (
              <FadeIn key={plan.name} className={cn(plan.featured && "lg:-mt-2 lg:mb-2")}>
                <PremiumCard
                  hover={!plan.featured}
                  className={cn(
                    "h-full p-7 sm:p-8 flex flex-col relative",
                    plan.featured &&
                      "border-primary/35 bg-gradient-to-b from-primary/[0.14] via-primary/[0.05] to-transparent shadow-[0_24px_60px_-20px_rgba(249,146,0,0.35)] xl:scale-[1.03]"
                  )}
                >
                  {plan.featured ? (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
                      Recomendado
                    </span>
                  ) : null}
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                    Plano
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">{plan.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground/90 leading-relaxed">{plan.tagline}</p>
                  <ul className="mt-8 space-y-3.5 flex-1">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm leading-relaxed">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-6 border-t border-white/[0.06]">
                    <LandingCta
                      variant={plan.featured ? "primary" : "outline"}
                      scrollToLead
                      className="w-full"
                    >
                      Solicitar proposta
                    </LandingCta>
                  </div>
                </PremiumCard>
              </FadeIn>
            ))}
          </div>
        </LandingSection>

        {/* Oportunidade */}
        <LandingSection id="oportunidade" tint="warm">
          <div className="text-center">
            <FadeIn>
              <SectionLabel>Oportunidade</SectionLabel>
              <SectionTitle className="mt-5 max-w-3xl mx-auto">
                Cidades estratégicas podem contar com operação local forte e posicionamento
                diferenciado.
              </SectionTitle>
              <SectionLead className="mx-auto">
                A oportunidade não está apenas em lançar um aplicativo — mas em ocupar um espaço
                relevante no mercado local com plataforma preparada para mobilidade, entregas e
                logística urbana.
              </SectionLead>

              <div className="mt-10 flex flex-wrap justify-center gap-2.5">
                {STRATEGIC_CITIES.map((city) => (
                  <span
                    key={city}
                    className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  >
                    {city}
                  </span>
                ))}
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground">
                  e cidades similares
                </span>
              </div>

              <p className="mt-10 text-lg sm:text-xl font-semibold text-primary max-w-xl mx-auto leading-snug">
                Quem se posiciona antes conquista uma vantagem relevante no mercado da própria
                cidade.
              </p>
            </FadeIn>
          </div>
        </LandingSection>

        {/* Formulário de captação */}
        <LandingSection id="captacao" tint="accent">
          <FadeIn>
            <ComercialLeadForm />
          </FadeIn>
        </LandingSection>

        <SectionDivider />

        {/* FAQ */}
        <LandingSection id="faq" tint="muted">
          <FadeIn className="text-center max-w-3xl mx-auto">
            <SectionLabel>FAQ</SectionLabel>
            <SectionTitle className="mt-5 centered">Perguntas frequentes</SectionTitle>
            <SectionLead className="mx-auto">
              Respostas objetivas para as principais dúvidas de empresários e operadores locais.
            </SectionLead>
          </FadeIn>

          <FadeIn className="mt-12 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-2 sm:px-4 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.5)]">
              <Accordion type="single" collapsible className="w-full">
                {LANDING_FAQ.map((item, i) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${i}`}
                    className="border-white/[0.06] px-2 sm:px-3"
                  >
                    <AccordionTrigger className="text-left text-[0.9375rem] sm:text-base font-semibold hover:no-underline py-5 hover:text-primary transition-colors">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground/90 leading-relaxed pb-5 text-sm sm:text-[0.9375rem]">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </FadeIn>
        </LandingSection>

        {/* CTA final */}
        <LandingSection id="contato" className="pb-28 sm:pb-32">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.16] via-card/70 to-background px-6 py-10 sm:px-12 sm:py-14 text-center shadow-[0_32px_80px_-32px_rgba(249,146,0,0.35)]">
              <div className="pointer-events-none absolute -top-28 -right-28 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-[-0.02em] leading-tight">
                  Leve uma plataforma robusta de{" "}
                  <HighlightPhrase>mobilidade, entregas e utilitários</HighlightPhrase> para a sua
                  cidade.
                </h2>
                <p className="mt-5 text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
                  O Fui foi construído para quem deseja operar com marca própria, controle local e
                  múltiplas fontes de faturamento.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                  <LandingCta scrollToLead showArrow>
                    Quero levar o Fui para minha cidade
                  </LandingCta>
                  <LandingCta variant="outline" message={LANDING_WHATSAPP_MESSAGES.demo}>
                    Agendar demonstração
                  </LandingCta>
                  <LandingCta variant="ghost" message={LANDING_WHATSAPP_MESSAGES.founder}>
                    Falar com o fundador
                  </LandingCta>
                </div>
                <div className="mt-6 flex justify-center">
                  <WhatsAppCTAButton message={LANDING_WHATSAPP_MESSAGES.proposal} variant="outline">
                    Receber proposta via WhatsApp
                  </WhatsAppCTAButton>
                </div>
              </div>
            </div>
          </FadeIn>
        </LandingSection>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
            <div>
              <img src={WL.logoUrl} alt="Fui" className="h-8 w-auto mb-5" />
              <p className="text-sm text-muted-foreground/90 max-w-sm leading-relaxed">
                Fui — Plataforma de Mobilidade, Entregas e Utilitários para cidades que querem
                crescer com inteligência operacional.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 text-sm">
              <WhatsAppCTAButton
                message={LANDING_WHATSAPP_MESSAGES.city}
                variant="ghost"
                className="h-auto p-0 justify-start text-muted-foreground hover:text-primary hover:bg-transparent"
                fallbackToLead={false}
              >
                WhatsApp
              </WhatsAppCTAButton>
              <a
                href={`mailto:${LANDING_CONTACT.email}`}
                className="inline-flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                {LANDING_CONTACT.email}
              </a>
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                Voltar ao app
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-muted-foreground/75">
            <p>© {new Date().getFullYear()} Fui. Todos os direitos reservados.</p>
            <div className="flex gap-5">
              <span>Política de privacidade</span>
              <span>Termos de uso</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-white/[0.08] bg-background/95 backdrop-blur-2xl px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]">
        <div className="flex gap-2">
          <LandingCta
            variant="outline"
            message={LANDING_WHATSAPP_MESSAGES.demo}
            className="h-11 flex-1 px-4 text-xs"
          >
            Demonstração
          </LandingCta>
          <LandingCta scrollToLead className="h-11 flex-[1.4] px-4 text-xs">
            Quero o Fui
          </LandingCta>
        </div>
      </div>

      <WhatsAppCTAButton
        message={LANDING_WHATSAPP_MESSAGES.demo}
        variant="icon"
        className="fixed bottom-[5.75rem] lg:bottom-6 right-4 z-40"
      />

      <div className="h-[5rem] lg:h-0" aria-hidden />
    </div>
  );
}
