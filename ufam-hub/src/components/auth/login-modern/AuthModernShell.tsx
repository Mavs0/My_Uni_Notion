"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginAmbientBackground } from "./LoginAmbientBackground";
import { LoginMascotInteractive } from "./LoginMascotInteractive";
import { useMascotAttention, type MascotFocus } from "./useMascotAttention";
import { LOGIN_BG, LOGIN_GREEN, LOGIN_TEXT } from "./theme";

export type AuthModernFeature = {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
};

export type AuthMascotMode =
  | "idle"
  | "focus-email"
  | "focus-password"
  | "error"
  | "success"
  | "loading";

export type AuthShellVariant = "split" | "formOnly";

export type AuthModernShellProps = {
  /** `formOnly`: só formulário centrado (ex.: 2FA). `split`: marketing + mascote + formulário. */
  variant?: AuthShellVariant;
  /** Se omitido, usa `useTheme().resolvedTheme === "light"`. */
  lightMode?: boolean;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: string;
  features?: AuthModernFeature[];
  /** Bolha acima do mascote: segunda linha só quando `focus === "password"`. */
  speechBubble?: { default: string; password?: string };
  mascotMode?: AuthMascotMode;
  mascotFocus?: MascotFocus;
  /** Desativa seguimento do rato (ex.: loading, senha em foco no login). */
  mascotAttentionDisabled?: boolean;
  /** Avisos acima do formulário (cookies, sucesso global). */
  topSlots?: React.ReactNode;
  /** Conteúdo da coluna direita (normalmente o cartão do formulário). */
  children: React.ReactNode;
  /** Ex.: nota de segurança com ícone — só coluna esquerda. */
  leftFooter?: React.ReactNode;
};

export function AuthModernShell({
  variant = "split",
  lightMode: lightModeProp,
  eyebrow,
  title,
  description = "",
  features = [],
  speechBubble = { default: "" },
  mascotMode = "idle",
  mascotFocus = null,
  mascotAttentionDisabled = false,
  topSlots,
  children,
  leftFooter,
}: AuthModernShellProps) {
  const { resolvedTheme } = useTheme();
  const lightMode =
    lightModeProp ?? (resolvedTheme === "light" ? true : false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const bubbleKey =
    mascotFocus === "password" && speechBubble.password ? "pwd" : "idle";
  const bubbleText =
    mascotFocus === "password" && speechBubble.password
      ? speechBubble.password
      : speechBubble.default;

  const { springX, springY } = useMascotAttention(
    svgRef,
    mascotFocus,
    variant === "formOnly" || mascotAttentionDisabled,
  );

  if (variant === "formOnly") {
    return (
      <div
        className="relative min-h-[100dvh] w-full overflow-x-hidden"
        style={{ backgroundColor: LOGIN_BG, color: LOGIN_TEXT }}
      >
        <div className="fixed right-5 top-5 z-50">
          <ThemeToggle variant="floating" syncThemeToServer={false} />
        </div>
        <div
          className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12"
          style={{
            background: lightMode
              ? "linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)",
          }}
        >
          <div className="mb-5 w-full max-w-md space-y-3">{topSlots}</div>
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-x-hidden"
      style={{ backgroundColor: LOGIN_BG, color: LOGIN_TEXT }}
    >
      <div className="fixed right-5 top-5 z-50">
        <ThemeToggle variant="floating" syncThemeToServer={false} />
      </div>

      <div className="flex min-h-[100dvh] w-full flex-col lg:h-[100dvh] lg:flex-row lg:overflow-hidden">
        <div className="relative flex min-h-[100dvh] flex-1 flex-col px-6 pb-10 pt-14 lg:h-full lg:min-h-0 lg:flex-[1.12] lg:overflow-y-auto lg:px-10 lg:pb-12 lg:pt-10 xl:px-14">
          <LoginAmbientBackground />
          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center lg:mx-0 lg:max-w-none lg:justify-center xl:pr-4">
            <motion.div
              className="mb-7 flex justify-center lg:mb-10 lg:justify-start"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="flex items-center gap-3.5">
                <AppLogo size="lg" priority />
                <span
                  className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-[1.75rem]"
                  style={{ color: LOGIN_TEXT }}
                >
                  UFAM <span style={{ color: LOGIN_GREEN }}>Hub</span>
                </span>
              </div>
            </motion.div>
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-14 xl:gap-16">
              <div className="flex min-w-0 flex-1 flex-col items-center text-center lg:min-w-[280px] lg:max-w-xl lg:items-start lg:text-left xl:max-w-2xl">
                {eyebrow ? (
                  <motion.div
                    className="text-xl font-medium sm:text-2xl lg:text-2xl"
                    style={{ color: LOGIN_TEXT }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    {eyebrow}
                  </motion.div>
                ) : null}
                {title ? (
                  <motion.h2
                    className={`text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.25rem] ${eyebrow ? "mt-3" : ""}`}
                    style={{ color: LOGIN_TEXT }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: eyebrow ? 0.1 : 0.05 }}
                  >
                    {title}
                  </motion.h2>
                ) : null}
                {description ? (
                  <motion.p
                    className="mt-4 max-w-lg text-base leading-relaxed sm:text-lg lg:max-w-xl"
                    style={{ color: "rgba(250,250,250,0.62)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.16 }}
                  >
                    {description}
                  </motion.p>
                ) : null}
                {features.length > 0 ? (
                  <ul className="mt-10 w-full max-w-lg space-y-5 text-left lg:mt-12">
                    {features.map(({ Icon, title: ft, subtitle }, i) => (
                      <motion.li
                        key={ft}
                        className="flex gap-4"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 + i * 0.06 }}
                      >
                        <span
                          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12"
                          style={{
                            borderColor: "rgba(5, 134, 94, 0.5)",
                            color: LOGIN_GREEN,
                            background: "rgba(5, 134, 94, 0.1)",
                            boxShadow: "0 0 24px rgba(5, 134, 94, 0.08)",
                          }}
                          aria-hidden
                        >
                          <Icon
                            className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]"
                            strokeWidth={1.75}
                          />
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block text-base font-semibold leading-snug sm:text-lg"
                            style={{ color: LOGIN_TEXT }}
                          >
                            {ft}
                          </span>
                          <span
                            className="mt-1 block text-sm leading-relaxed sm:text-[15px]"
                            style={{ color: "rgba(250,250,250,0.52)" }}
                          >
                            {subtitle}
                          </span>
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                ) : null}
                {leftFooter ? (
                  <div className="mt-10 hidden w-full max-w-lg lg:mt-12 lg:block">
                    {leftFooter}
                  </div>
                ) : null}
              </div>
              <div className="mx-auto flex w-full min-w-0 flex-1 flex-col items-center justify-center lg:mx-0 lg:max-w-none">
                {speechBubble.default ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={bubbleKey}
                      role="status"
                      aria-live="polite"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 360, damping: 28 }}
                      className="pointer-events-none mb-5 max-w-[min(320px,92vw)] rounded-2xl border border-white/12 bg-zinc-900/92 px-4 py-3 text-center text-sm leading-snug shadow-lg backdrop-blur-sm sm:text-[15px]"
                      style={{ color: LOGIN_TEXT }}
                    >
                      {bubbleText}
                    </motion.div>
                  </AnimatePresence>
                ) : null}
                <LoginMascotInteractive
                  svgRef={svgRef}
                  springX={springX}
                  springY={springY}
                  mode={mascotMode}
                />
              </div>
            </div>
            {leftFooter ? (
              <div className="mt-8 w-full max-w-lg lg:hidden">{leftFooter}</div>
            ) : null}
          </div>
        </div>

        <div
          className="relative z-10 flex min-h-[100dvh] flex-1 flex-col items-center justify-center px-4 py-10 lg:min-h-0 lg:h-full lg:flex-[0.88] lg:overflow-y-auto lg:px-8 lg:py-10 xl:px-12"
          style={{
            background: lightMode
              ? "linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)",
          }}
        >
          <div className="mb-5 w-full max-w-[400px] space-y-3 lg:max-w-[380px]">
            {topSlots}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
