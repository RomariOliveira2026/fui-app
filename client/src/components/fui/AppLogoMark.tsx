import { WL, getAppIconUrl } from "@/whitelabel";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  /** Header escuro — só o ícone da marca (já inclui o texto Fui!) */
  variant?: "header" | "onMap" | "image";
  className?: string;
  imageClassName?: string;
};

export default function AppLogoMark({
  variant = "header",
  className,
  imageClassName,
}: AppLogoMarkProps) {
  if (variant === "image" && WL.logoUrl) {
    return (
      <img
        src={WL.logoUrl}
        alt={WL.appName}
        className={cn("h-6 sm:h-8 w-auto max-w-full object-contain", imageClassName, className)}
      />
    );
  }

  const icon = (
    <img
      src={getAppIconUrl()}
      alt={WL.appName}
      className={cn(
        "shrink-0 object-contain",
        variant === "onMap" ? "h-8 w-8" : "h-10 w-10 sm:h-11 sm:w-11",
        imageClassName
      )}
    />
  );

  if (variant === "onMap") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-white/90 p-2 shadow-sm backdrop-blur-sm border border-black/5",
          className
        )}
      >
        {icon}
      </div>
    );
  }

  return <div className={cn("flex shrink-0 items-center justify-center", className)}>{icon}</div>;
}
