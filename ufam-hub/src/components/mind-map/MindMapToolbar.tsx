"use client";

import {
  Copy,
  FolderOpen,
  Loader2,
  MoreVertical,
  Network,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";
import type { MindMapRefineAction } from "@/types/mind-map";

type Props = {
  mapBusy: boolean;
  onSave: () => void;
  onOpenSaved: () => void;
  onNewMap: () => void;
  onRegenerate: () => void;
  onGlobalIa: (action: MindMapRefineAction) => void;
  disciplinaLabel?: string | null;
  className?: string;
};

export function MindMapToolbar({
  mapBusy,
  onSave,
  onOpenSaved,
  onNewMap,
  onRegenerate,
  onGlobalIa,
  disciplinaLabel,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#101010] p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {disciplinaLabel ? (
          <p className={cn("text-xs font-medium uppercase tracking-wide", MM.muted)}>
            {disciplinaLabel}
          </p>
        ) : null}
        <p className="truncate text-lg font-semibold text-[#F5F5F5]">
          Mapa mental
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={mapBusy}
          onClick={onSave}
          className={cn("rounded-lg", MM.primary)}
        >
          {mapBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Guardar</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={mapBusy}
          onClick={onOpenSaved}
          className="rounded-lg border-[#262626] bg-[#151515] text-[#E5E5E5]"
        >
          <FolderOpen className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Guardados</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={mapBusy}
          onClick={onNewMap}
          className="rounded-lg border-[#262626] bg-[#151515] text-[#E5E5E5]"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={mapBusy}
          onClick={onRegenerate}
          className="rounded-lg border-[#262626] bg-[#151515] text-[#E5E5E5]"
        >
          <RefreshCw className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Regenerar</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={mapBusy}
              className="rounded-lg border-violet-500/25 bg-violet-500/5 text-violet-200 hover:bg-violet-500/10"
            >
              <Wand2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">IA no mapa</span>
              <MoreVertical className="ml-1 h-4 w-4 opacity-60 sm:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-[#262626] bg-[#121212] text-[#F5F5F5]"
          >
            <DropdownMenuLabel className={MM.muted}>
              Ações no mapa completo
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#262626]" />
            <DropdownMenuItem
              className="cursor-pointer focus:bg-[#1a1a1a]"
              onClick={() => onGlobalIa("expandir_mapa")}
            >
              <Network className="mr-2 h-4 w-4" />
              Expandir mapa
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-[#1a1a1a]"
              onClick={() => onGlobalIa("reorganizar_mapa")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Reorganizar estrutura
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-[#1a1a1a]"
              onClick={() => onGlobalIa("simplificar_mapa")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Simplificar mapa
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-[#1a1a1a]"
              onClick={() => onGlobalIa("detalhar_mapa")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Detalhar mapa
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-[#1a1a1a]"
              onClick={() => onGlobalIa("resumo_final")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar resumo final
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-[#1a1a1a]"
              onClick={() => onGlobalIa("revisao_topicos")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Tópicos para revisão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
