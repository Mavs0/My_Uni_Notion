"use client";

import { Copy, FolderOpen, Loader2, Network, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BibliotecaItem } from "@/lib/mind-map/mind-map-api";
import { EmptyMindMapState } from "./EmptyMindMapState";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  items: BibliotecaItem[];
  onOpenItem: (item: BibliotecaItem) => void;
  onDuplicateItem: (item: BibliotecaItem) => void;
  onDeleteItem: (item: BibliotecaItem) => void;
  busyId: string | null;
};

export function SavedMindMapsModal({
  open,
  onOpenChange,
  loading,
  items,
  onOpenItem,
  onDuplicateItem,
  onDeleteItem,
  busyId,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-[#262626] bg-[#101010] text-[#F5F5F5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <Network className="h-5 w-5 text-violet-400" />
            </span>
            Mapas guardados
          </DialogTitle>
          <DialogDescription className={MM.muted}>
            Abre, duplica ou remove mapas mentais da tua biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[200px] max-h-[55vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#737373]" />
            </div>
          ) : items.length === 0 ? (
            <EmptyMindMapState />
          ) : (
            <div className="space-y-2">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#121212] p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left transition-opacity hover:opacity-90"
                    onClick={() => onOpenItem(m)}
                  >
                    <h4 className="font-medium text-[#F5F5F5]">{m.titulo}</h4>
                    {m.descricao ? (
                      <p className={cn("mt-1 line-clamp-2 text-sm", MM.muted)}>
                        {m.descricao}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#737373]">
                      {m.created_at ? (
                        <span>
                          {new Date(m.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      ) : null}
                      {m.tags?.slice(0, 4).map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="border-[#333] bg-[#1a1a1a] text-[#A3A3A3]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={busyId === m.id}
                      className="border-[#333] bg-[#151515]"
                      title="Abrir"
                      onClick={() => onOpenItem(m)}
                    >
                      {busyId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FolderOpen className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={busyId === m.id}
                      className="border-[#333] bg-[#151515]"
                      title="Duplicar"
                      onClick={() => onDuplicateItem(m)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={busyId === m.id}
                      className="border-[#333] bg-[#151515] text-red-400 hover:bg-red-500/10"
                      title="Excluir"
                      onClick={() => onDeleteItem(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-[#333]"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
