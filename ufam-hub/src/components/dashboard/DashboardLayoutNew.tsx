"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  TrendingUp,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  User,
  ChevronRight,
  Clock,
  Sparkles,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Disciplina } from "@/hooks/useDisciplinasOptimized";
import type { Avaliacao } from "@/hooks/useAvaliacoesOptimized";
import { LOGIN_GREEN, LOGIN_GLOW } from "@/components/auth/login-modern/theme";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

type PrioridadeItem = {
  type: "tarefa" | "avaliacao";
  id: string;
  titulo: string;
  subtitulo: string;
  data: string;
  prioridade: string;
  concluida?: boolean;
  disciplinaId?: string;
};

export interface DashboardLayoutNewProps {
  greeting: string;
  nomeUsuario: string;
  dataHoje: string;
  /** Tarefas com vencimento hoje (não concluídas). */
  tarefasHojeCount: number;
  /** Avaliações com data de amanhã. */
  avaliacoesAmanhaCount: number;
  /** Avaliações próximas (filtro da página, ex.: próximos 7 dias). */
  totalAvaliacoesSemana: number;
  aulasHoje: number;
  horasEstudadas: string;
  proximasAvaliacoes: Avaliacao[];
  disciplinasMap: Map<string, Disciplina>;
  prioridadesHoje: PrioridadeItem[];
  toggleConcluida: (id: string, concluida: boolean) => void;
  loadingTarefas: boolean;
  loadingAv: boolean;
  hojeNaGrade: Array<{
    disciplinaId: string;
    disciplina: string;
    local?: string;
    inicio: string;
    fim: string;
  }>;
  estatisticas: {
    horasPorSemana?: Array<{ semana: string; horas: number }>;
    produtividade?: {
      tarefasConcluidas: number;
      tarefasTotal: number;
      taxaConclusao: number;
    };
  } | null;
  loadingEstatisticas: boolean;
  profileData: { nome?: string; email?: string; avatar_url?: string } | null;
  eventosSemana: Array<{
    id: string;
    tipo: "avaliacao" | "aula";
    titulo: string;
    subtitulo: string;
    dataISO: string;
    cor: string;
  }>;
  disciplinas: Disciplina[];
}

function daysUntil(dtISO: string) {
  const now = new Date();
  const target = new Date(dtISO);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function parseHM(s: string) {
  const [h, m] = s.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function slotProgressPercent(inicio: string, fim: string): number {
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const a = parseHM(inicio);
  const b = parseHM(fim);
  if (b <= a || nowM < a || nowM > b) return 0;
  return Math.round(((nowM - a) / (b - a)) * 100);
}

function isSlotNow(inicio: string, fim: string): boolean {
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  return nowM >= parseHM(inicio) && nowM <= parseHM(fim);
}

function tipoBadge(tipo: "prova" | "trabalho" | "seminario") {
  const map = {
    prova: "bg-red-500/15 text-red-400 border-red-500/30",
    trabalho: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    seminario: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return `rounded px-2 py-0.5 text-xs border capitalize ${map[tipo]}`;
}

function tipoDisciplinaLabel(tipo: "obrigatoria" | "eletiva" | "optativa") {
  const m = {
    obrigatoria: "Obrigatória",
    eletiva: "Eletiva",
    optativa: "Optativa",
  };
  return m[tipo];
}

function tipoDisciplinaStyle(tipo: "obrigatoria" | "eletiva" | "optativa") {
  const map = {
    obrigatoria: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    eletiva: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    optativa: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };
  return map[tipo];
}

export function DashboardLayoutNew({
  greeting,
  nomeUsuario,
  dataHoje,
  tarefasHojeCount,
  avaliacoesAmanhaCount,
  totalAvaliacoesSemana,
  aulasHoje,
  horasEstudadas,
  proximasAvaliacoes,
  disciplinasMap,
  prioridadesHoje,
  toggleConcluida,
  loadingTarefas,
  loadingAv,
  hojeNaGrade,
  estatisticas,
  loadingEstatisticas,
  profileData,
  eventosSemana,
  disciplinas,
}: DashboardLayoutNewProps) {
  const primeiroNome = nomeUsuario.split(/\s+/)[0] ?? nomeUsuario;

  const resumoLinha = useMemo(() => {
    const parts: string[] = [];
    if (tarefasHojeCount > 0) {
      parts.push(
        `${tarefasHojeCount} ${tarefasHojeCount === 1 ? "tarefa" : "tarefas"} hoje`,
      );
    }
    if (avaliacoesAmanhaCount > 0) {
      parts.push(
        `${avaliacoesAmanhaCount} ${avaliacoesAmanhaCount === 1 ? "avaliação" : "avaliações"} amanhã`,
      );
    }
    if (parts.length === 0) {
      return "Organize seu dia e acompanhe sua agenda acadêmica.";
    }
    return `Você tem ${parts.join(" e ")}.`;
  }, [tarefasHojeCount, avaliacoesAmanhaCount]);

  const chartDataRaw = estatisticas?.horasPorSemana || [];
  const chartData = useMemo(() => {
    const slice = chartDataRaw.slice(-7);
    return slice.map((row, i) => ({
      ...row,
      label: row.semana?.includes("W")
        ? `S${row.semana.split("W")[1] ?? i + 1}`
        : `${i + 1}`,
    }));
  }, [chartDataRaw]);

  const prod = estatisticas?.produtividade;

  const disciplinasAtivas = useMemo(
    () => disciplinas.filter((d) => d.ativo !== false),
    [disciplinas],
  );

  const atasSemanaResumo = `${prod?.tarefasConcluidas ?? 0} de ${prod?.tarefasTotal ?? 0}`;

  const glass =
    "rounded-2xl border border-white/[0.08] bg-[rgba(18,18,18,0.55)] shadow-xl backdrop-blur-xl";

  const statCardIcon =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12";

  const courseShell = (i: number) =>
    [
      "border-emerald-500/30 bg-emerald-500/[0.08]",
      "border-sky-500/30 bg-sky-500/[0.08]",
      "border-amber-500/30 bg-amber-500/[0.08]",
      "border-violet-500/30 bg-violet-500/[0.08]",
    ][i % 4]!;

  const dicaIA = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 18 || h < 5)
      return "Você costuma render melhor à noite — que tal revisar às 19h?";
    if (h >= 12)
      return "Boa hora para fechar tarefas leves e revisar anotações da manhã.";
    return "Reserve este período para o conteúdo que pede mais foco.";
  }, []);

  const avaliacaoSubtitle = useMemo(() => {
    if (avaliacoesAmanhaCount === 1) return "1 avaliação amanhã";
    if (avaliacoesAmanhaCount > 1)
      return `${avaliacoesAmanhaCount} avaliações amanhã`;
    if (totalAvaliacoesSemana > 0) return `${totalAvaliacoesSemana} na semana`;
    return "Nenhuma próxima";
  }, [avaliacoesAmanhaCount, totalAvaliacoesSemana]);

  return (
    <div
      className="min-h-[calc(100dvh-4rem)]"
      style={{ backgroundColor: "#0a0a0a", color: "#fafafa" }}
    >
      <div className="mx-auto w-full max-w-[min(100%,1600px)] space-y-8 px-3 pb-16 pt-6 sm:px-5 lg:space-y-10 lg:px-8">
        <section className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between xl:gap-12">
          <header className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
              {greeting}, {primeiroNome}!{" "}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              {resumoLinha}
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-neutral-500">
              {dataHoje}
            </p>
          </header>

          <div className="grid w-full max-w-4xl shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:max-w-[46rem]">
            <div className={cn(glass, "p-4 sm:p-5")}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(statCardIcon, "bg-emerald-500/15")}
                  style={{ color: LOGIN_GREEN }}
                >
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {disciplinasAtivas.length}
                  </p>
                  <p className="text-[11px] leading-snug text-neutral-500 sm:text-xs">
                    Disciplinas ativas
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-600">
                    Resumo das disciplinas
                  </p>
                </div>
              </div>
            </div>
            <div className={cn(glass, "p-4 sm:p-5")}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(statCardIcon, "bg-amber-500/15 text-amber-400")}
                >
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {totalAvaliacoesSemana}
                  </p>
                  <p className="text-[11px] leading-snug text-neutral-500 sm:text-xs">
                    {avaliacaoSubtitle}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-600">
                    Próximas avaliações
                  </p>
                </div>
              </div>
            </div>
            <div className={cn(glass, "p-4 sm:p-5")}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(statCardIcon, "bg-blue-500/15 text-blue-400")}
                >
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {aulasHoje}
                  </p>
                  <p className="text-[11px] leading-snug text-neutral-500 sm:text-xs">
                    {aulasHoje === 1 ? "Aula hoje" : "Aulas hoje"}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-600">
                    Hoje na grade
                  </p>
                </div>
              </div>
            </div>
            <div className={cn(glass, "p-4 sm:p-5")}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(statCardIcon, "bg-emerald-500/15")}
                  style={{ color: LOGIN_GREEN }}
                >
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {horasEstudadas}
                  </p>
                  <p className="text-[11px] leading-snug text-neutral-500 sm:text-xs">
                    Horas esta semana
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-600">
                    Progresso de horas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disciplinas + Agenda */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-8 md:pb-20">
            <div className={glass}>
              <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5 pb-4 md:pb-10">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Minhas disciplinas
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Acesso rápido às suas disciplinas
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-emerald-400 hover:bg-white/5 hover:text-emerald-300"
                  asChild
                >
                  <Link href="/disciplinas" className="gap-1">
                    Ver todas
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="p-5 pt-4">
                {disciplinasAtivas.length === 0 ? (
                  <p className="py-10 text-center text-sm text-neutral-500">
                    Adicione disciplinas para vê-las aqui.
                  </p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
                    {disciplinasAtivas.map((d, i) => (
                      <Link
                        key={d.id}
                        href={`/disciplinas/${d.id}`}
                        className={cn(
                          "min-w-[220px] max-w-[260px] shrink-0 rounded-2xl border p-4 transition-transform hover:-translate-y-0.5",
                          courseShell(i),
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              tipoDisciplinaStyle(d.tipo),
                            )}
                          >
                            {tipoDisciplinaLabel(d.tipo)}
                          </span>
                          <BookOpen className="h-5 w-5 shrink-0 opacity-80" />
                        </div>
                        <p className="mt-3 line-clamp-2 text-base font-semibold leading-snug">
                          {d.nome}
                        </p>
                        <p className="mt-2 text-xs text-neutral-500">
                          {d.horasSemana ?? 0} h/semana
                          {d.favorito ? " · ★" : ""}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className={cn(glass, "flex h-full flex-col")}>
              <div className="border-b border-white/[0.06] p-5 pb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  Agenda de hoje
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                  <Clock className="h-3.5 w-3.5" />
                  {dataHoje}
                </p>
              </div>
              <div className="flex-1 p-5">
                {hojeNaGrade.length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-500">
                    Sem aulas na grade para hoje.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {hojeNaGrade.map((aula) => {
                      const agora = isSlotNow(aula.inicio, aula.fim);
                      const pct = agora
                        ? slotProgressPercent(aula.inicio, aula.fim)
                        : 0;
                      return (
                        <div
                          key={aula.disciplinaId + aula.inicio}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium tabular-nums text-neutral-400">
                              {aula.inicio} – {aula.fim}
                            </p>
                            {agora ? (
                              <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                                Agora
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 font-semibold leading-snug">
                            {aula.disciplina}
                          </p>
                          {aula.local ? (
                            <p className="mt-1 text-xs text-neutral-500">
                              {aula.local}
                            </p>
                          ) : null}
                          {agora ? (
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-[10px] text-neutral-500">
                                <span>Progresso da aula</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    background: LOGIN_GREEN,
                                    boxShadow: `0 0 12px ${LOGIN_GLOW}`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Resumo semana | Tarefas | IA */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className={glass}>
              <div className="border-b border-white/[0.06] p-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  Resumo da semana
                </h2>
                <p className="text-sm text-neutral-500">
                  Produtividade e metas rápidas
                </p>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-center">
                    <p className="text-xs text-neutral-500">
                      Tarefas concluídas
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {atasSemanaResumo}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-center">
                    <p className="text-xs text-neutral-500">Horas estudadas</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {horasEstudadas}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-center">
                    <p className="text-xs text-neutral-500">
                      Avaliações na semana
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {totalAvaliacoesSemana}
                    </p>
                  </div>
                </div>

                {loadingEstatisticas ? (
                  <div className="flex h-52 items-center justify-center text-neutral-500">
                    Carregando…
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex h-52 items-center justify-center text-sm text-neutral-500">
                    Registre horas de estudo para ver o gráfico.
                  </div>
                ) : (
                  <div className="h-52">
                    <p className="mb-2 text-xs font-medium text-neutral-500">
                      Produtividade (horas por período)
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="rgba(163,163,163,0.8)"
                          fontSize={11}
                        />
                        <YAxis stroke="rgba(163,163,163,0.8)" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#141414",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          labelStyle={{ color: "#fafafa" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="horas"
                          stroke={LOGIN_GREEN}
                          strokeWidth={2}
                          dot={{ fill: LOGIN_GREEN, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className={glass}>
              <div className="flex flex-row items-center justify-between gap-2 border-b border-white/[0.06] p-5">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Tarefas do dia
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Prioridades e checklist
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-1 border border-white/10 bg-white/[0.06] text-neutral-200 hover:bg-white/10"
                  asChild
                >
                  <Link href="/disciplinas">
                    <Plus className="h-4 w-4" />
                    Nova tarefa
                  </Link>
                </Button>
              </div>
              <div className="p-5 pt-4">
                {loadingTarefas || loadingAv ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl bg-white/[0.06]"
                      />
                    ))}
                  </div>
                ) : prioridadesHoje.length === 0 && hojeNaGrade.length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-500">
                    Nada pendente para hoje.
                  </p>
                ) : (
                  <ul className="max-h-[min(420px,55vh)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {hojeNaGrade.slice(0, 3).map((aula) => (
                      <li key={aula.disciplinaId + aula.inicio}>
                        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-neutral-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {aula.disciplina}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {aula.inicio} – {aula.fim}
                              {aula.local ? ` · ${aula.local}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            Hoje
                          </span>
                        </div>
                      </li>
                    ))}
                    {prioridadesHoje
                      .slice(0, Math.max(0, 8 - hojeNaGrade.length))
                      .map((item) => {
                        const isTarefa = item.type === "tarefa";
                        return (
                          <li key={`${item.type}-${item.id}`}>
                            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                              {isTarefa ? (
                                <Checkbox
                                  checked={item.concluida}
                                  onCheckedChange={() =>
                                    toggleConcluida(item.id, !item.concluida)
                                  }
                                  className="shrink-0 border-white/30 data-[state=checked]:border-[#05865E] data-[state=checked]:bg-[#05865E]"
                                />
                              ) : (
                                <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                              )}
                              <Link
                                href={
                                  isTarefa
                                    ? `/disciplinas/${item.disciplinaId}`
                                    : "/avaliacoes"
                                }
                                className="min-w-0 flex-1"
                              >
                                <p className="truncate font-medium">
                                  {item.titulo}
                                </p>
                                <p className="truncate text-xs text-neutral-500">
                                  {item.subtitulo}
                                </p>
                              </Link>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                  item.concluida
                                    ? "border-neutral-600 bg-neutral-800 text-neutral-400"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                                )}
                              >
                                {item.concluida ? "Concluída" : "Hoje"}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div
              className={cn(glass, "overflow-hidden")}
              style={{
                boxShadow: `0 0 40px -20px ${LOGIN_GLOW}`,
              }}
            >
              <div className="relative border-b border-white/[0.06] bg-gradient-to-br from-emerald-950/40 to-transparent p-5">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Sugestões da IA
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-snug">
                      {dicaIA}
                    </p>
                    <Button
                      className="mt-4 w-full gap-2 font-semibold text-white"
                      style={{
                        background: LOGIN_GREEN,
                        boxShadow: `0 0 20px ${LOGIN_GLOW}`,
                      }}
                      asChild
                    >
                      <Link href="/chat">
                        Criar plano de estudo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  Em breve
                </p>
                {proximasAvaliacoes.slice(0, 2).map((a) => {
                  const dname =
                    disciplinasMap.get(a.disciplinaId)?.nome ?? "Disciplina";
                  const dias = daysUntil(a.dataISO);
                  return (
                    <Link
                      key={a.id}
                      href="/avaliacoes"
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <GraduationCap
                        className="h-5 w-5 shrink-0"
                        style={{ color: LOGIN_GREEN }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{dname}</p>
                        <p className="text-xs text-neutral-500">
                          {dias === 0
                            ? "Hoje"
                            : dias === 1
                              ? "Amanhã"
                              : `Em ${dias} dias`}
                        </p>
                      </div>
                      <span
                        className={cn("shrink-0 text-xs", tipoBadge(a.tipo))}
                      >
                        {a.tipo}
                      </span>
                    </Link>
                  );
                })}
                {eventosSemana.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-neutral-400"
                  >
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-200">
                        {ev.titulo}
                      </p>
                      <p className="text-neutral-500">{ev.subtitulo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(glass, "p-4")}>
              <Link
                href="/perfil"
                className="flex items-center gap-3 rounded-xl transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-emerald-500/30">
                  {profileData?.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {profileData?.nome || nomeUsuario}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {profileData?.email || "Perfil"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
