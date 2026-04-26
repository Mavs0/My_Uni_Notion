"use client";

import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";
import type { MindMapLoadingStep } from "@/types/mind-map";

const STEP_LABEL: Record<MindMapLoadingStep, string> = {
  analisando: "Analisando conteúdo",
  estruturando: "Estruturando tópicos",
  relacoes: "Organizando relações",
};

type Props = {
  step: MindMapLoadingStep;
  className?: string;
};

export function MindMapLoadingState({ step, className }: Props) {
  const order: MindMapLoadingStep[] = ["analisando", "estruturando", "relacoes"];
  const idx = order.indexOf(step);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#262626] bg-[#101010] p-6 shadow-xl",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#F5F5F5]">
            {STEP_LABEL[step]}
          </p>
          <p className={cn("mt-1 text-xs", MM.muted)}>
            Isto pode levar alguns segundos.
          </p>
        </div>
        <div className="flex gap-1.5">
          {order.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                i <= idx ? "bg-[#05865E]/80" : "bg-[#262626]"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="mx-auto flex max-w-md justify-center">
          <div className="h-10 w-40 animate-pulse rounded-xl bg-[#1a1a1a] ring-1 ring-[#262626]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div
              key={k}
              className="h-24 rounded-xl border border-[#1f1f1f] bg-[#121212] p-3 shadow-inner"
            >
              <div className="mb-2 h-3 w-[75%] animate-pulse rounded bg-[#1a1a1a]" />
              <div className="h-2 w-full animate-pulse rounded bg-[#181818]" />
              <div className="mt-2 h-2 w-5/6 animate-pulse rounded bg-[#181818]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
