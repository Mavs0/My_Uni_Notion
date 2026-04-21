"use client";

import { useMemo } from "react";
import {
  Copy,
  Loader2,
  ListChecks,
  Minimize2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MindMapRamo, MindMapRefineAction } from "@/types/mind-map";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ramo: MindMapRamo | null;
  iaLoading: boolean;
  iaOutput: string | null;
  onUpdateRamo: (patch: Partial<MindMapRamo>) => void;
  onAddSubramo: () => void;
  onUpdateSubramo: (
    subId: string,
    patch: { texto?: string; detalhes?: string }
  ) => void;
  onRemoveSubramo: (subId: string) => void;
  onRemoveRamo: () => void;
  onDuplicateRamo: () => void;
  onTopicIa: (action: MindMapRefineAction) => void;
  onClearIaOutput: () => void;
};

export function MindMapSidePanel({
  open,
  onOpenChange,
  ramo,
  iaLoading,
  iaOutput,
  onUpdateRamo,
  onAddSubramo,
  onUpdateSubramo,
  onRemoveSubramo,
  onRemoveRamo,
  onDuplicateRamo,
  onTopicIa,
  onClearIaOutput,
}: Props) {
  const subList = useMemo(() => ramo?.subramos ?? [], [ramo]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-[#262626] bg-[#0c0c0c] p-0 sm:max-w-md"
      >
        {ramo ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[#262626] px-5 py-4 text-left">
              <SheetTitle className="text-lg text-[#F5F5F5]">
                Editar tópico
              </SheetTitle>
              <SheetDescription className={MM.muted}>
                Ajusta o texto, subitens e usa IA para aprofundar este ramo.
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label className={cn("mb-1.5 block text-xs", MM.muted)}>
                  Título do tópico
                </label>
                <Input
                  value={ramo.texto}
                  onChange={(e) => onUpdateRamo({ texto: e.target.value })}
                  className={cn(
                    "border-[#262626] bg-[#151515] text-[#F5F5F5]",
                    MM.focus
                  )}
                />
              </div>

              <div>
                <label className={cn("mb-1.5 block text-xs", MM.muted)}>
                  Descrição / notas
                </label>
                <Textarea
                  value={ramo.notas ?? ""}
                  onChange={(e) => onUpdateRamo({ notas: e.target.value })}
                  rows={3}
                  placeholder="Observações tuas sobre este tópico..."
                  className={cn(
                    "border-[#262626] bg-[#151515] text-sm text-[#F5F5F5]",
                    MM.focus
                  )}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn("text-xs font-medium", MM.muted)}>
                    Subitens
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[#05865E] hover:bg-[#05865E]/10 hover:text-[#05865E]"
                    onClick={onAddSubramo}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {subList.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-[#262626] bg-[#121212] p-3"
                    >
                      <Input
                        value={s.texto}
                        onChange={(e) =>
                          onUpdateSubramo(s.id, { texto: e.target.value })
                        }
                        className="mb-2 border-[#333] bg-[#151515] text-sm text-[#F5F5F5]"
                        placeholder="Subitem"
                      />
                      <Textarea
                        value={s.detalhes ?? ""}
                        onChange={(e) =>
                          onUpdateSubramo(s.id, { detalhes: e.target.value })
                        }
                        rows={2}
                        placeholder="Detalhes (opcional)"
                        className="border-[#333] bg-[#151515] text-xs text-[#A3A3A3]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-[#DC2626] hover:bg-red-500/10"
                        onClick={() => onRemoveSubramo(s.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remover subitem
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3">
                <p className={cn("mb-2 text-xs font-medium", MM.muted)}>
                  IA neste tópico
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={iaLoading}
                    className="border-[#333] bg-[#151515] text-xs"
                    onClick={() => onTopicIa("expandir_topico")}
                  >
                    <Wand2 className="mr-1 h-3.5 w-3.5" />
                    Expandir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={iaLoading}
                    className="border-[#333] bg-[#151515] text-xs"
                    onClick={() => onTopicIa("resumir_topico")}
                  >
                    <Minimize2 className="mr-1 h-3.5 w-3.5" />
                    Resumir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={iaLoading}
                    className="border-[#333] bg-[#151515] text-xs"
                    onClick={() => onTopicIa("exemplos_topico")}
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Exemplos
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={iaLoading}
                    className="border-[#333] bg-[#151515] text-xs"
                    onClick={() => onTopicIa("reorganizar_pontos")}
                  >
                    <ListChecks className="mr-1 h-3.5 w-3.5" />
                    Reorganizar pontos
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={iaLoading}
                    className="border-[#333] bg-[#151515] text-xs"
                    onClick={() => onTopicIa("checklist_estudo")}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Checklist
                  </Button>
                </div>
                {iaLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#A3A3A3]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A processar com IA...
                  </div>
                ) : null}
                {iaOutput ? (
                  <div className="mt-3 rounded-lg border border-[#262626] bg-[#0a0a0a] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#A3A3A3]">
                        Resultado
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={onClearIaOutput}
                      >
                        Fechar
                      </Button>
                    </div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[#E5E5E5]">
                      {iaOutput}
                    </pre>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[#262626] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#333] text-[#E5E5E5]"
                  onClick={onDuplicateRamo}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar tópico
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-600/90 hover:bg-red-600"
                  onClick={onRemoveRamo}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover tópico
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <SheetTitle className="text-[#F5F5F5]">Tópico</SheetTitle>
            <p className={cn("mt-2 text-sm", MM.muted)}>
              Seleciona um cartão no mapa para editar.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
