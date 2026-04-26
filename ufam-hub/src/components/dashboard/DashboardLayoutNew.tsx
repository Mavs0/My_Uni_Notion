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
  FileText,
  User,
  ChevronRight,
  Clock,
  Trophy,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Disciplina } from "@/hooks/useDisciplinasOptimized";
import type { Avaliacao } from "@/hooks/useAvaliacoesOptimized";
import { useI18n } from "@/lib/i18n/context";

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

interface DashboardLayoutNewProps {
  greeting: string;
  nomeUsuario: string;
  dataHoje: string;
  totalDisciplinas: number;
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
  } | null;
  loadingEstatisticas: boolean;
  profileData: { nome?: string; email?: string; avatar_url?: string } | null;
  avaliacoes: Avaliacao[];
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
  return Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function tipoBadge(tipo: "prova" | "trabalho" | "seminario") {
  const map = {
    prova: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    trabalho: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    seminario:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  };
  return `rounded px-2 py-0.5 text-xs border capitalize ${map[tipo]}`;
}

function tipoDisciplinaLabel(
  tipo: "obrigatoria" | "eletiva" | "optativa",
  locale: string,
) {
  if (locale === "pt-BR") {
    const m = {
      obrigatoria: "Obrigatória",
      eletiva: "Eletiva",
      optativa: "Optativa",
    };
    return m[tipo];
  }
  return tipo;
}

export function DashboardLayoutNew({
  greeting,
  nomeUsuario,
  dataHoje,
  totalDisciplinas,
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
  avaliacoes,
  eventosSemana,
  disciplinas,
}: DashboardLayoutNewProps) {
  const { t, locale } = useI18n();
  const chartData = estatisticas?.horasPorSemana || [];

  const disciplinasAtivas = useMemo(
    () => disciplinas.filter((d) => d.ativo !== false),
    [disciplinas],
  );

  const tipoDistrib = useMemo(() => {
    const o = { obrigatoria: 0, eletiva: 0, optativa: 0 };
    disciplinasAtivas.forEach((d) => {
      if (d.tipo in o) o[d.tipo as keyof typeof o]++;
    });
    const total = o.obrigatoria + o.eletiva + o.optativa;
    return { o, total };
  }, [disciplinasAtivas]);

  const destacadas = useMemo(
    () =>
      [...disciplinasAtivas]
        .sort((a, b) => (b.horasSemana ?? 0) - (a.horasSemana ?? 0))
        .slice(0, 5),
    [disciplinasAtivas],
  );

  const courseShell = (i: number) =>
    [
      "border-emerald-500/25 bg-emerald-500/[0.07] dark:bg-emerald-950/35",
      "border-sky-500/25 bg-sky-500/[0.07] dark:bg-sky-950/35",
      "border-amber-500/25 bg-amber-500/[0.07] dark:bg-amber-950/35",
      "border-teal-500/25 bg-teal-500/[0.07] dark:bg-teal-950/35",
    ][i % 4]!;

  const dashCard =
    "rounded-2xl border border-border/70 bg-card shadow-sm transition-[box-shadow,border-color] hover:shadow-md dark:border-border/50 dark:bg-card/90";

  const atividadesLista = (
    <Card className={dashCard}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">
          {locale === "pt-BR" ? "Tarefas do dia" : "Today's tasks"}
        </CardTitle>
        <CardDescription>
          {locale === "pt-BR"
            ? "Aulas na grade e prioridades"
            : "Schedule and priorities"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingTarefas || loadingAv ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-muted/50"
              />
            ))}
          </div>
        ) : prioridadesHoje.length === 0 && hojeNaGrade.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t.dashboard.semAulasHoje}
          </p>
        ) : (
          <ul className="max-h-[min(420px,55vh)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {hojeNaGrade.slice(0, 6).map((aula) => (
              <li key={aula.disciplinaId + aula.inicio}>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{aula.disciplina}</p>
                    <p className="text-xs text-muted-foreground">
                      {aula.inicio} – {aula.fim}
                      {aula.local ? ` · ${aula.local}` : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/calendar">
                      <Bell className="mr-1 h-4 w-4" />
                      {locale === "pt-BR" ? "Lembrete" : "Reminder"}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
            {prioridadesHoje
              .slice(0, Math.max(0, 6 - hojeNaGrade.length))
              .map((item) => {
                const isTarefa = item.type === "tarefa";
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                      {isTarefa ? (
                        <Checkbox
                          checked={item.concluida}
                          onCheckedChange={() =>
                            toggleConcluida(item.id, !item.concluida)
                          }
                          className="shrink-0"
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
                        <p className="truncate font-medium">{item.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.subtitulo}
                        </p>
                      </Link>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/calendar">
                          {locale === "pt-BR" ? "Lembrete" : "Reminder"}
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const sidebarCol = (
    <div className="space-y-8 lg:col-span-4">
      <Card className={dashCard}>
        <CardContent className="p-0">
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
              {profileData?.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {profileData?.nome || nomeUsuario}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profileData?.email || ""}
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className={dashCard}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            {new Date().toLocaleDateString(
              locale === "pt-BR" ? "pt-BR" : "en-US",
              { month: "long", year: "numeric" },
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {DIAS.map((d) => (
              <div key={d} className="font-medium">
                {d.slice(0, 3)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const now = new Date();
              const firstDay = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
              ).getDay();
              const daysInMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
              ).getDate();
              return Array.from({ length: 42 }, (_, i) => {
                const day = i - firstDay + 1;
                const isCurrentMonth = day > 0 && day <= daysInMonth;
                const isToday = isCurrentMonth && day === now.getDate();
                const hasEvent =
                  isCurrentMonth &&
                  avaliacoes.some((a) => {
                    const d = new Date(a.dataISO);
                    return (
                      d.getDate() === day && d.getMonth() === now.getMonth()
                    );
                  });
                return (
                  <div
                    key={i}
                    className={`flex aspect-square items-center justify-center rounded text-xs ${
                      !isCurrentMonth
                        ? "text-muted-foreground/40"
                        : isToday
                          ? "bg-emerald-600 font-semibold text-white shadow-sm dark:bg-emerald-500"
                          : hasEvent
                            ? "border border-emerald-500/25 bg-emerald-500/10"
                            : "text-foreground"
                    }`}
                  >
                    {isCurrentMonth ? day : ""}
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>

      <Card className={dashCard}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            {locale === "pt-BR" ? "Próximos eventos" : "Upcoming events"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventosSemana.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              {t.dashboard.nadaPorEnquanto}
            </p>
          ) : (
            <ul className="space-y-3">
              {eventosSemana.slice(0, 4).map((ev) => {
                const d = new Date(ev.dataISO);
                const timeStr = d.toLocaleTimeString(
                  locale === "pt-BR" ? "pt-BR" : "en-US",
                  { hour: "2-digit", minute: "2-digit" },
                );
                return (
                  <li
                    key={ev.id}
                    className="border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <p className="text-xs text-muted-foreground">{timeStr}</p>
                    <p className="truncate text-sm font-medium">{ev.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ev.subtitulo}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={dashCard}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            {locale === "pt-BR" ? "Minhas notas" : "My notes"}
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/disciplinas" className="gap-1">
              <Plus className="h-4 w-4" />
              {locale === "pt-BR" ? "Adicionar" : "Add"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === "pt-BR"
              ? "Suas anotações por disciplina."
              : "Your notes by subject."}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
            asChild
          >
            <Link href="/disciplinas" className="gap-2">
              <FileText className="h-4 w-4" />
              {t.dashboard.verTodas}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background">
      <div className="mx-auto w-full max-w-[min(100%,1600px)] space-y-10 px-2 pb-14 pt-4 sm:px-4 lg:px-6">
        {/* Hero + métricas */}
        <section className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between xl:gap-12">
          <header className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
              {greeting}, {nomeUsuario}!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {locale === "pt-BR"
                ? "Mantenha o foco — aqui está o essencial do seu percurso acadêmico."
                : "Stay focused — your academic essentials at a glance."}
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {dataHoje}
            </p>
          </header>

          <div className="grid w-full max-w-4xl shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:max-w-[44rem]">
            <Card className={dashCard}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {totalDisciplinas}
                  </p>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    {t.dashboard.resumoDisciplinas}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={dashCard}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 sm:h-12 sm:w-12">
                  <GraduationCap className="h-5 w-5 text-amber-500 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {totalAvaliacoesSemana}
                  </p>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    {t.dashboard.proximasAvaliacoes}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={dashCard}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 sm:h-12 sm:w-12">
                  <Calendar className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {aulasHoje}
                  </p>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    {t.dashboard.hojeNaGrade}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={dashCard}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 sm:h-12 sm:w-12">
                  <TrendingUp className="h-5 w-5 text-emerald-500 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {horasEstudadas}
                  </p>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    {t.dashboard.progressoHoras}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Faixa 1 — Disciplinas (carrossel) + Agenda do dia (timeline) */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-8">
            <Card className={dashCard}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    {locale === "pt-BR"
                      ? "Minhas disciplinas"
                      : "My courses"}
                  </CardTitle>
                  <CardDescription>
                    {locale === "pt-BR"
                      ? "Acesso rápido às suas disciplinas"
                      : "Quick access to your subjects"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0" asChild>
                  <Link href="/disciplinas" className="gap-1">
                    {locale === "pt-BR" ? "Ver todas" : "View all"}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {disciplinasAtivas.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {locale === "pt-BR"
                      ? "Adicione disciplinas para ver o carrossel."
                      : "Add courses to see them here."}
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
                          <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                            {tipoDisciplinaLabel(d.tipo, locale)}
                          </span>
                          <BookOpen className="h-5 w-5 shrink-0 opacity-70" />
                        </div>
                        <p className="mt-3 line-clamp-2 text-base font-semibold leading-snug">
                          {d.nome}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {d.horasSemana ?? 0} h/sem
                          {d.favorito ? " · ★" : ""}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className={cn(dashCard, "h-full")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  {locale === "pt-BR" ? "Agenda de hoje" : "Today's schedule"}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {dataHoje}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hojeNaGrade.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {locale === "pt-BR"
                      ? "Sem aulas na grade para hoje."
                      : "No classes scheduled for today."}
                  </p>
                ) : (
                  <div className="relative space-y-3 border-l-2 border-border/80 pl-4">
                    {hojeNaGrade.map((aula, idx) => (
                      <div
                        key={aula.disciplinaId + aula.inicio}
                        className={cn(
                          "relative rounded-xl border p-3",
                          idx % 2 === 0
                            ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                            : "border-sky-500/25 bg-sky-500/[0.06]",
                        )}
                      >
                        <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                          {aula.inicio} – {aula.fim}
                        </p>
                        <p className="font-semibold leading-snug">
                          {aula.disciplina}
                        </p>
                        {aula.local ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {aula.local}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Faixa 2 — Atividades (gráfico) | Tarefas | Destaques */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-5">
            <Card className={dashCard}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  {locale === "pt-BR"
                    ? "Relatório de horas estudadas"
                    : "Study hours report"}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {locale === "pt-BR" ? "Semanal" : "Weekly"}
                </span>
              </CardHeader>
              <CardContent>
                {loadingEstatisticas ? (
                  <div className="flex h-56 items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      {locale === "pt-BR" ? "Carregando…" : "Loading…"}
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    {locale === "pt-BR"
                      ? "Registre horas de estudo para ver o gráfico."
                      : "Record study hours to see the chart."}
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--muted))"
                        />
                        <XAxis
                          dataKey="semana"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="horas"
                          stroke="#34d399"
                          strokeWidth={2}
                          dot={{ fill: "#34d399", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {tipoDistrib.total > 0 ? (
                  <div className="mt-6 space-y-2 border-t border-border/60 pt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      {locale === "pt-BR"
                        ? "Disciplinas por tipo"
                        : "Courses by type"}
                    </p>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      {tipoDistrib.o.obrigatoria > 0 ? (
                        <div
                          className="bg-amber-500/90"
                          style={{
                            width: `${(tipoDistrib.o.obrigatoria / tipoDistrib.total) * 100}%`,
                          }}
                          title="Obrigatória"
                        />
                      ) : null}
                      {tipoDistrib.o.eletiva > 0 ? (
                        <div
                          className="bg-sky-500/90"
                          style={{
                            width: `${(tipoDistrib.o.eletiva / tipoDistrib.total) * 100}%`,
                          }}
                          title="Eletiva"
                        />
                      ) : null}
                      {tipoDistrib.o.optativa > 0 ? (
                        <div
                          className="bg-emerald-500/90"
                          style={{
                            width: `${(tipoDistrib.o.optativa / tipoDistrib.total) * 100}%`,
                          }}
                          title="Optativa"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        Obr.: {tipoDistrib.o.obrigatoria}
                      </span>
                      <span>
                        Elet.: {tipoDistrib.o.eletiva}
                      </span>
                      <span>
                        Opt.: {tipoDistrib.o.optativa}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">{atividadesLista}</div>

          <div className="lg:col-span-3">
            <Card className={dashCard}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  {locale === "pt-BR" ? "Em destaque" : "Highlights"}
                </CardTitle>
                <CardDescription>
                  {locale === "pt-BR"
                    ? "Disciplinas com mais carga horária"
                    : "Subjects by weekly hours"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {destacadas.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {locale === "pt-BR"
                      ? "Sem dados ainda."
                      : "No data yet."}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {destacadas.map((d, i) => (
                      <li key={d.id}>
                        <Link
                          href={`/disciplinas/${d.id}`}
                          className="flex items-center gap-3 rounded-xl border border-border/50 p-2.5 transition-colors hover:bg-muted/50"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold tabular-nums">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {d.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {d.horasSemana ?? 0} h/sem
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Faixa 3 — Próximas avaliações + Sidebar widgets */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <Card className={dashCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  {t.dashboard.proximasAvaliacoes}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAv ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse rounded-xl bg-muted/50"
                      />
                    ))}
                  </div>
                ) : proximasAvaliacoes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {locale === "pt-BR"
                      ? "Nenhuma avaliação próxima."
                      : "No upcoming assessments."}
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {proximasAvaliacoes.slice(0, 8).map((a) => {
                      const dname =
                        disciplinasMap.get(a.disciplinaId)?.nome ?? "";
                      const dias = daysUntil(a.dataISO);
                      return (
                        <li key={a.id}>
                          <Link
                            href="/avaliacoes"
                            className="flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{dname}</p>
                              <p className="text-xs text-muted-foreground">
                                {dias > 0
                                  ? `${dias} ${dias === 1 ? "dia" : "dias"}`
                                  : dias === 0
                                    ? "Hoje"
                                    : ""}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-xs ${tipoBadge(a.tipo)}`}
                            >
                              {a.tipo}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
          {sidebarCol}
        </section>
      </div>
    </div>
  );
}
