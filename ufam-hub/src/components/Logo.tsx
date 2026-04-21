"use client";

import { cn } from "@/lib/utils";
import { AppLogo, type AppLogoSize } from "@/components/AppLogo";

interface LogoProps {
  className?: string;
  size?: AppLogoSize;
  showText?: boolean;
  variant?: "default" | "minimal" | "full";
  /** LCP: usar só num logo acima da dobra (ex.: topbar). */
  priority?: boolean;
  /** Quando o pai mostra o título “UFAM Hub” ao lado do ícone (ex.: sidebar expandida). */
  pairedWithTitle?: boolean;
}

const textSizeMap: Record<AppLogoSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Logo({
  className,
  size = "md",
  showText = true,
  variant = "default",
  priority = false,
  pairedWithTitle = false,
}: LogoProps) {
  const textSize = textSizeMap[size];

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <AppLogo
          size={size}
          priority={priority}
          decorative={pairedWithTitle}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <AppLogo size={size} priority={priority} decorative={showText} />
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent",
              textSize,
            )}
          >
            UFAM Hub
          </span>
          {variant === "full" && (
            <span className="text-xs text-muted-foreground -mt-1">
              Organizador acadêmico
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoWithAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
      <AppLogo size="lg" className="relative z-10" />
    </div>
  );
}
