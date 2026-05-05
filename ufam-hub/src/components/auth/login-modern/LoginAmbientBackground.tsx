"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LOGIN_GREEN, LOGIN_GLOW } from "./theme";

export function LoginAmbientBackground() {
  const uid = React.useId().replace(/:/g, "");
  const pid = (n: string) => `lab-${n}-${uid}`;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 30% 20%, rgba(5,134,94,0.12) 0%, transparent 55%), radial-gradient(ellipse 90% 70% at 80% 60%, rgba(5,134,94,0.08) 0%, transparent 50%), linear-gradient(165deg, #0a0a0a 0%, #0B0B0B 40%, #080808 100%)",
        }}
      />
      {/* Partículas / círculos suaves */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/[0.04]"
          style={{
            width: 40 + i * 28,
            height: 40 + i * 28,
            left: `${8 + i * 14}%`,
            top: `${12 + (i % 3) * 22}%`,
            boxShadow: `0 0 40px ${LOGIN_GLOW}`,
          }}
          initial={{ opacity: 0.15, scale: 0.92 }}
          animate={{
            opacity: [0.12, 0.22, 0.12],
            scale: [0.92, 1.02, 0.92],
          }}
          transition={{
            duration: 5 + i * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
      {/* Grelha / rede suave (referência login) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <pattern id={pid("grid")} width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke={LOGIN_GREEN}
              strokeOpacity="0.12"
              strokeWidth="0.6"
            />
          </pattern>
          <radialGradient id={pid("leak")} cx="45%" cy="35%" r="55%">
            <stop offset="0%" stopColor={LOGIN_GREEN} stopOpacity="0.14" />
            <stop offset="55%" stopColor={LOGIN_GREEN} stopOpacity="0.03" />
            <stop offset="100%" stopColor={LOGIN_GREEN} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={pid("lines")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={LOGIN_GREEN} stopOpacity="0" />
            <stop offset="50%" stopColor={LOGIN_GREEN} stopOpacity="0.5" />
            <stop offset="100%" stopColor={LOGIN_GREEN} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid("grid")})`} />
        <rect width="100%" height="100%" fill={`url(#${pid("leak")})`} />
        {[0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M ${-20 + k * 40} 0 Q ${120 + k * 30} ${180 + k * 40} ${280 + k * 20} 400`}
            fill="none"
            stroke={`url(#${pid("lines")})`}
            strokeWidth="1"
            opacity={0.35}
          />
        ))}
      </svg>
    </div>
  );
}
