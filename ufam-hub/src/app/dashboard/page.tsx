"use client";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, memo, useCallback } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Grid3x3,
  HelpCircle,
  MapPin,
  MessageSquare,
  Plus,
  Sparkles,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Target,
  BarChart3,
  Link as LinkIcon,
  LayoutDashboard,
  Bell,
  FileText,
  Users,
  Library,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { TipManager } from "@/components/tips/SmartContextualTip";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import {
  StatsSkeleton,
  GradeSemanalSkeleton,
  AvaliacoesSkeleton,
  EventosSemanaSkeleton,
  MetasSkeleton,
  EstatisticasSkeleton,
} from "@/components/dashboard/DashboardSkeletons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
const GoogleCalendarIntegration = dynamic(
  () => import("@/components/GoogleCalendarIntegration").then((m) => m.GoogleCalendarIntegration),
  { ssr: false, loading: () => <div className="rounded-lg border p-6 animate-pulse"><div className="h-32 bg-muted rounded" /></div> }
);
const SyncDisciplinasWithCalendar = dynamic(
  () => import("@/components/GoogleCalendarIntegration").then((m) => m.SyncDisciplinasWithCalendar),
  { ssr: false }
);
import {
  useDisciplinas,
  type Disciplina,
} from "@/hooks/useDisciplinasOptimized";
import { useAvaliacoes, type Avaliacao } from "@/hooks/useAvaliacoesOptimized";
const WidgetGrid = dynamic(
  () => import("@/components/dashboard/WidgetGrid").then((m) => m.WidgetGrid),
  { ssr: false, loading: () => <div className="rounded-lg border p-6 animate-pulse"><div className="h-48 bg-muted rounded" /></div> }
);
import { Widget } from "@/components/dashboard/DashboardWidget";
const RecommendationsWidget = dynamic(
  () => import("@/components/RecommendationsWidget").then((m) => m.RecommendationsWidget),
  { ssr: false }
);
const WidgetSelector = dynamic(
  () => import("@/components/dashboard/WidgetSelector").then((m) => m.WidgetSelector),
  { ssr: false }
);


type TTipo = "obrigatoria" | "eletiva" | "optativa";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
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
  return date.getDay();
}
function badgeTipo(tipo: TTipo) {
  const map: Record<TTipo, string> = {
    obrigatoria: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    eletiva: "bg-red-500/15 text-red-400 border-red-500/30",
    optativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return `rounded px-2 py-0.5 text-xs border capitalize ${map[tipo]}`;
}
function tipoBadgeAvaliacao(tipo: "prova" | "trabalho" | "seminario") {
  const map: Record<"prova" | "trabalho" | "seminario", string> = {
    prova: "bg-red-500/15 text-red-400 border-red-500/30",
    trabalho: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    seminario: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return `rounded px-2 py-0.5 text-xs border capitalize ${map[tipo]}`;
}

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
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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

const GradeSemanalCompacta = memo(function GradeSemanalCompacta({
  disciplinas,
}: {
  disciplinas: Disciplina[];
}) {
  const aulas = useMemo(() => {
    const aulasList: Array<{
      id: string;
      nome: string;
      tipo: TTipo;
      dia: number;
      inicio: string;
      fim: string;
      local?: string;
      disciplinaId: string;
    }> = [];
    disciplinas.forEach((disciplina) => {
      if (disciplina.horarios && disciplina.horarios.length > 0) {
        disciplina.horarios.forEach((horario) => {
          aulasList.push({
            id: `${disciplina.id}-${horario.id}`,
            nome: disciplina.nome,
            tipo: disciplina.tipo,
            dia: horario.dia,
            inicio: horario.inicio,
            fim: horario.fim,
            local: disciplina.local,
            disciplinaId: disciplina.id,
          });
        });
      }
    });
    return aulasList;
  }, [disciplinas]);
  const timeslots = useMemo(() => {
    const slots = new Set<string>();
    aulas.forEach((aula) => {
      slots.add(`${aula.inicio}-${aula.fim}`);
    });
    return Array.from(slots)
      .map((key) => {
        const [inicio, fim] = key.split("-");
        const [hInicio] = inicio.split(":").map(Number);
        return {
          id: key,
          label: `${hInicio}h`,
          inicio,
          fim,
          sortKey: hInicio * 60 + parseInt(inicio.split(":")[1] || "0"),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 8);
  }, [aulas]);
  function typeClass(tipo: TTipo) {
    switch (tipo) {
      case "obrigatoria":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "eletiva":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "optativa":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
  }
  function inSlot(
    a: { inicio: string; fim: string },
    slot: { inicio: string; fim: string }
  ) {
    return a.inicio === slot.inicio && a.fim === slot.fim;
  }
  if (aulas.length === 0) {
    return (
      <EmptyState
        icon={Grid3x3}
        title="Nenhuma disciplina com horários cadastrada"
        description="Adicione disciplinas e configure seus horários para visualizar sua grade semanal aqui."
        action={{
          label: "Adicionar Disciplinas",
          href: "/disciplinas",
          icon: Plus,
        }}
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DIAS.slice(1, 7).map((dia) => (
            <div
              key={dia}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {dia}
            </div>
          ))}
        </div>
        {}
        <div className="space-y-1">
          {timeslots.map((slot) => (
            <div key={slot.id} className="grid grid-cols-7 gap-1">
              {DIAS.slice(1, 7).map((_, idx) => {
                const dia = idx + 1;
                const aulasDoDia = aulas.filter(
                  (a) => a.dia === dia && inSlot(a, slot)
                );
                return (
                  <div
                    key={`${slot.label}-${dia}`}
                    className="min-h-[60px] border rounded p-1.5 bg-muted/20"
                  >
                    {aulasDoDia.length > 0 ? (
                      <div className="space-y-1">
                        {aulasDoDia.map((a) => (
                          <Link
                            key={a.id}
                            href={`/disciplinas/${a.disciplinaId}`}
                            className={`block rounded border p-1.5 text-[10px] leading-tight hover:opacity-80 transition-opacity ${typeClass(
                              a.tipo
                            )}`}
                            title={`${a.nome} - ${a.inicio}–${a.fim}${
                              a.local ? ` • ${a.local}` : ""
                            }`}
                          >
                            <div className="font-semibold truncate">
                              {a.nome}
                            </div>
                            <div className="opacity-80 text-[9px]">
                              {a.inicio}–{a.fim}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t text-xs flex-wrap">
          <span className="text-muted-foreground">Legenda:</span>
          <span className="rounded border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-yellow-400">
            Obrigatória
          </span>
          <span className="rounded border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-red-400">
            Eletiva
          </span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
            Optativa
          </span>
        </div>
      </div>
    </div>
  );
});

const EventosSemana = memo(function EventosSemana({
  avaliacoes,
  hojeNaGrade,
  disciplinasMap,
  disciplinas,
}: {
  avaliacoes: Avaliacao[];
  hojeNaGrade: Array<{
    disciplinaId: string;
    disciplina: string;
    local?: string;
    inicio: string;
    fim: string;
  }>;
  disciplinasMap: Map<string, Disciplina>;
  disciplinas: Disciplina[];
}) {
  const hoje = new Date();
  const fimSemana = new Date(hoje);
  fimSemana.setDate(hoje.getDate() + 7);
  const avaliacoesSemana = avaliacoes
    .filter((a) => {
      const data = new Date(a.dataISO);
      return data >= hoje && data <= fimSemana;
    })
    .sort(
      (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
    )
    .slice(0, 5);
  const proximasAulas = useMemo(() => {
    const aulas: Array<{
      disciplinaId: string;
      disciplina: string;
      local?: string;
      dia: number;
      diaNome: string;
      inicio: string;
      fim: string;
      dataISO: string;
    }> = [];
    disciplinas.forEach((disc) => {
      disc.horarios?.forEach((h) => {
        const hoje = new Date();
        const diaAtual = hoje.getDay();
        let diasParaProximo = (h.dia - diaAtual + 7) % 7;
        if (diasParaProximo === 0 && h.dia === diaAtual) {
          const agora = new Date();
          const [hora, minuto] = h.inicio.split(":").map(Number);
          const horarioInicio = new Date(agora);
          horarioInicio.setHours(hora, minuto, 0, 0);
          if (agora < horarioInicio) {
            diasParaProximo = 0;
          } else {
            diasParaProximo = 7;
          }
        }
        const proximaData = new Date(hoje);
        proximaData.setDate(hoje.getDate() + diasParaProximo);
        proximaData.setHours(0, 0, 0, 0);
        if (proximaData <= fimSemana) {
          aulas.push({
            disciplinaId: disc.id,
            disciplina: disc.nome,
            local: disc.local,
            dia: h.dia,
            diaNome: DIAS[h.dia],
            inicio: h.inicio,
            fim: h.fim,
            dataISO: proximaData.toISOString(),
          });
        }
      });
    });
    return aulas
      .sort(
        (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
      )
      .slice(0, 5);
  }, [disciplinas]);
  const todosEventos = [
    ...avaliacoesSemana.map((a) => ({
      tipo: "avaliacao" as const,
      id: a.id,
      titulo: disciplinasMap.get(a.disciplinaId)?.nome ?? "Disciplina",
      subtitulo: a.tipo,
      dataISO: a.dataISO,
      local: undefined,
      cor:
        a.tipo === "prova" ? "red" : a.tipo === "trabalho" ? "blue" : "emerald",
    })),
    ...proximasAulas.map((a) => ({
      tipo: "aula" as const,
      id: `aula-${a.disciplinaId}-${a.dia}`,
      titulo: a.disciplina,
      subtitulo: `${a.diaNome} ${a.inicio}–${a.fim}`,
      dataISO: a.dataISO,
      local: a.local,
      cor: "zinc" as const,
    })),
  ].sort(
    (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
  );
  if (todosEventos.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nenhum evento esta semana"
        description="Não há avaliações ou aulas programadas para os próximos 7 dias. Aproveite para revisar o conteúdo ou planejar seus estudos!"
        action={{
          label: "Ver Calendário Completo",
          href: "/calendar",
          icon: Calendar,
        }}
        secondaryAction={{
          label: "Adicionar Avaliação",
          href: "/avaliacoes",
        }}
      />
    );
  }
  return (
    <div
      className="space-y-2 max-h-96 overflow-y-auto"
      role="list"
      aria-label="Eventos da semana"
    >
      {todosEventos.slice(0, 6).map((evento) => {
        const data = new Date(evento.dataISO);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataEvento = new Date(data);
        dataEvento.setHours(0, 0, 0, 0);
        const isHoje = dataEvento.getTime() === hoje.getTime();
        const dias = Math.ceil(
          (data.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const corMap: Record<string, string> = {
          red: "border-red-500/30 bg-red-500/10",
          blue: "border-blue-500/30 bg-blue-500/10",
          emerald: "border-emerald-500/30 bg-emerald-500/10",
          zinc: "border-zinc-500/30 bg-zinc-500/10",
        };
        return (
          <div
            key={evento.id}
            role="listitem"
            className={`rounded-lg border p-3 ${
              corMap[evento.cor] || corMap.zinc
            } transition-all hover:shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2`}
            tabIndex={0}
            aria-label={`${
              evento.tipo === "avaliacao" ? "Avaliação" : "Aula"
            }: ${evento.titulo} em ${fmtDate(evento.dataISO)}`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {evento.tipo === "avaliacao" ? (
                  <GraduationCap className="h-4 w-4 text-zinc-400" />
                ) : (
                  <BookOpen className="h-4 w-4 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-medium truncate">
                    {evento.titulo}
                  </div>
                  {isHoje && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Hoje
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmtDate(evento.dataISO)}
                  </span>
                  {evento.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {evento.local}
                    </span>
                  )}
                  {!isHoje && dias > 0 && (
                    <span className="text-zinc-400">
                      {dias === 1 ? "Amanhã" : `Em ${dias} dias`}
                    </span>
                  )}
                </div>
                {evento.tipo === "avaliacao" && (
                  <div className="mt-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border ${tipoBadgeAvaliacao(
                        evento.subtitulo as "prova" | "trabalho" | "seminario"
                      )}`}
                    >
                      {evento.subtitulo}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {todosEventos.length > 6 && (
        <div className="text-center pt-2">
          <a href="/calendar" className="text-xs text-blue-400 hover:underline">
            Ver todos os eventos →
          </a>
        </div>
      )}
    </div>
  );
});
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
export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [periodoEstatisticas, setPeriodoEstatisticas] = useState(30);
  const [showEstatisticas, setShowEstatisticas] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  const {
    disciplinas,
    loading: loadingDisc,
    error: errorDisc,
  } = useDisciplinas();
  const { avaliacoes, loading: loadingAv, error: errorAv } = useAvaliacoes();

  const { data: estatisticas, isLoading: loadingEstatisticas } = useQuery({
    queryKey: ["estatisticas", periodoEstatisticas],
    queryFn: async () => {
      const res = await fetch(
        `/api/estatisticas?periodo=${periodoEstatisticas}`
      );
      if (!res.ok) throw new Error("Erro ao buscar estatísticas");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: showEstatisticas, // Só buscar quando necessário
  });

  const { data: metasData, isLoading: loadingMetas } = useQuery({
    queryKey: ["metas"],
    queryFn: async () => {
      const res = await fetch("/api/metas");
      if (!res.ok) throw new Error("Erro ao buscar metas");
      const data = await res.json();
      return data.metas || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const { data: notificacoesData, isLoading: loadingNotificacoes } = useQuery({
    queryKey: ["notificacoes", "recentes"],
    queryFn: async () => {
      const res = await fetch("/api/notificacoes/recentes?limit=5");
      if (!res.ok) throw new Error("Erro ao buscar notificações");
      const data = await res.json();
      return data.notificacoes || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos - notificações mudam mais frequentemente
  });

  const { data: onboardingData } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/status");
      if (!res.ok) return { isNewUser: false };
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hora - status de onboarding não muda frequentemente
  });

  const metas = metasData || [];
  const notificacoes = notificacoesData || [];
  const isNewUser = onboardingData?.isNewUser || false;

  const { data: widgetsConfig } = useQuery({
    queryKey: ["dashboard-widgets"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/dashboard/widgets");
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.widgets || data.widgets.length === 0) return null;
        return data;
      } catch (error) {
        console.error("Erro ao carregar widgets:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 1,
  });

  const saveWidgetsMutation = useMutation({
    mutationFn: async (widgets: Widget[]) => {
      const res = await fetch("/api/dashboard/widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgets: widgets.map((w, index) => ({
            id: w.id,
            type: w.type,
            position: index,
            size: w.size || "medium",
            visible: w.visible !== false,
            config: w.config || {},
          })),
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        console.error("Erro ao salvar widgets:", error);
        throw new Error(error.details || error.error || "Erro ao salvar widgets");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
  });

  useEffect(() => {
    if (isNewUser) {
      setShowChecklist(true);
      const timer = setTimeout(() => {
              setShowTour(true);
            }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNewUser]);

  const hoje = weekdayIndex();
  const disciplinasMap = useMemo(
    () => new Map(disciplinas.map((d) => [d.id, d])),
    [disciplinas]
  );
  const hojeNaGrade = useMemo(() => {
    const hojeHorarios: Array<{
      disciplinaId: string;
      disciplina: string;
      local?: string;
      inicio: string;
      fim: string;
    }> = [];
    disciplinas.forEach((disc) => {
      disc.horarios?.forEach((h) => {
        if (h.dia === hoje) {
          hojeHorarios.push({
            disciplinaId: disc.id,
            disciplina: disc.nome,
            local: disc.local,
            inicio: h.inicio,
            fim: h.fim,
          });
        }
      });
    });
    return hojeHorarios.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [hoje, disciplinas]);
  const proximasAvaliacoes = useMemo(() => {
    const base = avaliacoes
      .filter((a) => new Date(a.dataISO) > new Date())
      .sort(
        (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
      );
    if (!search) return base;
    return base.filter((a) => {
      const disc =
        disciplinasMap.get(a.disciplinaId)?.nome?.toLowerCase() || "";
      return disc.includes(search.toLowerCase());
    });
  }, [search, disciplinasMap, avaliacoes]);
  const totalDisciplinas = disciplinas.length;
  const totalAvaliacoesSemana = proximasAvaliacoes.filter(
    (a) => daysUntil(a.dataISO) <= 7
  ).length;
  const progressoHoras = useMemo(() => {
    const tipos: Array<{
      tipo: "obrigatoria" | "eletiva" | "optativa";
      horasCumpridas: number;
      horasNecessarias: number;
    }> = [
      { tipo: "obrigatoria", horasCumpridas: 0, horasNecessarias: 0 },
      { tipo: "eletiva", horasCumpridas: 0, horasNecessarias: 0 },
      { tipo: "optativa", horasCumpridas: 0, horasNecessarias: 0 },
    ];
    disciplinas.forEach((disc) => {
      const tipoIndex = tipos.findIndex((t) => t.tipo === disc.tipo);
      if (tipoIndex >= 0) {
        tipos[tipoIndex].horasNecessarias += disc.horasSemana;
      }
    });
    return tipos.map((h) => ({
      ...h,
      pct: (h.horasCumpridas / Math.max(1, h.horasNecessarias)) * 100,
    }));
  }, [disciplinas]);

  const widgets = useMemo<Widget[]>(() => {
    const defaultWidgets: Widget[] = [
      {
        id: "notificacoes",
        type: "notificacoes",
        title: "Notificações Recentes",
        size: "medium",
        visible: true,
        content: (
          <NotificationCard
            notificacoes={notificacoes}
            loading={loadingNotificacoes}
            disciplinasMap={disciplinasMap}
          />
        ),
      },
      {
        id: "proximas-avaliacoes",
        type: "avaliacoes",
        title: "Próximas Avaliações",
        size: "small",
        visible: true,
        content: loadingAv ? (
          <AvaliacoesSkeleton />
        ) : proximasAvaliacoes.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nenhuma avaliação próxima"
            description="Você não tem avaliações agendadas no momento."
            action={{
              label: "Adicionar Avaliação",
              href: "/avaliacoes",
              icon: Plus,
            }}
          />
        ) : (
          <div className="space-y-2">
            {proximasAvaliacoes.slice(0, 3).map((a) => {
              const dname =
                disciplinasMap.get(a.disciplinaId)?.nome ?? "Disciplina";
              const dias = daysUntil(a.dataISO);
              return (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={tipoBadgeAvaliacao(a.tipo)}>
                        {a.tipo}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {dname}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dias > 0
                        ? `Em ${dias} ${dias === 1 ? "dia" : "dias"}`
                        : dias === 0
                        ? "Hoje"
                        : "Passou"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ),
      },
      {
        id: "grade-semanal",
        type: "grade",
        title: "Grade Semanal",
        size: "large",
        visible: true,
        content: loadingDisc ? (
          <GradeSemanalSkeleton />
        ) : (
          <GradeSemanalCompacta disciplinas={disciplinas} />
        ),
      },
      {
        id: "eventos-semana",
        type: "eventos",
        title: "Esta Semana",
        size: "small",
        visible: true,
        content:
          loadingAv || loadingDisc ? (
            <EventosSemanaSkeleton />
          ) : (
            <EventosSemana
              avaliacoes={proximasAvaliacoes}
              hojeNaGrade={hojeNaGrade}
              disciplinasMap={disciplinasMap}
              disciplinas={disciplinas}
            />
          ),
      },
      {
        id: "metas",
        type: "metas",
        title: "Metas de Estudo",
        size: "small",
        visible: metas.length > 0,
        content: loadingMetas ? (
          <MetasSkeleton />
        ) : metas.length > 0 ? (
          <div className="space-y-3">
            {metas
              .slice(0, 3)
              .map(
                (meta: {
                  id: string;
                  descricao?: string;
                  tipo: string;
                  valor_atual: number;
                  valor_alvo: number;
                }) => {
                  const progresso =
                    meta.valor_alvo > 0
                      ? (meta.valor_atual / meta.valor_alvo) * 100
                      : 0;
                  return (
                    <div key={meta.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate">
                          {meta.descricao || meta.tipo.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground">
                          {progresso.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, progresso)} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {meta.valor_atual.toFixed(1)} / {meta.valor_alvo}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
          </div>
        ) : null,
      },
      {
        id: "grafico-horas",
        type: "grafico-horas",
        title: "Horas Estudadas por Semana",
        size: "medium",
        visible: !!estatisticas,
        content: estatisticas && estatisticas.horasPorSemana ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={estatisticas.horasPorSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="semana" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
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
        ) : loadingEstatisticas ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Sem dados de horas estudadas"
            description="Comece a registrar suas horas de estudo para ver gráficos aqui."
          />
        ),
      },
      {
        id: "distribuicao-carga",
        type: "distribuicao-carga",
        title: "Distribuição de Carga",
        size: "small",
        visible: !!estatisticas && estatisticas.distribuicaoCarga?.length > 0,
        content: estatisticas && estatisticas.distribuicaoCarga?.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estatisticas.distribuicaoCarga}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const percent = entry.percent || 0;
                    const nome = entry.nome || entry.name || "";
                    return `${nome}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="horasSemana"
                >
                  {estatisticas.distribuicaoCarga.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null,
      },
      {
        id: "produtividade",
        type: "produtividade",
        title: "Produtividade",
        size: "small",
        visible: !!estatisticas && estatisticas.produtividade,
        content: estatisticas && estatisticas.produtividade ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Conclusão</span>
                <span className="font-semibold">
                  {estatisticas.produtividade.taxaConclusao.toFixed(0)}%
                </span>
              </div>
              <Progress value={estatisticas.produtividade.taxaConclusao} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <div className="text-2xl font-bold">
                  {estatisticas.produtividade.tarefasConcluidas}
                </div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {estatisticas.produtividade.tarefasTotal}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        ) : null,
      },
      {
        id: "comparativo-desempenho",
        type: "comparativo-desempenho",
        title: "Comparativo de Desempenho",
        size: "medium",
        visible: !!estatisticas && estatisticas.comparativoDesempenho?.length > 0,
        content: estatisticas && estatisticas.comparativoDesempenho?.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticas.comparativoDesempenho.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="disciplinaNome" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar 
                  dataKey="media" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                >
                  {estatisticas.comparativoDesempenho.slice(0, 5).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null,
      },
      {
        id: "evolucao-medias",
        type: "evolucao-medias",
        title: "Evolução de Médias",
        size: "large",
        visible: !!estatisticas && estatisticas.evolucaoMedias?.length > 0,
        content: estatisticas && estatisticas.evolucaoMedias?.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 10]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {estatisticas.evolucaoMedias.slice(0, 3).map((disciplina: any, index: number) => (
                  <Line
                    key={disciplina.disciplinaId}
                    type="monotone"
                    dataKey="media"
                    data={disciplina.medias}
                    name={disciplina.disciplinaNome}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null,
      },
      {
        id: "calendario-mensal",
        type: "calendario-mensal",
        title: "Calendário do Mês",
        size: "medium",
        visible: true,
        content: (
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div key={dia} className="text-center font-medium text-muted-foreground py-1">
                  {dia}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date();
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
                const day = i - firstDay + 1;
                const isCurrentMonth = day > 0 && day <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                const isToday = isCurrentMonth && day === date.getDate();
                const hasEvent = isCurrentMonth && avaliacoes.some((a) => {
                  const avalDate = new Date(a.dataISO);
                  return avalDate.getDate() === day && avalDate.getMonth() === date.getMonth();
                });
                
                return (
                  <div
                    key={i}
                    className={`
                      aspect-square flex items-center justify-center text-xs rounded
                      ${isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-30"}
                      ${isToday ? "bg-primary text-primary-foreground font-semibold" : ""}
                      ${hasEvent && !isToday ? "bg-primary/10 border border-primary/20" : ""}
                    `}
                  >
                    {isCurrentMonth ? day : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Hoje</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20"></div>
                <span>Avaliação</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "insights",
        type: "insights",
        title: "Insights",
        size: "small",
        visible: true,
        content: (
          <div className="space-y-3">
            {proximasAvaliacoes.length > 0 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Você tem {proximasAvaliacoes.length} avaliação{proximasAvaliacoes.length > 1 ? "ões" : ""} próxima{proximasAvaliacoes.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Revise seus materiais de estudo
                    </p>
                  </div>
                </div>
              </div>
            )}
            {hojeNaGrade.length > 0 && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {hojeNaGrade.length} aula{hojeNaGrade.length > 1 ? "s" : ""} hoje
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Não se esqueça de levar seus materiais
                    </p>
                  </div>
                </div>
              </div>
            )}
            {metas.length > 0 && metas.some((m: any) => {
              const progresso = m.valor_alvo > 0 ? (m.valor_atual / m.valor_alvo) * 100 : 0;
              return progresso >= 80 && progresso < 100;
            }) && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Você está próximo de alcançar suas metas!
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Continue assim para completá-las
                    </p>
                  </div>
                </div>
              </div>
            )}
            {(!proximasAvaliacoes.length && !hojeNaGrade.length && metas.length === 0) && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum insight no momento</p>
              </div>
            )}
          </div>
        ),
      },
    ];

    if (widgetsConfig?.widgets && widgetsConfig.widgets.length > 0) {
      const savedOrder = [...widgetsConfig.widgets].sort(
        (a: { position: number }, b: { position: number }) =>
          a.position - b.position
      );

      const defaultWidgetsMapById = new Map(
        defaultWidgets.map((w) => [w.id, w])
      );
      const defaultWidgetsMapByType = new Map(
        defaultWidgets.map((w) => [w.type, w])
      );
      
      const shouldAddDefaults = !isNewUser;

      interface SavedWidget {
        id?: string;
        widget_type?: string;
        size?: string;
        visible?: boolean;
        widget_config?: Record<string, any>;
        config?: Record<string, any>;
        position?: number;
      }

      const mappedWidgetIds = new Set<string>();
      const mappedWidgetTypes = new Set<string>();

      const mappedWidgets = savedOrder
        .map((saved: SavedWidget) => {
          const defaultWidget = 
            (saved.id && defaultWidgetsMapById.get(saved.id)) ||
            (saved.widget_type && defaultWidgetsMapByType.get(saved.widget_type));
          
          if (defaultWidget) {
            mappedWidgetIds.add(defaultWidget.id);
            mappedWidgetTypes.add(defaultWidget.type);
            
            return {
              ...defaultWidget,
              size: (saved.size || defaultWidget.size || "medium") as
                | "small"
                | "medium"
                | "large",
              visible: saved.visible !== false,
              config: saved.widget_config || saved.config || {},
            };
          }
          return null;
        })
        .filter((w): w is NonNullable<typeof w> => w !== null && w.id !== undefined)
        .map((w) => ({
          ...w,
          size: (w.size || "medium") as "small" | "medium" | "large",
        })) as Widget[];

      const newWidgets = shouldAddDefaults 
        ? defaultWidgets.filter(
            (w) => !mappedWidgetIds.has(w.id) && !mappedWidgetTypes.has(w.type)
          )
        : [];
      
      const allWidgetsMap = new Map<string, Widget>();
      
      mappedWidgets.forEach((w) => {
        if (!allWidgetsMap.has(w.id)) {
          allWidgetsMap.set(w.id, w);
        }
      });
      
      newWidgets.forEach((w) => {
        if (!allWidgetsMap.has(w.id)) {
          allWidgetsMap.set(w.id, {
            ...w,
            size: (w.size || "medium") as "small" | "medium" | "large",
          });
        }
      });
      
      return Array.from(allWidgetsMap.values());
    }

    if (isNewUser) {
      return [];
    }
    
    return defaultWidgets.map((w) => ({
      ...w,
      size: (w.size || "medium") as "small" | "medium" | "large",
    }));
  }, [
    notificacoes,
    loadingNotificacoes,
    disciplinasMap,
    loadingAv,
    proximasAvaliacoes,
    loadingDisc,
    disciplinas,
    loadingMetas,
    metas,
    hojeNaGrade,
    avaliacoes,
    widgetsConfig,
    estatisticas,
    loadingEstatisticas,
    isNewUser,
  ]);

  const handleReorder = useCallback(
    async (newWidgets: Widget[]) => {
      await saveWidgetsMutation.mutateAsync(newWidgets);
    },
    [saveWidgetsMutation]
  );

  const allAvailableWidgets = useMemo(() => {
    return [
      {
        id: "notificacoes",
        type: "notificacoes",
        title: "Notificações Recentes",
        description: "Veja suas notificações recentes e importantes",
        icon: <Bell className="h-5 w-5" />,
        size: "medium" as const,
        category: "Notificações",
      },
      {
        id: "proximas-avaliacoes",
        type: "avaliacoes",
        title: "Próximas Avaliações",
        description: "Acompanhe suas próximas avaliações e prazos",
        icon: <GraduationCap className="h-5 w-5" />,
        size: "small" as const,
        category: "Avaliações",
      },
      {
        id: "grade-semanal",
        type: "grade",
        title: "Grade Semanal",
        description: "Visualize sua grade horária semanal completa",
        icon: <Calendar className="h-5 w-5" />,
        size: "large" as const,
        category: "Horários",
      },
      {
        id: "eventos-semana",
        type: "eventos",
        title: "Esta Semana",
        description: "Veja os eventos e compromissos desta semana",
        icon: <Clock className="h-5 w-5" />,
        size: "small" as const,
        category: "Eventos",
      },
      {
        id: "metas",
        type: "metas",
        title: "Metas de Estudo",
        description: "Acompanhe o progresso das suas metas de estudo",
        icon: <Target className="h-5 w-5" />,
        size: "small" as const,
        category: "Metas",
      },
      {
        id: "grafico-horas",
        type: "grafico-horas",
        title: "Horas Estudadas por Semana",
        description: "Gráfico de horas estudadas ao longo das semanas",
        icon: <BarChart3 className="h-5 w-5" />,
        size: "medium" as const,
        category: "Estatísticas",
      },
      {
        id: "distribuicao-carga",
        type: "distribuicao-carga",
        title: "Distribuição de Carga",
        description: "Distribuição de carga horária por disciplina",
        icon: <BarChart3 className="h-5 w-5" />,
        size: "small" as const,
        category: "Estatísticas",
      },
      {
        id: "produtividade",
        type: "produtividade",
        title: "Produtividade",
        description: "Estatísticas de produtividade e conclusão de tarefas",
        icon: <TrendingUp className="h-5 w-5" />,
        size: "small" as const,
        category: "Estatísticas",
      },
      {
        id: "comparativo-desempenho",
        type: "comparativo-desempenho",
        title: "Comparativo de Desempenho",
        description: "Compare seu desempenho entre disciplinas",
        icon: <BarChart3 className="h-5 w-5" />,
        size: "medium" as const,
        category: "Estatísticas",
      },
      {
        id: "evolucao-medias",
        type: "evolucao-medias",
        title: "Evolução de Médias",
        description: "Acompanhe a evolução das suas médias ao longo do tempo",
        icon: <TrendingUp className="h-5 w-5" />,
        size: "large" as const,
        category: "Estatísticas",
      },
      {
        id: "calendario-mensal",
        type: "calendario-mensal",
        title: "Calendário do Mês",
        description: "Calendário mensal com suas avaliações marcadas",
        icon: <Calendar className="h-5 w-5" />,
        size: "medium" as const,
        category: "Calendário",
      },
      {
        id: "insights",
        type: "insights",
        title: "Insights",
        description: "Insights e recomendações personalizadas",
        icon: <Sparkles className="h-5 w-5" />,
        size: "small" as const,
        category: "Insights",
      },
    ];
  }, []);

  const createWidgetFromType = useCallback(
    (widgetType: string): Widget | null => {
      const widgetOption = allAvailableWidgets.find((w) => w.type === widgetType);
      if (!widgetOption) return null;

      const baseWidget: Widget = {
        id: `${widgetType}_${Date.now()}`,
        type: widgetType,
        title: widgetOption.title,
        size: widgetOption.size,
        visible: true,
        content: <div>Widget {widgetOption.title}</div>, // Placeholder - será substituído pelo conteúdo real
      };

      return baseWidget;
    },
    [allAvailableWidgets]
  );

  const handleAddWidget = useCallback(
    async (widgetType: string) => {
      const exists = widgets.some((w) => w.type === widgetType);
      if (exists) {
        return; // Widget já existe
      }

      const widgetOption = allAvailableWidgets.find((w) => w.type === widgetType);
      if (!widgetOption) return;

      const newWidget: Widget = {
        id: widgetType,
        type: widgetType,
        title: widgetOption.title,
        size: widgetOption.size,
        visible: true,
        content: <div className="p-4 text-center text-muted-foreground">Carregando widget...</div>, // Placeholder temporário
      };

      const updatedWidgets = [...widgets, newWidget];
      await handleReorder(updatedWidgets);
      setShowWidgetSelector(false);
      
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] });
    },
    [widgets, handleReorder, allAvailableWidgets, queryClient]
  );
  if (loadingDisc || loadingAv) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        role="status"
        aria-live="polite"
        aria-label="Carregando dashboard"
      >
        <div className="text-center">
          <LayoutDashboard
            className="size-12 animate-pulse mx-auto mb-4 text-primary"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }
  if (errorDisc || errorAv) {
    return (
      <main
        className="mx-auto max-w-6xl space-y-6 p-6"
        role="main"
        aria-label="Dashboard principal"
      >
        <div
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500"
          role="alert"
          aria-live="assertive"
        >
          {errorDisc || errorAv || "Erro ao carregar dados"}
        </div>
      </main>
    );
  }
  return (
    <main
      className="mx-auto max-w-6xl space-y-6 p-6"
      data-tour="dashboard"
      role="main"
      aria-label="Dashboard principal"
    >
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalDisciplinas} disciplinas · {totalAvaliacoesSemana} avaliações esta semana
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/ajuda">
              <HelpCircle className="h-4 w-4 mr-2" />
              Ajuda
            </Link>
          </Button>
          {isNewUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTour(true)}
              aria-label="Iniciar tour guiado do dashboard"
            >
              Iniciar Tour
            </Button>
          )}
        </div>
      </header>

      {/* Checklist de Onboarding */}
      {showChecklist && <OnboardingChecklist />}

      {/* Tour Guiado */}
      <OnboardingTour
        open={showTour}
        onComplete={() => {
          setShowTour(false);
          setShowChecklist(false);
        }}
        onSkip={() => {
          setShowTour(false);
        }}
      />

      {/* Dicas Contextuais Inteligentes */}
      <TipManager pagina="/dashboard" maxTips={1} />

      {/* Estatísticas rápidas */}
      {loadingDisc || loadingAv ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">{totalDisciplinas}</div>
              <div className="text-xs text-muted-foreground">Disciplinas</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-xl font-bold">{totalAvaliacoesSemana}</div>
              <div className="text-xs text-muted-foreground">Avaliações (7d)</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold">{hojeNaGrade.length}</div>
              <div className="text-xs text-muted-foreground">Aulas hoje</div>
            </div>
          </div>
          {estatisticas && (
            <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xl font-bold">
                  {estatisticas.horasPorDisciplina
                    .reduce(
                      (acc: number, item: { horasEstudadas: number }) =>
                        acc + item.horasEstudadas,
                      0
                    )
                    .toFixed(0)}
                  h
                </div>
                <div className="text-xs text-muted-foreground">Estudadas</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widgets arrastáveis */}
      <WidgetGrid
        widgets={widgets}
        onReorder={handleReorder}
        onToggleVisibility={async (id) => {
          const updated = widgets.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
          );
          await handleReorder(updated);
        }}
        onAddWidget={() => setShowWidgetSelector(true)}
        availableWidgets={allAvailableWidgets}
      />

      {/* Dialog de seleção de widgets */}
      <WidgetSelector
        availableWidgets={allAvailableWidgets}
        currentWidgets={widgets}
        onAddWidget={handleAddWidget}
        open={showWidgetSelector}
        onOpenChange={setShowWidgetSelector}
      />
      {}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GoogleCalendarIntegration />
        </div>
        <div className="space-y-4">
          <SyncDisciplinasWithCalendar />
          <Card title="Esta Semana">
            {loadingAv || loadingDisc ? (
              <EventosSemanaSkeleton />
            ) : (
              <EventosSemana
                avaliacoes={proximasAvaliacoes}
                hojeNaGrade={hojeNaGrade}
                disciplinasMap={disciplinasMap}
                disciplinas={disciplinas}
              />
            )}
          </Card>
        </div>
      </div>
      {}
      {loadingEstatisticas ? (
        <EstatisticasSkeleton />
      ) : estatisticas ? (
        <Card title="Estatísticas de Estudo">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Visualize seu progresso e desempenho
            </p>
            <button
              onClick={() => setShowEstatisticas(!showEstatisticas)}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label={
                showEstatisticas
                  ? "Ocultar estatísticas"
                  : "Mostrar estatísticas"
              }
              aria-expanded={showEstatisticas}
            >
              {showEstatisticas ? "Ocultar" : "Mostrar"} estatísticas
            </button>
          </div>
          {showEstatisticas && (
            <div className="space-y-6 pt-4 border-t">
              <div
                className="flex gap-2"
                role="group"
                aria-label="Selecionar período das estatísticas"
              >
                <Button
                  variant={periodoEstatisticas === 7 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodoEstatisticas(7)}
                  aria-pressed={periodoEstatisticas === 7}
                  aria-label="Estatísticas dos últimos 7 dias"
                >
                  7 dias
                </Button>
                <Button
                  variant={periodoEstatisticas === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodoEstatisticas(30)}
                  aria-pressed={periodoEstatisticas === 30}
                  aria-label="Estatísticas dos últimos 30 dias"
                >
                  30 dias
                </Button>
                <Button
                  variant={periodoEstatisticas === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodoEstatisticas(90)}
                  aria-pressed={periodoEstatisticas === 90}
                  aria-label="Estatísticas dos últimos 90 dias"
                >
                  90 dias
                </Button>
              </div>
              {loadingEstatisticas ? (
                <EstatisticasSkeleton />
              ) : estatisticas ? (
                <>
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const mediasComNota =
                    estatisticas.comparativoDesempenho.filter(
                          (item: { media: number | null }) =>
                            item.media !== null
                    );
                  const mediaGeral =
                    mediasComNota.length > 0
                      ? mediasComNota.reduce(
                              (acc: number, item: { media: number | null }) =>
                                acc + (item.media || 0),
                          0
                        ) / mediasComNota.length
                      : null;
                  return (
                    <>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-xl font-bold">
                              {mediaGeral !== null
                                ? mediaGeral.toFixed(1)
                                : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Média Geral
                        </div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-xl font-bold">
                          {estatisticas.produtividade.tarefasConcluidas}/
                          {estatisticas.produtividade.tarefasTotal}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Tarefas
                        </div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-xl font-bold">
                          {
                            estatisticas.horasPorDisciplina.filter(
                                  (d: { horasEstudadas: number }) =>
                                    d.horasEstudadas > 0
                            ).length
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Ativas
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              {estatisticas.horasPorDisciplina.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      Horas por Disciplina
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                            data={estatisticas.horasPorDisciplina.map(
                              (item: {
                                disciplinaNome: string;
                                horasEstudadas: number;
                              }) => ({
                          nome: item.disciplinaNome,
                          horas: item.horasEstudadas,
                              })
                            )}
                      >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.3}
                            />
                        <XAxis
                          dataKey="nome"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar
                          dataKey="horas"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {estatisticas.comparativoDesempenho.filter(
                        (item: { media: number | null }) => item.media !== null
                  ).length > 0 && (
                    <div>
                          <h3 className="text-sm font-medium mb-3">
                            Desempenho
                          </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={estatisticas.comparativoDesempenho
                                .filter(
                                  (item: { media: number | null }) =>
                                    item.media !== null
                                )
                                .map(
                                  (item: {
                                    disciplinaNome: string;
                                    media: number | null;
                                  }) => ({
                              nome: item.disciplinaNome,
                              media: item.media || 0,
                                  })
                                )
                                .sort(
                                  (
                                    a: { media: number },
                                    b: { media: number }
                                  ) => b.media - a.media
                                )}
                          layout="vertical"
                        >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.3}
                              />
                              <XAxis
                                type="number"
                                domain={[0, 10]}
                                fontSize={11}
                              />
                          <YAxis
                            dataKey="nome"
                            type="category"
                            width={80}
                            fontSize={11}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="media"
                            fill="#10b981"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
                </>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}
      {}
      <div className="space-y-4">
          {loadingMetas ? (
            <MetasSkeleton />
          ) : metas.length > 0 ? (
            <Card title="Metas de Estudo">
              <div className="space-y-3">
                {metas
                  .slice(0, 3)
                  .map(
                    (meta: {
                      id: string;
                      descricao?: string;
                      tipo: string;
                      valor_atual: number;
                      valor_alvo: number;
                    }) => {
                  const progresso =
                    meta.valor_alvo > 0
                      ? (meta.valor_atual / meta.valor_alvo) * 100
                      : 0;
                  return (
                    <div key={meta.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate">
                          {meta.descricao || meta.tipo.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground">
                          {progresso.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, progresso)} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {meta.valor_atual.toFixed(1)} / {meta.valor_alvo}
                        </span>
                      </div>
                    </div>
                  );
                    }
                  )}
                <Link
                  href="/metas"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Ver todas as metas
                  <LinkIcon className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ) : null}
          <RecommendationsWidget limit={5} />
      </div>
      {}
    </main>
  );
}
