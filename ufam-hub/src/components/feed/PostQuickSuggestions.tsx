"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_SUGGESTIONS = [
  "Completei meu primeiro pomodoro!",
  "Finalizei uma prova difícil",
  "Conquista: terminei todas as tarefas da semana",
  "Reflexão: aprendi algo novo hoje",
  "Conquista desbloqueada",
  "Dica de estudo que funcionou",
];

export function PostQuickSuggestions({
  onPick,
  suggestions = DEFAULT_SUGGESTIONS,
}: {
  onPick: (text: string) => void;
  suggestions?: string[];
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-[#A3A3A3]">
        <Sparkles className="h-3.5 w-3.5 text-[#05865E]" />
        Sugestões rápidas
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className={cn(
              "max-w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-left text-xs leading-snug text-[#374151] transition-colors",
              "hover:border-[#05865E]/45 hover:bg-[#05865E]/[0.06] dark:border-[#262626] dark:bg-[#151515] dark:text-[#D4D4D4] dark:hover:bg-[#1a1a1a]",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
