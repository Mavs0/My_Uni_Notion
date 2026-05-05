"use client";

import { useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, type RefObject } from "react";

export type MascotFocus = "email" | "password" | null;

/**
 * Olhos seguem o rato (suave) + bias quando há foco num campo.
 */
export function useMascotAttention(
  robotRef: RefObject<SVGSVGElement | null>,
  focus: MascotFocus,
  disabled?: boolean,
) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 90, damping: 20, mass: 0.4 });
  const springY = useSpring(my, { stiffness: 90, damping: 20, mass: 0.4 });

  const targetBias = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (focus === "email") {
      targetBias.current = { x: 5.5, y: -1.2 };
    } else if (focus === "password") {
      targetBias.current = { x: 0, y: 4.5 };
    } else {
      targetBias.current = { x: 0, y: 0 };
    }
  }, [focus]);

  /* Sem rato: só bias (privacidade na senha / loading). */
  useEffect(() => {
    if (!disabled) return;
    mx.set(targetBias.current.x);
    my.set(targetBias.current.y);
  }, [disabled, focus, mx, my]);

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (disabled) return;
      const el = robotRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      /* Centro aproximado do visor (SVG 260×320, cabeça alta). */
      const visorCx = r.left + r.width * 0.5;
      const visorCy = r.top + r.height * 0.34;
      const max = 6;
      const rawX = (e.clientX - visorCx) * 0.045;
      const rawY = (e.clientY - visorCy) * 0.04;
      const bx = targetBias.current.x;
      const by = targetBias.current.y;
      mx.set(Math.max(-max, Math.min(max, rawX + bx)));
      my.set(Math.max(-max, Math.min(max, rawY + by)));
    },
    [disabled, mx, my, robotRef],
  );

  useEffect(() => {
    if (disabled) return;
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [disabled, onMove]);

  return { springX, springY };
}
