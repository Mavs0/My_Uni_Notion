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
        {/* Efeito de brilho animado */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
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
        {/* Gradiente principal mais vibrante */}
        <linearGradient id={`logoGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
        </linearGradient>
        
        {/* Gradiente de destaque */}
        <linearGradient id={`accentGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
        
        {/* Gradiente para o capelo */}
        <linearGradient id={`capGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Círculo de fundo com gradiente e sombra */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={`url(#logoGradient-${uniqueId})`}
        className="drop-shadow-lg"
      />
      
      {/* Anel decorativo externo */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        strokeOpacity="0.2"
      />

      {/* Capelo de formatura modernizado */}
      <g className="drop-shadow-md">
        {/* Corpo do capelo */}
        <path
          d="M18 30 L32 18 L46 30 L46 38 L18 38 Z"
          fill={`url(#capGradient-${uniqueId})`}
        />
        
        {/* Borda superior do capelo */}
        <path
          d="M18 30 L32 18 L46 30"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeOpacity="0.2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Linha de dobra do capelo */}
        <path
          d="M20 34 L44 34"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          strokeOpacity="0.15"
        />
      </g>

      {/* Borla do capelo com destaque */}
      <g>
        <circle cx="32" cy="30" r="4" fill="hsl(var(--primary))" opacity="0.9" />
        <circle cx="32" cy="30" r="2.5" fill="white" />
        <circle cx="32" cy="30" r="1" fill="hsl(var(--primary))" />
      </g>

      {/* Partículas de conhecimento (estrelas) */}
      <g opacity="0.9">
        <circle cx="22" cy="22" r="1.5" fill="white" />
        <circle cx="42" cy="22" r="1.5" fill="white" />
        <circle cx="26" cy="44" r="1.5" fill="white" />
        <circle cx="38" cy="44" r="1.5" fill="white" />
        {/* Estrelas menores */}
        <circle cx="18" cy="36" r="1" fill="white" opacity="0.7" />
        <circle cx="46" cy="36" r="1" fill="white" opacity="0.7" />
      </g>

      {/* Elementos de conexão/hub (ondas) */}
      <g opacity="0.5">
        <path
          d="M12 32 Q18 26, 24 32"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M40 32 Q46 26, 52 32"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Linhas de conexão verticais */}
        <path
          d="M32 12 Q28 18, 32 24"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M32 40 Q28 46, 32 52"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* Círculo central representando hub/conexão com efeito de brilho */}
      <circle
        cx="32"
        cy="32"
        r="10"
        fill={`url(#accentGradient-${uniqueId})`}
        className="animate-pulse"
        opacity="0.6"
      />
      
      {/* Ponto central */}
      <circle
        cx="32"
        cy="32"
        r="2"
        fill="white"
        opacity="0.8"
      />
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
