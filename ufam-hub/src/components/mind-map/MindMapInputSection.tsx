"use client";

import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MM } from "@/lib/mind-map/mind-map-theme";

type Props = {
  titulo: string;
  texto: string;
  onTituloChange: (v: string) => void;
  onTextoChange: (v: string) => void;
  disabled: boolean;
  pdfExtractLoading: boolean;
  pdfFileName: string | null;
  onPickPdf: () => void;
  className?: string;
};

export function MindMapInputSection({
  titulo,
  texto,
  onTituloChange,
  onTextoChange,
  disabled,
  pdfExtractLoading,
  pdfFileName,
  onPickPdf,
  className,
}: Props) {
  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <label className={cn("mb-2 block", MM.label)}>Título do mapa (opcional)</label>
        <Input
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          disabled={disabled}
          placeholder="Ex.: Funções de várias variáveis"
          className={cn(
            "h-11 border-[#262626] bg-[#151515] text-[#F5F5F5] placeholder:text-[#737373]",
            MM.focus
          )}
        />
      </div>

      <div>
        <label className={cn("mb-2 block", MM.label)}>Texto para transformar</label>
        <textarea
          value={texto}
          onChange={(e) => onTextoChange(e.target.value)}
          disabled={disabled}
          placeholder="Cole anotações, um resumo ou texto extraído de um PDF..."
          rows={10}
          className={cn(
            "min-h-[200px] w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed",
            MM.input,
            MM.focus,
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || pdfExtractLoading}
            onClick={onPickPdf}
            className="rounded-lg border-[#262626] bg-[#121212] text-[#E5E5E5] hover:bg-[#1a1a1a]"
          >
            {pdfExtractLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A extrair PDF...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Enviar PDF
              </>
            )}
          </Button>
          {pdfFileName ? (
            <span className={cn("text-xs", MM.muted)}>{pdfFileName}</span>
          ) : (
            <span className={cn("text-xs", MM.muted)}>
              Podes colar texto ou enviar um ficheiro .pdf
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
