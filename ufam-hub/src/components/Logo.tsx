"use client";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "minimal" | "full";
}

const sizeMap = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
  xl: { icon: 64, text: "text-3xl" },
};

export function Logo({
  className,
  size = "md",
  showText = true,
  variant = "default",
}: LogoProps) {
  const iconSize = sizeMap[size].icon;
  const textSize = sizeMap[size].text;

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LogoIcon size={iconSize} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <LogoIcon size={iconSize} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent",
              textSize
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

function LogoIcon({ size = 32 }: { size?: number }) {
  const uniqueId = useId();
  // Estilo Notion: bloco geométrico (cubo isométrico) com "H" de Hub integrado — organização, modularidade
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10"
    >
      <defs>
        <linearGradient id={`logoBlock-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`logoTop-${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.75" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
        <linearGradient id={`logoSide-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* Cubo isométrico: face superior */}
      <path
        d="M32 14 L52 26 L32 38 L12 26 Z"
        fill={`url(#logoTop-${uniqueId})`}
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        fillOpacity="1"
      />
      {/* Face lateral esquerda */}
      <path
        d="M12 26 L12 50 L32 62 L32 38 Z"
        fill={`url(#logoSide-${uniqueId})`}
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeOpacity="0.2"
      />
      {/* Face frontal (onde fica o H) */}
      <path
        d="M32 38 L52 26 L52 50 L32 62 Z"
        fill={`url(#logoBlock-${uniqueId})`}
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      {/* Letra H integrada ao bloco — usa primary-foreground para contraste em claro/escuro */}
      <g
        fill="hsl(var(--primary-foreground))"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="0.5"
        strokeOpacity="0.4"
      >
        <path d="M36 36 L36 52 L40 52 L40 36 Z" fillOpacity="0.95" />
        <path d="M44 36 L44 52 L48 52 L48 36 Z" fillOpacity="0.95" />
        <path d="M36 42 L48 42 L48 44 L36 44 Z" fillOpacity="0.95" />
      </g>
    </svg>
  );
}

export function LogoWithAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
      <LogoIcon size={64} />
    </div>
  );
}
