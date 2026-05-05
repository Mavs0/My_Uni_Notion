"use client";

/**
 * Mascote login — referência visual “anexo 01”: proporções premium, braços no corpo,
 * volume suave (gradientes SVG), olhos/visor/antena em camadas para Framer Motion.
 */
import * as React from "react";
import { motion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { LOGIN_GREEN, LOGIN_GLOW } from "./theme";

const VISOR = "#070708";
const GREEN_SOFT = "#4ade80";
const GREEN_MID = "#10b981";

type MascotMode =
  | "idle"
  | "focus-email"
  | "focus-password"
  | "error"
  | "success"
  | "loading";

type Props = {
  className?: string;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  mode: MascotMode;
  svgRef: React.RefObject<SVGSVGElement | null>;
};

export function LoginMascotInteractive({
  className,
  springX,
  springY,
  mode,
  svgRef,
}: Props) {
  const uid = React.useId().replace(/:/g, "");
  const gid = (n: string) => `lm-${n}-${uid}`;

  const isPwd = mode === "focus-password";
  const isErr = mode === "error";
  const isOk = mode === "success" || mode === "loading";
  const isCurious = mode === "focus-email";

  const mouthD = isErr
    ? "M 98 142 Q 130 128 162 142"
    : isOk
      ? "M 94 132 Q 130 152 166 132"
      : isCurious
        ? "M 100 136 Q 130 150 160 136"
        : "M 98 136 Q 130 152 162 136";

  /* Ombros no topo do torso (elipse cy=222, ry=52 → topo ~170). */
  const shoulderL = { x: 82, y: 170 };
  const shoulderR = { x: 178, y: 170 };
  /**
   * Braços “pendurados”: pivot no ombro (fill-box + origin em px).
   * Na senha não se usa rotação grande — trocamos por braços à frente do visor.
   */
  const armOriginL = "56px 0px";
  const armOriginR = "10px 0px";

  return (
    <motion.div
      className={cn("relative flex justify-center", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="absolute inset-0 -z-10 blur-[56px]"
        style={{
          background: `radial-gradient(ellipse 50% 42% at 50% 48%, ${LOGIN_GLOW}, transparent 72%)`,
        }}
        aria-hidden
      />
      <motion.svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 260 320"
        className={cn(
          "max-h-[min(88dvh,560px)] h-[min(78vw,420px)] w-auto max-w-[min(96vw,440px)]",
          "sm:h-[min(70vw,480px)] sm:max-w-[min(92vw,500px)]",
          "lg:h-[min(52vw,520px)] lg:max-h-[min(80dvh,600px)] lg:max-w-[min(48vw,560px)]",
        )}
        style={{
          filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.45)) drop-shadow(0 0 28px rgba(5,134,94,0.22))",
        }}
        role="img"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid("hull")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f4f6fa" />
            <stop offset="45%" stopColor="#dce1e9" />
            <stop offset="100%" stopColor="#b9c0cd" />
          </linearGradient>
          <linearGradient id={gid("body")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e4e8ef" />
            <stop offset="100%" stopColor="#aeb6c5" />
          </linearGradient>
          <radialGradient id={gid("headShine")} cx="35%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gid("eg")} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GREEN_SOFT} stopOpacity="0.95" />
            <stop offset="55%" stopColor={GREEN_MID} stopOpacity="0.75" />
            <stop offset="100%" stopColor={LOGIN_GREEN} stopOpacity="0.15" />
          </radialGradient>
          <filter id={gid("eyeBloom")} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={gid("antGlow")} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Propulsão / pedestal — fora do grupo de flutuação para leitura estável */}
        <ellipse cx="130" cy="292" rx="58" ry="10" fill={LOGIN_GREEN} opacity="0.2" />
        <ellipse cx="130" cy="290" rx="38" ry="6" fill={LOGIN_GREEN} opacity="0.42" />

        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.g
            animate={
              isErr
                ? { rotate: [0, -3, 3, -2, 0] }
                : isCurious
                  ? { rotate: [0, 4, 0], y: [0, -2, 0] }
                  : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.55 }}
            style={{ transformOrigin: "130px 175px" }}
          >
            {/* Corpo primeiro (atrás) — cápsula flutuante */}
            <ellipse
              cx="130"
              cy="222"
              rx="58"
              ry="52"
              fill={`url(#${gid("body")})`}
              stroke="#8b93a5"
              strokeWidth="1.15"
            />
            <ellipse cx="130" cy="210" rx="44" ry="20" fill="#000" opacity="0.06" />

            {/* Emblema peito */}
            <g transform="translate(130, 218)" opacity="0.92">
              <circle r="11" fill="none" stroke={LOGIN_GREEN} strokeWidth="1.35" />
              <path
                d="M -4.5 -1.5 L 4.5 -1.5 M -4.5 1.5 L 4.5 1.5 M 0 -5.5 L 0 5.5"
                stroke={LOGIN_GREEN}
                strokeWidth="1.15"
                strokeLinecap="round"
              />
              <circle cx="-5.5" cy="-5.5" r="1.6" fill={LOGIN_GREEN} opacity="0.85" />
              <circle cx="5.5" cy="5.5" r="1.6" fill={LOGIN_GREEN} opacity="0.65" />
            </g>

            {/* Braços em repouso — atrás da cabeça; escondidos ao focar senha. */}
            <g transform={`translate(${shoulderL.x}, ${shoulderL.y})`}>
              <motion.g
                style={{
                  transformBox: "fill-box",
                  transformOrigin: armOriginL,
                }}
                initial={false}
                animate={{ opacity: isPwd ? 0 : 1 }}
                transition={{ duration: 0.22 }}
              >
                <path
                  d="M 0 0 C -30 28 -46 62 -38 100"
                  fill="none"
                  stroke={`url(#${gid("hull")})`}
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                <path
                  d="M 0 0 C -30 28 -46 62 -38 100"
                  fill="none"
                  stroke="#8b93a5"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <ellipse
                  cx="-38"
                  cy="104"
                  rx="12"
                  ry="11"
                  fill={`url(#${gid("hull")})`}
                  stroke="#8b93a5"
                  strokeWidth="1"
                />
              </motion.g>
            </g>
            <g transform={`translate(${shoulderR.x}, ${shoulderR.y})`}>
              <motion.g
                style={{
                  transformBox: "fill-box",
                  transformOrigin: armOriginR,
                }}
                initial={false}
                animate={{ opacity: isPwd ? 0 : 1 }}
                transition={{ duration: 0.22 }}
              >
                <path
                  d="M 0 0 C 30 28 46 62 38 100"
                  fill="none"
                  stroke={`url(#${gid("hull")})`}
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                <path
                  d="M 0 0 C 30 28 46 62 38 100"
                  fill="none"
                  stroke="#8b93a5"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <ellipse
                  cx="38"
                  cy="104"
                  rx="12"
                  ry="11"
                  fill={`url(#${gid("hull")})`}
                  stroke="#8b93a5"
                  strokeWidth="1"
                />
              </motion.g>
            </g>

            {/* Pescoço */}
            <rect
              x="118"
              y="148"
              width="24"
              height="28"
              rx="8"
              fill="#c5cad6"
              stroke="#9aa3b5"
              strokeWidth="0.9"
            />

            {/* Cabeça — grande, “pill”, com volume */}
            <ellipse
              cx="130"
              cy="98"
              rx="76"
              ry="62"
              fill={`url(#${gid("hull")})`}
              stroke="#8b93a5"
              strokeWidth="1.2"
            />
            <ellipse cx="130" cy="98" rx="76" ry="62" fill={`url(#${gid("headShine")})`} />
            <ellipse cx="130" cy="112" rx="52" ry="18" fill="#000" opacity="0.07" />

            {/* Antena — topo da cabeça */}
            <motion.g
              style={{ transformOrigin: "130px 42px" }}
              animate={
                isErr
                  ? { rotate: [0, -10, 10, 0] }
                  : isOk
                    ? { scale: [1, 1.06, 1] }
                    : {}
              }
              transition={{ duration: 0.5 }}
            >
              <line
                x1="130"
                y1="42"
                x2="130"
                y2="14"
                stroke="#9aa3b5"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle
                cx="130"
                cy="10"
                r="8"
                fill={isErr ? "#f87171" : LOGIN_GREEN}
                filter={`url(#${gid("antGlow")})`}
              />
              <circle cx="130" cy="10" r="3.8" fill={GREEN_SOFT} opacity="0.95" />
            </motion.g>

            {/* Visor vidro */}
            <rect x="54" y="62" width="152" height="84" rx="36" fill={VISOR} />
            <rect x="64" y="70" width="132" height="28" rx="14" fill="#fff" opacity="0.07" />
            <rect
              x="54"
              y="62"
              width="152"
              height="84"
              rx="36"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.06"
              strokeWidth="1"
            />

            {/* Olhos */}
            <motion.g style={{ x: springX, y: springY }}>
              <motion.g
                animate={
                  isErr
                    ? { rotate: 18, y: 5, scaleY: 0.45 }
                    : isPwd
                      ? { scale: 0.28, opacity: 0.2, y: 2 }
                      : { rotate: 0, y: 0, scaleY: 1, scale: 1, opacity: 1 }
                }
                transition={{ type: "spring", stiffness: 120, damping: 16 }}
                style={{ transformOrigin: "102px 108px" }}
              >
                <circle cx="102" cy="108" r="16" fill={`url(#${gid("eg")})`} opacity="0.55" />
                <circle
                  cx="102"
                  cy="108"
                  r="11"
                  fill={LOGIN_GREEN}
                  filter={`url(#${gid("eyeBloom")})`}
                />
                <circle cx="98" cy="103" r="3.2" fill="#fff" opacity="0.95" />
              </motion.g>
              <motion.g
                animate={
                  isErr
                    ? { rotate: -18, y: 5, scaleY: 0.45 }
                    : isPwd
                      ? { scale: 0.28, opacity: 0.2, y: 2 }
                      : { rotate: 0, y: 0, scaleY: 1, scale: 1, opacity: 1 }
                }
                transition={{ type: "spring", stiffness: 120, damping: 16 }}
                style={{ transformOrigin: "158px 108px" }}
              >
                <circle cx="158" cy="108" r="16" fill={`url(#${gid("eg")})`} opacity="0.55" />
                <circle
                  cx="158"
                  cy="108"
                  r="11"
                  fill={LOGIN_GREEN}
                  filter={`url(#${gid("eyeBloom")})`}
                />
                <circle cx="154" cy="103" r="3.2" fill="#fff" opacity="0.95" />
              </motion.g>
            </motion.g>

            <motion.path
              d={mouthD}
              fill="none"
              stroke={LOGIN_GREEN}
              strokeWidth="2.4"
              strokeLinecap="round"
              initial={false}
              animate={isErr ? { stroke: "#fca5a5" } : { stroke: LOGIN_GREEN }}
            />

            {/* Senha: mãos sobem para o centro do visor (~108–152, y~100), não às orelhas. */}
            <motion.g
              initial={false}
              animate={{ opacity: isPwd ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <g transform={`translate(${shoulderL.x}, ${shoulderL.y})`}>
                <path
                  d="M 0 0 C 6 -34 18 -56 26 -70"
                  fill="none"
                  stroke={`url(#${gid("hull")})`}
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                <path
                  d="M 0 0 C 6 -34 18 -56 26 -70"
                  fill="none"
                  stroke="#8b93a5"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <ellipse
                  cx="26"
                  cy="-70"
                  rx="15"
                  ry="13"
                  fill={`url(#${gid("hull")})`}
                  stroke="#8b93a5"
                  strokeWidth="1"
                />
              </g>
              <g transform={`translate(${shoulderR.x}, ${shoulderR.y})`}>
                <path
                  d="M 0 0 C -6 -34 -18 -56 -26 -70"
                  fill="none"
                  stroke={`url(#${gid("hull")})`}
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                <path
                  d="M 0 0 C -6 -34 -18 -56 -26 -70"
                  fill="none"
                  stroke="#8b93a5"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <ellipse
                  cx="-26"
                  cy="-70"
                  rx="15"
                  ry="13"
                  fill={`url(#${gid("hull")})`}
                  stroke="#8b93a5"
                  strokeWidth="1"
                />
              </g>
            </motion.g>
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
