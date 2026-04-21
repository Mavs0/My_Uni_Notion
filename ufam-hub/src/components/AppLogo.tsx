"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Proporção intrínseca dos PNG em /public (logo quadrada 1024×1024). */
const ASPECT = 1;

/** Bump após regenerar logos (fundo transparente) para evitar cache antigo. */
const LOGO_CACHE = "v2";

export type AppLogoSize = "sm" | "md" | "lg" | "xl";

const heightPx: Record<AppLogoSize, number> = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export type AppLogoProps = {
  size?: AppLogoSize | number;
  className?: string;
  priority?: boolean;
  /** Quando há texto “UFAM Hub” visível ao lado, o ícone é puramente decorativo. */
  decorative?: boolean;
};

export function AppLogo({
  size = "md",
  className,
  priority,
  decorative = false,
}: AppLogoProps) {
  const h = typeof size === "number" ? size : heightPx[size];
  const w = Math.max(1, Math.round(h * ASPECT));

  return (
    <div
      className={cn("relative shrink-0 overflow-visible", className)}
      style={{ width: w, height: h }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "UFAM Hub"}
      aria-hidden={decorative ? true : undefined}
    >
      <Image
        src={`/logo-dark.png?${LOGO_CACHE}`}
        alt=""
        width={w}
        height={h}
        priority={priority}
        className={cn(
          "pointer-events-none absolute left-0 top-0 h-full w-full object-contain object-left",
          "opacity-0 transition-opacity duration-300 ease-out dark:opacity-100",
        )}
        sizes={`${w}px`}
      />
      <Image
        src={`/logo-light.png?${LOGO_CACHE}`}
        alt=""
        width={w}
        height={h}
        priority={priority}
        className={cn(
          "pointer-events-none absolute left-0 top-0 h-full w-full object-contain object-left",
          "opacity-100 transition-opacity duration-300 ease-out dark:opacity-0",
        )}
        sizes={`${w}px`}
      />
    </div>
  );
}
