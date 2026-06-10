import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/_core/hooks/useAuth";
import { WL } from "@/whitelabel";

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
}

export default function AppHeader({ showBack = true, title }: AppHeaderProps) {
  const [, setLocation] = useLocation();
  const { canUsePrivateUserApi } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card text-card-foreground backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="hover:bg-accent text-card-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {WL.logoUrl ? (
              <img src={WL.logoUrl} alt={`${WL.appName} - Mobilidade Urbana em ${WL.city}`} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-bold text-primary">{WL.appName}</span>
            )}
          </button>
        </div>
        
        {title && (
          <h1 className="text-lg font-semibold text-card-foreground">{title}</h1>
        )}
        
        <div className="flex items-center gap-2">
          {canUsePrivateUserApi && <NotificationCenter />}
        </div>
      </div>
    </header>
  );
}
