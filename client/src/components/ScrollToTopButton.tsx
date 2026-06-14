import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLandingRoute } from "@/components/landing/landingRoutes";

/** Distância mínima de rolagem antes de exibir o botão. */
const SCROLL_THRESHOLD_PX = 320;

/** Rotas em tela cheia / mapa onde o botão não agrega (sem scroll de página). */
const HIDDEN_ROUTE_PREFIXES = ["/track/"];

export default function ScrollToTopButton() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);

  const onLanding = isLandingRoute(location);
  const hidden = HIDDEN_ROUTE_PREFIXES.some((prefix) => location.startsWith(prefix));

  useEffect(() => {
    if (hidden) {
      setVisible(false);
      return;
    }

    let ticking = false;

    const updateVisibility = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setVisible(scrollTop > SCROLL_THRESHOLD_PX);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateVisibility();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateVisibility();

    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden, location]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (hidden) return null;

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      onClick={scrollToTop}
      className={cn(
        "fixed z-30",
        onLanding
          ? /* LP: esquerda no mobile (WhatsApp à direita); acima do WA no desktop */
            "left-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:left-auto lg:right-4 lg:bottom-[5.75rem]"
          : /* App: acima de FABs/chats + safe area */
            "right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]",
        "flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center",
        "rounded-full border border-primary/30 bg-card/92 text-primary",
        "shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md",
        "transition-all duration-300 ease-out",
        "hover:border-primary/55 hover:bg-primary/12 hover:shadow-[0_6px_24px_rgba(243,146,0,0.15)]",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <ChevronUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
