"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/AppLogo";
import {
  UfamErrorIllustration404,
  UfamErrorIllustration500,
} from "@/components/errors/ufam-error-illustrations";

const brand = "#05865E";

type UfamErrorShellProps = {
  code: "404" | "500";
  title: string;
  description: string;
  onRetry: () => void;
  extra?: ReactNode;
};

export function UfamErrorShell({
  code,
  title,
  description,
  onRetry,
  extra,
}: UfamErrorShellProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className={cn(
        "dark fixed inset-0 z-[100] flex min-h-[100dvh] w-full flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#050506] text-zinc-100 antialiased",
      )}
      role="document"
      aria-label={code === "404" ? "Página não encontrada" : "Erro do servidor"}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full opacity-[0.07]"
          style={{
            background: `radial-gradient(circle, ${brand} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -right-24 bottom-1/4 h-[360px] w-[360px] rounded-full opacity-[0.05]"
          style={{
            background: `radial-gradient(circle, ${brand} 0%, transparent 68%)`,
          }}
        />
        <svg
          className="absolute left-[8%] top-[18%] h-40 w-40 text-white opacity-[0.04]"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="0.6" fill="none" />
        </svg>
        <svg
          className="absolute right-[12%] top-[40%] h-48 w-48 text-white opacity-[0.035]"
          viewBox="0 0 120 120"
          aria-hidden
        >
          <path
            d="M60 20 L75 55 L110 60 L80 82 L88 118 L60 98 L32 118 L40 82 L10 60 L45 55 Z"
            stroke="currentColor"
            strokeWidth="0.7"
            fill="none"
          />
        </svg>
        <div className="absolute bottom-[22%] left-[20%] h-px w-32 rotate-[-35deg] bg-white opacity-[0.06]" />
        <div className="absolute top-[30%] right-[25%] h-px w-24 rotate-[12deg] bg-white opacity-[0.05]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-8 flex shrink-0 items-center">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2.5 rounded-lg outline-none ring-offset-2 ring-offset-[#050506] transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#05865E]/60"
          >
            <AppLogo size={28} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
              UFAM Hub
            </span>
          </Link>
        </header>

        <div
          className={cn(
            "flex flex-1 flex-col justify-center",
            "rounded-[22px] border border-white/[0.09]",
            "bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent",
            "shadow-[0_32px_96px_-32px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
            "backdrop-blur-xl",
          )}
        >
          <div className="grid items-center gap-10 p-8 sm:p-10 md:gap-12 md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(240px,380px)] lg:p-14">
            <div className="flex flex-col justify-center">
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: brand }}
              >
                Ops!
              </p>
              <p
                className="mb-3 text-7xl font-bold tracking-tight text-white sm:text-8xl"
                style={{
                  textShadow: `0 0 80px ${brand}33`,
                }}
              >
                {code}
              </p>
              <h1 className="mb-4 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                {title}
              </h1>
              <p className="mb-8 max-w-md text-[15px] leading-relaxed text-zinc-400">
                {description}
              </p>
              {extra}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white",
                    "transition-all duration-200",
                    "shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_8px_28px_-8px_rgba(5,134,94,0.55)]",
                    "hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_12px_36px_-6px_rgba(5,134,94,0.65)]",
                    "active:scale-[0.98]",
                  )}
                  style={{ backgroundColor: brand }}
                >
                  <RefreshCw className="size-4 shrink-0 opacity-95" aria-hidden />
                  Tentar novamente
                </button>
                <Link
                  href="/dashboard"
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-100",
                    "transition-all duration-200",
                    "hover:border-[#05865E]/45 hover:bg-[#05865E]/10 hover:shadow-[0_0_24px_-4px_rgba(5,134,94,0.35)]",
                    "active:scale-[0.98]",
                  )}
                >
                  <LayoutDashboard className="size-4 shrink-0 opacity-90" aria-hidden />
                  Ir para o dashboard
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-[220px] items-center justify-center lg:min-h-[300px]">
              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-40 blur-3xl"
                style={{
                  background: `radial-gradient(ellipse at center, ${brand}22 0%, transparent 65%)`,
                }}
              />
              <div className="relative w-full max-w-[min(100%,380px)]">
                {code === "404" ? (
                  <UfamErrorIllustration404 className="mx-auto drop-shadow-[0_20px_48px_rgba(0,0,0,0.45)]" />
                ) : (
                  <UfamErrorIllustration500 className="mx-auto drop-shadow-[0_20px_48px_rgba(0,0,0,0.45)]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
