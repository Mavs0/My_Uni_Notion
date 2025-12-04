"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { Loader2, AlertCircle } from "lucide-react";

type TTipo = "obrigatoria" | "eletiva" | "optativa";
type Aula = {
  id: string;
  nome: string;
  tipo: TTipo;
  dia: number;
  inicio: string;
  fim: string;
  local?: string;
  disciplinaId: string;
};
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

function typeClass(tipo: TTipo) {
  switch (tipo) {
    case "obrigatoria":
      return "bg-yellow-500/20 text-yellow-100 border-yellow-500/40";
    case "eletiva":
      return "bg-red-500/25 text-red-100 border-red-500/40";
    case "optativa":
      return "bg-emerald-500/25 text-emerald-100 border-emerald-500/40";
  }
}

function inSlot(a: Aula, slot: { inicio: string; fim: string }) {
  return a.inicio === slot.inicio && a.fim === slot.fim;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}
export default function GradePage() {
  const { disciplinas, loading, error } = useDisciplinas();
  const [filtroTipo, setFiltroTipo] = useState<"todas" | TTipo>("todas");
  const aulas = useMemo(() => {
    const aulasList: Aula[] = [];
    disciplinas.forEach((disciplina) => {
      if (disciplina.horarios && disciplina.horarios.length > 0) {
        disciplina.horarios.forEach((horario) => {
          aulasList.push({
            id: `${disciplina.id}-${horario.id}`,
            nome: disciplina.nome,
            tipo: disciplina.tipo,
            dia: horario.dia,
            inicio: horario.inicio,
            fim: horario.fim,
            local: disciplina.local,
            disciplinaId: disciplina.id,
          });
        });
      }
    });
    return aulasList;
  }, [disciplinas]);
  const timeslots = useMemo(() => {
    const slots = new Set<string>();
    aulas.forEach((aula) => {
      const key = `${aula.inicio}-${aula.fim}`;
      slots.add(key);
    });
    return Array.from(slots)
      .map((key) => {
        const [inicio, fim] = key.split("-");
        const inicioMin = timeToMinutes(inicio);
        const fimMin = timeToMinutes(fim);
        const inicioLabel = minutesToLabel(inicioMin);
        const fimLabel = minutesToLabel(fimMin);
        return {
          label: `${inicioLabel}-${fimLabel}`,
          inicio,
          fim,
          sortKey: inicioMin,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...slot }) => slot);
  }, [aulas]);
  const aulasFiltradas = useMemo(() => {
    return filtroTipo === "todas"
      ? aulas
      : aulas.filter((a) => a.tipo === filtroTipo);
  }, [aulas, filtroTipo]);
  if (loading) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-3 text-zinc-400">Carregando grade...</span>
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div className="ml-3">
            <div className="font-medium text-red-500">
              Erro ao carregar grade
            </div>
            <div className="text-sm text-zinc-400">{error}</div>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Grade Horária</h1>
          <p className="text-zinc-500">
            {disciplinas.length > 0
              ? `${disciplinas.length} disciplina${
                  disciplinas.length > 1 ? "s" : ""
                } cadastrada${disciplinas.length > 1 ? "s" : ""}`
              : "Nenhuma disciplina cadastrada"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="rounded border bg-transparent px-2 py-1 text-sm"
          >
            <option value="todas">Todas</option>
            <option value="obrigatoria">Obrigatórias</option>
            <option value="eletiva">Eletivas</option>
            <option value="optativa">Optativas</option>
          </select>
          <Legend />
        </div>
      </header>
      {aulas.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <p className="text-zinc-400">
            Nenhuma disciplina com horários cadastrada.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Adicione disciplinas com horários na página de{" "}
            <Link href="/disciplinas" className="underline">
              Disciplinas
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <div className="min-w-[880px]">
            {}
            <div className="grid grid-cols-8 bg-zinc-900/50 text-sm font-medium">
              <div className="px-3 py-3"></div>
              {DIAS.slice(1, 7).map(
                (
                  d
                ) => (
                  <div key={d} className="px-3 py-3 text-center">
                    {d}
                  </div>
                )
              )}
            </div>
            {}
            {timeslots.map((slot) => (
              <div key={slot.label} className="grid grid-cols-8 border-t">
                {}
                <div className="bg-zinc-900/30 px-3 py-6 text-sm font-medium">
                  {slot.label}
                </div>
                {}
                {DIAS.slice(1, 7).map((dLabel, idx) => {
                  const dia = idx + 1;
                  const aulas = aulasFiltradas.filter(
                    (a) => a.dia === dia && inSlot(a, slot)
                  );
                  return (
                    <div key={dLabel} className="min-h-[84px] border-l p-2">
                      {aulas.length === 0 ? (
                        <div className="h-full w-full rounded bg-transparent/5"></div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {aulas.map((a) => (
                            <div
                              key={a.id}
                              className={`rounded border p-2 text-xs leading-5 ${typeClass(
                                a.tipo
                              )}`}
                              title={`${a.inicio}–${a.fim}${
                                a.local ? ` • ${a.local}` : ""
                              }`}
                            >
                              <div className="font-semibold">{a.nome}</div>
                              {a.local && (
                                <div className="opacity-80">{a.local}</div>
                              )}
                              <div className="opacity-80">
                                {a.inicio} — {a.fim}
                              </div>
                              {a.disciplinaId && (
                                <Link
                                  href={`/disciplinas/${a.disciplinaId}`}
                                  className="mt-1 inline-block underline"
                                >
                                  abrir disciplina →
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
function Legend() {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="text-xs text-zinc-500">Legenda:</span>
      <span className="rounded border border-yellow-500/40 bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-100">
        Obrigatória
      </span>
      <span className="rounded border border-red-500/40 bg-red-500/25 px-2 py-0.5 text-xs text-red-100">
        Eletiva
      </span>
      <span className="rounded border border-emerald-500/40 bg-emerald-500/25 px-2 py-0.5 text-xs text-emerald-100">
        Optativa
      </span>
    </div>
  );
}