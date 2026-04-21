"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  onRegenerateIa: () => void;
  regenerating: boolean;
  className?: string;
};

export function MindMapSummaryCard({
  value,
  onChange,
  disabled,
  onRegenerateIa,
  regenerating,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#262626] bg-[#101010] p-5 shadow-lg",
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#05865E]" />
          <h3 className="text-base font-semibold text-[#F5F5F5]">
            Resumo textual
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || regenerating}
          onClick={onRegenerateIa}
          className="rounded-lg border-[#262626] bg-[#151515] text-xs text-[#E5E5E5] hover:bg-[#1a1a1a]"
        >
          {regenerating ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              A gerar...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Regenerar com IA
            </>
          )}
        </Button>
      </div>
      <p className={cn("mb-3 text-xs", MM.muted)}>
        Versão compacta para revisão rápida; podes editar livremente.
      </p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        className={cn(
          "resize-y rounded-xl border-[#262626] bg-[#151515] text-sm text-[#F5F5F5] placeholder:text-[#737373]",
          MM.focus
        )}
        placeholder="Resumo do mapa..."
      />
    </div>
  );
}
