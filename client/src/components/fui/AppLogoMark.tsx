import { WL } from "@/whitelabel";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  /** Header escuro — logo transparente, sem cápsula */
  variant?: "header" | "onMap";
  className?: string;
  imageClassName?: string;
};

export default function AppLogoMark({
  variant = "header",
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
        "flex shrink-0 items-center justify-center bg-transparent",
        onMap &&
          "rounded-xl bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm border border-black/5",
        className
      )}
    >
      <img
        src={WL.logoUrl}
        alt={WL.appName}
        className={cn(
          "w-auto max-w-full object-contain",
          onMap
            ? "h-7 sm:h-8 brightness-0 opacity-90"
            : "h-6 sm:h-8 max-w-[8.5rem] sm:max-w-none",
          imageClassName
        )}
      />
    </div>
  );
}
