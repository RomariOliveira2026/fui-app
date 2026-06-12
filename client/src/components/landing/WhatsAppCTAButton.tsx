import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openLandingWhatsApp } from "./landingContact";
import { scrollToLeadSection } from "./scrollToLeadSection";

type WhatsAppCTAButtonProps = {
  message: string;
  children?: ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "ghost" | "icon";
  fallbackToLead?: boolean;
  onFallback?: () => void;
};

export default function WhatsAppCTAButton({
  message,
  children,
  className,
  variant = "primary",
  fallbackToLead = true,
  onFallback,
}: WhatsAppCTAButtonProps) {
  const handleClick = () => {
    const opened = openLandingWhatsApp(message);
    if (!opened && fallbackToLead) {
      scrollToLeadSection();
      onFallback?.();
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/25 ring-4 ring-emerald-600/15 hover:bg-emerald-500 hover:scale-105 transition-all duration-300",
          className
        )}
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  const variantClass =
    variant === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 border border-emerald-500/30"
      : variant === "outline"
        ? "border-emerald-500/30 bg-emerald-500/5 text-foreground hover:bg-emerald-500/10"
        : "border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5";

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleClick}
      className={cn(
        "h-11 sm:h-12 rounded-full px-6 font-semibold gap-2",
        variantClass,
        className
      )}
    >
      <MessageCircle className="h-4 w-4 shrink-0" />
      {children}
    </Button>
  );
}
