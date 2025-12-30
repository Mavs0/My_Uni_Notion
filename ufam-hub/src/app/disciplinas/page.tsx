"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useDisciplinas,
  type Disciplina as DisciplinaType,
} from "@/hooks/useDisciplinas";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Loader2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Plus,
  X,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  Grid3x3,
  List,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  Star,
  Palette,
  GripVertical,
  Check,
  Pin,
} from "lucide-react";
import { SyncDisciplinasWithCalendar } from "@/components/GoogleCalendarIntegration";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TTipo = "obrigatoria" | "eletiva" | "optativa";
type Disciplina = DisciplinaType;

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function badgeTipo(tipo: TTipo) {
  const map: Record<TTipo, string> = {
    obrigatoria: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    eletiva: "bg-red-500/15 text-red-400 border-red-500/30",
    optativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return cn("rounded px-2 py-0.5 text-xs border capitalize", map[tipo]);
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {right}
      </header>
      {children}
    </section>
  );
}

interface DisciplinaStats {
  media: number | null;
  horasEstudadas: number;
  totalAvaliacoes: number;
  totalTarefas: number;
  tarefasConcluidas: number;
}

function DisciplinaCard({
  disciplina,
  stats,
  onDelete,
  onToggleAtivo,
  onToggleFavorito,
  onUpdateCor,
  loadingStats,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  disciplina: Disciplina;
  stats?: DisciplinaStats;
  onDelete: () => void;
  onToggleAtivo: () => void;
  onToggleFavorito: () => void;
  onUpdateCor: (cor: string) => void;
  loadingStats: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  const isArquivada = disciplina.ativo === false;
  const isFavorito = disciplina.favorito === true;
  const cor = disciplina.cor || "#6366f1";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg transition-all duration-300",
        isArquivada
          ? "opacity-60 hover:opacity-80 border-dashed"
          : "hover:border-primary/30 hover:-translate-y-0.5",
        isDragging && "opacity-50 scale-95"
      )}
      style={{ borderLeftWidth: "4px", borderLeftColor: cor }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {isFavorito && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            <h3 className="font-semibold text-lg text-foreground truncate">
              {disciplina.nome}
            </h3>
            <span className={badgeTipo(disciplina.tipo)}>
              {disciplina.tipo}
            </span>
            {isArquivada && (
              <span className="rounded px-2 py-0.5 text-xs border bg-muted text-muted-foreground">
                Arquivada
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {disciplina.horasSemana}h/sem
            </span>
            {disciplina.professor && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {disciplina.professor}
              </span>
            )}
            {disciplina.local && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {disciplina.local}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Favoritar */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleFavorito}
                  className={cn(
                    "h-8 w-8 transition-all",
                    isFavorito
                      ? "text-yellow-500"
                      : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-500"
                  )}
                >
                  <Star
                    className={cn("h-4 w-4", isFavorito && "fill-yellow-500")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isFavorito
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Seletor de Cor */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ColorPicker
                  value={cor}
                  onChange={onUpdateCor}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Alterar cor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Arquivar */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleAtivo}
                  className={cn(
                    "h-8 w-8 opacity-0 group-hover:opacity-100 transition-all",
                    isArquivada
                      ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                      : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  )}
                >
                  {isArquivada ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isArquivada ? "Ativar disciplina" : "Arquivar disciplina"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Excluir */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir disciplina</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Stats */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10 p-3">
          {stats.media !== null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Média</div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-lg font-bold",
                    stats.media >= 7
                      ? "text-emerald-500"
                      : stats.media >= 5
                      ? "text-amber-500"
                      : "text-red-500"
                  )}
                >
                  {stats.media.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Horas</div>
            <div className="text-lg font-bold text-foreground">
              {stats.horasEstudadas.toFixed(1)}h
            </div>
          </div>
          {stats.totalTarefas > 0 && (
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Tarefas</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                    style={{
                      width: `${
                        (stats.tarefasConcluidas / stats.totalTarefas) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stats.tarefasConcluidas}/{stats.totalTarefas}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Horários */}
      {disciplina.horarios && disciplina.horarios.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Horários
          </div>
          <div className="space-y-1.5">
            {disciplina.horarios.slice(0, 3).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-background/50 px-2.5 py-1.5 text-xs"
              >
                <span className="font-medium">{DIAS[h.dia]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {h.inicio}–{h.fim}
                </span>
              </div>
            ))}
            {disciplina.horarios.length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{disciplina.horarios.length - 3} mais
              </div>
            )}
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          asChild
          variant="default"
          size="sm"
          className="flex-1 shadow-sm"
        >
          <a href={`/disciplinas/${disciplina.id}`}>
            <GraduationCap className="h-4 w-4 mr-2" />
            Abrir
          </a>
        </Button>
      </div>
    </div>
  );
}

function DisciplinaCardList({
  disciplina,
  stats,
  onDelete,
  onToggleAtivo,
  onToggleFavorito,
  onUpdateCor,
  loadingStats,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  disciplina: Disciplina;
  stats?: DisciplinaStats;
  onDelete: () => void;
  onToggleAtivo: () => void;
  onToggleFavorito: () => void;
  onUpdateCor: (cor: string) => void;
  loadingStats: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  const isArquivada = disciplina.ativo === false;
  const isFavorito = disciplina.favorito === true;
  const cor = disciplina.cor || "#6366f1";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300",
        isArquivada
          ? "opacity-60 hover:opacity-80 border-dashed"
          : "hover:border-primary/30",
        isDragging && "opacity-50 scale-95"
      )}
      style={{ borderLeftWidth: "4px", borderLeftColor: cor }}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {isFavorito && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            <h3 className="font-semibold text-base text-foreground">
              {disciplina.nome}
            </h3>
            <span className={badgeTipo(disciplina.tipo)}>
              {disciplina.tipo}
            </span>
            {isArquivada && (
              <span className="rounded px-2 py-0.5 text-xs border bg-muted text-muted-foreground">
                Arquivada
              </span>
            )}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {disciplina.horasSemana}h/sem
            </span>
            {disciplina.professor && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {disciplina.professor}
              </span>
            )}
            {disciplina.local && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {disciplina.local}
              </span>
            )}
          </div>
          {/* Stats */}
          {stats && (
            <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
              {stats.media !== null && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp
                    className={cn(
                      "h-4 w-4",
                      stats.media >= 7
                        ? "text-emerald-500"
                        : stats.media >= 5
                        ? "text-amber-500"
                        : "text-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold",
                      stats.media >= 7
                        ? "text-emerald-500"
                        : stats.media >= 5
                        ? "text-amber-500"
                        : "text-red-500"
                    )}
                  >
                    {stats.media.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/ 10</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {stats.horasEstudadas.toFixed(1)}h estudadas
                </span>
              </div>
              {stats.totalAvaliacoes > 0 && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {stats.totalAvaliacoes} avaliações
                  </span>
                </div>
              )}
              {stats.totalTarefas > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {stats.tarefasConcluidas}/{stats.totalTarefas} tarefas
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Horários */}
          {disciplina.horarios && disciplina.horarios.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {disciplina.horarios.slice(0, 4).map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg border bg-muted/50 px-2 py-1 text-xs"
                >
                  <span className="font-medium">{DIAS[h.dia]}</span>
                  <span className="text-muted-foreground">
                    {h.inicio}–{h.fim}
                  </span>
                </span>
              ))}
              {disciplina.horarios.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{disciplina.horarios.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <a href={`/disciplinas/${disciplina.id}`}>Abrir</a>
          </Button>

          {/* Favoritar */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleFavorito}
                  className={cn(
                    "h-9 w-9",
                    isFavorito
                      ? "text-yellow-500"
                      : "text-muted-foreground hover:text-yellow-500"
                  )}
                >
                  <Star
                    className={cn("h-4 w-4", isFavorito && "fill-yellow-500")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isFavorito
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Seletor de Cor */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ColorPicker
                  value={cor}
                  onChange={onUpdateCor}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Palette className="h-4 w-4" />
                    </Button>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Alterar cor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Arquivar */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleAtivo}
                  className={cn(
                    "h-9 w-9",
                    isArquivada
                      ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                      : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  )}
                >
                  {isArquivada ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isArquivada ? "Ativar disciplina" : "Arquivar disciplina"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Excluir */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir disciplina</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
export default function DisciplinasPage() {
  const searchParams = useSearchParams();
  const [tipo, setTipo] = useState<"todas" | TTipo>("todas");
  const [q, setQ] = useState("");
  const [filtroCargaHoraria, setFiltroCargaHoraria] = useState<string>("todas");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [disciplinaToDelete, setDisciplinaToDelete] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [disciplinaToArchive, setDisciplinaToArchive] = useState<{
    id: string;
    nome: string;
    isAtivo: boolean;
  } | null>(null);
  const {
    disciplinas,
    loading,
    error,
    refetch,
    deleteDisciplina,
    toggleAtivo,
    toggleFavorito,
    updateCor,
    reordenarDisciplinas,
  } = useDisciplinas();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    periodo?: string;
    curso?: string;
  }>({});
  const [shouldOpenModal, setShouldOpenModal] = useState(false);
  const [statsMap, setStatsMap] = useState<Map<string, DisciplinaStats>>(
    new Map()
  );
  const [loadingStats, setLoadingStats] = useState(false);
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const { profile } = await response.json();
          setUserProfile({
            periodo: profile.periodo || "",
            curso: profile.curso || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };
    loadProfile();
  }, []);
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShouldOpenModal(true);
      window.history.replaceState({}, "", "/disciplinas");
    }
  }, [searchParams]);
  useEffect(() => {
    const loadStats = async () => {
      if (disciplinas.length === 0) return;
      setLoadingStats(true);
      const stats = new Map<string, DisciplinaStats>();
      try {
        const response = await fetch("/api/estatisticas?periodo=90");
        if (response.ok) {
          const data = await response.json();
          data.horasPorDisciplina?.forEach((item: any) => {
            stats.set(item.disciplinaId, {
              media: null,
              horasEstudadas: item.horasEstudadas || 0,
              totalAvaliacoes: 0,
              totalTarefas: 0,
              tarefasConcluidas: 0,
            });
          });
          data.comparativoDesempenho?.forEach((item: any) => {
            const existing = stats.get(item.disciplinaId) || {
              media: null,
              horasEstudadas: 0,
              totalAvaliacoes: 0,
              totalTarefas: 0,
              tarefasConcluidas: 0,
            };
            stats.set(item.disciplinaId, {
              ...existing,
              media: item.media,
              totalAvaliacoes: item.totalAvaliacoes || 0,
            });
          });
        }
        const tarefasResponse = await fetch("/api/tarefas");
        if (tarefasResponse.ok) {
          const tarefasData = await tarefasResponse.json();
          const tarefas = tarefasData.tarefas || [];
          tarefas.forEach((tarefa: any) => {
            if (tarefa.disciplinaId) {
              const existing = stats.get(tarefa.disciplinaId) || {
                media: null,
                horasEstudadas: 0,
                totalAvaliacoes: 0,
                totalTarefas: 0,
                tarefasConcluidas: 0,
              };
              stats.set(tarefa.disciplinaId, {
                ...existing,
                totalTarefas: (existing.totalTarefas || 0) + 1,
                tarefasConcluidas: tarefa.concluida
                  ? (existing.tarefasConcluidas || 0) + 1
                  : existing.tarefasConcluidas || 0,
              });
            }
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoadingStats(false);
        setStatsMap(stats);
      }
    };
    loadStats();
  }, [disciplinas]);
  const list = useMemo(() => {
    if (!disciplinas) return [];
    let arr = [...disciplinas];
    // Filtrar por status ativo/arquivada
    if (!mostrarArquivadas) {
      arr = arr.filter((d) => d.ativo !== false);
    }
    if (tipo !== "todas") arr = arr.filter((d) => d.tipo === tipo);
    if (filtroCargaHoraria !== "todas") {
      const [min, max] = filtroCargaHoraria.split("-").map(Number);
      if (max) {
        arr = arr.filter((d) => d.horasSemana >= min && d.horasSemana <= max);
      } else {
        arr = arr.filter((d) => d.horasSemana >= min);
      }
    }
    if (q) {
      const n = q.toLowerCase();
      arr = arr.filter(
        (d) =>
          d.nome.toLowerCase().includes(n) ||
          d.professor?.toLowerCase().includes(n) ||
          d.local?.toLowerCase().includes(n)
      );
    }
    // Ordenar: favoritos primeiro, depois por ordem customizada, depois por nome
    return arr.sort((a, b) => {
      // Favoritos primeiro
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      // Depois por ordem customizada
      if ((a.ordem ?? 0) !== (b.ordem ?? 0)) {
        return (a.ordem ?? 0) - (b.ordem ?? 0);
      }
      // Por último, alfabética
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [disciplinas, tipo, q, filtroCargaHoraria, mostrarArquivadas]);

  // Contagem de disciplinas arquivadas
  const totalArquivadas = useMemo(() => {
    return disciplinas.filter((d) => d.ativo === false).length;
  }, [disciplinas]);
  const horasTotais = useMemo(
    () => list.reduce((acc, d) => acc + d.horasSemana, 0),
    [list]
  );

  // Funções de drag & drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = list.findIndex((d) => d.id === draggedId);
    const targetIndex = list.findIndex((d) => d.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Criar nova ordem
    const newList = [...list];
    const [removed] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, removed);

    // Atualizar ordem no banco
    const novaOrdem = newList.map((d, idx) => ({ id: d.id, ordem: idx }));
    const result = await reordenarDisciplinas(novaOrdem);

    if (result.success) {
      toast.success("Ordem atualizada!");
    }

    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Função para favoritar
  const handleToggleFavorito = async (id: string, atualFavorito: boolean) => {
    const result = await toggleFavorito(id, !atualFavorito);
    if (result.success) {
      toast.success(
        !atualFavorito ? "Disciplina favoritada!" : "Removida dos favoritos"
      );
    }
  };

  // Função para mudar cor
  const handleUpdateCor = async (id: string, novaCor: string) => {
    const result = await updateCor(id, novaCor);
    if (result.success) {
      toast.success("Cor atualizada!");
    }
  };

  function removeItem(id: string, nome: string) {
    setDisciplinaToDelete({ id, nome });
  }
  async function confirmDelete() {
    if (!disciplinaToDelete) return;
    const result = await deleteDisciplina(disciplinaToDelete.id);
    if (result.success) {
      toast.success("Disciplina removida com sucesso!");
      setDisciplinaToDelete(null);
    } else {
      toast.error(result.error || "Erro ao remover disciplina");
    }
  }
  function handleToggleAtivo(id: string, nome: string, atualAtivo: boolean) {
    // Se for arquivar (está ativo), mostra o dialog de confirmação
    if (atualAtivo) {
      setDisciplinaToArchive({ id, nome, isAtivo: atualAtivo });
    } else {
      // Se for ativar (está arquivada), ativa diretamente
      confirmArchiveToggle(id, atualAtivo);
    }
  }

  async function confirmArchiveToggle(id?: string, isAtivo?: boolean) {
    const targetId = id || disciplinaToArchive?.id;
    const targetIsAtivo =
      isAtivo !== undefined ? isAtivo : disciplinaToArchive?.isAtivo;

    if (!targetId) return;

    const result = await toggleAtivo(targetId, !targetIsAtivo);
    if (result.success) {
      toast.success(
        !targetIsAtivo
          ? "Disciplina ativada com sucesso!"
          : "Disciplina arquivada com sucesso!"
      );
      setDisciplinaToArchive(null);
    } else {
      toast.error(result.error || "Erro ao alterar status da disciplina");
    }
  }

  // Função para fixar posições de todas as disciplinas
  const [fixandoPosicoes, setFixandoPosicoes] = useState(false);
  async function handleFixarPosicoes() {
    try {
      setFixandoPosicoes(true);
      const response = await fetch("/api/disciplinas/fixar-posicoes", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || "Posições fixadas com sucesso!");
        await refetch();
      } else {
        toast.error(data.error || "Erro ao fixar posições");
      }
    } catch (err: any) {
      console.error("Erro ao fixar posições:", err);
      toast.error("Erro ao fixar posições");
    } finally {
      setFixandoPosicoes(false);
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BookOpen className="size-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando disciplinas...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
          Erro ao carregar disciplinas: {error}
        </div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Disciplinas</h1>
            <p className="text-muted-foreground">
              {userProfile.periodo || userProfile.curso ? (
                <>
                  {userProfile.periodo && `${userProfile.periodo}º período`}
                  {userProfile.periodo && userProfile.curso && " — "}
                  {userProfile.curso}
                  {` • ${horasTotais}h/sem`}
                </>
              ) : (
                `${horasTotais}h/semana`
              )}
              {list.length !== disciplinas.length &&
                ` (${list.length} filtradas)`}
            </p>
          </div>
          <AddDisciplinaModal
            onAdd={refetch}
            openFromCommand={shouldOpenModal}
            onOpenChange={setShouldOpenModal}
          />
        </div>
        {/* Barra de busca e ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar disciplina..."
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
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[130px]"
            >
              <option value="todas">Todos os tipos</option>
              <option value="obrigatoria">Obrigatórias</option>
              <option value="eletiva">Eletivas</option>
              <option value="optativa">Optativas</option>
            </select>

            <select
              value={filtroCargaHoraria}
              onChange={(e) => setFiltroCargaHoraria(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[120px]"
            >
              <option value="todas">Carga horária</option>
              <option value="1-2">1-2h/sem</option>
              <option value="3-4">3-4h/sem</option>
              <option value="5-6">5-6h/sem</option>
              <option value="7-8">7-8h/sem</option>
              <option value="9-">9h+</option>
            </select>

            {/* Separador visual */}
            <div className="hidden sm:block w-px bg-border" />

            {/* Toggle de visualização */}
            <div className="flex rounded-md border bg-background p-1 gap-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grade</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        viewMode === "list"
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
            </div>

            {/* Arquivadas */}
            {totalArquivadas > 0 && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMostrarArquivadas(!mostrarArquivadas)}
                      className={cn(
                        "h-10 px-3 rounded-md border flex items-center gap-2 text-sm transition-colors",
                        mostrarArquivadas
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Archive className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {totalArquivadas}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {mostrarArquivadas ? "Ocultar" : "Mostrar"}{" "}
                      {totalArquivadas} arquivada
                      {totalArquivadas > 1 ? "s" : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Fixar Posições */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleFixarPosicoes}
                    disabled={fixandoPosicoes || disciplinas.length === 0}
                    className={cn(
                      "h-10 px-3 rounded-md border flex items-center gap-2 text-sm transition-colors",
                      fixandoPosicoes || disciplinas.length === 0
                        ? "opacity-50 cursor-not-allowed bg-background text-muted-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {fixandoPosicoes ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Fixando...</span>
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4" />
                        <span className="hidden sm:inline">Fixar Posições</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fixar a posição atual de todas as disciplinas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>
      {}
      {list.length === 0 ? (
        <Card title="Disciplinas">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground font-medium mb-2">
              Nenhuma disciplina encontrada
            </p>
            <p className="text-xs text-muted-foreground">
              {q || tipo !== "todas" || filtroCargaHoraria !== "todas"
                ? "Tente ajustar os filtros"
                : "Crie sua primeira disciplina para começar"}
            </p>
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => {
            const stats = statsMap.get(d.id);
            return (
              <DisciplinaCard
                key={d.id}
                disciplina={d}
                stats={stats}
                onDelete={() => removeItem(d.id, d.nome)}
                onToggleAtivo={() =>
                  handleToggleAtivo(d.id, d.nome, d.ativo !== false)
                }
                onToggleFavorito={() =>
                  handleToggleFavorito(d.id, d.favorito === true)
                }
                onUpdateCor={(cor) => handleUpdateCor(d.id, cor)}
                loadingStats={loadingStats}
                onDragStart={(e) => handleDragStart(e, d.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, d.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedId === d.id}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((d) => {
            const stats = statsMap.get(d.id);
            return (
              <DisciplinaCardList
                key={d.id}
                disciplina={d}
                stats={stats}
                onDelete={() => removeItem(d.id, d.nome)}
                onToggleAtivo={() =>
                  handleToggleAtivo(d.id, d.nome, d.ativo !== false)
                }
                onToggleFavorito={() =>
                  handleToggleFavorito(d.id, d.favorito === true)
                }
                onUpdateCor={(cor) => handleUpdateCor(d.id, cor)}
                loadingStats={loadingStats}
                onDragStart={(e) => handleDragStart(e, d.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, d.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedId === d.id}
              />
            );
          })}
        </div>
      )}
      {}
      <SyncDisciplinasWithCalendar />
      {}
      <Dialog
        open={!!disciplinaToDelete}
        onOpenChange={(open) => !open && setDisciplinaToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Remover Disciplina
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a disciplina{" "}
              <span className="font-semibold text-foreground">
                {disciplinaToDelete?.nome}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-destructive/10 border-destructive/30 p-4 text-sm">
              <p className="text-destructive font-medium">
                ⚠️ Atenção: Esta ação é irreversível!
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>A disciplina será excluída permanentemente</li>
                <li>Todas as avaliações serão removidas</li>
                <li>Todas as notas e materiais serão apagados</li>
                <li>Não será possível recuperar esses dados</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisciplinaToDelete(null)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de confirmação para arquivar */}
      <Dialog
        open={!!disciplinaToArchive}
        onOpenChange={(open) => !open && setDisciplinaToArchive(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              Arquivar Disciplina
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar a disciplina{" "}
              <span className="font-semibold text-foreground">
                {disciplinaToArchive?.nome}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-amber-500/10 border-amber-500/30 p-4 text-sm">
              <p className="text-amber-600 dark:text-amber-400">
                <strong>O que acontece ao arquivar:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>A disciplina não aparecerá na lista principal</li>
                <li>Você poderá reativá-la a qualquer momento</li>
                <li>Seus dados, avaliações e notas serão mantidos</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisciplinaToArchive(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => confirmArchiveToggle()}
            >
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function AddDisciplinaModal({
  onAdd,
  openFromCommand,
  onOpenChange,
}: {
  onAdd: () => void;
  openFromCommand?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createDisciplina } = useDisciplinas();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (openFromCommand !== undefined) {
      setOpen(openFromCommand);
    }
  }, [openFromCommand]);
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TTipo>("obrigatoria");
  const [horasSemana, setHorasSemana] = useState<number>(4);
  const [local, setLocal] = useState("");
  const [professor, setProfessor] = useState("");
  const [horarios, setHorarios] = useState<
    { dia: number; inicio: string; fim: string }[]
  >([]);
  const [novoHorario, setNovoHorario] = useState<{
    dia: number;
    inicio: string;
    fim: string;
  }>({ dia: 1, inicio: "08:00", fim: "10:00" });
  function resetForm() {
    setNome("");
    setTipo("obrigatoria");
    setHorasSemana(4);
    setLocal("");
    setProfessor("");
    setHorarios([]);
    setNovoHorario({ dia: 1, inicio: "08:00", fim: "10:00" });
  }
  function adicionarHorario() {
    if (!novoHorario.inicio || !novoHorario.fim) {
      toast.error("Preencha o horário de início e fim");
      return;
    }
    if (novoHorario.inicio >= novoHorario.fim) {
      toast.error("O horário de fim deve ser depois do horário de início");
      return;
    }
    const conflito = horarios.some(
      (h) =>
        h.dia === novoHorario.dia &&
        ((novoHorario.inicio >= h.inicio && novoHorario.inicio < h.fim) ||
          (novoHorario.fim > h.inicio && novoHorario.fim <= h.fim) ||
          (novoHorario.inicio <= h.inicio && novoHorario.fim >= h.fim))
    );
    if (conflito) {
      toast.error("Já existe um horário neste dia e horário");
      return;
    }
    setHorarios((prev) => [...prev, { ...novoHorario }]);
    setNovoHorario({ dia: 1, inicio: "08:00", fim: "10:00" });
    toast.success("Horário adicionado");
  }
  function removerHorario(index: number) {
    setHorarios((prev) => prev.filter((_, i) => i !== index));
  }
  async function salvar() {
    if (!nome.trim()) {
      toast.error("Nome da disciplina é obrigatório");
      return;
    }
    if (horasSemana <= 0) {
      toast.error("Carga horária semanal deve ser maior que zero");
      return;
    }
    const result = await createDisciplina({
      nome: nome.trim(),
      tipo,
      horasSemana,
      local: local.trim() || undefined,
      professor: professor.trim() || undefined,
      horarios:
        horarios.length > 0
          ? horarios.map((h) => ({
              id: "",
              dia: h.dia,
              inicio: h.inicio,
              fim: h.fim,
            }))
          : undefined,
    });
    if (result.success) {
      toast.success("Disciplina criada com sucesso!");
      resetForm();
      setOpen(false);
      onAdd();
    } else {
      toast.error(result.error || "Erro ao criar disciplina");
    }
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          + Nova Disciplina
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Disciplina</DialogTitle>
          <DialogDescription>
            Preencha os dados da disciplina. Campos marcados com * são
            obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {}
          <div className="grid gap-2">
            <label
              htmlFor="nome"
              className="text-sm font-medium flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Nome da Disciplina <span className="text-red-500">*</span>
            </label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Programação Web, Cálculo I, Estrutura de Dados"
            />
          </div>
          {}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="tipo" className="text-sm font-medium">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TTipo)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="obrigatoria">Obrigatória</option>
                <option value="eletiva">Eletiva</option>
                <option value="optativa">Optativa</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="horasSemana" className="text-sm font-medium">
                Carga Horária Semanal (h){" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="horasSemana"
                type="number"
                min="1"
                max="40"
                value={horasSemana}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value > 0 && value <= 40) {
                    setHorasSemana(value);
                  }
                }}
                placeholder="Ex: 4, 6, 8"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Total de horas por semana
              </p>
            </div>
          </div>
          {}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="local"
                className="text-sm font-medium flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Local (opcional)
              </label>
              <Input
                id="local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex: Sala 05, Lab Virtu"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="professor"
                className="text-sm font-medium flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Professor (opcional)
              </label>
              <Input
                id="professor"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Ex: Prof. João Silva"
              />
            </div>
          </div>
          {}
          <div className="grid gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários (opcional)
            </label>
            <div className="rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-4">
              {}
              <div className="grid grid-cols-4 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Dia da Semana
                  </label>
                  <select
                    value={novoHorario.dia}
                    onChange={(e) =>
                      setNovoHorario({
                        ...novoHorario,
                        dia: Number(e.target.value),
                      })
                    }
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {DIAS.map((dia, idx) => (
                      <option key={idx} value={idx}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Início
                  </label>
                  <Input
                    type="time"
                    value={novoHorario.inicio}
                    onChange={(e) =>
                      setNovoHorario({
                        ...novoHorario,
                        inicio: e.target.value,
                      })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Fim
                  </label>
                  <Input
                    type="time"
                    value={novoHorario.fim}
                    onChange={(e) =>
                      setNovoHorario({
                        ...novoHorario,
                        fim: e.target.value,
                      })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={adicionarHorario}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
              {}
              {horarios.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Horários adicionados ({horarios.length}):
                  </div>
                  <div className="space-y-2">
                    {horarios.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {DIAS[h.dia].charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{DIAS[h.dia]}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {h.inicio} — {h.fim}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removerHorario(idx);
                            toast.success("Horário removido");
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remover horário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={salvar}>
            Adicionar Disciplina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
