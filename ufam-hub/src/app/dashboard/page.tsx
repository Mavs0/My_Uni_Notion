"use client";
import { useMemo, useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Grid3x3,
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
  Trophy,
} from "lucide-react";
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
import {
  GoogleCalendarIntegration,
  SyncDisciplinasWithCalendar,
} from "@/components/GoogleCalendarIntegration";
import { useDisciplinas, type Disciplina } from "@/hooks/useDisciplinas";
import { useAvaliacoes, type Avaliacao } from "@/hooks/useAvaliacoes";

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

function GradeSemanalCompacta({ disciplinas }: { disciplinas: Disciplina[] }) {
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
      <div className="text-center py-8">
        <Grid3x3 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Nenhuma disciplina com horários cadastrada
        </p>
        <Link
          href="/disciplinas"
          className="text-xs text-primary hover:underline mt-2 inline-block"
        >
          Adicionar disciplinas →
        </Link>
      </div>
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
}

function EventosSemana({
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
      <div className="text-center py-4">
        <Calendar className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Nenhum evento esta semana</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
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
            className={`rounded-lg border p-3 ${
              corMap[evento.cor] || corMap.zinc
            } transition-all hover:shadow-sm`}
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
}
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
  const [search, setSearch] = useState("");
  const [periodoEstatisticas, setPeriodoEstatisticas] = useState(30);
  const [estatisticas, setEstatisticas] = useState<EstatisticasData | null>(
    null
  );
  const [loadingEstatisticas, setLoadingEstatisticas] = useState(false);
  const [showEstatisticas, setShowEstatisticas] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  const [loadingMetas, setLoadingMetas] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const {
    disciplinas,
    loading: loadingDisc,
    error: errorDisc,
  } = useDisciplinas();
  const { avaliacoes, loading: loadingAv, error: errorAv } = useAvaliacoes();
  useEffect(() => {
    const loadEstatisticas = async () => {
      try {
        setLoadingEstatisticas(true);
        const response = await fetch(
          `/api/estatisticas?periodo=${periodoEstatisticas}`
        );
        if (response.ok) {
          const data = await response.json();
          setEstatisticas(data);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoadingEstatisticas(false);
      }
    };
    loadEstatisticas();
    loadMetas();
    loadNotificacoes();
  }, [periodoEstatisticas]);

  const loadNotificacoes = async () => {
    try {
      setLoadingNotificacoes(true);
      const response = await fetch("/api/notificacoes/recentes?limit=5");
      if (response.ok) {
        const { notificacoes: notifData } = await response.json();
        setNotificacoes(notifData || []);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoadingNotificacoes(false);
    }
  };

  const loadMetas = async () => {
    try {
      setLoadingMetas(true);
      const response = await fetch("/api/metas");
      if (response.ok) {
        const { metas: metasData } = await response.json();
        setMetas(metasData || []);
      }
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
    } finally {
      setLoadingMetas(false);
    }
  };
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
  if (loadingDisc || loadingAv) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LayoutDashboard className="size-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }
  if (errorDisc || errorAv) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
          {errorDisc || errorAv || "Erro ao carregar dados"}
        </div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu semestre</p>
      </header>
      {}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">{totalDisciplinas}</div>
          <div className="text-xs text-muted-foreground mt-1">Disciplinas</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">{totalAvaliacoesSemana}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Avaliações (7d)
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">{hojeNaGrade.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Aulas hoje</div>
        </div>
        {estatisticas && (
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">
              {estatisticas.horasPorDisciplina
                .reduce((acc, item) => acc + item.horasEstudadas, 0)
                .toFixed(0)}
              h
            </div>
            <div className="text-xs text-muted-foreground mt-1">Estudadas</div>
          </div>
        )}
      </div>
      {}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Notificações Recentes">
            {loadingNotificacoes ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação recente
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacoes.map((notif) => {
                  const dias = Math.ceil(
                    (new Date(notif.data).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const disciplinaNome =
                    notif.disciplina_id &&
                    disciplinasMap.get(notif.disciplina_id)?.nome;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        notif.urgente
                          ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 ${
                          notif.tipo === "avaliacao"
                            ? "text-blue-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {notif.tipo === "avaliacao" ? (
                          <GraduationCap className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {notif.titulo}
                        </div>
                        {disciplinaNome && (
                          <div className="text-xs text-muted-foreground">
                            {disciplinaNome}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {dias === 0
                            ? "Hoje"
                            : dias === 1
                            ? "Amanhã"
                            : dias < 0
                            ? `Há ${Math.abs(dias)} dias`
                            : `Em ${dias} dias`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 text-center">
                  <Link
                    href="/avaliacoes"
                    className="text-xs text-primary hover:underline"
                  >
                    Ver todas →
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
        <div>
          <Card title="Próximas Avaliações">
            {proximasAvaliacoes.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma avaliação próxima
                </p>
              </div>
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
                {proximasAvaliacoes.length > 3 && (
                  <div className="pt-2 text-center">
                    <a
                      href="/avaliacoes"
                      className="text-xs text-primary hover:underline"
                    >
                      Ver todas ({proximasAvaliacoes.length}) →
                    </a>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      {}
      <Card
        title="Grade Semanal"
        right={
          <Link
            href="/grade"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver completa
            <LinkIcon className="h-3 w-3" />
          </Link>
        }
      >
        <GradeSemanalCompacta disciplinas={disciplinas} />
      </Card>
      {}
      <Card title="Ações Rápidas">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <a
            href="/disciplinas"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:scale-105"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Disciplinas</span>
          </a>
          <a
            href="/avaliacoes"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:scale-105"
          >
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Avaliações</span>
          </a>
          <a
            href="/calendar"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:scale-105"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Calendário</span>
          </a>
          <a
            href="/chat"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:scale-105"
          >
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Chat IA</span>
          </a>
          <a
            href="/revisao"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:scale-105"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Revisão</span>
          </a>
          <a
            href="/gamificacao"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent/50 hover:scale-105"
          >
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Gamificação</span>
          </a>
        </div>
      </Card>
      {}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GoogleCalendarIntegration />
        </div>
        <div className="space-y-4">
          <SyncDisciplinasWithCalendar />
          <Card title="Esta Semana">
            <EventosSemana
              avaliacoes={proximasAvaliacoes}
              hojeNaGrade={hojeNaGrade}
              disciplinasMap={disciplinasMap}
              disciplinas={disciplinas}
            />
          </Card>
        </div>
      </div>
      {}
      {estatisticas && (
        <Card title="Estatísticas de Estudo">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Visualize seu progresso e desempenho
            </p>
            <button
              onClick={() => setShowEstatisticas(!showEstatisticas)}
              className="text-sm text-primary hover:underline"
            >
              {showEstatisticas ? "Ocultar" : "Mostrar"} estatísticas
            </button>
          </div>
          {showEstatisticas && (
            <div className="space-y-6 pt-4 border-t">
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriodoEstatisticas(7)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    periodoEstatisticas === 7
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  7 dias
                </button>
                <button
                  onClick={() => setPeriodoEstatisticas(30)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    periodoEstatisticas === 30
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  30 dias
                </button>
                <button
                  onClick={() => setPeriodoEstatisticas(90)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    periodoEstatisticas === 90
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  90 dias
                </button>
              </div>
              {}
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const mediasComNota =
                    estatisticas.comparativoDesempenho.filter(
                      (item) => item.media !== null
                    );
                  const mediaGeral =
                    mediasComNota.length > 0
                      ? mediasComNota.reduce(
                          (acc, item) => acc + (item.media || 0),
                          0
                        ) / mediasComNota.length
                      : null;
                  return (
                    <>
                      <div className="rounded-lg border p-3 text-center">
                        <div className="text-xl font-bold">
                          {mediaGeral !== null ? mediaGeral.toFixed(1) : "—"}
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
                              (d) => d.horasEstudadas > 0
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
              {}
              {estatisticas.horasPorDisciplina.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      Horas por Disciplina
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={estatisticas.horasPorDisciplina.map((item) => ({
                          nome: item.disciplinaNome,
                          horas: item.horasEstudadas,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                    (item) => item.media !== null
                  ).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Desempenho</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={estatisticas.comparativoDesempenho
                            .filter((item) => item.media !== null)
                            .map((item) => ({
                              nome: item.disciplinaNome,
                              media: item.media || 0,
                            }))
                            .sort((a, b) => b.media - a.media)}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" domain={[0, 10]} fontSize={11} />
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
            </div>
          )}
        </Card>
      )}
      {}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Progresso por Disciplina">
            {estatisticas && estatisticas.horasPorDisciplina.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={estatisticas.horasPorDisciplina
                      .map((item) => ({
                        nome: item.disciplinaNome,
                        horas: item.horasEstudadas,
                        meta: item.horasSemana * 4,
                        progresso:
                          item.horasSemana > 0
                            ? (item.horasEstudadas / (item.horasSemana * 4)) *
                              100
                            : 0,
                      }))
                      .sort((a, b) => b.horas - a.horas)}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="nome"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                    />
                    <YAxis fontSize={11} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (name === "horas") return [`${value}h`, "Estudadas"];
                        if (name === "meta")
                          return [`${value}h`, "Meta Mensal"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="horas"
                      fill="#3b82f6"
                      name="Horas Estudadas"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="meta"
                      fill="#94a3b8"
                      name="Meta Mensal"
                      radius={[4, 4, 0, 0]}
                      opacity={0.5}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3">
                  {estatisticas.horasPorDisciplina.slice(0, 4).map((item) => {
                    const progresso =
                      item.horasSemana > 0
                        ? (item.horasEstudadas / (item.horasSemana * 4)) * 100
                        : 0;
                    return (
                      <div
                        key={item.disciplinaId}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {item.disciplinaNome}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {progresso.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={Math.min(100, progresso)} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.horasEstudadas.toFixed(1)}h</span>
                          <span>
                            Meta: {(item.horasSemana * 4).toFixed(0)}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum dado de progresso disponível
                </p>
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          {metas.length > 0 && (
            <Card title="Metas de Estudo">
              <div className="space-y-3">
                {metas.slice(0, 3).map((meta) => {
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
                })}
                <Link
                  href="/metas"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Ver todas as metas
                  <LinkIcon className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          )}
          <Card title="Notificações Recentes">
            {loadingNotificacoes ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação recente
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacoes.map((notif) => {
                  const dias = Math.ceil(
                    (new Date(notif.data).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const disciplinaNome =
                    notif.disciplina_id &&
                    disciplinasMap.get(notif.disciplina_id)?.nome;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        notif.urgente
                          ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 ${
                          notif.tipo === "avaliacao"
                            ? "text-blue-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {notif.tipo === "avaliacao" ? (
                          <GraduationCap className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {notif.titulo}
                        </div>
                        {disciplinaNome && (
                          <div className="text-xs text-muted-foreground">
                            {disciplinaNome}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {dias === 0
                            ? "Hoje"
                            : dias === 1
                            ? "Amanhã"
                            : dias < 0
                            ? `Há ${Math.abs(dias)} dias`
                            : `Em ${dias} dias`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 text-center">
                  <Link
                    href="/avaliacoes"
                    className="text-xs text-primary hover:underline"
                  >
                    Ver todas →
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      {}
    </main>
  );
}
