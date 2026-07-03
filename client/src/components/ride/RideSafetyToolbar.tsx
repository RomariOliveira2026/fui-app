import { Button } from "@/components/ui/button";
import { shareRideTrip } from "@/lib/shareRide";
import { fuiBrand } from "@/lib/fuiTheme";
import { cn } from "@/lib/utils";
import { Headphones, Share2, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

type RideSafetyToolbarProps = {
  shareToken?: string | null;
  className?: string;
  compact?: boolean;
};

export default function RideSafetyToolbar({
  shareToken,
  className,
  compact = false,
}: RideSafetyToolbarProps) {
  const [, setLocation] = useLocation();
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!shareToken) return;
    setSharing(true);
    try {
      await shareRideTrip(shareToken);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="flex-1 border-border bg-background/80"
        disabled={!shareToken || sharing}
        onClick={() => void handleShare()}
      >
        <Share2 className="mr-2 h-4 w-4 shrink-0" />
        {compact ? "Compartilhar" : "Compartilhar viagem"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="flex-1 border-border bg-background/80"
        onClick={() => setLocation("/emergency-contacts")}
      >
        <Shield className="mr-2 h-4 w-4 shrink-0 text-primary" />
        Segurança
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "default"}
        className={compact ? "shrink-0" : "border border-border bg-background/80"}
        onClick={() => setLocation("/profile")}
        aria-label="Ajuda e suporte"
      >
        <Headphones className="h-4 w-4" />
        {!compact ? <span className="ml-2">Ajuda</span> : null}
      </Button>
    </div>
  );
}
