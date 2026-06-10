import { cn } from "@/lib/utils";

/** Tokens visuais Fui — dark base, laranja marca, acentos semânticos discretos */
export const fuiBrand = {
  text: "text-primary",
  bgSoft: "bg-primary/10",
  border: "border-primary/25",
  borderStrong: "border-primary",
  ring: "ring-primary/30",
  btn: "bg-primary hover:bg-primary/90 text-primary-foreground",
  btnOutline: "border-primary/40 text-primary hover:bg-primary/10 hover:text-primary",
} as const;

export const fuiSurface = {
  page: "min-h-screen bg-background text-foreground",
  card: "bg-card border border-border rounded-xl",
  panel: "bg-card border border-border rounded-xl p-4",
  muted: "bg-muted/40 border border-border rounded-lg",
  price: "bg-card border border-primary/25 rounded-xl",
} as const;

export type FuiSemantic = "default" | "brand" | "success" | "info" | "warning" | "danger";

const semanticStyles: Record<
  FuiSemantic,
  { accent: string; icon: string; badge: string; text: string }
> = {
  default: {
    accent: "border-l-border",
    icon: "bg-muted text-muted-foreground ring-1 ring-border",
    badge: "bg-muted text-muted-foreground border-border",
    text: "text-foreground",
  },
  brand: {
    accent: "border-l-primary",
    icon: "bg-primary/10 text-primary ring-1 ring-primary/25",
    badge: "bg-primary/15 text-primary border-primary/25",
    text: "text-primary",
  },
  success: {
    accent: "border-l-emerald-500",
    icon: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    text: "text-emerald-400",
  },
  info: {
    accent: "border-l-sky-500",
    icon: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    text: "text-sky-400",
  },
  warning: {
    accent: "border-l-amber-500",
    icon: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    text: "text-amber-400",
  },
  danger: {
    accent: "border-l-red-500",
    icon: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
    badge: "bg-red-500/10 text-red-400 border-red-500/25",
    text: "text-red-400",
  },
};

export function fuiSemantic(variant: FuiSemantic) {
  return semanticStyles[variant];
}

export const fuiRoute = {
  originIcon: "text-emerald-400/90",
  destinationIcon: "text-rose-400/90",
} as const;

export const rideStatusVariant: Record<string, FuiSemantic> = {
  requested: "warning",
  accepted: "info",
  in_progress: "success",
  completed: "default",
  cancelled: "danger",
};

export const rideStatusLabels: Record<string, string> = {
  requested: "Procurando motorista...",
  accepted: "Motorista a caminho",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

/** Card neutro com borda esquerda semântica */
export function fuiPanelClass(variant: FuiSemantic = "default", className?: string) {
  const s = semanticStyles[variant];
  return cn(fuiSurface.panel, "border-l-2", s.accent, className);
}

/** Anel de ícone sem fundo sólido saturado */
export function fuiIconRingClass(variant: FuiSemantic = "default", className?: string) {
  return cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
    semanticStyles[variant].icon,
    className
  );
}

/** Badge de status sem bloco colorido inteiro */
export function fuiStatusBadgeClass(variant: FuiSemantic) {
  const s = semanticStyles[variant];
  return cn("border", s.badge);
}

/** Seleção ativa (tipo veículo, pagamento) */
export function fuiSelectedTile(active: boolean) {
  return cn(
    "rounded-lg border-2 transition-all",
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-muted/30 text-foreground hover:border-border/80"
  );
}
