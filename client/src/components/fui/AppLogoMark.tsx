import { WL } from "@/whitelabel";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  /** Logo escura legível sobre mapa claro (OSM) */
  variant?: "onMap" | "default";
  className?: string;
  imageClassName?: string;
};

export default function AppLogoMark({
  variant = "default",
  className,
  imageClassName,
}: AppLogoMarkProps) {
  const onMap = variant === "onMap";

  if (!WL.logoUrl) {
    return (
      <span
        className={cn(
          "truncate text-lg sm:text-xl font-bold tracking-tight",
          onMap ? "text-foreground" : "text-primary",
          className
        )}
      >
        {WL.appName}
      </span>
    );
  }

  return (
    <div
      className={cn(
        onMap && "rounded-xl bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm border border-black/5",
        className
      )}
    >
      <img
        src={WL.logoUrl}
        alt={WL.appName}
        className={cn(
          "h-7 sm:h-8 w-auto max-w-full object-contain",
          onMap && "brightness-0 opacity-90",
          imageClassName
        )}
      />
    </div>
  );
}
