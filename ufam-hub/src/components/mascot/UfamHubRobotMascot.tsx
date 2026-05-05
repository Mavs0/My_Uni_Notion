"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const UFAM_GREEN = "#05865E";
const UFAM_GREEN_SOFT = "#0abf8c";
const VISOR = "#101010";
const SHELL = "#f4f5f7";
const SHELL_STROKE = "#d1d5db";
const SHELL_SHADOW = "#e5e7eb";

export type UfamHubRobotMascotProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "viewBox" | "xmlns"
> & {
  /** Largura em px (altura escala com viewBox). */
  width?: number;
  /** Altura em px (opcional; se omitido, mantém proporção do viewBox). */
  height?: number;
  /** Texto para leitores de ecrã. */
  title?: string;
};

/**
 * Mascote robô UFAM Hub — SVG vetorial em camadas para animação futura
 * (olhos, visor, antena, braços, corpo em grupos separados).
 */
export function UfamHubRobotMascot({
  className,
  width = 200,
  height,
  title = "Assistente virtual UFAM Hub",
  "aria-hidden": ariaHidden,
  ...rest
}: UfamHubRobotMascotProps) {
  const uid = React.useId().replace(/:/g, "");
  const gid = (name: string) => `ufam-mascot-${name}-${uid}`;

  const h = height ?? (width * 300) / 240;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 300"
      width={width}
      height={h}
      className={cn("shrink-0 select-none", className)}
      role={ariaHidden ? undefined : "img"}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : title}
      {...rest}
    >
      {!ariaHidden ? <title>{title}</title> : null}

      <defs>
        <radialGradient id={gid("eye-glow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={UFAM_GREEN_SOFT} stopOpacity="0.9" />
          <stop offset="70%" stopColor={UFAM_GREEN} stopOpacity="0.35" />
          <stop offset="100%" stopColor={UFAM_GREEN} stopOpacity="0" />
        </radialGradient>
        <filter
          id={gid("soft-glow")}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={gid("antenna-glow")} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base / flutuação — pedestal luminoso discreto */}
      <ellipse
        cx="120"
        cy="276"
        rx="52"
        ry="9"
        fill={UFAM_GREEN}
        opacity="0.22"
      />
      <ellipse
        cx="120"
        cy="275"
        rx="36"
        ry="5"
        fill={UFAM_GREEN}
        opacity="0.35"
      />

      {/* Antena — grupo independente (oscilar, brilho em erro/sucesso) */}
      <g id={`ufam-mascot-antenna-${uid}`} data-mascot-part="antenna">
        <line
          x1="120"
          y1="56"
          x2="120"
          y2="24"
          stroke={SHELL_STROKE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="120"
          cy="18"
          r="7"
          fill={UFAM_GREEN}
          filter={`url(#${gid("antenna-glow")})`}
        />
        <circle cx="120" cy="18" r="3.5" fill={UFAM_GREEN_SOFT} opacity="0.85" />
      </g>

      {/* Cabeça — casco exterior */}
      <g id={`ufam-mascot-head-shell-${uid}`} data-mascot-part="head-shell">
        <ellipse
          cx="120"
          cy="118"
          rx="78"
          ry="62"
          fill={SHELL}
          stroke={SHELL_STROKE}
          strokeWidth="1.25"
        />
        {/* Sombra suave inferior da cabeça */}
        <ellipse
          cx="120"
          cy="132"
          rx="56"
          ry="18"
          fill="#000"
          opacity="0.06"
        />
      </g>

      {/* Corpo — grupo independente (lean, bounce) */}
      <g id={`ufam-mascot-body-${uid}`} data-mascot-part="body">
        <ellipse
          cx="120"
          cy="208"
          rx="46"
          ry="40"
          fill={SHELL_SHADOW}
          stroke={SHELL_STROKE}
          strokeWidth="1.15"
        />
        {/* Símbolo peito: “circuito + aprendizagem” abstrato (não é logótipo) */}
        <g
          opacity="0.9"
          transform="translate(120, 200)"
          data-mascot-part="chest-emblem"
        >
          <circle cx="0" cy="0" r="10" fill="none" stroke={UFAM_GREEN} strokeWidth="1.4" />
          <path
            d="M -5 -2 L 5 -2 M -5 2 L 5 2 M 0 -6 L 0 6"
            stroke={UFAM_GREEN}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="-6" cy="-6" r="1.8" fill={UFAM_GREEN} opacity="0.8" />
          <circle cx="6" cy="6" r="1.8" fill={UFAM_GREEN} opacity="0.6" />
        </g>
      </g>

      {/* Braço esquerdo */}
      <g id={`ufam-mascot-arm-left-${uid}`} data-mascot-part="arm-left">
        <path
          d="M 52 128 C 28 148 18 188 24 218"
          fill="none"
          stroke={SHELL}
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 52 128 C 28 148 18 188 24 218"
          fill="none"
          stroke={SHELL_STROKE}
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="22" cy="224" r="12" fill={SHELL} stroke={SHELL_STROKE} strokeWidth="1.1" />
      </g>

      {/* Braço direito */}
      <g id={`ufam-mascot-arm-right-${uid}`} data-mascot-part="arm-right">
        <path
          d="M 188 128 C 212 148 222 188 216 218"
          fill="none"
          stroke={SHELL}
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 188 128 C 212 148 222 188 216 218"
          fill="none"
          stroke={SHELL_STROKE}
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="218" cy="224" r="12" fill={SHELL} stroke={SHELL_STROKE} strokeWidth="1.1" />
      </g>

      {/* Visor — camada independente (máscara, reflexos) */}
      <g id={`ufam-mascot-visor-${uid}`} data-mascot-part="visor">
        <rect
          x="46"
          y="72"
          width="148"
          height="86"
          rx="34"
          ry="34"
          fill={VISOR}
        />
        {/* Brilho superior discreto no visor */}
        <rect
          x="58"
          y="80"
          width="124"
          height="28"
          rx="14"
          fill="#fff"
          opacity="0.06"
        />
      </g>

      {/* Olhos — grupos separados para seguir rato / piscar */}
      <g id={`ufam-mascot-eyes-${uid}`} data-mascot-part="eyes">
        <g id={`ufam-mascot-eye-left-${uid}`} data-mascot-part="eye-left">
          <circle cx="88" cy="118" r="14" fill={`url(#${gid("eye-glow")})`} opacity="0.45" />
          <circle
            cx="88"
            cy="118"
            r="10.5"
            fill={UFAM_GREEN}
            filter={`url(#${gid("soft-glow")})`}
          />
          <circle cx="85" cy="114" r="3.2" fill="#fff" opacity="0.9" />
        </g>
        <g id={`ufam-mascot-eye-right-${uid}`} data-mascot-part="eye-right">
          <circle cx="152" cy="118" r="14" fill={`url(#${gid("eye-glow")})`} opacity="0.45" />
          <circle
            cx="152"
            cy="118"
            r="10.5"
            fill={UFAM_GREEN}
            filter={`url(#${gid("soft-glow")})`}
          />
          <circle cx="149" cy="114" r="3.2" fill="#fff" opacity="0.9" />
        </g>
      </g>

      {/* Boca — curva simples; animar path d para expressões */}
      <path
        id={`ufam-mascot-mouth-${uid}`}
        data-mascot-part="mouth"
        d="M 92 142 Q 120 156 148 142"
        fill="none"
        stroke={UFAM_GREEN}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
