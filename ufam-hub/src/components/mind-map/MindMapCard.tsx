"use client";

import { ChevronRight, MoreHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MindMapRamo } from "@/types/mind-map";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

type Props = {
  ramo: MindMapRamo;
  selected: boolean;
  onSelect: () => void;
  onOpenPanel: () => void;
};

export function MindMapCard({
  ramo,
  selected,
  onSelect,
  onOpenPanel,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative rounded-xl border bg-[#121212] p-4 text-left transition-all",
        "border-l-[3px] shadow-sm hover:shadow-md",
        selected
          ? "ring-2 ring-[#05865E]/50 ring-offset-2 ring-offset-[#050505]"
          : "border-[#262626] hover:border-[#333]"
      )}
      style={{ borderLeftColor: ramo.cor }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold leading-snug">
            <span style={{ color: ramo.cor }}>{ramo.texto}</span>
          </h4>
          {ramo.notas ? (
            <p className={cn("mt-1 line-clamp-2 text-xs", MM.muted)}>
              {ramo.notas}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[#A3A3A3] hover:bg-white/5 hover:text-[#05865E]"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPanel();
            }}
            title="Editar tópico"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {ramo.subramos && ramo.subramos.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-[#1f1f1f] pt-3">
          {ramo.subramos.map((sub) => (
            <li key={sub.id} className="flex gap-2 text-sm">
              <ChevronRight
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: ramo.cor }}
              />
              <div>
                <span className="font-medium text-[#E5E5E5]">{sub.texto}</span>
                {sub.detalhes ? (
                  <p className={cn("mt-0.5 text-xs leading-relaxed", MM.muted)}>
                    {sub.detalhes}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-30">
        <Sparkles className="h-4 w-4 text-violet-400" />
      </div>
    </div>
  );
}
