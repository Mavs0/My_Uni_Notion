"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parseNotaPt } from "@/lib/controle-academico/business-rules";
import type { Avaliacao } from "@/hooks/useAvaliacoes";

function labelTipo(t: Avaliacao["tipo"]) {
  if (t === "prova") return "Prova";
  if (t === "trabalho") return "Trabalho";
  return "Seminário";
}

function fmtData(dataISO: string | null | undefined) {
  if (!dataISO) return "—";
  try {
    return new Date(dataISO).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dataISO;
  }
}

export type RegistarNotaAvaliacaoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avaliacao: Avaliacao | null;
  /** Nome da disciplina (lista global de avaliações). */
  disciplinaNome?: string | null;
  updateAvaliacao: (
    id: string,
    patch: Partial<Omit<Avaliacao, "id">>,
  ) => Promise<{ success: boolean; error?: string }>;
  onSaved?: () => void | Promise<void>;
};

export function RegistarNotaAvaliacaoDialog({
  open,
  onOpenChange,
  avaliacao,
  disciplinaNome,
  updateAvaliacao,
  onSaved,
}: RegistarNotaAvaliacaoDialogProps) {
  const [notaTexto, setNotaTexto] = useState("");
  const [pesoTexto, setPesoTexto] = useState("1");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !avaliacao) return;
    setNotaTexto(
      avaliacao.nota != null && !Number.isNaN(Number(avaliacao.nota))
        ? String(avaliacao.nota).replace(".", ",")
        : "",
    );
    setPesoTexto(
      avaliacao.peso != null &&
        !Number.isNaN(Number(avaliacao.peso)) &&
        Number(avaliacao.peso) > 0
        ? String(avaliacao.peso)
        : "1",
    );
  }, [avaliacao, open]);

  async function handleGuardar() {
    if (!avaliacao) return;
    const nota = parseNotaPt(notaTexto);
    if (nota === null) {
      toast.error("Indica uma nota válida (ex.: 7,5).");
      return;
    }
    if (nota < 0 || nota > 20) {
      toast.error("A nota deve estar entre 0 e 20.");
      return;
    }
    const pRaw = pesoTexto.trim().replace(",", ".");
    let peso = 1;
    if (pRaw !== "") {
      const p = Number.parseFloat(pRaw);
      if (!Number.isFinite(p) || p <= 0) {
        toast.error("Peso inválido — usa um número positivo (ex.: 1 ou 2).");
        return;
      }
      peso = p;
    }

    setSalvando(true);
    try {
      const r = await updateAvaliacao(avaliacao.id, { nota, peso });
      if (!r.success) {
        toast.error(r.error || "Erro ao guardar a nota");
        return;
      }
      toast.success("Nota guardada. Aparece em Controle Acadêmico → Notas.");
      onOpenChange(false);
      await onSaved?.();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/80 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nota no controlo de notas</DialogTitle>
          <DialogDescription>
            A nota fica associada a esta avaliação e entra na média parcial em{" "}
            <strong className="text-foreground">Controle Acadêmico</strong>.
          </DialogDescription>
        </DialogHeader>
        {avaliacao ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">
                {labelTipo(avaliacao.tipo)}
                {disciplinaNome ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {disciplinaNome}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmtData(avaliacao.dataISO)}
              </p>
              {avaliacao.descricao?.trim() ? (
                <p className="mt-2 text-sm text-foreground/90 line-clamp-3">
                  {avaliacao.descricao}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-nota-valor">Nota que obtiveste</Label>
              <Input
                id="reg-nota-valor"
                inputMode="decimal"
                placeholder="Ex.: 7,5"
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                className="rounded-xl"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Escala 0 a 20 (ou 0 a 10 — usa o valor que corresponde ao teu
                plano de ensino).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-nota-peso">Peso na média parcial</Label>
              <Input
                id="reg-nota-peso"
                inputMode="decimal"
                placeholder="1"
                value={pesoTexto}
                onChange={(e) => setPesoTexto(e.target.value)}
                className="rounded-xl"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Por defeito 1. Usa 2 se esta avaliação contar o dobro, etc.
              </p>
            </div>
            <p className="text-xs">
              <Link
                href="/controle-academico?tab=notas"
                className="text-primary underline-offset-2 hover:underline"
              >
                Abrir Controle Acadêmico (Notas)
              </Link>
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => void handleGuardar()}
            disabled={salvando || !avaliacao}
          >
            {salvando ? "A guardar…" : "Guardar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
