import { cn } from "@/lib/utils";
import {
  Bookmark,
  Briefcase,
  Heart,
  History,
  Home,
  RotateCcw,
} from "lucide-react";

type QuickAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
};

type PassengerQuickActionsProps = {
  onHome: () => void;
  onWork: () => void;
  onLastRide: () => void;
  onSavedAddresses: () => void;
  onHistory: () => void;
  onFavorites: () => void;
  hasHome?: boolean;
  hasWork?: boolean;
  hasLastRide?: boolean;
};

export default function PassengerQuickActions({
  onHome,
  onWork,
  onLastRide,
  onSavedAddresses,
  onHistory,
  onFavorites,
  hasHome,
  hasWork,
  hasLastRide,
}: PassengerQuickActionsProps) {
  const actions: QuickAction[] = [
    { id: "home", label: "Casa", icon: Home, onClick: onHome, disabled: !hasHome },
    { id: "work", label: "Trabalho", icon: Briefcase, onClick: onWork, disabled: !hasWork },
    { id: "last", label: "Última corrida", icon: RotateCcw, onClick: onLastRide, disabled: !hasLastRide },
    { id: "saved", label: "Endereços", icon: Bookmark, onClick: onSavedAddresses },
    { id: "history", label: "Histórico", icon: History, onClick: onHistory },
    { id: "favorites", label: "Favoritos", icon: Heart, onClick: onFavorites },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Atalhos rápidos</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3",
              "text-center transition-colors hover:bg-accent/50",
              action.disabled && "opacity-40 cursor-not-allowed hover:bg-card"
            )}
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium leading-tight text-muted-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
