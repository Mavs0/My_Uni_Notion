"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LOGIN_ERROR, LOGIN_GREEN, LOGIN_GLOW, LOGIN_MUTED, LOGIN_TEXT } from "./theme";

export type HoverZone = "email" | "password" | "submit" | "oauth" | null;

export type LoginModernPrimaryFormProps = {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  fieldErrors: { email?: string; password?: string };
  loading: boolean;
  error: string | null;
  shake: boolean;
  onSubmit: (e: React.FormEvent) => void;
  googleHref: string;
  institutionalHref: string;
  onCreateAccount: () => void;
  onFocusEmail: () => void;
  onBlurEmail: () => void;
  onFocusPassword: () => void;
  onBlurPassword: () => void;
  onHover: (z: HoverZone) => void;
  lightMode?: boolean;
};

export function LoginModernPrimaryForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  fieldErrors,
  loading,
  error,
  shake,
  onSubmit,
  googleHref,
  institutionalHref,
  onCreateAccount,
  onFocusEmail,
  onBlurEmail,
  onFocusPassword,
  onBlurPassword,
  onHover,
  lightMode = false,
}: LoginModernPrimaryFormProps) {
  const hasErr = Boolean(fieldErrors.email || fieldErrors.password || error);
  const cardBg = lightMode ? "rgba(255,255,255,0.72)" : "rgba(18,18,18,0.55)";
  const borderCol = lightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const labelCol = lightMode ? "#404040" : LOGIN_MUTED;
  const inputBg = lightMode ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.04)";
  const inputText = lightMode ? "#171717" : LOGIN_TEXT;

  return (
    <motion.div
      className="w-full max-w-[400px] lg:max-w-[380px]"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.42 }}
        className="rounded-2xl border p-6 shadow-xl backdrop-blur-xl sm:p-7"
        style={{
          backgroundColor: cardBg,
          borderColor: borderCol,
          boxShadow: `0 0 0 1px ${borderCol}, 0 16px 48px -12px rgba(0,0,0,0.4), 0 0 40px -24px ${LOGIN_GLOW}`,
        }}
      >
        <div className="mb-6 text-center">
          <h1
            className="text-xl font-semibold tracking-tight sm:text-[1.45rem]"
            style={{ color: inputText }}
          >
            Entrar no{" "}
            <span style={{ color: LOGIN_GREEN }} className="font-semibold">
              UFAM Hub
            </span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: labelCol }}>
            A plataforma inteligente para sua jornada acadêmica.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="group/field space-y-2" onMouseEnter={() => onHover("email")}>
            <label htmlFor="login-modern-email" className="text-sm font-medium" style={{ color: labelCol }}>
              E-mail
            </label>
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2 transition-[border-color,box-shadow] duration-200",
                lightMode
                  ? "border-black/[0.12] bg-white focus-within:border-[#05865E]"
                  : "border-white/[0.1] bg-white/[0.04] focus-within:border-[#05865E]",
                "focus-within:shadow-[0_0_0_1px_rgba(5,134,94,0.45),0_0_28px_rgba(5,134,94,0.12)]",
                hasErr && fieldErrors.email && "!border-red-500/80 focus-within:!shadow-none",
              )}
            >
              <Mail className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0" style={{ color: LOGIN_GREEN }} />
              <input
                id="login-modern-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={onFocusEmail}
                onBlur={onBlurEmail}
                required
                placeholder="seu@email.com"
                className={cn(
                  "min-h-[40px] w-full flex-1 border-0 bg-transparent py-1 text-[15px] outline-none ring-0",
                  "placeholder:text-neutral-500 focus-visible:ring-0",
                  lightMode && "placeholder:text-neutral-400",
                )}
                style={{ color: inputText }}
              />
            </div>
            {fieldErrors.email ? (
              <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="group/field space-y-2" onMouseEnter={() => onHover("password")}>
            <label htmlFor="login-modern-password" className="text-sm font-medium" style={{ color: labelCol }}>
              Senha
            </label>
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2 transition-[border-color,box-shadow] duration-200",
                lightMode
                  ? "border-black/[0.12] bg-white focus-within:border-[#05865E]"
                  : "border-white/[0.1] bg-white/[0.04] focus-within:border-[#05865E]",
                "focus-within:shadow-[0_0_0_1px_rgba(5,134,94,0.45),0_0_28px_rgba(5,134,94,0.12)]",
                hasErr && fieldErrors.password && "!border-red-500/80 focus-within:!shadow-none",
              )}
            >
              <Lock className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0" style={{ color: LOGIN_GREEN }} />
              <input
                id="login-modern-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={onFocusPassword}
                onBlur={onBlurPassword}
                required
                minLength={6}
                placeholder="Digite sua senha"
                className={cn(
                  "min-h-[40px] w-full flex-1 border-0 bg-transparent py-1 pr-1 text-[15px] outline-none ring-0",
                  "placeholder:text-neutral-500 focus-visible:ring-0",
                  lightMode && "placeholder:text-neutral-400",
                )}
                style={{ color: inputText }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 p-1.5 opacity-65 transition hover:opacity-100"
                style={{ color: labelCol }}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {error ? (
            <p
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: "rgba(255,77,77,0.35)",
                background: "rgba(255,77,77,0.08)",
                color: LOGIN_ERROR,
              }}
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: labelCol }}>
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c === true)}
                className="border-white/30 data-[state=checked]:border-[#05865E] data-[state=checked]:bg-[#05865E]"
              />
              Lembrar de mim
            </label>
            <Link
              href="/esqueci-senha"
              className="text-sm transition hover:underline"
              style={{ color: LOGIN_GREEN }}
            >
              Esqueci minha senha
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            onMouseEnter={() => onHover("submit")}
            onMouseLeave={() => onHover(null)}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "flex h-[52px] w-full items-center gap-3 rounded-xl px-5 text-[15px] font-semibold text-white transition-shadow disabled:opacity-60",
              loading ? "justify-center" : "justify-between",
            )}
            style={{
              background: LOGIN_GREEN,
              boxShadow: `0 0 24px ${LOGIN_GLOW}`,
            }}
          >
            <span className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:justify-start">
              {loading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : null}
              {loading ? "Entrando…" : "Entrar"}
            </span>
            {!loading ? (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25"
                aria-hidden
              >
                <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
              </span>
            ) : null}
          </motion.button>

          <div className="relative py-2">
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
              style={{ background: borderCol }}
            />
            <span
              className="relative mx-auto block w-fit px-3 text-xs tracking-wide"
              style={{ color: labelCol, background: cardBg }}
            >
              ou continue com
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <motion.a
              href={googleHref}
              onMouseEnter={() => onHover("oauth")}
              onMouseLeave={() => onHover(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors"
              style={{
                borderColor: borderCol,
                color: inputText,
                background: inputBg,
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold leading-none text-[#4285F4]"
                aria-hidden
              >
                G
              </span>
              Google
            </motion.a>
            <motion.a
              href={institutionalHref}
              onMouseEnter={() => onHover("oauth")}
              onMouseLeave={() => onHover(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors"
              style={{
                borderColor: borderCol,
                color: inputText,
                background: inputBg,
              }}
            >
              <Building2 className="h-4 w-4 shrink-0 opacity-90" style={{ color: LOGIN_GREEN }} aria-hidden />
              Login institucional
            </motion.a>
          </div>

          <div
            className="flex items-start justify-center gap-2.5 text-center text-[11px] leading-relaxed sm:text-xs"
            style={{ color: labelCol }}
          >
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: LOGIN_GREEN }} aria-hidden />
            <span>Seus dados estão protegidos com segurança avançada.</span>
          </div>

          <p className="text-center text-sm" style={{ color: labelCol }}>
            Não tem conta?{" "}
            <button
              type="button"
              onClick={onCreateAccount}
              className="font-semibold transition hover:underline"
              style={{ color: LOGIN_GREEN }}
            >
              Criar conta
            </button>
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
