import { WL, getAppIconUrl } from "@/whitelabel";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  /** Header escuro — ícone + texto, sem imagem com fundo branco */
  variant?: "header" | "onMap" | "image";
  className?: string;
  imageClassName?: string;
};

function ComposedBrandMark({
  className,
  iconClassName,
  textClassName,
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <img
        src={getAppIconUrl()}
        alt=""
        aria-hidden
        className={cn("shrink-0 object-contain", iconClassName)}
      />
      <span className={cn("font-bold tracking-tight leading-none", textClassName)}>
        Fui<span className="text-primary">!</span>
      </span>
    </div>
  );
}

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

  if (variant === "onMap") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm border border-black/5",
          className
        )}
      >
        <ComposedBrandMark
          iconClassName="h-6 w-6"
          textClassName="text-base text-foreground"
        />
      </div>
    );
  }

  return (
    <ComposedBrandMark
      className={className}
      iconClassName={cn("h-7 w-7 sm:h-8 sm:w-8", imageClassName)}
      textClassName="text-lg sm:text-xl text-foreground"
    />
  );
}
