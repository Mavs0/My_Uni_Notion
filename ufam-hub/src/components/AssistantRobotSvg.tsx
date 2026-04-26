"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function AssistantRobotSvg({
  className,
}: {
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 128 140"
      className={cn(
        "pointer-events-none h-[4.75rem] w-auto sm:h-[5.5rem]",
        className,
      )}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={`${gid}-teal`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="42%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient
          id={`${gid}-teal-shine`}
          x1="0%"
          x2="0%"
          y1="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter
          id={`${gid}-glow`}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse
        cx="28"
        cy="82"
        rx="10"
        ry="9"
        fill={`url(#${gid}-teal)`}
        stroke="#0f172a"
        strokeWidth="1.2"
        opacity="0.95"
      />
      <ellipse
        cx="100"
        cy="82"
        rx="10"
        ry="9"
        fill={`url(#${gid}-teal)`}
        stroke="#0f172a"
        strokeWidth="1.2"
        opacity="0.95"
      />

      <rect
        x="44"
        y="72"
        width="40"
        height="34"
        rx="14"
        fill={`url(#${gid}-teal)`}
        stroke="#0f172a"
        strokeWidth="1.4"
      />
      <rect
        x="46"
        y="74"
        width="36"
        height="16"
        rx="10"
        fill={`url(#${gid}-teal-shine)`}
      />

      <ellipse
        cx="64"
        cy="48"
        rx="30"
        ry="26"
        fill={`url(#${gid}-teal)`}
        stroke="#0f172a"
        strokeWidth="1.4"
      />
      <ellipse cx="56" cy="40" rx="14" ry="10" fill="#ffffff" opacity="0.2" />

      <circle cx="34" cy="48" r="5" fill="#0f172a" />
      <circle cx="94" cy="48" r="5" fill="#0f172a" />

      <rect
        x="40"
        y="34"
        width="48"
        height="26"
        rx="8"
        fill="#0f172a"
        stroke="#1e293b"
        strokeWidth="1"
      />
      <rect
        x="48"
        y="40"
        width="8"
        height="14"
        rx="1.5"
        fill="#f8fafc"
        filter={`url(#${gid}-glow)`}
        opacity="0.95"
      />
      <rect
        x="72"
        y="40"
        width="8"
        height="14"
        rx="1.5"
        fill="#f8fafc"
        filter={`url(#${gid}-glow)`}
        opacity="0.95"
      />
      <path
        d="M 52 58 Q 64 64 76 58"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />

      <path
        d="M 32 36 L 96 36 L 88 22 L 40 22 Z"
        fill="#0f172a"
        stroke="#020617"
        strokeWidth="1"
      />
      <ellipse cx="64" cy="36" rx="34" ry="5" fill="#020617" />
      <line
        x1="88"
        y1="28"
        x2="96"
        y2="44"
        stroke="#f6ad55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="96"
        cy="46"
        r="3.5"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="0.5"
      />
    </svg>
  );
}
