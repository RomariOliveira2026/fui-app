import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fuiPanelClass, fuiIconRingClass, type FuiSemantic } from "@/lib/fuiTheme";

type StatusPanelProps = {
  variant?: FuiSemantic;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
};

export default function StatusPanel({
  variant = "default",
  icon,
  title,
  description,
  badge,
  action,
  children,
  className,
  compact = false,
}: StatusPanelProps) {
  return (
    <div className={cn(fuiPanelClass(variant), compact ? "p-3" : undefined, className)}>
      <div className="flex items-start gap-3">
        {icon ? <div className={fuiIconRingClass(variant)}>{icon}</div> : null}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {badge}
          </div>
          {description ? (
            <div className="text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {action}
      </div>
      {children ? <div className="mt-3 space-y-3">{children}</div> : null}
    </div>
  );
}
