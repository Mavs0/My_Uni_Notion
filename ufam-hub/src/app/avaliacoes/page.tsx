"use client";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  TrendingUp,
  Download,
  Copy,
  Bell,
  Settings,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAvaliacoes,
  type Avaliacao as AvaliacaoType,
} from "@/hooks/useAvaliacoes";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { SyncAvaliacoesWithCalendar } from "@/components/GoogleCalendarIntegration";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type AvaliacaoTipo = "prova" | "trabalho" | "seminario";
type Avaliacao = AvaliacaoType;

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
const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function TipoBadge({
  tipo,
  t,
}: {
  tipo: AvaliacaoTipo;
  t: { tipo: { prova: string; trabalho: string; seminario: string } };
}) {
  const map: Record<
    AvaliacaoTipo,
    { bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    prova: {
      bg: "bg-red-500/15",
      text: "text-red-400",
      border: "border-red-500/30",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    trabalho: {
      bg: "bg-blue-500/15",
      text: "text-blue-400",
      border: "border-blue-500/30",
      icon: <BookOpen className="h-3 w-3" />,
    },
    seminario: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };
  const style = map[tipo];
  const tipoLabel = t.tipo[tipo];
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium border capitalize flex items-center gap-1.5",
        style.bg,
        style.text,
        style.border
      )}
    >
      {style.icon}
      {tipoLabel}
    </span>
  );
}

function UrgenciaBadge({ dias }: { dias: number }) {
  if (dias < 0) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
        Passou
      </span>
    );
  }
  if (dias === 0) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border border-red-500/40 font-medium animate-pulse">
        Hoje!
      </span>
    );
  }
  if (dias <= 3) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 font-medium">
        {dias === 1 ? "Amanhã" : `Em ${dias} dias`}
      </span>
    );
  }
  if (dias <= 7) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
        {dias} dias
      </span>
    );
  }
  return (
    <span className="rounded-full px-2 py-0.5 text-xs bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
      {dias} dias
    </span>
  );
}

export default function AvaliacoesPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { disciplinas } = useDisciplinas();
  const [fDisc, setFDisc] = useState<string>("todas");
  const [fTipo, setFTipo] = useState<"tudo" | AvaliacaoTipo>("tudo");
  const [fStatus, setFStatus] = useState<
    "todos" | "pendente" | "concluida" | "vencida"
  >("todos");
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Avaliacao | null>(null);
  const [avaliacaoToDelete, setAvaliacaoToDelete] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"lista" | "calendario">("lista");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBuscaAvancada, setShowBuscaAvancada] = useState(false);
  const [buscaAvancada, setBuscaAvancada] = useState({
    notaMin: "",
    notaMax: "",
    dataInicio: "",
    dataFim: "",
    comNota: "todos",
  });
  const {
    avaliacoes,
    loading,
    error,
    refetch,
    deleteAvaliacao,
    updateAvaliacao,
    createAvaliacao,
  } = useAvaliacoes(fDisc !== "todas" ? { disciplinaId: fDisc } : undefined);
  const discMap = useMemo(
    () => new Map(disciplinas.map((d) => [d.id, d.nome])),
    [disciplinas]
  );
  const getStatus = (
    avaliacao: Avaliacao
  ): "pendente" | "concluida" | "vencida" => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAval = new Date(avaliacao.dataISO);
    dataAval.setHours(0, 0, 0, 0);
    if (avaliacao.nota !== undefined && avaliacao.nota !== null) {
      return "concluida";
    }
    if (dataAval < hoje) {
      return "vencida";
    }
    return "pendente";
  };
  const list = useMemo(() => {
    let arr = [...avaliacoes];
    if (fDisc !== "todas") arr = arr.filter((a) => a.disciplinaId === fDisc);
    if (fTipo !== "tudo") arr = arr.filter((a) => a.tipo === fTipo);
    if (fStatus !== "todos") {
      arr = arr.filter((a) => getStatus(a) === fStatus);
    }
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((a) => {
        const nome = discMap.get(a.disciplinaId)?.toLowerCase() || "";
        const desc = a.descricao?.toLowerCase() || "";
        return nome.includes(needle) || desc.includes(needle);
      });
    }
    if (showBuscaAvancada) {
      if (buscaAvancada.notaMin) {
        arr = arr.filter(
          (a) =>
            a.nota !== undefined &&
            a.nota !== null &&
            a.nota >= Number(buscaAvancada.notaMin)
        );
      }
      if (buscaAvancada.notaMax) {
        arr = arr.filter(
          (a) =>
            a.nota !== undefined &&
            a.nota !== null &&
            a.nota <= Number(buscaAvancada.notaMax)
        );
      }
      if (buscaAvancada.dataInicio) {
        const dataInicio = new Date(buscaAvancada.dataInicio);
        arr = arr.filter((a) => new Date(a.dataISO) >= dataInicio);
      }
      if (buscaAvancada.dataFim) {
        const dataFim = new Date(buscaAvancada.dataFim);
        dataFim.setHours(23, 59, 59);
        arr = arr.filter((a) => new Date(a.dataISO) <= dataFim);
      }
      if (buscaAvancada.comNota === "sim") {
        arr = arr.filter((a) => a.nota !== undefined && a.nota !== null);
      } else if (buscaAvancada.comNota === "nao") {
        arr = arr.filter((a) => a.nota === undefined || a.nota === null);
      }
    }
    return arr.sort(
      (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
    );
  }, [
    avaliacoes,
    fDisc,
    fTipo,
    fStatus,
    q,
    discMap,
    showBuscaAvancada,
    buscaAvancada,
  ]);
  const dadosGrafico = useMemo(() => {
    const avaliacoesComNota = avaliacoes
      .filter((a) => a.nota !== undefined && a.nota !== null)
      .sort(
        (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
      );
    return avaliacoesComNota.map((a) => {
      const nomeDisc = discMap.get(a.disciplinaId) ?? "Disciplina";
      return {
        data: new Date(a.dataISO).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        nota: a.nota,
        disciplina: nomeDisc,
        tipo: a.tipo,
        dataISO: a.dataISO,
      };
    });
  }, [avaliacoes, discMap]);
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setOpenNew(true);
      window.history.replaceState({}, "", "/avaliacoes");
    }
  }, [searchParams]);
  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencidas = avaliacoes.filter((a) => {
      if (a.nota !== undefined && a.nota !== null) return false;
      const dataAval = new Date(a.dataISO);
      dataAval.setHours(0, 0, 0, 0);
      return dataAval < hoje;
    });
    if (vencidas.length > 0) {
      toast.warning(
        `${vencidas.length} avaliação(ões) vencida(s) sem nota registrada`,
        {
          description: "Registre as notas para manter seu histórico atualizado",
          duration: 6000,
        }
      );
    }
    const hojeAvaliacoes = avaliacoes.filter((a) => {
      const dataAval = new Date(a.dataISO);
      dataAval.setHours(0, 0, 0, 0);
      return dataAval.getTime() === hoje.getTime();
    });
    if (hojeAvaliacoes.length > 0) {
      toast.info(`Você tem ${hojeAvaliacoes.length} avaliação(ões) hoje!`, {
        description: hojeAvaliacoes
          .map((a) => discMap.get(a.disciplinaId) ?? "Disciplina")
          .join(", "),
        duration: 8000,
      });
    }
    const proximos3Dias = new Date(hoje);
    proximos3Dias.setDate(hoje.getDate() + 3);
    const proximas = avaliacoes.filter((a) => {
      if (a.nota !== undefined && a.nota !== null) return false;
      const dataAval = new Date(a.dataISO);
      dataAval.setHours(0, 0, 0, 0);
      return dataAval > hoje && dataAval <= proximos3Dias;
    });
    if (proximas.length > 0 && hojeAvaliacoes.length === 0) {
      toast.info(`${proximas.length} avaliação(ões) nos próximos 3 dias`, {
        description: "Prepare-se com antecedência!",
        duration: 5000,
      });
    }
  }, [avaliacoes, discMap]);
  const stats = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const proximaSemana = new Date(hoje);
    proximaSemana.setDate(hoje.getDate() + 7);
    const proximas = avaliacoes.filter((a) => {
      const data = new Date(a.dataISO);
      return data >= hoje && data <= proximaSemana;
    });
    const urgentes = avaliacoes.filter((a) => {
      const dias = daysUntil(a.dataISO);
      return dias >= 0 && dias <= 3;
    });
    return {
      total: avaliacoes.length,
      proximas: proximas.length,
      urgentes: urgentes.length,
    };
  }, [avaliacoes]);
  function removeItem(id: string) {
    setAvaliacaoToDelete(id);
  }
  async function confirmDelete() {
    if (!avaliacaoToDelete) return;
    const result = await deleteAvaliacao(avaliacaoToDelete);
    if (result.success) {
      setAvaliacaoToDelete(null);
      toast.success("Avaliação removida com sucesso");
    } else {
      toast.error(result.error || "Erro ao remover avaliação");
    }
  }
  function exportarCSV() {
    const headers = [
      "Disciplina",
      "Tipo",
      "Data",
      "Descrição",
      "Nota",
      "Peso",
      "Status",
    ];
    const rows = list.map((a) => {
      const nomeDisc = discMap.get(a.disciplinaId) ?? "Disciplina";
      const status = getStatus(a);
      return [
        nomeDisc,
        a.tipo,
        new Date(a.dataISO).toLocaleDateString("pt-BR"),
        a.descricao || "",
        a.nota !== undefined && a.nota !== null ? a.nota.toString() : "",
        a.peso !== undefined && a.peso !== null ? a.peso.toString() : "",
        status,
      ];
    });
    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `avaliacoes_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Avaliações exportadas para CSV");
  }
  async function exportarGrafico() {
    toast.info(
      "Para exportar o gráfico como imagem, instale: npm install html2canvas"
    );
  }
  async function duplicarAvaliacao(avaliacao: Avaliacao) {
    const novaData = new Date(avaliacao.dataISO);
    novaData.setDate(novaData.getDate() + 7);
    const result = await createAvaliacao({
      disciplinaId: avaliacao.disciplinaId,
      tipo: avaliacao.tipo,
      dataISO: novaData.toISOString(),
      descricao: avaliacao.descricao || undefined,
      resumo_assuntos: avaliacao.resumo_assuntos || undefined,
      gerado_por_ia: avaliacao.gerado_por_ia || false,
      nota: undefined,
      peso: avaliacao.peso || undefined,
    });
    if (result.success) {
      toast.success("Avaliação duplicada com sucesso");
      refetch();
    } else {
      toast.error(result.error || "Erro ao duplicar avaliação");
    }
  }
  async function saveEdited(updated: Avaliacao) {
    const result = await updateAvaliacao(updated.id, updated);
    if (result.success) {
      setEditing(null);
      toast.success("Avaliação atualizada com sucesso");
    } else {
      toast.error(result.error || "Erro ao atualizar avaliação");
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <GraduationCap className="size-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando avaliações...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
          Erro ao carregar avaliações: {error}
        </div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              {t.avaliacoes.title}
            </h1>
            <p className="text-muted-foreground ml-[52px]">
              {t.avaliacoes.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportarCSV}
              size="lg"
              disabled={list.length === 0}
              className="hover:bg-muted/50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => setOpenNew(true)}
              size="lg"
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.avaliacoes.novaAvaliacao}
            </Button>
          </div>
        </div>
      </header>
      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t.avaliacoes.total}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.total}
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t.avaliacoes.proximos7Dias}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.proximas}
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Calendar className="h-7 w-7 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-orange-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t.avaliacoes.urgentes}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.urgentes}
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <AlertCircle className="h-7 w-7 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {}
      {dadosGrafico.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Evolução de Notas
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportarGrafico}
                className="hover:bg-muted/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Gráfico
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis
                  dataKey="data"
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 10]}
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: 600,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nota"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{
                    fill: "hsl(var(--primary))",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "hsl(var(--background))",
                  }}
                  activeDot={{ r: 7 }}
                  name="Nota"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {/* Barra de busca e filtros inline */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.avaliacoes.buscar}
              className="pl-9 h-10"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros inline */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Select value={fDisc} onValueChange={setFDisc}>
              <SelectTrigger className="h-10 min-w-[160px]">
                <SelectValue placeholder={t.avaliacoes.todasDisciplinas} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">
                  {t.avaliacoes.todasDisciplinas}
                </SelectItem>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={fTipo}
              onValueChange={(value) => setFTipo(value as any)}
            >
              <SelectTrigger className="h-10 min-w-[120px]">
                <SelectValue placeholder={t.avaliacoes.todosTipos} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tudo">{t.avaliacoes.todosTipos}</SelectItem>
                <SelectItem value="prova">{t.avaliacoes.tipo.prova}</SelectItem>
                <SelectItem value="trabalho">
                  {t.avaliacoes.tipo.trabalho}
                </SelectItem>
                <SelectItem value="seminario">
                  {t.avaliacoes.tipo.seminario}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={fStatus}
              onValueChange={(value) => setFStatus(value as any)}
            >
              <SelectTrigger className="h-10 min-w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
              </SelectContent>
            </Select>

            {/* Separador visual */}
            <div className="hidden sm:block w-px bg-border" />

            {/* Toggle de visualização */}
            <div className="flex rounded-md border bg-background p-1 gap-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode("lista")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        viewMode === "lista"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lista</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode("calendario")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        viewMode === "calendario"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calendário</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Botão busca avançada */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowBuscaAvancada(!showBuscaAvancada)}
                    className={cn(
                      "h-10 px-3 rounded-md border flex items-center gap-2 text-sm transition-colors",
                      showBuscaAvancada
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filtros avançados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Busca avançada - painel colapsável */}
        {showBuscaAvancada && (
          <div className="rounded-lg border bg-card p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filtros Avançados
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBuscaAvancada({
                    notaMin: "",
                    notaMax: "",
                    dataInicio: "",
                    dataFim: "",
                    comNota: "todos",
                  });
                }}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Nota mín.
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={buscaAvancada.notaMin}
                  onChange={(e) =>
                    setBuscaAvancada({
                      ...buscaAvancada,
                      notaMin: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Nota máx.
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={buscaAvancada.notaMax}
                  onChange={(e) =>
                    setBuscaAvancada({
                      ...buscaAvancada,
                      notaMax: e.target.value,
                    })
                  }
                  placeholder="10"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Tem nota?
                </label>
                <Select
                  value={buscaAvancada.comNota}
                  onValueChange={(value) =>
                    setBuscaAvancada({
                      ...buscaAvancada,
                      comNota: value,
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Com nota</SelectItem>
                    <SelectItem value="nao">Sem nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  De
                </label>
                <Input
                  type="date"
                  value={buscaAvancada.dataInicio}
                  onChange={(e) =>
                    setBuscaAvancada({
                      ...buscaAvancada,
                      dataInicio: e.target.value,
                    })
                  }
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Até
                </label>
                <Input
                  type="date"
                  value={buscaAvancada.dataFim}
                  onChange={(e) =>
                    setBuscaAvancada({
                      ...buscaAvancada,
                      dataFim: e.target.value,
                    })
                  }
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {}
      {viewMode === "calendario" ? (
        <CalendarioView
          avaliacoes={list}
          discMap={discMap}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onEdit={(a) => setEditing(a)}
          onDelete={(id) => removeItem(id)}
          onDuplicate={duplicarAvaliacao}
          t={t.avaliacoes}
        />
      ) : (
        <>
          {list.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <GraduationCap className="h-10 w-10 text-muted-foreground opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-foreground">
                      {t.avaliacoes.nenhumaEncontrada}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {q || fDisc !== "todas" || fTipo !== "tudo"
                        ? "Tente ajustar os filtros para encontrar mais resultados"
                        : "Crie uma nova avaliação para começar a acompanhar seu desempenho"}
                    </p>
                  </div>
                  {!q && fDisc === "todas" && fTipo === "tudo" && (
                    <Button onClick={() => setOpenNew(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Avaliação
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map((a) => {
                const nomeDisc = discMap.get(a.disciplinaId) ?? "Disciplina";
                const dias = daysUntil(a.dataISO);
                const isUrgente = dias >= 0 && dias <= 3;
                const isHoje = dias === 0;
                const isPast = dias < 0;
                const hasNota = a.nota !== undefined && a.nota !== null;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "group rounded-xl border bg-card p-5 shadow-sm transition-all duration-300",
                      "hover:shadow-lg hover:-translate-y-0.5",
                      isHoje &&
                        !hasNota &&
                        "border-destructive/50 bg-gradient-to-br from-destructive/5 to-transparent",
                      isUrgente &&
                        !isHoje &&
                        !hasNota &&
                        "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent",
                      hasNota &&
                        "border-emerald-500/20 hover:border-emerald-500/40",
                      isPast && !hasNota && "opacity-70 border-dashed"
                    )}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TipoBadge tipo={a.tipo} t={t.avaliacoes} />
                            <UrgenciaBadge dias={dias} />
                          </div>
                          <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                            {nomeDisc}
                          </h3>
                        </div>
                        <TooltipProvider delayDuration={300}>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => duplicarAvaliacao(a)}
                                  className="h-8 w-8 hover:bg-primary/10"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duplicar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditing(a)}
                                  className="h-8 w-8 hover:bg-primary/10"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(a.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Excluir</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                      {/* Descrição */}
                      {a.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {a.descricao}
                        </p>
                      )}
                      {/* Data */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {fmtDate(a.dataISO)}
                        </span>
                      </div>
                      {/* Nota */}
                      {hasNota && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 border">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span
                                className={cn(
                                  "text-2xl font-bold",
                                  a.nota! >= 7
                                    ? "text-emerald-500"
                                    : a.nota! >= 5
                                    ? "text-amber-500"
                                    : "text-red-500"
                                )}
                              >
                                {a.nota!.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                / 10
                              </span>
                              {a.peso && a.peso !== 1 && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  peso: {a.peso}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-semibold",
                              a.nota! >= 7
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : a.nota! >= 5
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/20 text-red-600 dark:text-red-400"
                            )}
                          >
                            {a.nota! >= 7
                              ? "Aprovado"
                              : a.nota! >= 5
                              ? "Recuperação"
                              : "Reprovado"}
                          </div>
                        </div>
                      )}
                      {/* Resumo dos assuntos */}
                      {a.resumo_assuntos && (
                        <div className="rounded-lg border bg-gradient-to-br from-muted/30 to-transparent p-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            {a.gerado_por_ia && (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                            <span>Resumo</span>
                            {a.gerado_por_ia && (
                              <span className="text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                                IA
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-2 leading-relaxed">
                            {a.resumo_assuntos}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {}
      {}
      <SyncAvaliacoesWithCalendar />
      <NovaAvaliacaoModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={refetch}
        disciplinas={disciplinas}
      />
      {}
      <EditarAvaliacaoModal
        open={!!editing}
        avaliacao={editing}
        onClose={() => setEditing(null)}
        onSave={async (upd) => {
          await saveEdited(upd);
        }}
        disciplinas={disciplinas}
      />
      {}
      <Dialog
        open={!!avaliacaoToDelete}
        onOpenChange={(open) => !open && setAvaliacaoToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.avaliacoes.confirmarRemover}</DialogTitle>
            <DialogDescription>
              {t.avaliacoes.confirmarRemoverDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAvaliacaoToDelete(null)}
            >
              {t.avaliacoes.cancelar}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t.avaliacoes.remover}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CalendarioView({
  avaliacoes,
  discMap,
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
  onEdit,
  onDelete,
  onDuplicate,
  t,
}: {
  avaliacoes: Avaliacao[];
  discMap: Map<string, string>;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  onEdit: (a: Avaliacao) => void;
  onDelete: (id: string) => void;
  onDuplicate: (a: Avaliacao) => void;
  t: any;
}) {
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    const lastDay = new Date(year, month + 1, 0);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };
  const getAvaliacoesForDate = (date: Date) => {
    return avaliacoes.filter((a) => {
      const dataAval = new Date(a.dataISO);
      return (
        dataAval.getDate() === date.getDate() &&
        dataAval.getMonth() === date.getMonth() &&
        dataAval.getFullYear() === date.getFullYear()
      );
    });
  };
  const getStatusColor = (avaliacao: Avaliacao) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAval = new Date(avaliacao.dataISO);
    dataAval.setHours(0, 0, 0, 0);
    if (avaliacao.nota !== undefined && avaliacao.nota !== null) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
    if (dataAval < hoje) {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };
  const avaliacoesDoDia = selectedDate
    ? getAvaliacoesForDate(selectedDate)
    : [];
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          {}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={goToPreviousMonth}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mês anterior</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={goToNextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Próximo mês</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          {}
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            {}
            <div className="grid grid-cols-7 bg-muted/50 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>
            {}
            <div className="grid grid-cols-7">
              {getCalendarDays().map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={index}
                      className="min-h-[120px] border-r border-b bg-muted/30"
                    />
                  );
                }
                const isToday =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                const isSelected =
                  selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();
                const isCurrentMonth =
                  date.getMonth() === currentDate.getMonth();
                const dayAvaliacoes = getAvaliacoesForDate(date);
                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[120px] border-r border-b p-2 cursor-pointer transition-colors",
                      !isCurrentMonth
                        ? "bg-muted/30 opacity-50"
                        : isSelected
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          isToday
                            ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center font-semibold"
                            : isSelected
                            ? "text-primary font-semibold"
                            : "text-foreground"
                        )}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {dayAvaliacoes.slice(0, 3).map((a) => {
                        const nomeDisc =
                          discMap.get(a.disciplinaId) ?? "Disciplina";
                        return (
                          <div
                            key={a.id}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded truncate border",
                              getStatusColor(a)
                            )}
                            title={`${nomeDisc} - ${a.tipo}`}
                          >
                            {nomeDisc}
                          </div>
                        );
                      })}
                      {dayAvaliacoes.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1.5 font-medium">
                          +{dayAvaliacoes.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      {}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Avaliações em{" "}
              {selectedDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {avaliacoesDoDia.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma avaliação neste dia
              </p>
            ) : (
              <div className="space-y-3">
                {avaliacoesDoDia.map((a) => {
                  const nomeDisc = discMap.get(a.disciplinaId) ?? "Disciplina";
                  const dias = daysUntil(a.dataISO);
                  return (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TipoBadge tipo={a.tipo} t={t.avaliacoes} />
                          <UrgenciaBadge dias={dias} />
                        </div>
                        <h3 className="font-semibold text-foreground">
                          {nomeDisc}
                        </h3>
                        {a.descricao && (
                          <p className="text-sm text-muted-foreground">
                            {a.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{fmtDate(a.dataISO)}</span>
                        </div>
                        {a.nota !== undefined && a.nota !== null && (
                          <div className="text-sm">
                            <span className="font-semibold text-foreground">
                              Nota: {a.nota.toFixed(1)}/10
                            </span>
                          </div>
                        )}
                      </div>
                      <TooltipProvider delayDuration={300}>
                        <div className="flex gap-1 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDuplicate(a)}
                                className="h-8 w-8 hover:bg-primary/10"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Duplicar</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(a)}
                                className="h-8 w-8 hover:bg-primary/10"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(a.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NovaAvaliacaoModal({
  open,
  onClose,
  onCreate,
  disciplinas,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  disciplinas: Array<{ id: string; nome: string }>;
}) {
  const { createAvaliacao } = useAvaliacoes();
  const [disciplinaId, setDisciplinaId] = useState<string>(
    disciplinas[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<AvaliacaoTipo>("prova");
  const [dataLocal, setDataLocal] = useState<string>(() =>
    toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000))
  );
  const [descricao, setDescricao] = useState("");
  const [resumo, setResumo] = useState("");
  const [nota, setNota] = useState<number | null>(null);
  const [peso, setPeso] = useState<number | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  async function gerarResumoIA() {
    if (!disciplinaId) {
      toast.error("Selecione uma disciplina primeiro");
      return;
    }

    setLoadingResumo(true);
    try {
      const response = await fetch("/api/ai/resumo-estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplinaId,
          tipoAvaliacao: tipo,
          descricao: descricao || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao gerar resumo");
      }

      const data = await response.json();
      setResumo(data.resumo || "");
      toast.success("Resumo gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar resumo:", err);
      toast.error(err.message || "Erro ao gerar resumo com IA");
    } finally {
      setLoadingResumo(false);
    }
  }
  async function salvar() {
    const iso = new Date(dataLocal).toISOString();
    const result = await createAvaliacao({
      disciplinaId,
      tipo,
      dataISO: iso,
      descricao: descricao || undefined,
      resumo_assuntos: resumo || undefined,
      gerado_por_ia: !!resumo,
      nota: nota ?? undefined,
      peso: peso ?? undefined,
    });
    if (result.success) {
      onClose();
      setDescricao("");
      setResumo("");
      setNota(null);
      setPeso(null);
      toast.success("Avaliação criada com sucesso");
      onCreate();
    } else {
      toast.error(result.error || "Erro ao criar avaliação");
    }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Nova Avaliação
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da avaliação. Campos marcados com * são
            obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <FormAvaliacao
          disciplinaId={disciplinaId}
          setDisciplinaId={setDisciplinaId}
          tipo={tipo}
          setTipo={setTipo}
          dataLocal={dataLocal}
          setDataLocal={setDataLocal}
          descricao={descricao}
          setDescricao={setDescricao}
          resumo={resumo}
          setResumo={setResumo}
          nota={nota}
          setNota={setNota}
          peso={peso}
          setPeso={setPeso}
          onGerarResumoIA={gerarResumoIA}
          loadingResumo={loadingResumo}
          onCancel={onClose}
          onSubmit={salvar}
          submitLabel="Criar Avaliação"
          disciplinas={disciplinas}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditarAvaliacaoModal({
  open,
  avaliacao,
  onClose,
  onSave,
  disciplinas,
}: {
  open: boolean;
  avaliacao: Avaliacao | null;
  onClose: () => void;
  onSave: (a: Avaliacao) => Promise<void>;
  disciplinas: Array<{ id: string; nome: string }>;
}) {
  const { updateAvaliacao } = useAvaliacoes();
  const [disciplinaId, setDisciplinaId] = useState<string>("");
  const [tipo, setTipo] = useState<AvaliacaoTipo>("prova");
  const [dataLocal, setDataLocal] = useState<string>(
    toLocalInputValue(new Date())
  );
  const [descricao, setDescricao] = useState("");
  const [resumo, setResumo] = useState("");
  const [nota, setNota] = useState<number | null>(null);
  const [peso, setPeso] = useState<number | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  useEffect(() => {
    if (avaliacao) {
      setDisciplinaId(avaliacao.disciplinaId);
      setTipo(avaliacao.tipo);
      setDataLocal(toLocalInputValue(new Date(avaliacao.dataISO)));
      setDescricao(avaliacao.descricao ?? "");
      setResumo(avaliacao.resumo_assuntos ?? "");
      setNota(avaliacao.nota ?? null);
      setPeso(avaliacao.peso ?? null);
    }
  }, [avaliacao]);
  async function gerarResumoIA() {
    if (!disciplinaId) {
      toast.error("Selecione uma disciplina primeiro");
      return;
    }

    setLoadingResumo(true);
    try {
      const response = await fetch("/api/ai/resumo-estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplinaId,
          tipoAvaliacao: tipo,
          descricao: descricao || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao gerar resumo");
      }

      const data = await response.json();
      setResumo(data.resumo || "");
      toast.success("Resumo gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar resumo:", err);
      toast.error(err.message || "Erro ao gerar resumo com IA");
    } finally {
      setLoadingResumo(false);
    }
  }
  async function salvar() {
    if (!avaliacao) return;
    const iso = new Date(dataLocal).toISOString();
    const result = await updateAvaliacao(avaliacao.id, {
      disciplinaId,
      tipo,
      dataISO: iso,
      descricao: descricao || undefined,
      resumo_assuntos: resumo || undefined,
      gerado_por_ia: !!resumo,
      nota: nota ?? undefined,
      peso: peso ?? undefined,
    });
    if (result.success) {
      await onSave({
        ...avaliacao,
        disciplinaId,
        tipo,
        dataISO: iso,
        descricao,
        resumo_assuntos: resumo || undefined,
        gerado_por_ia: !!resumo,
        nota: nota ?? undefined,
        peso: peso ?? undefined,
      });
      onClose();
      toast.success("Avaliação atualizada com sucesso");
    } else {
      toast.error(result.error || "Erro ao atualizar avaliação");
    }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Editar Avaliação
          </DialogTitle>
          <DialogDescription>Atualize os dados da avaliação.</DialogDescription>
        </DialogHeader>
        {avaliacao && (
          <FormAvaliacao
            disciplinaId={disciplinaId}
            setDisciplinaId={setDisciplinaId}
            tipo={tipo}
            setTipo={setTipo}
            dataLocal={dataLocal}
            setDataLocal={setDataLocal}
            descricao={descricao}
            setDescricao={setDescricao}
            resumo={resumo}
            setResumo={setResumo}
            nota={nota}
            setNota={setNota}
            peso={peso}
            setPeso={setPeso}
            onGerarResumoIA={gerarResumoIA}
            loadingResumo={loadingResumo}
            onCancel={onClose}
            onSubmit={salvar}
            submitLabel="Salvar Alterações"
            disciplinas={disciplinas}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormAvaliacao(props: {
  disciplinaId: string;
  setDisciplinaId: (v: string) => void;
  tipo: AvaliacaoTipo;
  setTipo: (v: AvaliacaoTipo) => void;
  dataLocal: string;
  setDataLocal: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  resumo: string;
  setResumo: (v: string) => void;
  nota?: number | null;
  setNota?: (v: number | null) => void;
  peso?: number | null;
  setPeso?: (v: number | null) => void;
  onGerarResumoIA: () => Promise<void> | void;
  loadingResumo: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disciplinas: Array<{ id: string; nome: string }>;
}) {
  const {
    disciplinaId,
    setDisciplinaId,
    tipo,
    setTipo,
    dataLocal,
    setDataLocal,
    descricao,
    setDescricao,
    resumo,
    setResumo,
    nota,
    setNota,
    peso,
    setPeso,
    onGerarResumoIA,
    loadingResumo,
    onCancel,
    onSubmit,
    submitLabel,
    disciplinas,
  } = props;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!disciplinaId) {
      newErrors.disciplinaId = "Selecione uma disciplina";
    }
    if (!dataLocal) {
      newErrors.dataLocal = "Selecione uma data e hora";
    } else {
      const selectedDate = new Date(dataLocal);
      if (isNaN(selectedDate.getTime())) {
        newErrors.dataLocal = "Data inválida";
      }
    }
    if (nota !== null && nota !== undefined && (nota < 0 || nota > 10)) {
      newErrors.nota = "Nota deve estar entre 0 e 10";
    }
    if (peso !== null && peso !== undefined && (peso < 0.1 || peso > 10)) {
      newErrors.peso = "Peso deve estar entre 0.1 e 10";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    } else {
      toast.error("Por favor, corrija os erros no formulário");
    }
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">
            Disciplina <span className="text-destructive">*</span>
          </span>
          <select
            value={disciplinaId}
            onChange={(e) => {
              setDisciplinaId(e.target.value);
              setErrors((prev) => ({ ...prev, disciplinaId: "" }));
            }}
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.disciplinaId && "border-destructive"
            )}
          >
            <option value="">Selecione uma disciplina</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
          {errors.disciplinaId && (
            <p className="text-xs text-destructive">{errors.disciplinaId}</p>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">
            Tipo <span className="text-destructive">*</span>
          </span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as AvaliacaoTipo)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="prova">Prova</option>
            <option value="trabalho">Trabalho</option>
            <option value="seminario">Seminário</option>
          </select>
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium">
          Data e hora <span className="text-destructive">*</span>
        </span>
        <Input
          type="datetime-local"
          value={dataLocal}
          onChange={(e) => {
            setDataLocal(e.target.value);
            setErrors((prev) => ({ ...prev, dataLocal: "" }));
          }}
          className={cn(errors.dataLocal && "border-destructive")}
        />
        {errors.dataLocal && (
          <p className="text-xs text-destructive">{errors.dataLocal}</p>
        )}
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Descrição</span>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: Cap. 1–3; lista 1 e 2; apresentação de tópicos..."
          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">Nota (opcional)</span>
          <Input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={nota ?? ""}
            onChange={(e) => {
              const value =
                e.target.value === "" ? null : Number(e.target.value);
              setNota?.(value);
              setErrors((prev) => ({ ...prev, nota: "" }));
            }}
            placeholder="0.0 - 10.0"
            className={cn("w-full", errors.nota && "border-destructive")}
          />
          {errors.nota ? (
            <p className="text-xs text-destructive">{errors.nota}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nota obtida na avaliação (0 a 10)
            </p>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Peso (opcional)</span>
          <Input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={peso ?? ""}
            onChange={(e) => {
              const value =
                e.target.value === "" ? null : Number(e.target.value);
              setPeso?.(value);
              setErrors((prev) => ({ ...prev, peso: "" }));
            }}
            placeholder="1.0"
            className={cn("w-full", errors.peso && "border-destructive")}
          />
          {errors.peso ? (
            <p className="text-xs text-destructive">{errors.peso}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Peso para cálculo de média ponderada (padrão: 1.0)
            </p>
          )}
        </label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Resumo dos assuntos (opcional)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGerarResumoIA}
            disabled={loadingResumo}
          >
            {loadingResumo ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar com IA
              </>
            )}
          </Button>
        </div>
        <textarea
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          placeholder="Resumo a estudar para esta avaliação..."
          className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );
}
