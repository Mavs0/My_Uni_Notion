"use client";
import { useState, useEffect, useMemo } from "react";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { Clock, TrendingUp, Calendar, BookOpen } from "lucide-react";

interface StudySession {
  disciplina_id: string;
  disciplina_nome: string;
  total_minutos: number;
  total_sessoes: number;
  ultima_sessao: string;
}

export default function PomodoroPage() {
  const { disciplinas } = useDisciplinas();
  const [stats, setStats] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"today" | "week" | "month" | "all">(
    "week"
  );

  useEffect(() => {
    loadStats();
  }, [periodo]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/progresso");
      if (!response.ok) throw new Error("Erro ao carregar estatísticas");

      const { progresso } = await response.json();

      // Criar mapa de disciplinas
      const disciplinasMap = new Map(disciplinas.map((d) => [d.id, d.nome]));

      // Agrupar por disciplina e calcular estatísticas
      const statsMap = new Map<string, StudySession>();

      progresso.forEach((item: any) => {
        const disciplinaId = item.disciplina_id;
        const disciplinaNome =
          disciplinasMap.get(disciplinaId) || "Disciplina desconhecida";

        // Filtrar por período
        const dataRegistro = new Date(item.data_registro);
        const hoje = new Date();
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
          incluir = true; // all
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
        const minutos =
          (item.blocos_assistidos || 0) * (item.horas_por_bloco || 0) * 60;
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

  const totalMinutos = useMemo(() => {
    return stats.reduce((sum, stat) => sum + stat.total_minutos, 0);
  }, [stats]);

  const totalHoras = useMemo(() => {
    return (totalMinutos / 60).toFixed(1);
  }, [totalMinutos]);

  const totalSessoes = useMemo(() => {
    return stats.reduce((sum, stat) => sum + stat.total_sessoes, 0);
  }, [stats]);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Clock className="h-8 w-8" />
          Pomodoro Timer
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Gerencie seu tempo de estudo com a técnica Pomodoro
        </p>
      </header>

      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6">
          <PomodoroTimer />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {/* Filtro de Período */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Período:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriodo("today")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodo === "today"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodo("week")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodo === "week"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodo("month")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodo === "month"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setPeriodo("all")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodo === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Tudo
              </button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Horas
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Total de Sessões
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Disciplinas
                </CardTitle>
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

          {/* Lista de Estatísticas por Disciplina */}
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Carregando estatísticas...
                </p>
              </CardContent>
            </Card>
          ) : stats.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-zinc-500">
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
                          <h3 className="font-semibold">
                            {stat.disciplina_nome}
                          </h3>
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
                              {new Date(stat.ultima_sessao).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {horas}h
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
