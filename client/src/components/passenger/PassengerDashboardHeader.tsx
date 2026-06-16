import AppLogoMark from "@/components/fui/AppLogoMark";
import NotificationCenter from "@/components/NotificationCenter";
import { cn } from "@/lib/utils";
import { Menu, Settings, User } from "lucide-react";

type PassengerDashboardHeaderProps = {
  onMenuClick: () => void;
  onProfileClick: () => void;
  isAdmin?: boolean;
  canUsePrivateUserApi?: boolean;
  className?: string;
};

export default function PassengerDashboardHeader({
  onMenuClick,
  onProfileClick,
  isAdmin,
  canUsePrivateUserApi,
  className,
}: PassengerDashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md",
        className
      )}
    >
      <div className="relative mx-auto flex min-h-[3.75rem] max-w-screen-xl items-center justify-center px-3 sm:px-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className={cn(
            "absolute left-3 sm:left-4",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "border border-border bg-card text-foreground transition-colors hover:bg-accent"
          )}
        >
          <Menu className="h-5 w-5" />
        </button>

        <AppLogoMark />

        <div className="absolute right-3 sm:right-4 flex items-center gap-2">
          {canUsePrivateUserApi ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card overflow-hidden">
              <NotificationCenter />
            </div>
          ) : null}
          <button
            type="button"
            onClick={onProfileClick}
            aria-label={isAdmin ? "Painel administrativo" : "Meu perfil"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "border border-border bg-card text-foreground transition-colors hover:bg-accent"
            )}
          >
            {isAdmin ? <Settings className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
