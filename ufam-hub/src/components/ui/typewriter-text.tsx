"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
  text: string;
  className?: string;
  cursorClassName?: string;
  /** Velocidade entre caracteres (ms) */
  speed?: number;
  /** Pausa no fim antes de apagar (ms); 0 = não apagar (sem loop) */
  pauseBeforeErase?: number;
  /** Velocidade ao apagar (ms) */
  eraseSpeed?: number;
}

export function TypewriterText({
  text,
  className,
  cursorClassName,
  speed = 100,
  pauseBeforeErase = 0,
  eraseSpeed = 50,
}: TypewriterTextProps) {
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const run = useCallback(() => {
    if (!isDeleting) {
      if (display.length < text.length) {
        setDisplay(text.slice(0, display.length + 1));
      } else if (pauseBeforeErase > 0) {
        setIsDeleting(true);
      }
    } else {
      if (display.length > 0) {
        setDisplay(display.slice(0, -1));
      } else {
        setIsDeleting(false);
      }
    }
  }, [display, text, isDeleting, pauseBeforeErase]);

  const doneNoLoop = !isDeleting && display.length === text.length && pauseBeforeErase === 0;
  const delay = doneNoLoop
    ? 0
    : isDeleting
      ? eraseSpeed
      : display.length < text.length
        ? speed
        : pauseBeforeErase;

  useEffect(() => {
    if (doneNoLoop) return;
    const id = setTimeout(run, delay);
    return () => clearTimeout(id);
  }, [display, isDeleting, run, speed, eraseSpeed, pauseBeforeErase, text.length, delay, doneNoLoop]);

  return (
    <span className={cn("inline", className)}>
      {display}
      <span
        className={cn(
          "inline-block w-[2px] min-w-[2px] h-[0.9em] align-middle bg-current ml-0.5 animate-pulse",
          cursorClassName
        )}
        style={{ animationDuration: "0.8s" }}
        aria-hidden
      />
    </span>
  );
}
