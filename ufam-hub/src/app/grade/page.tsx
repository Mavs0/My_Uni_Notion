"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/**
 * Modelo de dado para a Grade
 * dia: 0=Dom ... 6=Sáb
 */
type TTipo = "obrigatoria" | "eletiva" | "optativa";
type Aula = {
  id: string;
  nome: string;
  tipo: TTipo;
  dia: number; // 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
  local?: string;
  disciplinaId?: string; // para linkar com /disciplinas/[id] depois
};

/** Dados do anexo (8º período — Engenharia de Software)
 * 16–18h: Seg  Fundamentos de IA (Sala 05)   [optativa - verde]
 *         Ter  PW (Lab Virtu)                [eletiva  - vermelho]
 *         Qua  Fundamentos de IA (Sala 05)   [optativa - verde]
 *         Qui  PW (Lab Virtu)                [eletiva  - vermelho]
 *         Sex  Metodologia (Lab Virtu)       [obrigatória - amarelo]
 *
 * 18–20h: Seg  PAA (Sala 01)                 [obrigatória - amarelo]
 *         Ter  Álgebra II                    [obrigatória - amarelo]
 *         Qua  PAA (Sala 01)                 [obrigatória - amarelo]
 *         Qui  Álgebra II                    [obrigatória - amarelo]
 *         Sex  Introdução à Economia Política e da Amazônia [optativa - verde]
 */
const AULAS: Aula[] = [
  {
    id: "a1",
    nome: "Fundamentos de IA",
    tipo: "optativa",
    dia: 1,
    inicio: "16:00",
    fim: "18:00",
    local: "Sala 05",
    disciplinaId: "d1",
  },
  {
    id: "a2",
    nome: "PW (Lab Virtu)",
    tipo: "eletiva",
    dia: 2,
    inicio: "16:00",
    fim: "18:00",
    local: "Lab Virtu",
    disciplinaId: "d2",
  },
  {
    id: "a3",
    nome: "Fundamentos de IA",
    tipo: "optativa",
    dia: 3,
    inicio: "16:00",
    fim: "18:00",
    local: "Sala 05",
    disciplinaId: "d1",
  },
  {
    id: "a4",
    nome: "PW (Lab Virtu)",
    tipo: "eletiva",
    dia: 4,
    inicio: "16:00",
    fim: "18:00",
    local: "Lab Virtu",
    disciplinaId: "d2",
  },
  {
    id: "a5",
    nome: "Metodologia",
    tipo: "obrigatoria",
    dia: 5,
    inicio: "16:00",
    fim: "18:00",
    local: "Lab Virtu",
    disciplinaId: "d3",
  },

  {
    id: "a6",
    nome: "PAA",
    tipo: "obrigatoria",
    dia: 1,
    inicio: "18:00",
    fim: "20:00",
    local: "Sala 01",
    disciplinaId: "d4",
  },
  {
    id: "a7",
    nome: "Álgebra II",
    tipo: "obrigatoria",
    dia: 2,
    inicio: "18:00",
    fim: "20:00",
    disciplinaId: "d5",
  },
  {
    id: "a8",
    nome: "PAA",
    tipo: "obrigatoria",
    dia: 3,
    inicio: "18:00",
    fim: "20:00",
    local: "Sala 01",
    disciplinaId: "d4",
  },
  {
    id: "a9",
    nome: "Álgebra II",
    tipo: "obrigatoria",
    dia: 4,
    inicio: "18:00",
    fim: "20:00",
    disciplinaId: "d5",
  },
  {
    id: "a10",
    nome: "Introdução à Economia Política e da Amazônia",
    tipo: "optativa",
    dia: 5,
    inicio: "18:00",
    fim: "20:00",
    disciplinaId: "d6",
  },
];

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const TIMESLOTS = [
  { label: "14h-16h", inicio: "14:00", fim: "16:00" },
  { label: "16h-18h", inicio: "16:00", fim: "18:00" },
  { label: "18h-20h", inicio: "18:00", fim: "20:00" },
  { label: "20h-22h", inicio: "20:00", fim: "22:00" },
];

/** Estilo do bloco conforme o tipo */
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

/** Util */
function inSlot(a: Aula, slot: { inicio: string; fim: string }) {
  return a.inicio === slot.inicio && a.fim === slot.fim;
}

export default function GradePage() {
  const [filtroTipo, setFiltroTipo] = useState<"todas" | TTipo>("todas");

  const aulasFiltradas = useMemo(() => {
    return filtroTipo === "todas"
      ? AULAS
      : AULAS.filter((a) => a.tipo === filtroTipo);
  }, [filtroTipo]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Grade Horária</h1>
          <p className="text-zinc-500">8º período — Engenharia de Software</p>
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

      {/* Tabela responsiva */}
      <div className="overflow-x-auto rounded-xl border">
        <div className="min-w-[880px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-8 bg-zinc-900/50 text-sm font-medium">
            <div className="px-3 py-3"></div>
            {DIAS.slice(1, 7).map(
              (
                d // Seg..Sáb
              ) => (
                <div key={d} className="px-3 py-3 text-center">
                  {d}
                </div>
              )
            )}
          </div>

          {/* Linhas por timeslot */}
          {TIMESLOTS.map((slot) => (
            <div key={slot.label} className="grid grid-cols-8 border-t">
              {/* Coluna do horário */}
              <div className="bg-zinc-900/30 px-3 py-6 text-sm font-medium">
                {slot.label}
              </div>

              {/* Colunas dos dias */}
              {DIAS.slice(1, 7).map((dLabel, idx) => {
                const dia = idx + 1; // 1..6
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
