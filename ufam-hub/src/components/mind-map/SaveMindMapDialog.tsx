"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

export type SaveMindMapMode = "novo" | "atualizar";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  onTituloChange: (v: string) => void;
  tagsStr: string;
  onTagsStrChange: (v: string) => void;
  disciplinaNome?: string | null;
  mode: SaveMindMapMode;
  onModeChange: (m: SaveMindMapMode) => void;
  canUpdate: boolean;
  saving: boolean;
  onConfirm: () => void;
};

export function SaveMindMapDialog({
  open,
  onOpenChange,
  titulo,
  onTituloChange,
  tagsStr,
  onTagsStrChange,
  disciplinaNome,
  mode,
  onModeChange,
  canUpdate,
  saving,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#262626] bg-[#101010] text-[#F5F5F5] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar mapa mental</DialogTitle>
          <DialogDescription className={MM.muted}>
            Tipo: mapa mental IA
            {disciplinaNome ? ` · Disciplina: ${disciplinaNome}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className={cn("mb-2 block text-sm", MM.label)}>Nome do mapa</label>
            <Input
              value={titulo}
              onChange={(e) => onTituloChange(e.target.value)}
              placeholder="Ex.: Revisão — Cálculo II"
              className="border-[#262626] bg-[#151515] text-[#F5F5F5]"
            />
          </div>
          <div>
            <label className={cn("mb-2 block text-sm", MM.label)}>
              Tags (opcional, separadas por vírgula)
            </label>
            <Input
              value={tagsStr}
              onChange={(e) => onTagsStrChange(e.target.value)}
              placeholder="prova, revisão, capítulo 3"
              className="border-[#262626] bg-[#151515] text-[#F5F5F5]"
            />
          </div>
          {canUpdate ? (
            <div className="flex gap-2 rounded-xl border border-[#262626] bg-[#121212] p-3">
              <Button
                type="button"
                size="sm"
                variant={mode === "novo" ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  mode === "novo" && MM.primary
                )}
                onClick={() => onModeChange("novo")}
              >
                Guardar como novo
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "atualizar" ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  mode === "atualizar" && MM.primary
                )}
                onClick={() => onModeChange("atualizar")}
              >
                Atualizar existente
              </Button>
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="border-[#333] bg-transparent"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className={MM.primary}
            disabled={!titulo.trim() || saving}
            onClick={onConfirm}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
