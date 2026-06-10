import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fuiStatusBadgeClass,
  rideStatusLabels,
  rideStatusVariant,
  type FuiSemantic,
} from "@/lib/fuiTheme";

type StatusBadgeProps = {
  variant?: FuiSemantic;
  children?: React.ReactNode;
  className?: string;
};

export function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(fuiStatusBadgeClass(variant), className)}>
      {children}
    </Badge>
  );
}

type RideStatusBadgeProps = {
  status: string;
  className?: string;
};

export function RideStatusBadge({ status, className }: RideStatusBadgeProps) {
  const variant = rideStatusVariant[status] ?? "default";
  return (
    <StatusBadge variant={variant} className={className}>
      {rideStatusLabels[status] ?? status}
    </StatusBadge>
  );
}
