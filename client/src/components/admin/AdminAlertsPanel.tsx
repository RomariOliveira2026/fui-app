import type { AdminOperationalAlert } from "@shared/adminOperational";
import { adminPanelCard, adminSectionSubtitle, adminSectionTitle } from "@/lib/adminShell";
import { priorityDotClass } from "@/lib/adminOperationalUi";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminAlertsPanelProps = {
  alerts: AdminOperationalAlert[];
  onSelectRide?: (rideId: number) => void;
};

/** Painel de fila de prioridade / alertas / SOS da Central Operacional. */
export default function AdminAlertsPanel({ alerts, onSelectRide }: AdminAlertsPanelProps) {
  const sosCount = alerts.filter((a) => a.priority === "sos").length;

  return (
    <div className={cn(adminPanelCard, "overflow-hidden")}>
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3.5 border-b border-border/50",
          sosCount > 0 ? "bg-red-500/10" : "bg-muted/10"
        )}
      >
        <div>
          <h2 className={cn(adminSectionTitle, "flex items-center gap-2")}>
            {sosCount > 0 ? (
              <ShieldAlert className="h-4 w-4 text-red-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            Prioridades & alertas
          </h2>
          <p className={adminSectionSubtitle}>Triagem operacional em tempo real</p>
        </div>
        {alerts.length > 0 ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              sosCount > 0
                ? "bg-red-500 text-white"
                : "bg-amber-400/20 text-amber-600"
            )}
          >
            {alerts.length}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Tudo sob controle. Nenhum alerta ativo.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <button
                  type="button"
                  onClick={() => onSelectRide?.(alert.rideId)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/40",
                    alert.priority === "sos"
                      ? "border-red-500/50 bg-red-500/[0.06]"
                      : alert.priority === "critical"
                        ? "border-orange-500/40 bg-orange-500/[0.05]"
                        : "border-amber-400/40 bg-amber-400/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                      priorityDotClass(alert.priority),
                      alert.priority === "sos" && "animate-pulse"
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{alert.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {alert.detail}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
