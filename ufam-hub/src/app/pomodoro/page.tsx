"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { Clock, TrendingUp, Calendar, BookOpen } from "lucide-react";
import { usePomodoroTasks } from "@/hooks/usePomodoroTasks";
import { TaskListPanel } from "@/components/pomodoro/TaskListPanel";
import { DailyProgressCard } from "@/components/pomodoro/DailyProgressCard";
import { PomodoroTimerCard } from "@/components/pomodoro/PomodoroTimerCard";
import { cn } from "@/lib/utils";

interface StudySession {
  disciplina_id: string;
  disciplina_nome: string;
  total_minutos: number;
  total_sessoes: number;
  ultima_sessao: string;
}

export default function PomodoroPage() {
  const { disciplinas } = useDisciplinas();
  const tasks = usePomodoroTasks();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [stats, setStats] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"today" | "week" | "month" | "all">("week");

  const currentTask = currentTaskId
    ? tasks.tasks.find((t) => t.id === currentTaskId) ?? null
    : null;

  const handleAddTask = (data: {
    title: string;
    category: import("@/hooks/usePomodoroTasks").PomodoroTaskCategory;
    totalSessions: number;
    notes: string;
    disciplinaId: string | null;
  }) => {
    tasks.addTask(data);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Clock className="h-7 w-7 md:h-8 md:w-8" />
            Pomodoro Timer
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerencie seu tempo com a técnica Pomodoro
          </p>
        </header>

        <Tabs defaultValue="timer" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna esquerda: Lista de tarefas */}
              <div className="lg:col-span-5 min-h-[420px]">
                <TaskListPanel
                  tasks={tasks.tasks}
                  currentTaskId={currentTaskId}
                  onAddTask={handleAddTask}
                  onUpdateTask={tasks.updateTask}
                  onDeleteTask={tasks.deleteTask}
                  onSelectTask={setCurrentTaskId}
                />
              </div>

              {/* Coluna direita: Progresso + Timer */}
              <div className="lg:col-span-7 space-y-4">
                <DailyProgressCard
                  doneCount={tasks.doneCount}
                  totalCount={Math.max(tasks.totalTasks, 1)}
                />
                <PomodoroTimerCard
                  currentTask={currentTask}
                  onSessionComplete={tasks.completeSession}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 mt-6">
            <StatsContent
              disciplinas={disciplinas}
              stats={stats}
              setStats={setStats}
              loading={loading}
              setLoading={setLoading}
              periodo={periodo}
              setPeriodo={setPeriodo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function StatsContent({
  disciplinas,
  stats,
  setStats,
  loading,
  setLoading,
  periodo,
  setPeriodo,
}: {
  disciplinas: Array<{ id: string; nome: string }>;
  stats: StudySession[];
  setStats: React.Dispatch<React.SetStateAction<StudySession[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  periodo: "today" | "week" | "month" | "all";
  setPeriodo: React.Dispatch<React.SetStateAction<"today" | "week" | "month" | "all">>;
}) {
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/progresso");
      if (!response.ok) throw new Error("Erro ao carregar estatísticas");
      const { progresso } = await response.json();
      const disciplinasMap = new Map(disciplinas.map((d) => [d.id, d.nome]));
      const statsMap = new Map<string, StudySession>();
      const hoje = new Date();

      progresso.forEach((item: any) => {
        const disciplinaId = item.disciplina_id;
        const disciplinaNome = disciplinasMap.get(disciplinaId) || "Disciplina desconhecida";
        const dataRegistro = new Date(item.data_registro);
        let incluir = false;
        if (periodo === "today") {
          incluir = dataRegistro.toDateString() === hoje.toDateString();
        } else if (periodo === "week") {
          const semanaAtras = new Date(hoje);
          semanaAtras.setDate(semanaAtras.getDate() - 7);
          incluir = dataRegistro >= semanaAtras;
        } else if (periodo === "month") {
          const mesAtras = new Date(hoje);
          mesAtras.setMonth(mesAtras.getMonth() - 1);
          incluir = dataRegistro >= mesAtras;
        } else {
          incluir = true;
        }
        if (!incluir) return;
        if (!statsMap.has(disciplinaId)) {
          statsMap.set(disciplinaId, {
            disciplina_id: disciplinaId,
            disciplina_nome: disciplinaNome,
            total_minutos: 0,
            total_sessoes: 0,
            ultima_sessao: item.data_registro,
          });
        }
        const stat = statsMap.get(disciplinaId)!;
        const minutos = (item.blocos_assistidos || 0) * (item.horas_por_bloco || 0) * 60;
        stat.total_minutos += minutos;
        stat.total_sessoes += item.blocos_assistidos || 0;
        if (new Date(item.data_registro) > new Date(stat.ultima_sessao)) {
          stat.ultima_sessao = item.data_registro;
        }
      });

      setStats(
        Array.from(statsMap.values()).sort(
          (a, b) => b.total_minutos - a.total_minutos
        )
      );
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, [periodo, disciplinas.length]);

  const totalMinutos = stats.reduce((sum, stat) => sum + stat.total_minutos, 0);
  const totalHoras = (totalMinutos / 60).toFixed(1);
  const totalSessoes = stats.reduce((sum, stat) => sum + stat.total_sessoes, 0);

  return (
    <>
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Período:</label>
        <div className="flex gap-2">
          {(["today", "week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                "px-3 py-1 rounded-md text-sm",
                periodo === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {p === "today" ? "Hoje" : p === "week" ? "Semana" : p === "month" ? "Mês" : "Tudo"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras}h</div>
            <p className="text-xs text-muted-foreground">
              {totalMinutos.toFixed(0)} minutos estudados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessoes}</div>
            <p className="text-xs text-muted-foreground">
              {totalSessoes === 1 ? "sessão" : "sessões"} completas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.length === 1 ? "disciplina" : "disciplinas"} estudadas
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </CardContent>
        </Card>
      ) : stats.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sessão de estudo registrada</p>
            <p className="text-sm mt-2">
              Use o timer para começar a registrar seu tempo de estudo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Por Disciplina</h2>
          {stats.map((stat) => {
            const horas = (stat.total_minutos / 60).toFixed(1);
            return (
              <Card key={stat.disciplina_id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{stat.disciplina_nome}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {horas}h ({stat.total_minutos.toFixed(0)}min)
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {stat.total_sessoes}{" "}
                          {stat.total_sessoes === 1 ? "sessão" : "sessões"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(stat.ultima_sessao).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">{horas}h</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
