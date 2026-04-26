"use client";

import { Network } from "lucide-react";
import { MM } from "@/lib/mind-map/mind-map-theme";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  hint?: string;
};

export function EmptyMindMapState({
  title = "Nenhum mapa guardado",
  hint = "Gere um mapa e guarde-o na biblioteca para o ver aqui.",
}: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#262626] bg-[#0a0a0a] px-6 py-14 text-center"
      role="status"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Network className="h-7 w-7 text-violet-400" />
      </div>
      <p className="text-base font-medium text-[#F5F5F5]">{title}</p>
      <p className={cn("max-w-sm text-sm", MM.muted)}>{hint}</p>
    </div>
  );
}
