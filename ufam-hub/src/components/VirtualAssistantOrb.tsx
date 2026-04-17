"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Vídeo de referência (Dribbble). Pode sobrescrever com NEXT_PUBLIC_ASSISTANT_ORB_VIDEO_URL (ex.: MP4 em /public). */
export const VIRTUAL_ASSISTANT_VIDEO_SRC =
  process.env.NEXT_PUBLIC_ASSISTANT_ORB_VIDEO_URL ||
  "https://cdn.dribbble.com/userupload/4092388/file/original-f3ba952f70b42737e63565e8ca9c28f3.mp4";

const POSTER = "/assistant-orb-poster.png";

const sizeClass = {
  sm: "h-8 w-8 min-h-8 min-w-8",
  md: "h-10 w-10 min-h-10 min-w-10",
  lg: "h-14 w-14 min-h-14 min-w-14",
} as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function OrbFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "assistant-orb-fallback h-full w-full rounded-full",
        className,
      )}
      aria-hidden
    />
  );
}

type VirtualAssistantOrbProps = {
  className?: string;
  /** Tamanho do círculo (FAB usa `lg`). */
  size?: keyof typeof sizeClass;
};

/**
 * Ícone do assistente: vídeo em loop (estética “orbe” do Dribbble) com poster e fallback CSS animado.
 */
export function VirtualAssistantOrb({
  className,
  size = "lg",
}: VirtualAssistantOrbProps) {
  const [useFallback, setUseFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (useFallback || reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.play().catch(() => setUseFallback(true));
    };
    tryPlay();
  }, [useFallback, reducedMotion]);

  const showVideo = !useFallback && !reducedMotion;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full shadow-lg",
        "ring-2 ring-white/40 dark:ring-white/15",
        "shadow-[0_8px_32px_-8px_rgba(236,72,153,0.55),0_4px_16px_-4px_rgba(167,139,250,0.35)]",
        sizeClass[size],
        className,
      )}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          className="h-full w-full scale-[1.12] object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster={POSTER}
          preload="metadata"
          onError={() => setUseFallback(true)}
        >
          <source src={VIRTUAL_ASSISTANT_VIDEO_SRC} type="video/mp4" />
        </video>
      ) : reducedMotion ? (
        <div className="relative h-full w-full">
          <Image
            src={POSTER}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            priority={false}
          />
        </div>
      ) : (
        <OrbFallback />
      )}
    </div>
  );
}
