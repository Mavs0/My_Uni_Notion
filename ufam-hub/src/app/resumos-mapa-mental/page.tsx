"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Network } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { MindMapWorkspace } from "@/components/mind-map";

export default function ResumosMapaMentalPage() {
  const { disciplinas, disciplinasAtivas, loading } = useDisciplinas();
  const lista = disciplinasAtivas.length ? disciplinasAtivas : disciplinas;
  const [disciplinaId, setDisciplinaId] = useState("");

  useEffect(() => {
    if (lista.length === 0) return;
    const ok = lista.some((d) => d.id === disciplinaId);
    if (!disciplinaId || !ok) {
      setDisciplinaId(lista[0]!.id);
    }
  }, [lista, disciplinaId]);

  const disciplinaAtual = useMemo(
    () => lista.find((d) => d.id === disciplinaId) ?? null,
    [lista, disciplinaId],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/busca-anotacoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Anotações
      </Link>
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40">
              <Network className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Resumos em mapa mental
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                O mesmo ecrã de mapa mental do Chat IA, só com edição manual — sem
                gerar nem refinar com IA.
              </p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar disciplinas…
            </div>
          ) : lista.length > 0 ? (
            <div className="w-full sm:w-72">
              <span className="mb-1.5 block text-xs text-muted-foreground">
                Disciplina
              </span>
              <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {lista.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </header>

      {lista.length === 0 && !loading ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Adiciona pelo menos uma disciplina em Disciplinas para associar os
          resumos.
        </p>
      ) : disciplinaId ? (
        <MindMapWorkspace
          key={disciplinaId}
          disciplinaId={disciplinaId}
          disciplinaNome={disciplinaAtual?.nome ?? null}
          manualOnly
        />
      ) : null}
    </div>
  );
}
