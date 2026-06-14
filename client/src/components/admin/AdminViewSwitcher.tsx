import { Activity, BrainCircuit } from "lucide-react";
import { adminViewTabTrigger, adminViewTabsList } from "@/lib/adminShell";
import type { AdminView } from "@/lib/useAdminView";
import { cn } from "@/lib/utils";

type AdminViewSwitcherProps = {
  value: AdminView;
  onChange: (value: AdminView) => void;
};

const VIEWS: { value: AdminView; label: string; icon: typeof Activity }[] = [
  { value: "live", label: "Operação ao vivo", icon: Activity },
  { value: "intelligence", label: "Inteligência 7.1", icon: BrainCircuit },
];

/** Botões nativos — Radix Tabs sem TabsContent quebrava o switcher com wouter. */
export default function AdminViewSwitcher({ value, onChange }: AdminViewSwitcherProps) {
  return (
    <div className={adminViewTabsList} role="tablist" aria-label="Modo da central operacional">
      {VIEWS.map(({ value: tabValue, label, icon: Icon }) => {
        const active = value === tabValue;
        return (
          <button
            key={tabValue}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tabValue)}
            className={cn(
              adminViewTabTrigger,
              "inline-flex items-center cursor-pointer",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 mr-2 opacity-80" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
