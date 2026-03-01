"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
}: DashboardLayoutNewProps) {
  const { t, locale } = useI18n();
  const chartData = estatisticas?.horasPorSemana || [];

  return (
    <div className="min-h-screen bg-sky-50/50 dark:bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header: saudação + data */}
        <header>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {nomeUsuario}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dataHoje}</p>
        </header>

        {/* 4 cards de resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDisciplinas}</p>
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.resumoDisciplinas}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAvaliacoesSemana}</p>
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.proximasAvaliacoes}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aulasHoje}</p>
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.hojeNaGrade}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{horasEstudadas}</p>
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.progressoHoras}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid principal: esquerda (2 col) + direita (sidebar) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna esquerda: 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Próximas avaliações */}
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {t.dashboard.proximasAvaliacoes}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAv ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-14 rounded-lg bg-muted/50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : proximasAvaliacoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {locale === "pt-BR"
                      ? "Nenhuma avaliação próxima."
                      : "No upcoming assessments."}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {proximasAvaliacoes.slice(0, 4).map((a) => {
                      const dname =
                        disciplinasMap.get(a.disciplinaId)?.nome ?? "";
                      const dias = daysUntil(a.dataISO);
                      return (
                        <li key={a.id}>
                          <Link
                            href="/avaliacoes"
                            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{dname}</p>
                              <p className="text-xs text-muted-foreground">
                                {dias > 0
                                  ? `${dias} ${dias === 1 ? "dia" : "dias"}`
                                  : dias === 0
                                    ? "Hoje"
                                    : ""}
                              </p>
                            </div>
                            <span
                              className={`text-xs shrink-0 ${tipoBadge(a.tipo)}`}
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

            {/* Atividades de hoje / Aulas */}
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {locale === "pt-BR" ? "Atividades de hoje" : "Today's activities"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTarefas || loadingAv ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 rounded-lg bg-muted/50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : prioridadesHoje.length === 0 && hojeNaGrade.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {t.dashboard.semAulasHoje}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {hojeNaGrade.slice(0, 4).map((aula) => (
                      <li key={aula.disciplinaId + aula.inicio}>
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {aula.disciplina}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {aula.inicio} – {aula.fim}
                              {aula.local ? ` · ${aula.local}` : ""}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/calendar">
                              <Bell className="h-4 w-4 mr-1" />
                              {locale === "pt-BR" ? "Lembrete" : "Reminder"}
                            </Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                    {prioridadesHoje.slice(0, 4 - hojeNaGrade.length).map((item) => {
                      const isTarefa = item.type === "tarefa";
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <div className="flex items-center gap-3 rounded-lg border p-3">
                            {isTarefa ? (
                              <Checkbox
                                checked={item.concluida}
                                onCheckedChange={() =>
                                  toggleConcluida(item.id, !item.concluida)
                                }
                                className="shrink-0"
                              />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                            )}
                            <Link
                              href={
                                isTarefa
                                  ? `/disciplinas/${item.disciplinaId}`
                                  : "/avaliacoes"
                              }
                              className="flex-1 min-w-0"
                            >
                              <p className="font-medium truncate">{item.titulo}</p>
                              <p className="text-xs text-muted-foreground truncate">
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

            {/* Relatório: gráfico de horas */}
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">
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
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      {locale === "pt-BR" ? "Carregando…" : "Loading…"}
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    {locale === "pt-BR"
                      ? "Registre horas de estudo para ver o gráfico."
                      : "Record study hours to see the chart."}
                  </div>
                ) : (
                  <div className="h-64">
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
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="horas"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar direita: 1/3 */}
          <div className="space-y-6">
            {/* Perfil */}
            <Card className="border-0 bg-card shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {profileData?.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {profileData?.nome || nomeUsuario}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profileData?.email || ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Calendário do mês */}
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {new Date().toLocaleDateString(
                    locale === "pt-BR" ? "pt-BR" : "en-US",
                    { month: "long", year: "numeric" },
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
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
                    const cells = Array.from({ length: 42 }, (_, i) => {
                      const day = i - firstDay + 1;
                      const isCurrentMonth =
                        day > 0 && day <= daysInMonth;
                      const isToday =
                        isCurrentMonth && day === now.getDate();
                      const hasEvent =
                        isCurrentMonth &&
                        avaliacoes.some((a) => {
                          const d = new Date(a.dataISO);
                          return (
                            d.getDate() === day &&
                            d.getMonth() === now.getMonth()
                          );
                        });
                      return (
                        <div
                          key={i}
                          className={`aspect-square flex items-center justify-center text-xs rounded ${
                            !isCurrentMonth
                              ? "text-muted-foreground/40"
                              : isToday
                                ? "bg-primary text-primary-foreground font-semibold"
                                : hasEvent
                                  ? "bg-primary/10 border border-primary/20"
                                  : "text-foreground"
                          }`}
                        >
                          {isCurrentMonth ? day : ""}
                        </div>
                      );
                    });
                    return cells;
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Próximos eventos */}
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {locale === "pt-BR" ? "Próximos eventos" : "Upcoming events"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventosSemana.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
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
                        <li key={ev.id} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <p className="text-xs text-muted-foreground">
                            {timeStr}
                          </p>
                          <p className="font-medium text-sm truncate">
                            {ev.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ev.subtitulo}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Minhas notas */}
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">
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
                <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" asChild>
                  <Link href="/disciplinas" className="gap-2">
                    <FileText className="h-4 w-4" />
                    {t.dashboard.verTodas}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
