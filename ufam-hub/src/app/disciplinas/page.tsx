"use client";

import { useMemo, useState } from "react";

/** Tipos */
type TTipo = "obrigatoria" | "eletiva" | "optativa";
type Disciplina = {
  id: string;
  nome: string;
  tipo: TTipo;
  horasSemana: number; // carga horária semanal
  local?: string;
  horarios?: { dia: number; inicio: string; fim: string }[]; // 0=Dom ... 6=Sáb
};

/** Dados do teu anexo ------------------------------------------
 * Cores: amarelo = obrigatória, vermelho = eletiva, verde = optativa
 * Cada bloco do quadro = 2h
 *
 * 16-18h: Seg  Fundamentos de IA (Sala 05)  [verde]
 *         Ter  PW (Lab Virtu)               [vermelho]
 *         Qua  Fundamentos de IA (Sala 05)  [verde]
 *         Qui  PW (Lab Virtu)               [vermelho]
 *         Sex  Metodologia (Lab Virtu)      [amarelo]
 *
 * 18-20h: Seg  PAA (Sala 01)                [amarelo]
 *         Ter  Álgebra II                   [amarelo]
 *         Qua  PAA (Sala 01)                [amarelo]
 *         Qui  Álgebra II                   [amarelo]
 *         Sex  INTRODUÇÃO À ECONOMIA POLÍTICA E DA AMAZÔNIA [verde]
 -----------------------------------------------------------------*/
const DISCIPLINAS: Disciplina[] = [
  {
    id: "d1",
    nome: "Fundamentos de IA",
    tipo: "optativa",
    horasSemana: 4,
    local: "Sala 05",
    horarios: [
      { dia: 1, inicio: "16:00", fim: "18:00" }, // Seg
      { dia: 3, inicio: "16:00", fim: "18:00" }, // Qua
    ],
  },
  {
    id: "d2",
    nome: "PW (Programação Web)",
    tipo: "eletiva",
    horasSemana: 4,
    local: "Lab Virtu",
    horarios: [
      { dia: 2, inicio: "16:00", fim: "18:00" }, // Ter
      { dia: 4, inicio: "16:00", fim: "18:00" }, // Qui
    ],
  },
  {
    id: "d3",
    nome: "Metodologia",
    tipo: "obrigatoria",
    horasSemana: 2,
    local: "Lab Virtu",
    horarios: [{ dia: 5, inicio: "16:00", fim: "18:00" }], // Sex
  },
  {
    id: "d4",
    nome: "PAA (Projeto e Análise de Algoritmos)",
    tipo: "obrigatoria",
    horasSemana: 4,
    local: "Sala 01",
    horarios: [
      { dia: 1, inicio: "18:00", fim: "20:00" }, // Seg
      { dia: 3, inicio: "18:00", fim: "20:00" }, // Qua
    ],
  },
  {
    id: "d5",
    nome: "Álgebra II",
    tipo: "obrigatoria",
    horasSemana: 4,
    horarios: [
      { dia: 2, inicio: "18:00", fim: "20:00" }, // Ter
      { dia: 4, inicio: "18:00", fim: "20:00" }, // Qui
    ],
  },
  {
    id: "d6",
    nome: "Introdução à Economia Política e da Amazônia",
    tipo: "optativa",
    horasSemana: 2,
    horarios: [{ dia: 5, inicio: "18:00", fim: "20:00" }], // Sex
  },
];

/** Utils */
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function badgeTipo(tipo: TTipo) {
  const map: Record<TTipo, string> = {
    obrigatoria: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    eletiva: "bg-red-500/15 text-red-400 border-red-500/30",
    optativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return cn("rounded px-2 py-0.5 text-xs border capitalize", map[tipo]);
}

/** Componentes */
function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white/5 p-4 shadow-sm dark:bg-zinc-900/40">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </h2>
        {right}
      </header>
      {children}
    </section>
  );
}

export default function DisciplinasPage() {
  const [tipo, setTipo] = useState<"todas" | TTipo>("todas");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let arr = [...DISCIPLINAS];
    if (tipo !== "todas") arr = arr.filter((d) => d.tipo === tipo);
    if (q) {
      const n = q.toLowerCase();
      arr = arr.filter((d) => d.nome.toLowerCase().includes(n));
    }
    return arr.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [tipo, q]);

  const horasTotais = useMemo(
    () => list.reduce((acc, d) => acc + d.horasSemana, 0),
    [list]
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Disciplinas</h1>
          <p className="text-zinc-500">
            8º período — Engenharia de Software • {horasTotais}h/sem (filtradas)
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="rounded border bg-transparent px-2 py-1 text-sm"
          >
            <option value="todas">Todas</option>
            <option value="obrigatoria">Obrigatórias</option>
            <option value="eletiva">Eletivas</option>
            <option value="optativa">Optativas</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome…"
            className="rounded border bg-transparent px-2 py-1 text-sm"
          />
        </div>
      </header>

      <Card title="Lista de disciplinas">
        {list.length === 0 ? (
          <p className="text-sm text-zinc-500">Nada encontrado.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((d) => (
              <li key={d.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-medium">{d.nome}</h3>
                  <span className={badgeTipo(d.tipo)}>{d.tipo}</span>
                </div>

                <div className="text-sm text-zinc-500">
                  Carga horária:{" "}
                  <span className="font-medium">{d.horasSemana}h/sem</span>
                  {d.local ? <> • Local: {d.local}</> : null}
                </div>

                {d.horarios?.length ? (
                  <div className="mt-2 text-sm">
                    <div className="mb-1 text-xs text-zinc-500">Horários</div>
                    <ul className="space-y-1">
                      {d.horarios.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded border p-2"
                        >
                          <span>{DIAS[h.dia]}</span>
                          <span className="tabular-nums">
                            {h.inicio} — {h.fim}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <a
                    href={`/disciplinas/${d.id}`}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-white/5"
                  >
                    Abrir
                  </a>
                  <button
                    className="rounded-md border px-3 py-1 text-sm hover:bg-white/5"
                    // TODO: quando ligar Supabase, pode marcar concluída, arquivar etc.
                    onClick={() => alert("Em breve: ações da disciplina")}
                  >
                    Ações
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
