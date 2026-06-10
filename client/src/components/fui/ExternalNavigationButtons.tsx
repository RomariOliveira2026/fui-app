import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import {
  buildGoogleMapsDirectionsUrl,
  buildWazeUrl,
  openExternalNavigation,
  type NavigationPoint,
} from "@/lib/navigationLinks";
import { cn } from "@/lib/utils";

type ExternalNavigationButtonsProps = {
  target: NavigationPoint | null;
  className?: string;
  size?: "sm" | "default";
  layout?: "row" | "stack";
};

/** Botões para abrir Google Maps e Waze — sem engine própria de navegação. */
export default function ExternalNavigationButtons({
  target,
  className,
  size = "sm",
  layout = "row",
}: ExternalNavigationButtonsProps) {
  if (!target) return null;

  const openGoogle = () => openExternalNavigation(buildGoogleMapsDirectionsUrl(target));
  const openWaze = () => openExternalNavigation(buildWazeUrl(target));

  return (
    <div
      className={cn(
        layout === "row" ? "flex flex-wrap gap-2" : "flex flex-col gap-2",
        className
      )}
    >
      <Button type="button" variant="outline" size={size} className="flex-1" onClick={openGoogle}>
        <MapPin className="h-4 w-4 mr-2" />
        Google Maps
      </Button>
      <Button type="button" variant="outline" size={size} className="flex-1" onClick={openWaze}>
        <Navigation className="h-4 w-4 mr-2" />
        Waze
      </Button>
    </div>
  );
}
