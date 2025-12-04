"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Clock, CheckCircle2, Target } from "lucide-react";
interface EstatisticasData {
  horasPorDisciplina: Array<{
    disciplinaId: string;
    disciplinaNome: string;
    horasEstudadas: number;
    horasSemana: number;
    diasAtivos: number;
  }>;
  evolucaoMedias: Array<{
    disciplinaId: string;
    disciplinaNome: string;
    medias: Array<{ mes: string; media: number }>;
  }>;
  produtividade: {
    tarefasConcluidas: number;
    tarefasTotal: number;
    taxaConclusao: number;
  };
  horasPorSemana: Array<{ semana: string; horas: number }>;
  distribuicaoCarga: Array<{
    nome: string;
    horasSemana: number;
    tipo: string;
  }>;
  comparativoDesempenho: Array<{
    disciplinaId: string;
    disciplinaNome: string;
    media: number | null;
    totalAvaliacoes: number;
  }>;
  heatmap: Array<{ date: string; value: number }>;
  periodo: number;
}
const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
];
export default function EstatisticasPage() {
  const [data, setData] = useState<EstatisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(30);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadEstatisticas();
  }, [periodo]);
  const loadEstatisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/estatisticas?periodo=${periodo}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              {error || "Erro ao carregar estatísticas"}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
  const horasPorDisciplinaData = data.horasPorDisciplina.map((item) => ({
    nome: item.disciplinaNome,
    horas: item.horasEstudadas,
    meta: item.horasSemana * (periodo / 7),
  }));
  const evolucaoMediasData = data.evolucaoMedias
    .filter((item) => item.medias.length > 0)
    .flatMap((item) =>
      item.medias.map((m) => ({
        mes: m.mes,
        disciplina: item.disciplinaNome,
        media: m.media,
      }))
    );
  const distribuicaoCargaData = data.distribuicaoCarga.map((item) => ({
    name: item.nome,
    value: item.horasSemana,
  }));
  const comparativoData = data.comparativoDesempenho
    .filter((item) => item.media !== null)
    .map((item) => ({
      nome: item.disciplinaNome,
      media: item.media || 0,
      avaliacoes: item.totalAvaliacoes,
    }))
    .sort((a, b) => b.media - a.media);
  const totalHoras = data.horasPorDisciplina.reduce(
    (acc, item) => acc + item.horasEstudadas,
    0
  );
  const mediasComNota = data.comparativoDesempenho.filter(
    (item) => item.media !== null
  );
  const mediaGeral =
    mediasComNota.length > 0
      ? mediasComNota.reduce((acc, item) => acc + (item.media || 0), 0) /
        mediasComNota.length
      : null;
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estatísticas de Estudo</h1>
          <p className="text-muted-foreground mt-1">
            Visualize seu progresso e desempenho acadêmico
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={periodo === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodo(7)}
          >
            7 dias
          </Button>
          <Button
            variant={periodo === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodo(30)}
          >
            30 dias
          </Button>
          <Button
            variant={periodo === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodo(90)}
          >
            90 dias
          </Button>
        </div>
      </div>
      {}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Horas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Últimos {periodo} dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaGeral !== null ? mediaGeral.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {mediasComNota.length} disciplinas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tarefas Concluídas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.produtividade.tarefasConcluidas} /{" "}
              {data.produtividade.tarefasTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.produtividade.taxaConclusao}% de conclusão
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Disciplinas Ativas
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                data.horasPorDisciplina.filter((d) => d.horasEstudadas > 0)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              de {data.horasPorDisciplina.length} total
            </p>
          </CardContent>
        </Card>
      </div>
      {}
      {horasPorDisciplinaData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Horas Estudadas por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={horasPorDisciplinaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nome"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="horas" fill="#3b82f6" name="Horas Estudadas" />
                <Bar dataKey="meta" fill="#e5e7eb" name="Meta (horas/semana)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {}
      {evolucaoMediasData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Médias ao Longo do Semestre</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoMediasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="media"
                  stroke="#8b5cf6"
                  name="Média"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {}
        {distribuicaoCargaData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Carga Horária</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distribuicaoCargaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribuicaoCargaData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {}
        {comparativoData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Desempenho</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={comparativoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="media" fill="#10b981" name="Média" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
      {}
      {data.horasPorSemana.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Horas Estudadas por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.horasPorSemana}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="horas"
                  stroke="#ec4899"
                  name="Horas"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {}
      <Card>
        <CardHeader>
          <CardTitle>Heatmap de Atividade de Estudo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {data.heatmap.map((day, index) => {
              const intensity = Math.min(day.value / 4, 1);
              const bgColor =
                intensity === 0
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : intensity < 0.25
                  ? "bg-blue-200 dark:bg-blue-900"
                  : intensity < 0.5
                  ? "bg-blue-400 dark:bg-blue-700"
                  : intensity < 0.75
                  ? "bg-blue-600 dark:bg-blue-600"
                  : "bg-blue-800 dark:bg-blue-500";
              return (
                <div
                  key={index}
                  className={`aspect-square rounded ${bgColor} flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-300`}
                  title={`${day.date}: ${day.value.toFixed(1)}h`}
                >
                  {day.value > 0 ? day.value.toFixed(0) : ""}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900" />
              <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-700" />
              <div className="w-3 h-3 rounded bg-blue-600 dark:bg-blue-600" />
              <div className="w-3 h-3 rounded bg-blue-800 dark:bg-blue-500" />
            </div>
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}