"use client";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { ColorPicker } from "@/components/ui/color-picker";
import { useAvaliacoes } from "@/hooks/useAvaliacoes";
import { useTarefas, type Tarefa } from "@/hooks/useTarefas";
import { useNotas } from "@/hooks/useNotas";
import {
  Loader2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  XCircle,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Flag,
  ArrowLeft,
  Clock,
  MapPin,
  BookOpen,
  ClipboardList,
  Folder,
  GraduationCap,
  Target,
  Sparkles,
  MoreVertical,
  Palette,
  Check,
  Pencil,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Search,
  ExternalLink,
} from "lucide-react";
import { COLAB_WEB_LOGIN_URL } from "@/lib/external-links";
import { EditDisciplinaDialog } from "@/components/EditDisciplinaDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormStepper } from "@/components/forms/FormStepper";

type TTipo = "obrigatoria" | "eletiva" | "optativa";
type Disciplina = {
  id: string;
  nome: string;
  tipo: TTipo;
  horasSemana: number;
  local?: string;
  horarios?: { dia: number; inicio: string; fim: string }[];
};
type AvaliacaoTipo = "prova" | "trabalho" | "seminario";
type Avaliacao = {
  id: string;
  disciplinaId: string;
  tipo: AvaliacaoTipo;
  dataISO: string;
  descricao?: string;
  resumo_assuntos?: string;
  gerado_por_ia?: boolean;
};
type Material = {
  id: string;
  titulo: string;
  url?: string;
  tipo: "url" | "pdf" | "svg";
  arquivo?: string;
  nomeArquivo?: string;
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function darkenHex(hex: string, amount: number): string {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * (1 - amount))));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * (1 - amount))));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * (1 - amount))));
  return `#${[r, g, b]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function truncatePreview(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars).trimEnd()}…`;
}
function fmtDate(dt: string | Date | null | undefined) {
  if (dt == null) return "—";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const RESUMO_AVALIACAO_MAX_DISC = 500;

function splitDateTimeLocalDisc(isoLocal: string) {
  if (!isoLocal || !isoLocal.includes("T")) {
    const t = new Date(Date.now() + 86400000);
    const s = toLocalInputValue(t);
    const [d, tm] = s.split("T");
    return { date: d, time: (tm || "09:00").slice(0, 5) };
  }
  const [d, tm] = isoLocal.split("T");
  return { date: d || "", time: (tm || "09:00").slice(0, 5) };
}

function joinDateTimeLocalDisc(date: string, time: string) {
  if (!date) return "";
  const t = time && time.length >= 4 ? time.slice(0, 5) : "09:00";
  return `${date}T${t}`;
}
function daysUntil(dtISO: string | null | undefined) {
  if (dtISO == null) return NaN;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dtISO);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return NaN;
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}
function PrioridadeBadge({
  prioridade,
}: {
  prioridade: "baixa" | "media" | "alta";
}) {
  const map = {
    baixa: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    media: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    alta: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs border flex items-center gap-1",
        map[prioridade]
      )}
    >
      <Flag className="h-3 w-3" />
      {prioridade}
    </span>
  );
}

function Section({
  title,
  children,
  right,
  icon,
  cor,
  className,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  icon?: React.ReactNode;
  cor?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-shadow lg:p-7",
        "dark:border-zinc-800 dark:bg-zinc-900/55 dark:shadow-none",
        "hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20",
        className,
      )}
      style={{
        borderLeftWidth: cor ? "3px" : "1px",
        borderLeftColor: cor || undefined,
      }}
    >
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
          {icon && <span style={{ color: cor }}>{icon}</span>}
          {title}
        </h2>
        {right}
      </header>
      {children}
    </section>
  );
}

function isValidDisciplinaId(id: string | undefined): id is string {
  return !!id && id !== "undefined" && id.length > 0;
}

export default function DisciplinaDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [disciplinaArquivada, setDisciplinaArquivada] = useState(false);

  useEffect(() => {
    if (!isValidDisciplinaId(id)) {
      router.replace("/disciplinas");
    }
  }, [id, router]);

  useEffect(() => {
    if (!isValidDisciplinaId(id)) return;
    let cancelled = false;
    fetch(`/api/disciplinas/${id}`)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 403) return res.json();
        return null;
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (data.codigo === "DISCIPLINA_ARQUIVADA") {
          setDisciplinaArquivada(true);
          toast.info("Disciplina arquivada. Desarquive para acessar.");
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  useLayoutEffect(() => {
    if (disciplinaArquivada) router.replace("/disciplinas");
  }, [disciplinaArquivada, router]);

  const {
    disciplinas,
    loading: loadingDisc,
    error: errorDisc,
    updateCor,
  } = useDisciplinas();
  const {
    avaliacoes,
    loading: loadingAval,
    createAvaliacao,
    deleteAvaliacao,
  } = useAvaliacoes({
    disciplinaId: isValidDisciplinaId(id) ? id : undefined,
  });
  const {
    tarefas,
    loading: loadingTarefas,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    toggleConcluida,
  } = useTarefas({
    disciplinaId: isValidDisciplinaId(id) ? id : undefined,
  });
  const {
    notas,
    loading: loadingNotas,
    createNota,
    updateNota,
    deleteNota,
  } = useNotas({
    disciplinaId: isValidDisciplinaId(id) ? id : undefined,
  });

  const disciplina = useMemo(() => {
    if (!disciplinas || disciplinas.length === 0) return null;
    return disciplinas.find((d) => d.id === id) ?? null;
  }, [disciplinas, id]);

  useLayoutEffect(() => {
    if (disciplina && disciplina.ativo === false) {
      toast.info("Disciplina arquivada. Desarquive para acessar.");
      router.replace("/disciplinas");
    }
  }, [disciplina, router]);

  const corDisciplina = disciplina?.cor || "#6366f1";

  const storeKey = (k: string) => `disc:${id}:${k}`;
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [blocosAssistidos, setBlocosAssistidos] = useState<number>(0);
  const [notaToDelete, setNotaToDelete] = useState<string | null>(null);
  const [editDisciplinaOpen, setEditDisciplinaOpen] = useState(false);
  const [disciplinaTab, setDisciplinaTab] = useState<
    "visao" | "anotacoes" | "materiais" | "tarefas" | "avaliacoes"
  >("visao");

  useEffect(() => {
    const saved = localStorage.getItem(storeKey("materials"));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMateriais(parsed);
        }
      } catch (e) {
        console.error("Erro ao carregar materiais do localStorage:", e);
      }
    }
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem(storeKey("blocks"));
    if (saved) {
      try {
        setBlocosAssistidos(parseInt(saved) || 0);
      } catch (e) {
        console.error("Erro ao carregar blocos do localStorage:", e);
      }
    }
  }, [id]);

  useEffect(() => {
    localStorage.setItem(storeKey("materials"), JSON.stringify(materiais));
  }, [materiais, id]);
  useEffect(() => {
    localStorage.setItem(storeKey("blocks"), String(blocosAssistidos));
  }, [blocosAssistidos, id]);

  const proximaAvaliacao = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return [...avaliacoes]
      .filter((a) => {
        if (!a.dataISO) return false;
        return new Date(a.dataISO) >= start;
      })
      .sort((a, b) => {
        const ta = a.dataISO ? new Date(a.dataISO).getTime() : 0;
        const tb = b.dataISO ? new Date(b.dataISO).getTime() : 0;
        return ta - tb;
      })[0];
  }, [avaliacoes]);

  const heroSurfaceStyle = useMemo(() => {
    const base = corDisciplina;
    const deep = darkenHex(base, 0.32);
    return {
      background: `linear-gradient(135deg, ${base} 0%, ${deep} 100%)`,
      boxShadow: `0 24px 48px -12px ${base}66`,
    } as React.CSSProperties;
  }, [corDisciplina]);

  if (disciplinaArquivada) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-col items-center justify-center py-16">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </main>
    );
  }

  if (loadingDisc) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-col items-center justify-center py-16">
          <GraduationCap className="h-12 w-12 animate-pulse text-primary mb-4" />
          <p className="text-muted-foreground">Carregando disciplina...</p>
        </div>
      </main>
    );
  }
  if (errorDisc) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/disciplinas")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <div className="font-medium text-destructive">
              Erro ao carregar disciplina
            </div>
            <div className="text-sm text-muted-foreground">{errorDisc}</div>
          </div>
        </div>
      </main>
    );
  }
  if (!disciplina) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/disciplinas")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="rounded-xl border p-8 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground font-medium">
            Disciplina não encontrada.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            A disciplina pode ter sido removida ou você não tem permissão para
            acessá-la.
          </p>
        </div>
      </main>
    );
  }

  if (disciplina.ativo === false) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-col items-center justify-center py-16">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </main>
    );
  }

  const horasPorBloco = 2;
  const horasAssistidas = blocosAssistidos * horasPorBloco;
  const pctSemana = Math.min(
    100,
    Math.round((horasAssistidas / Math.max(1, disciplina.horasSemana)) * 100)
  );
  const progressoSemanalCard = (
    <div
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] lg:p-6 dark:border-zinc-800 dark:bg-zinc-900/55"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: corDisciplina,
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Target
          className="h-4 w-4 shrink-0"
          style={{ color: corDisciplina }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Progresso semanal
        </h3>
      </div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-500">Horas assistidas</span>
        <span className="tabular-nums font-medium text-slate-900">
          {horasAssistidas}/{disciplina.horasSemana}h
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pctSemana}%`,
            background: `linear-gradient(to right, ${corDisciplina}, ${corDisciplina}CC)`,
          }}
        />
      </div>
      <div className="mt-2 text-right">
        <span className="text-xs font-medium" style={{ color: corDisciplina }}>
          {pctSemana}% concluído
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBlocosAssistidos((v) => Math.max(0, v - 1))}
                className="flex-1 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:bg-white dark:hover:bg-slate-50"
              >
                − 1 bloco
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover {horasPorBloco}h</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={() => setBlocosAssistidos((v) => v + 1)}
                className="flex-1 rounded-xl text-white shadow-sm"
                style={{
                  backgroundColor: corDisciplina,
                  borderColor: corDisciplina,
                }}
              >
                + 1 bloco
              </Button>
            </TooltipTrigger>
            <TooltipContent>Adicionar {horasPorBloco}h</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {blocosAssistidos > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBlocosAssistidos(0)}
          className="mt-3 w-full rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-100"
        >
          Zerar progresso
        </Button>
      )}
    </div>
  );

  const dataHojeLabel = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

  return (
    <main className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-[min(100%,1920px)] space-y-6 bg-slate-100 px-3 py-6 text-slate-900 sm:px-5 lg:space-y-8 lg:px-10 xl:px-14 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        className="overflow-hidden rounded-3xl p-6 text-white sm:p-8"
        style={heroSurfaceStyle}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav
              className="flex flex-wrap items-center gap-1.5 text-sm text-white/85"
              aria-label="Navegação"
            >
              <Link
                href="/disciplinas"
                className="inline-flex items-center gap-1.5 rounded-lg transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Disciplinas
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
              <span className="max-w-[min(100%,20rem)] truncate font-medium text-white">
                {disciplina.nome}
              </span>
            </nav>
            <time
              dateTime={new Date().toISOString()}
              className="text-sm font-medium tabular-nums text-white/85"
            >
              {dataHojeLabel}
            </time>
          </div>

          <div
            className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur-sm"
            role="search"
          >
            <Search className="h-4 w-4 shrink-0 text-white/80" aria-hidden />
            <p className="text-sm text-white/75">
              Visão geral da disciplina — atalhos e métricas abaixo
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/25">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/85">
                Olá — hoje na disciplina
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {disciplina.nome}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
                {disciplina.horasSemana}h por semana
                {disciplina.local ? ` · ${disciplina.local}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/30 bg-white/15 px-3 py-0.5 text-xs font-medium capitalize text-white">
                  {disciplina.tipo}
                </span>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ColorPicker
                        value={corDisciplina}
                        onChange={async (cor) => {
                          const result = await updateCor(disciplina.id, cor);
                          if (result.success) {
                            toast.success("Cor atualizada!");
                          } else {
                            toast.error(
                              result.error || "Erro ao atualizar cor"
                            );
                          }
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white hover:bg-white/20"
                          >
                            <Palette className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alterar cor da disciplina</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-white hover:bg-white/20"
                        onClick={() => setEditDisciplinaOpen(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar disciplina</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {disciplina.horarios?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {disciplina.horarios.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-1 text-xs text-white/90"
                    >
                      <span className="font-semibold text-white">
                        {DIAS[h.dia]}
                      </span>
                      <span className="text-white/80">
                        {h.inicio}–{h.fim}
                      </span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {proximaAvaliacao?.dataISO ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-black/15 px-4 py-3 text-sm text-white/95 ring-1 ring-white/10">
              <Calendar className="h-4 w-4 shrink-0 text-white/85" />
              <span className="font-medium text-white">Lembrete:</span>
              <span className="min-w-0">
                Próxima avaliação em{" "}
                {new Date(proximaAvaliacao.dataISO).toLocaleDateString(
                  "pt-BR",
                  { dateStyle: "medium" }
                )}
                {proximaAvaliacao.descricao
                  ? ` — ${truncatePreview(proximaAvaliacao.descricao, 100)}`
                  : ""}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-6 border-t border-white/15 pt-5">
            <Link
              href={`/disciplinas/${id}/notas/nova`}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-90"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                <Plus className="h-5 w-5 text-white" />
              </span>
              <span className="text-xs font-medium text-white/85">
                Nova anotação
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setDisciplinaTab("materiais")}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-90"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                <Folder className="h-5 w-5 text-white" />
              </span>
              <span className="text-xs font-medium text-white/85">
                Materiais
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDisciplinaTab("tarefas")}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-90"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                <ClipboardList className="h-5 w-5 text-white" />
              </span>
              <span className="text-xs font-medium text-white/85">Tarefas</span>
            </button>
            <button
              type="button"
              onClick={() => setDisciplinaTab("avaliacoes")}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-90"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                <Calendar className="h-5 w-5 text-white" />
              </span>
              <span className="text-xs font-medium text-white/85">
                Avaliações
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            tab: "anotacoes" as const,
            label: "Anotações",
            value: notas.length,
            sub: "notas",
            Icon: BookOpen,
            isPct: false,
          },
          {
            tab: "materiais" as const,
            label: "Materiais",
            value: materiais.length,
            sub: "itens",
            Icon: Folder,
            isPct: false,
          },
          {
            tab: "tarefas" as const,
            label: "Tarefas",
            value: tarefas.length,
            sub: "abertas",
            Icon: ClipboardList,
            isPct: false,
          },
          {
            tab: "avaliacoes" as const,
            label: "Avaliações",
            value: avaliacoes.length,
            sub: "agendadas",
            Icon: Calendar,
            isPct: false,
          },
          {
            tab: "visao" as const,
            label: "Progresso",
            value: pctSemana,
            sub: "% semana",
            Icon: Target,
            isPct: true,
          },
        ].map(({ tab, label, value, sub, Icon, isPct }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setDisciplinaTab(tab)}
            className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-600"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-zinc-50">
                {isPct ? `${value}%` : value}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                {sub}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${corDisciplina}22`,
                  color: corDisciplina,
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <ChevronRight
                className="h-4 w-4 opacity-[0.35] transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                style={{ color: corDisciplina }}
              />
            </div>
          </button>
        ))}
      </div>

      <nav
        className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70"
        aria-label="Secções da disciplina"
      >
        {(
          [
            {
              id: "visao" as const,
              label: "Visão geral",
              Icon: LayoutDashboard,
              count: null as number | null,
            },
            {
              id: "anotacoes" as const,
              label: "Anotações",
              Icon: BookOpen,
              count: notas.length,
            },
            {
              id: "materiais" as const,
              label: "Materiais",
              Icon: Folder,
              count: materiais.length,
            },
            {
              id: "tarefas" as const,
              label: "Tarefas",
              Icon: ClipboardList,
              count: tarefas.length,
            },
            {
              id: "avaliacoes" as const,
              label: "Avaliações",
              Icon: Calendar,
              count: avaliacoes.length,
            },
          ] as const
        ).map(({ id, label, Icon, count }) => {
          const active = disciplinaTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setDisciplinaTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
                active
                  ? "text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              )}
              style={
                active
                  ? {
                      backgroundColor: corDisciplina,
                      boxShadow: `0 2px 8px ${corDisciplina}55`,
                    }
                  : undefined
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-95" />
              <span>{label}</span>
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs tabular-nums",
                    active
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {disciplinaTab === "visao" && (
        <div className="grid animate-in fade-in gap-6 duration-200 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/55">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                Sobre a disciplina
              </h3>
              <dl className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
                    <GraduationCap className="h-5 w-5 text-slate-500 dark:text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      Modalidade
                    </dt>
                    <dd className="text-sm font-medium capitalize text-slate-900 dark:text-zinc-100">
                      {disciplina.tipo}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
                    <Clock className="h-5 w-5 text-slate-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      Carga horária
                    </dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                      {disciplina.horasSemana}h por semana
                    </dd>
                  </div>
                </div>
                {disciplina.local ? (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
                      <MapPin className="h-5 w-5 text-slate-500 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        Local
                      </dt>
                      <dd className="text-sm font-medium text-slate-900 dark:text-zinc-100">{disciplina.local}</dd>
                    </div>
                  </div>
                ) : null}
                {disciplina.horarios?.length ? (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
                      <Calendar className="h-5 w-5 text-slate-500 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="mb-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
                        Horários
                      </dt>
                      <dd className="flex flex-wrap gap-2">
                        {disciplina.horarios.map((h, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs"
                            style={{
                              backgroundColor: `${corDisciplina}10`,
                              borderColor: `${corDisciplina}30`,
                            }}
                          >
                            <span
                              className="font-medium"
                              style={{ color: corDisciplina }}
                            >
                              {DIAS[h.dia]}
                            </span>
                            <span className="text-muted-foreground">
                              {h.inicio}–{h.fim}
                            </span>
                          </span>
                        ))}
                      </dd>
                    </div>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
          <div className="min-w-0 lg:max-w-md">{progressoSemanalCard}</div>
        </div>
      )}

      {/* Seção de Anotações */}
      {disciplinaTab === "anotacoes" && (
      <Section
        title="Anotações"
        icon={<BookOpen className="h-4 w-4" />}
        cor={corDisciplina}
        right={
          <Button asChild size="sm" className="rounded-lg gap-2">
            <Link href={`/disciplinas/${id}/notas/nova`}>
              <Plus className="h-4 w-4" />
              Nova Nota
            </Link>
          </Button>
        }
      >
        {loadingNotas ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Carregando anotações...
            </span>
          </div>
        ) : notas.length === 0 ? (
          <div className="py-10 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma anotação ainda.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Crie sua primeira anotação para esta disciplina
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notas.map((nota) => (
              <NotaCard
                key={nota.id}
                nota={nota}
                disciplinaId={id}
                corDisciplina={corDisciplina}
                onDelete={(e) => {
                  e?.preventDefault?.();
                  e?.stopPropagation?.();
                  setNotaToDelete(nota.id);
                }}
              />
            ))}
          </div>
        )}
      </Section>
      )}
      {/* Seção de Materiais */}
      {disciplinaTab === "materiais" && (
      <Section
        title="Materiais"
        icon={<Folder className="h-4 w-4" />}
        cor={corDisciplina}
        right={
          <AddMaterial onAdd={(m) => setMateriais((prev) => [m, ...prev])} />
        }
      >
        {materiais.length === 0 ? (
          <div className="py-10 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Sem materiais ainda.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Adicione links ou arquivos para esta disciplina
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {materiais.map((m) => (
              <li
                key={m.id}
                className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950/50 dark:hover:border-zinc-600"
                style={{ borderLeftWidth: 4, borderLeftColor: corDisciplina }}
              >
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${corDisciplina}18`,
                      color: corDisciplina,
                    }}
                  >
                    {m.tipo === "url" ? (
                      <LinkIcon className="h-4 w-4" />
                    ) : m.tipo === "pdf" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.titulo}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      {m.tipo === "url" ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs text-primary hover:underline"
                        >
                          {m.url}
                        </a>
                      ) : m.tipo === "pdf" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {m.nomeArquivo || "arquivo.pdf"}
                          </span>
                          {m.arquivo && (
                            <a
                              href={m.arquivo}
                              download={m.nomeArquivo || "arquivo.pdf"}
                              className="text-xs text-primary hover:underline"
                            >
                              Baixar
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {m.nomeArquivo || "arquivo.svg"}
                          </span>
                          {m.arquivo && (
                            <div className="flex items-center gap-2">
                              <a
                                href={m.arquivo}
                                download={m.nomeArquivo || "arquivo.svg"}
                                className="text-xs text-primary hover:underline"
                              >
                                Baixar
                              </a>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-primary hover:underline">
                                  Ver preview
                                </summary>
                                <div className="mt-2 rounded-lg border bg-muted/30 p-2">
                                  <img
                                    src={m.arquivo}
                                    alt={m.titulo}
                                    className="max-h-48 w-auto"
                                  />
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setMateriais((prev) =>
                            prev.filter((x) => x.id !== m.id)
                          )
                        }
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remover material</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
            ))}
          </ul>
        )}
      </Section>
      )}
      {/* Seção de Tarefas */}
      {disciplinaTab === "tarefas" && (
      <Section
        title="Tarefas"
        icon={<ClipboardList className="h-4 w-4" />}
        cor={corDisciplina}
        right={<AddTarefa disciplinaId={id} />}
      >
        {loadingTarefas ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Carregando tarefas...
            </span>
          </div>
        ) : tarefas.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma tarefa cadastrada.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Crie tarefas para organizar seus estudos
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tarefas
              .sort((a, b) => {
                if (a.concluida !== b.concluida) {
                  return a.concluida ? 1 : -1;
                }
                if (a.dataVencimento && b.dataVencimento) {
                  return (
                    new Date(a.dataVencimento).getTime() -
                    new Date(b.dataVencimento).getTime()
                  );
                }
                if (a.dataVencimento) return -1;
                if (b.dataVencimento) return 1;
                return 0;
              })
              .map((t) => (
                <TarefaItem
                  key={t.id}
                  tarefa={t}
                  accentColor={corDisciplina}
                  onToggle={async () => {
                    const result = await toggleConcluida(t.id, !t.concluida);
                    if (result.success) {
                      toast.success(
                        t.concluida
                          ? "Tarefa marcada como pendente"
                          : "Tarefa concluída!"
                      );
                    }
                  }}
                  onDelete={async () => {
                    const result = await deleteTarefa(t.id);
                    if (result.success) {
                      toast.success("Tarefa removida");
                    } else {
                      toast.error(result.error || "Erro ao remover tarefa");
                    }
                  }}
                  onEdit={async (updated) => {
                    const result = await updateTarefa(t.id, updated);
                    if (result.success) {
                      toast.success("Tarefa atualizada");
                    } else {
                      toast.error(result.error || "Erro ao atualizar tarefa");
                    }
                  }}
                />
              ))}
          </ul>
        )}
      </Section>
      )}
      {/* Seção de Avaliações */}
      {disciplinaTab === "avaliacoes" && (
      <Section
        title="Avaliações"
        icon={<Calendar className="h-4 w-4" />}
        cor={corDisciplina}
        right={
          <NovaAvaliacaoButton
            disciplinaId={disciplina.id}
            createAvaliacao={createAvaliacao}
          />
        }
      >
        {loadingAval ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Carregando avaliações...
            </span>
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Sem avaliações cadastradas para esta disciplina.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Adicione provas, trabalhos e seminários
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {avaliacoes
              .sort((a, b) => {
                const ta = a.dataISO ? new Date(a.dataISO).getTime() : 0;
                const tb = b.dataISO ? new Date(b.dataISO).getTime() : 0;
                return ta - tb;
              })
              .map((a) => {
                const dias = daysUntil(a.dataISO);
                const isPast = !Number.isNaN(dias) && dias < 0;
                const isUrgent = !Number.isNaN(dias) && dias >= 0 && dias <= 3;

                return (
                  <li
                    key={a.id}
                    className={cn(
                      "group overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md dark:hover:shadow-black/25",
                      "border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950/40",
                      isPast && "opacity-60",
                      isUrgent &&
                        !isPast &&
                        "border-amber-500/35 ring-1 ring-amber-500/20"
                    )}
                    style={{ borderLeftWidth: 4, borderLeftColor: corDisciplina }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${corDisciplina}20`,
                            color: corDisciplina,
                          }}
                        >
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={tipoBadgeMap[a.tipo]}>
                              {a.tipo}
                            </span>
                            {isUrgent && !isPast && (
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                {dias === 0
                                  ? "Hoje!"
                                  : dias === 1
                                  ? "Amanhã!"
                                  : `Em ${dias} dias`}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {fmtDate(a.dataISO)}
                          </div>
                          {a.descricao && (
                            <p className="mt-2 line-clamp-2 text-sm text-foreground">
                              {truncatePreview(a.descricao, 160)}
                            </p>
                          )}
                        </div>
                      </div>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                const result = await deleteAvaliacao(a.id);
                                if (!result.success) {
                                  toast.error(
                                    result.error || "Erro ao remover avaliação"
                                  );
                                } else {
                                  toast.success(
                                    "Avaliação removida com sucesso!"
                                  );
                                }
                              }}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remover avaliação</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {a.resumo_assuntos && (
                      <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/90 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950/40">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          {a.gerado_por_ia && (
                            <Sparkles
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: corDisciplina }}
                            />
                          )}
                          Resumo dos assuntos{" "}
                          {a.gerado_por_ia ? "(IA)" : ""}
                        </div>
                        <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                          {truncatePreview(a.resumo_assuntos, 180)}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </Section>
      )}
      {/* Dialog de confirmação para excluir nota */}
      <Dialog
        open={!!notaToDelete}
        onOpenChange={(open) => !open && setNotaToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Nota
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotaToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (notaToDelete) {
                  await deleteNota(notaToDelete);
                  setNotaToDelete(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditDisciplinaDialog
        open={editDisciplinaOpen}
        disciplina={disciplina}
        onOpenChange={setEditDisciplinaOpen}
        onSaved={() => setEditDisciplinaOpen(false)}
      />
    </main>
  );
}

function NotaCard({
  nota,
  disciplinaId,
  corDisciplina,
  onDelete,
}: {
  nota: import("@/hooks/useNotas").Nota;
  disciplinaId: string;
  corDisciplina: string;
  onDelete: (e?: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={`/disciplinas/${disciplinaId}/notas/${nota.id}`}
      className="group block rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-4 text-foreground no-underline shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900/70 dark:to-zinc-950/50 dark:hover:border-zinc-600"
      style={{ borderLeftWidth: "4px", borderLeftColor: corDisciplina }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm flex-1">{nota.titulo}</h4>
          <div
            className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir nota</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {nota.content_md && (
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground mt-2">
            {nota.content_md.length > 200
              ? `${nota.content_md.substring(0, 200)}...`
              : nota.content_md}
          </pre>
        )}
        {nota.updated_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Atualizada em{" "}
            {new Date(nota.updated_at).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    </Link>
  );
}

const tipoBadgeMap: Record<AvaliacaoTipo, string> = {
  prova:
    "rounded px-2 py-0.5 text-xs border bg-red-500/15 text-red-400 border-red-500/30 capitalize",
  trabalho:
    "rounded px-2 py-0.5 text-xs border bg-blue-500/15 text-blue-400 border-blue-500/30 capitalize",
  seminario:
    "rounded px-2 py-0.5 text-xs border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 capitalize",
};

function AddMaterial({ onAdd }: { onAdd: (m: Material) => void }) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [materialMethod, setMaterialMethod] = useState<"upload" | "url">("url");
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [tipoArquivo, setTipoArquivo] = useState<"pdf" | "svg">("pdf");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo de 5MB.");
      return;
    }
    if (tipoArquivo === "pdf" && file.type !== "application/pdf") {
      setError("Formato inválido. Use PDF.");
      return;
    }
    if (tipoArquivo === "svg" && file.type !== "image/svg+xml") {
      setError("Formato inválido. Use SVG.");
      return;
    }
    setNomeArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setArquivo(result);
      if (tipoArquivo === "svg") {
        setPreview(result);
      } else {
        setPreview(null);
      }
    };
    reader.readAsDataURL(file);
  }
  function resetForm() {
    setTitulo("");
    setUrl("");
    setArquivo(null);
    setNomeArquivo("");
    setPreview(null);
    setMaterialMethod("url");
    setTipoArquivo("pdf");
    setError(null);
  }
  function submit() {
    setError(null);
    setUploading(true);
    if (!titulo.trim()) {
      setError("Título é obrigatório");
      setUploading(false);
      return;
    }
    try {
      if (materialMethod === "url") {
        if (!url.trim()) {
          setError("URL é obrigatória");
          setUploading(false);
          return;
        }
        try {
          new URL(url);
        } catch {
          setError("URL inválida");
          setUploading(false);
          return;
        }
        onAdd({
          id: `m_${Date.now()}`,
          titulo,
          url,
          tipo: "url",
        });
      } else {
        if (!arquivo) {
          setError("Por favor, selecione um arquivo");
          setUploading(false);
          return;
        }
        onAdd({
          id: `m_${Date.now()}`,
          titulo,
          tipo: tipoArquivo,
          arquivo,
          nomeArquivo,
        });
      }
      resetForm();
      setOpen(false);
      toast.success("Material adicionado com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar material");
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          resetForm();
        }}
        variant="outline"
        size="sm"
      >
        + Adicionar
      </Button>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Material</DialogTitle>
            <DialogDescription>
              Adicione um link externo ou faça upload de um arquivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {}
            <div className="space-y-2">
              <label htmlFor="material-title" className="text-sm font-medium">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                id="material-title"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Slides da aula 1"
                className={error && !titulo.trim() ? "border-red-500" : ""}
              />
            </div>
            {}
            <div className="flex gap-2 border-b">
              <button
                type="button"
                onClick={() => {
                  setMaterialMethod("url");
                  setArquivo(null);
                  setNomeArquivo("");
                  setPreview(null);
                  setError(null);
                }}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                  materialMethod === "url"
                    ? "border-b-2 border-primary text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaterialMethod("upload");
                  setUrl("");
                  setError(null);
                }}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                  materialMethod === "upload"
                    ? "border-b-2 border-primary text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload
              </button>
            </div>
            {}
            {materialMethod === "url" && (
              <div className="space-y-2">
                <label htmlFor="material-url" className="text-sm font-medium">
                  URL do Material <span className="text-red-500">*</span>
                </label>
                <Input
                  id="material-url"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://exemplo.com/material.pdf"
                  className={error && !url.trim() ? "border-red-500" : ""}
                />
                <p className="text-xs text-zinc-500">
                  Cole a URL completa do material (PDF, link externo, etc.)
                </p>
              </div>
            )}
            {}
            {materialMethod === "upload" && (
              <div className="space-y-4">
                {}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Arquivo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoArquivo("pdf");
                        setArquivo(null);
                        setNomeArquivo("");
                        setPreview(null);
                        setError(null);
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        tipoArquivo === "pdf"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <FileText className="h-4 w-4 inline mr-2" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoArquivo("svg");
                        setArquivo(null);
                        setNomeArquivo("");
                        setPreview(null);
                        setError(null);
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        tipoArquivo === "svg"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <ImageIcon className="h-4 w-4 inline mr-2" />
                      SVG
                    </button>
                  </div>
                </div>
                {}
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="material-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold">
                          Clique para fazer upload
                        </span>{" "}
                        ou arraste e solte
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tipoArquivo.toUpperCase()} (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="material-upload"
                      type="file"
                      className="hidden"
                      accept={
                        tipoArquivo === "pdf"
                          ? "application/pdf"
                          : "image/svg+xml"
                      }
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {nomeArquivo && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Arquivo selecionado: {nomeArquivo}
                    </p>
                    {preview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                disabled={uploading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={
                  uploading ||
                  !titulo.trim() ||
                  (materialMethod === "url" ? !url.trim() : !arquivo)
                }
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NovaAvaliacaoButton({
  disciplinaId,
  createAvaliacao,
}: {
  disciplinaId: string;
  createAvaliacao: (a: {
    disciplinaId: string;
    tipo: AvaliacaoTipo;
    dataISO: string;
    descricao?: string;
    resumo_assuntos?: string;
    gerado_por_ia?: boolean;
  }) => Promise<
    | { success: true; id?: string }
    | { success: false; error?: string }
  >;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<AvaliacaoTipo>("prova");
  const defaultDt = () =>
    splitDateTimeLocalDisc(
      toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000)),
    );
  const [dataAval, setDataAval] = useState(() => defaultDt().date);
  const [horaAval, setHoraAval] = useState(() => defaultDt().time);
  const [localEntrega, setLocalEntrega] = useState<"plataforma" | "sala">(
    "plataforma",
  );
  const [lembreteAtivo, setLembreteAtivo] = useState(true);
  const [resumo, setResumo] = useState("");
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function descricaoEntrega() {
    return localEntrega === "plataforma"
      ? "Entrega: plataforma"
      : "Entrega: sala de aula";
  }

  async function gerarResumoIA() {
    setLoadingResumo(true);
    try {
      const response = await fetch("/api/ai/resumo-estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplinaId,
          tipoAvaliacao: tipo,
          descricao: descricaoEntrega(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao gerar resumo");
      }
      const data = await response.json();
      setResumo(String(data.resumo || "").slice(0, RESUMO_AVALIACAO_MAX_DISC));
      toast.success("Resumo gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar resumo com IA");
    } finally {
      setLoadingResumo(false);
    }
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    const joined = joinDateTimeLocalDisc(dataAval, horaAval);
    if (!dataAval) e.dataAval = "Informe a data";
    if (!horaAval) e.horaAval = "Informe a hora";
    if (joined && Number.isNaN(new Date(joined).getTime())) {
      e.dataAval = "Data ou hora inválida";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function salvar() {
    if (!validateStep2()) {
      toast.error("Corrija data e hora antes de salvar");
      return;
    }
    const joined = joinDateTimeLocalDisc(dataAval, horaAval);
    const iso = new Date(joined).toISOString();
    const result = await createAvaliacao({
      disciplinaId,
      tipo,
      dataISO: iso,
      descricao: descricaoEntrega(),
      resumo_assuntos: resumo.trim() || undefined,
      gerado_por_ia: !!resumo.trim(),
    });
    if (!result.success) {
      toast.error(result.error || "Erro ao criar avaliação");
      return;
    }
    let msg = "Avaliação criada com sucesso";
    if (lembreteAtivo && result.id) {
      try {
        const r = await fetch("/api/reminders/auto-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tipo: "avaliacao",
            referencia_id: result.id,
          }),
        });
        if (r.ok) msg = "Avaliação criada. Lembretes agendados.";
      } catch {
        /* noop */
      }
    }
    toast.success(msg);
    setStep(1);
    setResumo("");
    const d = defaultDt();
    setDataAval(d.date);
    setHoraAval(d.time);
    setErrors({});
    setOpen(false);
  }

  function resetForm() {
    setStep(1);
    setTipo("prova");
    const d = defaultDt();
    setDataAval(d.date);
    setHoraAval(d.time);
    setLocalEntrega("plataforma");
    setLembreteAtivo(true);
    setResumo("");
    setErrors({});
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) resetForm();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        Nova Avaliação
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <FormStepper
            currentStep={step}
            labels={["Info geral", "Resumo com IA"] as const}
          />
          <div className="px-6 pb-6 pt-4">
            {step === 1 && (
              <div className="grid gap-6">
                <DialogHeader className="text-left space-y-2">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary shrink-0" />
                    Nova Avaliação
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações gerais da avaliação nesta disciplina.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Label className="leading-snug">Tipo da avaliação</Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as AvaliacaoTipo)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="prova">Prova</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                      <SelectItem value="seminario">Seminário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-3">
                  <Label className="leading-snug">Local da entrega</Label>
                  <Select
                    value={localEntrega}
                    onValueChange={(v) =>
                      setLocalEntrega(v as "plataforma" | "sala")
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="plataforma">Plataforma</SelectItem>
                      <SelectItem value="sala">Sala de aula</SelectItem>
                    </SelectContent>
                  </Select>
                  {localEntrega === "plataforma" && (
                    <p className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary"
                        aria-hidden
                      />
                      <span>
                        No IComp, muitas entregas são pelo{" "}
                        <a
                          href={COLAB_WEB_LOGIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          ColabWeb
                        </a>
                        .
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-3.5">
                  <div className="space-y-1 pr-3">
                    <Label htmlFor="lem-disc" className="text-sm font-medium leading-snug">
                      Ativar lembrete
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Lembrar no dia da avaliação
                    </p>
                  </div>
                  <Switch
                    id="lem-disc"
                    checked={lembreteAtivo}
                    onCheckedChange={setLembreteAtivo}
                  />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-6">
                <DialogHeader className="text-left space-y-2">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary shrink-0" />
                    Nova Avaliação
                  </DialogTitle>
                  <DialogDescription>
                    Data, hora e resumo da avaliação com IA.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <Label className="leading-snug">Data da avaliação</Label>
                    <Input
                      type="date"
                      value={dataAval}
                      onChange={(e) => {
                        setDataAval(e.target.value);
                        setErrors((p) => ({ ...p, dataAval: "" }));
                      }}
                      className={cn(
                        "h-10",
                        errors.dataAval && "border-destructive",
                      )}
                    />
                    {errors.dataAval && (
                      <p className="text-xs text-destructive">{errors.dataAval}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label className="leading-snug">Hora da avaliação</Label>
                    <Input
                      type="time"
                      value={horaAval}
                      onChange={(e) => {
                        setHoraAval(e.target.value);
                        setErrors((p) => ({ ...p, horaAval: "" }));
                      }}
                      className={cn(
                        "h-10",
                        errors.horaAval && "border-destructive",
                      )}
                    />
                    {errors.horaAval && (
                      <p className="text-xs text-destructive">{errors.horaAval}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor="resumo-disc" className="leading-snug">
                      Resumo da avaliação
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {resumo.length}/{RESUMO_AVALIACAO_MAX_DISC}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você pode escrever ou gerar um resumo com IA.
                  </p>
                  <textarea
                    id="resumo-disc"
                    value={resumo}
                    onChange={(e) =>
                      setResumo(
                        e.target.value.slice(0, RESUMO_AVALIACAO_MAX_DISC),
                      )
                    }
                    placeholder="Descreva os principais tópicos..."
                    rows={5}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto border-dashed"
                    onClick={gerarResumoIA}
                    disabled={loadingResumo}
                  >
                    {loadingResumo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar resumo com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row items-center justify-between gap-4 border-t bg-muted/20 p-4">
            <div>
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              )}
            </div>
            <div>
              {step < 2 ? (
                <Button onClick={() => setStep(2)}>
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={salvar}>Salvar avaliação</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddTarefa({ disciplinaId }: { disciplinaId: string }) {
  const { createTarefa } = useTarefas({ disciplinaId });
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">(
    "media"
  );
  async function salvar() {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    const result = await createTarefa({
      disciplinaId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      dataVencimento: dataVencimento || undefined,
      prioridade,
      concluida: false,
    });
    if (result.success) {
      toast.success("Tarefa criada com sucesso!");
      setTitulo("");
      setDescricao("");
      setDataVencimento("");
      setPrioridade("media");
      setOpen(false);
    } else {
      toast.error(result.error || "Erro ao criar tarefa");
    }
  }
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Nova Tarefa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Adicione uma nova tarefa para esta disciplina
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Fazer exercícios do capítulo 3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes da tarefa..."
                className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Data de vencimento
                </label>
                <Input
                  type="datetime-local"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) =>
                    setPrioridade(e.target.value as "baixa" | "media" | "alta")
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Criar Tarefa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TarefaItem({
  tarefa,
  accentColor,
  onToggle,
  onDelete,
  onEdit,
}: {
  tarefa: Tarefa;
  accentColor: string;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: (updated: Partial<Tarefa>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [descricao, setDescricao] = useState(tarefa.descricao || "");
  const [dataVencimento, setDataVencimento] = useState(
    tarefa.dataVencimento
      ? toLocalInputValue(new Date(tarefa.dataVencimento))
      : ""
  );
  const [prioridade, setPrioridade] = useState(tarefa.prioridade);
  const diasRestantes = tarefa.dataVencimento
    ? daysUntil(tarefa.dataVencimento)
    : null;
  const isVencida =
    diasRestantes !== null && diasRestantes < 0 && !tarefa.concluida;
  const isUrgente =
    diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 2;

  async function salvarEdicao() {
    await onEdit({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      dataVencimento: dataVencimento || undefined,
      prioridade,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-primary/50 bg-primary/5 p-4">
        <div className="space-y-3">
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da tarefa"
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="datetime-local"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
            <select
              value={prioridade}
              onChange={(e) =>
                setPrioridade(e.target.value as "baixa" | "media" | "alta")
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={salvarEdicao}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTitulo(tarefa.titulo);
                setDescricao(tarefa.descricao || "");
                setDataVencimento(
                  tarefa.dataVencimento
                    ? toLocalInputValue(new Date(tarefa.dataVencimento))
                    : ""
                );
                setPrioridade(tarefa.prioridade);
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </li>
    );
  }

  const accentBar =
    !isVencida && !isUrgente && !tarefa.concluida ? accentColor : undefined;

  return (
    <li
      className={cn(
        "group rounded-2xl border p-4 transition-all hover:shadow-md dark:hover:shadow-black/30",
        "border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/50",
        tarefa.concluida && "opacity-60 bg-muted/30 dark:bg-zinc-900/30",
        isVencida &&
          !tarefa.concluida &&
          "border-destructive/50 bg-destructive/5 dark:bg-destructive/10",
        isUrgente && !tarefa.concluida && "border-amber-500/40 bg-amber-500/5"
      )}
      style={
        accentBar
          ? { borderLeftWidth: 4, borderLeftColor: accentBar }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
              >
                {tarefa.concluida ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {tarefa.concluida
                ? "Marcar como pendente"
                : "Marcar como concluída"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={cn(
                  "font-medium text-sm",
                  tarefa.concluida && "line-through text-muted-foreground"
                )}
              >
                {tarefa.titulo}
              </h4>
              {tarefa.descricao && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {tarefa.descricao}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(true)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar tarefa</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir tarefa</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <PrioridadeBadge prioridade={tarefa.prioridade} />
            {tarefa.dataVencimento && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
                  isVencida && !tarefa.concluida
                    ? "text-destructive bg-destructive/10"
                    : isUrgente && !tarefa.concluida
                    ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                    : "text-muted-foreground bg-muted"
                )}
              >
                <Calendar className="h-3 w-3" />
                <span>{fmtDate(tarefa.dataVencimento)}</span>
                {diasRestantes !== null && !tarefa.concluida && (
                  <span className="font-medium">
                    {diasRestantes < 0
                      ? `• Vencida`
                      : diasRestantes === 0
                      ? "• Hoje"
                      : diasRestantes === 1
                      ? "• Amanhã"
                      : `• ${diasRestantes}d`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
