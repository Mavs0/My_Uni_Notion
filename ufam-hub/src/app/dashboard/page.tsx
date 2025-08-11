"use client";

import { useMemo, useState } from "react";

/**
 * MOCKS — depois você troca por dados do Supabase:
 * - disciplinas: para contadores
 * - horarios: para "Hoje na grade"
 * - avaliacoes: para "Próximas avaliações"
 * - horas: para progresso (complementar/optativa/eletiva)
 */
type Disciplina = { id: string; nome: string; professor?: string };
type Horario = {
  id: string;
  disciplinaId: string;
  diaSemana: number;
  inicio: string;
  fim: string;
}; // "HH:MM"
type Avaliacao = {
  id: string;
  disciplinaId: string;
  tipo: "prova" | "trabalho" | "seminario";
  dataISO: string;
  descricao?: string;
};
type HoraAcademica = {
  tipo: "complementar" | "optativa" | "eletiva";
  horasCumpridas: number;
  horasNecessarias: number;
};

const DISCIPLINAS: Disciplina[] = [
  { id: "d1", nome: "Cálculo I", professor: "Prof. A" },
  { id: "d2", nome: "Programação I", professor: "Profa. B" },
  { id: "d3", nome: "Álgebra Linear" },
];

const HORARIOS: Horario[] = [
  { id: "h1", disciplinaId: "d1", diaSemana: 1, inicio: "08:00", fim: "10:00" }, // 1 = segunda
  { id: "h2", disciplinaId: "d2", diaSemana: 1, inicio: "10:00", fim: "12:00" },
  { id: "h3", disciplinaId: "d3", diaSemana: 3, inicio: "14:00", fim: "16:00" },
];

const AVALIACOES: Avaliacao[] = [
  {
    id: "a1",
    disciplinaId: "d2",
    tipo: "prova",
    dataISO: addDaysISO(2),
    descricao: "Cap. 1–3",
  },
  {
    id: "a2",
    disciplinaId: "d1",
    tipo: "trabalho",
    dataISO: addDaysISO(5),
    descricao: "Listas 1 e 2",
  },
  { id: "a3", disciplinaId: "d3", tipo: "seminario", dataISO: addDaysISO(9) },
];

const HORAS: HoraAcademica[] = [
  { tipo: "complementar", horasCumpridas: 45, horasNecessarias: 120 },
  { tipo: "optativa", horasCumpridas: 32, horasNecessarias: 60 },
  { tipo: "eletiva", horasCumpridas: 20, horasNecessarias: 60 },
];

/** Utils */
function addDaysISO(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}
function fmtDate(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function daysUntil(dtISO: string) {
  const now = new Date();
  const target = new Date(dtISO);
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}
function weekdayIndex(date = new Date()) {
  // Domingo=0 ... Sábado=6 (alinha com nosso dado)
  return date.getDay();
}

/** Componentes simples */
function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white/5 p-4 shadow-sm dark:bg-zinc-900/40">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </h2>
        {right}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
      {helper && <div className="mt-1 text-xs text-zinc-400">{helper}</div>}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
      <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");

  const hoje = weekdayIndex();
  const disciplinasMap = useMemo(
    () => new Map(DISCIPLINAS.map((d) => [d.id, d])),
    []
  );

  const hojeNaGrade = useMemo(() => {
    return HORARIOS.filter((h) => h.diaSemana === hoje)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .map((h) => ({
        ...h,
        disciplina: disciplinasMap.get(h.disciplinaId)?.nome ?? "Disciplina",
      }));
  }, [hoje, disciplinasMap]);

  const proximasAvaliacoes = useMemo(() => {
    const base = AVALIACOES.filter(
      (a) => new Date(a.dataISO) > new Date()
    ).sort(
      (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
    );
    if (!search) return base;
    return base.filter((a) => {
      const disc =
        disciplinasMap.get(a.disciplinaId)?.nome?.toLowerCase() || "";
      return disc.includes(search.toLowerCase());
    });
  }, [search, disciplinasMap]);

  const totalDisciplinas = DISCIPLINAS.length;
  const totalAvaliacoesSemana = proximasAvaliacoes.filter(
    (a) => daysUntil(a.dataISO) <= 7
  ).length;

  const progressoHoras = HORAS.map((h) => ({
    ...h,
    pct: (h.horasCumpridas / Math.max(1, h.horasNecessarias)) * 100,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-zinc-500">Visão geral do semestre</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/disciplinas"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            Disciplinas
          </a>
          <a
            href="/avaliacoes"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            Avaliações
          </a>
          <a
            href="/chat"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            Chat IA
          </a>
        </div>
      </header>

      {/* Linha 1: KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Disciplinas ativas" value={totalDisciplinas} />
        <Stat
          label="Avaliações nos próximos 7 dias"
          value={totalAvaliacoesSemana}
        />
        <Stat
          label="Hoje na grade"
          value={hojeNaGrade.length}
          helper={new Date().toLocaleDateString("pt-BR", { weekday: "long" })}
        />
      </div>

      {/* Linha 2: Hoje na grade + Próximas avaliações */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Hoje na grade">
          {hojeNaGrade.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem aulas hoje.</p>
          ) : (
            <ul className="space-y-2">
              {hojeNaGrade.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div>
                    <div className="font-medium">{h.disciplina}</div>
                    <div className="text-xs text-zinc-500">Sala • Bloco X</div>
                  </div>
                  <div className="text-sm tabular-nums">
                    {h.inicio} — {h.fim}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Próximas avaliações"
          right={
            <input
              placeholder="Filtrar por disciplina..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border bg-transparent px-2 py-1 text-sm"
            />
          }
        >
          {proximasAvaliacoes.length === 0 ? (
            <p className="text-sm text-zinc-500">Nada por enquanto.</p>
          ) : (
            <ul className="space-y-2">
              {proximasAvaliacoes.slice(0, 6).map((a) => {
                const dname =
                  disciplinasMap.get(a.disciplinaId)?.nome ?? "Disciplina";
                const dias = daysUntil(a.dataISO);
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div>
                      <div className="text-sm">
                        <span className="capitalize font-medium">{a.tipo}</span>{" "}
                        — {dname}
                      </div>
                      {a.descricao && (
                        <div className="text-xs text-zinc-500">
                          {a.descricao}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm tabular-nums">
                        {fmtDate(a.dataISO)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {dias > 0 ? `Faltam ${dias} dias` : "Hoje"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 text-right">
            <a href="/avaliacoes" className="text-sm underline">
              Ver todas →
            </a>
          </div>
        </Card>

        {/* Progresso horas */}
        <Card title="Progresso de horas">
          <div className="space-y-3">
            {progressoHoras.map((h) => (
              <div key={h.tipo}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize">{h.tipo}</span>
                  <span className="tabular-nums">
                    {h.horasCumpridas}/{h.horasNecessarias}h (
                    {Math.round(h.pct)}%)
                  </span>
                </div>
                <Progress value={h.pct} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Linha 3: Atalhos rápidos */}
      <Card title="Atalhos rápidos">
        <div className="flex flex-wrap gap-2">
          <a
            href="/disciplinas/nova"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            + Nova disciplina
          </a>
          <a
            href="/avaliacoes/nova"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            + Nova avaliação
          </a>
          <a
            href="/notas/nova"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            + Nova nota
          </a>
          <a
            href="/grade"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            Abrir grade
          </a>
          <a
            href="/chat"
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            Abrir Chat IA
          </a>
        </div>
      </Card>
    </main>
  );
}
