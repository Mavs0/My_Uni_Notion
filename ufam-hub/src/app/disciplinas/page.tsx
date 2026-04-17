"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useDisciplinas,
  CORES_DISCIPLINAS,
  type Disciplina as DisciplinaType,
} from "@/hooks/useDisciplinas";
import {
  Loader2,
  Trash2,
  Clock,
  User,
  BookOpen,
  Plus,
  X,
  Search,
  Filter,
  Grid3x3,
  List,
  Archive,
  ArchiveRestore,
  GraduationCap,
  Star,
  Palette,
  GripVertical,
  Pin,
  MapPin,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Bookmark,
  ArrowUpRight,
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
import { EmptyState } from "@/components/ui/empty-state";
import { EditDisciplinaDialog } from "@/components/EditDisciplinaDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return cn(
    "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
    map[tipo],
  );
}

const TIPO_FILTROS: { value: "todas" | TTipo; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "obrigatoria", label: "Obrigatórias" },
  { value: "optativa", label: "Optativas" },
  { value: "eletiva", label: "Eletivas" },
];

function monogramFromNome(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  return (nome.trim().slice(0, 2) || "?").toUpperCase();
}

function primeiroHorarioResumo(d: Disciplina): string | null {
  const h = d.horarios?.[0];
  if (!h) return null;
  return `${DIAS[h.dia]} · ${h.inicio.slice(0, 5)}–${h.fim.slice(0, 5)}`;
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
    <section className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {right}
      </header>
      {children}
    </section>
  );
}

function cardPatternBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
      aria-hidden
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,128,0.14) 1px, transparent 0)",
        backgroundSize: "20px 20px",
      }}
    />
  );
}

function DisciplinaFeaturedCard({
  disciplina,
  onToggleFavorito,
  onDelete,
  onToggleAtivo,
  onUpdateCor,
  onEdit,
}: {
  disciplina: Disciplina;
  onToggleFavorito: () => void;
  onDelete: () => void;
  onToggleAtivo: () => void;
  onUpdateCor: (cor: string) => void;
  onEdit?: (disciplina: Disciplina) => void;
}) {
  const isArquivada = disciplina.ativo === false;
  const isFavorito = disciplina.favorito === true;
  const cor = disciplina.cor || "#6366f1";
  const horario = primeiroHorarioResumo(disciplina);
  const mono = monogramFromNome(disciplina.nome ?? "?");

  return (
    <article
      className={cn(
        "relative flex h-full min-h-[280px] w-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-border/60 shadow-lg transition-transform duration-300",
        !isArquivada && "hover:-translate-y-0.5 hover:shadow-xl",
        isArquivada && "opacity-70",
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${cor}18 0%, hsl(var(--card)) 48%, hsl(var(--card)) 100%)`,
        }}
      />
      {cardPatternBg()}
      <div
        className="absolute -right-6 -top-8 text-[6rem] font-black leading-none tracking-tighter text-foreground/[0.06] dark:text-foreground/[0.09]"
        aria-hidden
      >
        {mono}
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <span className={badgeTipo(disciplina.tipo)}>{disciplina.tipo}</span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={isArquivada}
              onClick={(e) => {
                e.preventDefault();
                if (!isArquivada) onToggleFavorito();
              }}
              aria-label={isFavorito ? "Remover dos favoritos" : "Favoritar"}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  isFavorito && "fill-primary text-primary",
                )}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label="Opções"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isArquivada ? (
                  <>
                    <DropdownMenuItem onClick={onToggleAtivo}>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Desarquivar disciplina
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir disciplina
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Palette className="mr-2 h-4 w-4" />
                        Alterar cor
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                        {CORES_DISCIPLINAS.map((c) => (
                          <DropdownMenuItem
                            key={c.valor}
                            onClick={() => onUpdateCor(c.valor)}
                          >
                            <span
                              className="mr-2 h-4 w-4 shrink-0 rounded-full border"
                              style={{ backgroundColor: c.valor }}
                            />
                            {c.nome}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={onToggleAtivo}>
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar disciplina
                    </DropdownMenuItem>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(disciplina)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar disciplina
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir disciplina
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="mb-1 line-clamp-2 text-2xl font-bold leading-tight tracking-tight text-foreground">
          {disciplina.nome ?? "Sem nome"}
        </h3>
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {disciplina.horasSemana}h/semana
          {isArquivada && (
            <span className="ml-2 rounded-full border border-border bg-background/80 px-2 py-0.5 normal-case">
              Arquivada
            </span>
          )}
        </p>

        <div className="mb-5 flex flex-1 flex-col justify-end gap-3">
          <div className="h-px w-full bg-border/60" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 opacity-80" />
            <span className="line-clamp-2">
              {horario
                ? `Próximo horário: ${horario}`
                : "Nenhum horário cadastrado — defina na disciplina"}
            </span>
          </div>
        </div>

        {isArquivada ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-11 w-full rounded-full font-semibold opacity-60"
            disabled
          >
            Indisponível
          </Button>
        ) : (
          <Button
            asChild
            variant="default"
            size="sm"
            className="mt-auto h-11 w-full shrink-0 rounded-full font-semibold shadow-md"
          >
            <a
              href={disciplina.id ? `/disciplinas/${disciplina.id}` : "#"}
              className="inline-flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}

function DisciplinaCard({
  disciplina,
  onDelete,
  onToggleAtivo,
  onToggleFavorito,
  onUpdateCor,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  disciplina: Disciplina;
  onDelete: () => void;
  onToggleAtivo: () => void;
  onToggleFavorito: () => void;
  onUpdateCor: (cor: string) => void;
  onEdit?: (disciplina: Disciplina) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  const isArquivada = disciplina.ativo === false;
  const isFavorito = disciplina.favorito === true;
  const cor = disciplina.cor || "#6366f1";
  const horarioLinha = primeiroHorarioResumo(disciplina);
  const mono = monogramFromNome(disciplina.nome ?? "?");

  return (
    <div
      draggable={!isArquivada}
      onDragStart={isArquivada ? undefined : onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex max-h-[340px] min-h-[280px] flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03] transition-all duration-300 dark:ring-white/[0.05] sm:max-h-none sm:h-[300px]",
        isArquivada
          ? "border-dashed opacity-60 hover:opacity-80"
          : "hover:-translate-y-1 hover:shadow-xl",
        isDragging && "scale-95 opacity-50",
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-0 h-24 opacity-40"
        style={{
          background: `linear-gradient(180deg, ${cor}33 0%, transparent 100%)`,
        }}
        aria-hidden
      />
      {cardPatternBg()}
      <div
        className="pointer-events-none absolute bottom-2 right-3 select-none text-5xl font-black tabular-nums tracking-tighter text-foreground/[0.07] dark:text-foreground/[0.12]"
        aria-hidden
      >
        {mono}
      </div>

      <div
        className="relative z-[1] h-1 w-2/5 max-w-[120px] shrink-0 rounded-br-2xl"
        style={{ backgroundColor: cor }}
        aria-hidden
      />

      {/* Conteúdo rolável */}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-2 pt-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          {/* Drag Handle */}
          <div className={cn(
            "mt-0.5 text-muted-foreground",
            isArquivada ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing hover:text-foreground"
          )}>
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 pr-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={badgeTipo(disciplina.tipo)}>
                {disciplina.tipo}
              </span>
              {isArquivada && (
                <span className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Arquivada
                </span>
              )}
            </div>
            <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground">
              {disciplina.nome ?? "Sem nome"}
            </h3>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Carga · {disciplina.horasSemana}h/semana
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {horarioLinha ? (
                <>
                  <span className="font-medium text-foreground/90">
                    Agenda:{" "}
                  </span>
                  {horarioLinha}
                </>
              ) : (
                "Sem horários — toque em abrir para cadastrar"
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full md:opacity-0 md:group-hover:opacity-100"
              disabled={isArquivada}
              onClick={(e) => {
                e.preventDefault();
                if (!isArquivada) onToggleFavorito();
              }}
              aria-label={isFavorito ? "Remover dos favoritos" : "Favoritar"}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  isFavorito && "fill-primary text-primary",
                )}
              />
            </Button>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Opções"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isArquivada ? (
                <>
                  <DropdownMenuItem onClick={onToggleAtivo}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Desarquivar disciplina
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir disciplina
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={onToggleFavorito}>
                    <Star
                      className={cn(
                        "h-4 w-4 mr-2",
                        isFavorito && "fill-yellow-500",
                      )}
                    />
                    {isFavorito ? "Remover dos favoritos" : "Favoritar"}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Palette className="h-4 w-4 mr-2" />
                      Alterar cor
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                      {CORES_DISCIPLINAS.map((c) => (
                        <DropdownMenuItem
                          key={c.valor}
                          onClick={() => onUpdateCor(c.valor)}
                        >
                          <span
                            className="w-4 h-4 rounded-full border mr-2 shrink-0"
                            style={{ backgroundColor: c.valor }}
                          />
                          {c.nome}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={onToggleAtivo}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar disciplina
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(disciplina)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar disciplina
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir disciplina
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        {/* Professor, local e horários (uma vez cada) */}
        <div className="mb-3 space-y-1.5 text-xs text-muted-foreground">
          {disciplina.professor ||
          disciplina.local ||
          (disciplina.horarios?.length ?? 0) > 0 ? (
            <>
              {(disciplina.professor || disciplina.local) && (
                <div className="flex flex-wrap items-center gap-3">
                  {disciplina.professor && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      {disciplina.professor}
                    </span>
                  )}
                  {disciplina.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {disciplina.local}
                    </span>
                  )}
                </div>
              )}
              {disciplina.horarios && disciplina.horarios.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {disciplina.horarios.slice(0, 4).map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5"
                    >
                      <span className="font-medium text-foreground">
                        {DIAS[h.dia]}
                      </span>
                      <span>
                        {h.inicio}–{h.fim}
                      </span>
                    </span>
                  ))}
                  {disciplina.horarios.length > 4 && (
                    <span className="self-center">
                      +{disciplina.horarios.length - 4}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : isArquivada ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Plus className="h-3 w-3" />
              Desarquive para editar horários e detalhes
            </span>
          ) : (
            <Link
              href={disciplina.id ? `/disciplinas/${disciplina.id}` : "#"}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              <Plus className="h-3 w-3" />
              Adicione horários e detalhes na página da disciplina
            </Link>
          )}
        </div>
      </div>
      {/* Botão Abrir fixo no rodapé */}
      <div className="relative z-[1] mt-auto shrink-0 border-t border-border/50 bg-muted/20 px-5 py-4 backdrop-blur-[2px]">
        {isArquivada ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="h-11 w-full rounded-full shadow-sm pointer-events-none opacity-70"
                  disabled
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Abrir
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Desarquive a disciplina para abrir</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            asChild
            variant="default"
            size="sm"
            className="h-11 w-full rounded-full font-semibold shadow-md"
          >
            <a
              href={disciplina.id ? `/disciplinas/${disciplina.id}` : "#"}
              className="inline-flex items-center justify-center gap-2"
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              Abrir disciplina
              <ArrowUpRight className="h-4 w-4 shrink-0 opacity-90" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function DisciplinaCardList({
  disciplina,
  onDelete,
  onToggleAtivo,
  onToggleFavorito,
  onUpdateCor,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  disciplina: Disciplina;
  onDelete: () => void;
  onToggleAtivo: () => void;
  onToggleFavorito: () => void;
  onUpdateCor: (cor: string) => void;
  onEdit?: (disciplina: Disciplina) => void;
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
      draggable={!isArquivada}
      onDragStart={isArquivada ? undefined : onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg",
        isArquivada
          ? "opacity-60 hover:opacity-80 border-dashed"
          : "",
        isDragging && "scale-95 opacity-50",
      )}
    >
      <div className="flex items-stretch gap-0">
        <div
          className="w-1.5 shrink-0 self-stretch"
          style={{ backgroundColor: cor }}
          aria-hidden
        />
      <div className="flex flex-1 items-start gap-4 p-4">
        {/* Drag Handle */}
        <div className={cn(
          "mt-1 text-muted-foreground",
          isArquivada ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing hover:text-foreground"
        )}>
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {isFavorito && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            <h3 className="font-semibold text-base text-foreground">
              {disciplina.nome ?? "Sem nome"}
            </h3>
            <span className={badgeTipo(disciplina.tipo)}>
              {disciplina.tipo}
            </span>
            {isArquivada && (
              <span className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Arquivada
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {disciplina.horasSemana}h/semana
            </span>
            {disciplina.professor && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 shrink-0" />
                {disciplina.professor}
              </span>
            )}
            {disciplina.local && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {disciplina.local}
              </span>
            )}
            {disciplina.horarios && disciplina.horarios.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {disciplina.horarios.slice(0, 4).map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs"
                  >
                    {DIAS[h.dia]} {h.inicio}–{h.fim}
                  </span>
                ))}
                {disciplina.horarios.length > 4 && (
                  <span className="text-xs">
                    +{disciplina.horarios.length - 4}
                  </span>
                )}
              </span>
            ) : !disciplina.professor &&
              !disciplina.local &&
              (!disciplina.horarios || disciplina.horarios.length === 0) ? (
              isArquivada ? (
                <span className="text-muted-foreground text-xs">Desarquive para editar</span>
              ) : (
                <Link
                  href={disciplina.id ? `/disciplinas/${disciplina.id}` : "#"}
                  className="text-muted-foreground hover:text-foreground hover:underline text-xs"
                >
                  Adicione horários e detalhes
                </Link>
              )
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isArquivada ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" disabled className="pointer-events-none rounded-full opacity-70">
                    Abrir
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Desarquive a disciplina para abrir</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button asChild variant="default" size="sm" className="rounded-full px-5 font-semibold">
              <a href={disciplina.id ? `/disciplinas/${disciplina.id}` : "#"}>Abrir</a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="Opções"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isArquivada ? (
                <>
                  <DropdownMenuItem onClick={onToggleAtivo}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Desarquivar disciplina
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir disciplina
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={onToggleFavorito}>
                    <Star
                      className={cn(
                        "h-4 w-4 mr-2",
                        isFavorito && "fill-yellow-500",
                      )}
                    />
                    {isFavorito ? "Remover dos favoritos" : "Favoritar"}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Palette className="h-4 w-4 mr-2" />
                      Alterar cor
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                      {CORES_DISCIPLINAS.map((c) => (
                        <DropdownMenuItem
                          key={c.valor}
                          onClick={() => onUpdateCor(c.valor)}
                        >
                          <span
                            className="mr-2 h-4 w-4 shrink-0 rounded-full border"
                            style={{ backgroundColor: c.valor }}
                          />
                          {c.nome}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={onToggleAtivo}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar disciplina
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(disciplina)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar disciplina
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir disciplina
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
  const [disciplinaToEdit, setDisciplinaToEdit] = useState<Disciplina | null>(
    null,
  );
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
  const [shouldOpenModal, setShouldOpenModal] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShouldOpenModal(true);
      window.history.replaceState({}, "", "/disciplinas");
    }
  }, [searchParams]);
  const list = useMemo(() => {
    if (!disciplinas) return [];
    let arr = [...disciplinas];
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
          d.local?.toLowerCase().includes(n),
      );
    }
    return arr.sort((a, b) => {
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      if ((a.ordem ?? 0) !== (b.ordem ?? 0)) {
        return (a.ordem ?? 0) - (b.ordem ?? 0);
      }
      return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
    });
  }, [disciplinas, tipo, q, filtroCargaHoraria, mostrarArquivadas]);

  const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  }, [list, page]);

  useEffect(() => {
    setPage(1);
  }, [tipo, q, filtroCargaHoraria, mostrarArquivadas]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const totalArquivadas = useMemo(() => {
    return disciplinas.filter((d) => d.ativo === false).length;
  }, [disciplinas]);
  const horasTotais = useMemo(
    () => list.reduce((acc, d) => acc + d.horasSemana, 0),
    [list],
  );

  const topThree = useMemo(() => list.slice(0, 3), [list]);
  const showFeaturedStrip = viewMode === "grid" && page === 1 && list.length > 0;
  const gridDisplayList = useMemo(() => {
    if (!showFeaturedStrip) return paginatedList;
    const ids = new Set(topThree.map((d) => d.id));
    return paginatedList.filter((d) => !ids.has(d.id));
  }, [showFeaturedStrip, paginatedList, topThree]);

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

    const newList = [...list];
    const [removed] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, removed);

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

  const handleToggleFavorito = async (id: string, atualFavorito: boolean) => {
    const result = await toggleFavorito(id, !atualFavorito);
    if (result.success) {
      toast.success(
        !atualFavorito ? "Disciplina favoritada!" : "Removida dos favoritos",
      );
    }
  };

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
    if (atualAtivo) {
      setDisciplinaToArchive({ id, nome, isAtivo: atualAtivo });
    } else {
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
          : "Disciplina arquivada com sucesso!",
      );
      setDisciplinaToArchive(null);
    } else {
      toast.error(result.error || "Erro ao alterar status da disciplina");
    }
  }

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
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Disciplinas
            </h1>
            <p className="text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "disciplina" : "disciplinas"}
              {list.length !== disciplinas.length && " (filtradas)"}
              {" · "}
              {horasTotais}h/semana no total
            </p>
          </div>
          <AddDisciplinaModal
            onAdd={refetch}
            openFromCommand={shouldOpenModal}
            onOpenChange={setShouldOpenModal}
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar disciplina..."
            className="h-12 rounded-full border-border/80 bg-muted/40 pl-11 pr-11 shadow-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {TIPO_FILTROS.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={tipo === value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "shrink-0 rounded-full px-4 font-medium",
                  tipo === value && "shadow-sm",
                )}
                onClick={() => setTipo(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex flex-shrink-0 items-center justify-end gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 rounded-full border-border/80"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Mais filtros</span>
                  <span className="sm:hidden">Filtros</span>
                  {filtroCargaHoraria !== "todas" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 rounded-2xl" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Carga horária semanal
                    </label>
                    <select
                      value={filtroCargaHoraria}
                      onChange={(e) => setFiltroCargaHoraria(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="todas">Todas</option>
                      <option value="1-2">1–2h/semana</option>
                      <option value="3-4">3–4h/semana</option>
                      <option value="5-6">5–6h/semana</option>
                      <option value="7-8">7–8h/semana</option>
                      <option value="9-">9h ou mais</option>
                    </select>
                  </div>
                  <div className="border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 rounded-xl"
                      onClick={handleFixarPosicoes}
                      disabled={fixandoPosicoes || disciplinas.length === 0}
                    >
                      {fixandoPosicoes ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                      Fixar posições na grade
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex rounded-full border border-border/80 bg-muted/30 p-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "rounded-full p-2.5 transition-colors",
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                      aria-pressed={viewMode === "grid"}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grade</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "rounded-full p-2.5 transition-colors",
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                      aria-pressed={viewMode === "list"}
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

            {totalArquivadas > 0 && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setMostrarArquivadas(!mostrarArquivadas)}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
                        mostrarArquivadas
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "border-border/80 bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Archive className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">{totalArquivadas}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {mostrarArquivadas ? "Ocultar" : "Mostrar"} arquivadas
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </header>
      {}
      {list.length === 0 ? (
        <Card title="Disciplinas">
          <EmptyState
            icon={BookOpen}
            title="Nenhuma disciplina encontrada"
            description={
              q || tipo !== "todas" || filtroCargaHoraria !== "todas"
                ? "Tente ajustar os filtros de busca, tipo ou carga horária."
                : "Crie sua primeira disciplina para começar a organizar seu semestre."
            }
            action={
              q || tipo !== "todas" || filtroCargaHoraria !== "todas"
                ? undefined
                : {
                    label: "Nova disciplina",
                    onClick: () => setShouldOpenModal(true),
                    icon: Plus,
                  }
            }
          />
        </Card>
      ) : viewMode === "grid" ? (
        <div className="space-y-10">
          {showFeaturedStrip && (
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Em destaque
                  </h2>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Atalhos para as disciplinas no topo da sua lista — favoritos e
                    ordem da grade vêm primeiro.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch md:gap-4 lg:gap-5">
                {topThree.map((d, idx) => (
                  <div
                    key={d.id ?? `feat-${idx}`}
                    className="h-full min-h-0 min-w-0 w-full"
                  >
                    <DisciplinaFeaturedCard
                      disciplina={d}
                      onToggleFavorito={() =>
                        handleToggleFavorito(d.id, d.favorito === true)
                      }
                      onDelete={() => removeItem(d.id, d.nome)}
                      onToggleAtivo={() =>
                        handleToggleAtivo(d.id, d.nome, d.ativo !== false)
                      }
                      onUpdateCor={(cor) => handleUpdateCor(d.id, cor)}
                      onEdit={() => setDisciplinaToEdit(d)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {showFeaturedStrip && gridDisplayList.length > 0 && (
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Mais disciplinas
            </h2>
          )}

          <div
            className={cn(
              "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6",
              showFeaturedStrip && gridDisplayList.length > 0 && "pt-2",
            )}
          >
            {gridDisplayList.map((d, idx) => (
              <DisciplinaCard
                key={d.id ?? `disciplina-${idx}`}
                disciplina={d}
                onDelete={() => removeItem(d.id, d.nome)}
                onToggleAtivo={() =>
                  handleToggleAtivo(d.id, d.nome, d.ativo !== false)
                }
                onToggleFavorito={() =>
                  handleToggleFavorito(d.id, d.favorito === true)
                }
                onUpdateCor={(cor) => handleUpdateCor(d.id, cor)}
                onEdit={() => setDisciplinaToEdit(d)}
                onDragStart={(e) => handleDragStart(e, d.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, d.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedId === d.id}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-8">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[10rem] text-center text-sm font-medium text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedList.map((d, idx) => (
              <DisciplinaCardList
                key={d.id ?? `disciplina-list-${idx}`}
                disciplina={d}
                onDelete={() => removeItem(d.id, d.nome)}
                onToggleAtivo={() =>
                  handleToggleAtivo(d.id, d.nome, d.ativo !== false)
                }
                onToggleFavorito={() =>
                  handleToggleFavorito(d.id, d.favorito === true)
                }
                onUpdateCor={(cor) => handleUpdateCor(d.id, cor)}
                onEdit={() => setDisciplinaToEdit(d)}
                onDragStart={(e) => handleDragStart(e, d.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, d.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedId === d.id}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-8">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[10rem] text-center text-sm font-medium text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
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
      <EditDisciplinaDialog
        open={!!disciplinaToEdit}
        disciplina={disciplinaToEdit}
        onOpenChange={(open) => !open && setDisciplinaToEdit(null)}
        onSaved={() => setDisciplinaToEdit(null)}
      />
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
  const [step, setStep] = useState(1);
  function resetForm() {
    setNome("");
    setTipo("obrigatoria");
    setHorasSemana(4);
    setLocal("");
    setProfessor("");
    setHorarios([]);
    setNovoHorario({ dia: 1, inicio: "08:00", fim: "10:00" });
    setStep(1);
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
          (novoHorario.inicio <= h.inicio && novoHorario.fim >= h.fim)),
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
        <Button
          variant="default"
          size="sm"
          className="h-11 shrink-0 rounded-full px-6 font-semibold shadow-sm"
        >
          + Nova Disciplina
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 px-6 pt-6 pb-2 border-b">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </button>
              {s < 2 && <div className="w-8 h-0.5 bg-muted mx-0.5" />}
            </div>
          ))}
        </div>
        <div className="px-2 text-center text-xs text-muted-foreground mb-4 mt-2">
          {step === 1 && "Informações gerais"}
          {step === 2 && "Horários"}
        </div>

        <div className="px-6 pb-6">
          {step === 1 && (
            <div className="grid gap-6">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Informações da disciplina
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados básicos. Campos marcados com * são
                  obrigatórios.
                </DialogDescription>
              </DialogHeader>

              <div>
                <Label
                  htmlFor="nome"
                  className="flex items-center gap-2 block mb-4"
                >
                  Nome da Disciplina <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Programação Web, Cálculo I, Estrutura de Dados"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo" className="block mb-4">
                    Tipo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as TTipo)}
                  >
                    <SelectTrigger id="tipo" className="h-10">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                      <SelectItem value="eletiva">Eletiva</SelectItem>
                      <SelectItem value="optativa">Optativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="horasSemana" className="block mb-4">
                    Carga Horária Semanal (h){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="horasSemana"
                    type="number"
                    min={1}
                    max={40}
                    value={horasSemana}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > 0 && value <= 40) setHorasSemana(value);
                    }}
                    placeholder="Ex: 4, 6, 8"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Total de horas por semana
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="local"
                    className="flex items-center gap-2 block mb-4"
                  >
                    <MapPin className="h-4 w-4" />
                    Local (opcional)
                  </Label>
                  <Input
                    id="local"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Sala 05, Lab Virtu"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="professor"
                    className="flex items-center gap-2 block mb-4"
                  >
                    <User className="h-4 w-4" />
                    Professor (opcional)
                  </Label>
                  <Input
                    id="professor"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Ex: Prof. João Silva"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Horários das aulas
                </DialogTitle>
                <DialogDescription>
                  Adicione os horários da disciplina. Este passo é opcional.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <Label className="flex items-center gap-2 block mb-2">
                  <Clock className="h-4 w-4" />
                  Horários (opcional)
                </Label>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Dia da Semana
                      </Label>
                      <Select
                        value={String(novoHorario.dia)}
                        onValueChange={(v) =>
                          setNovoHorario({ ...novoHorario, dia: Number(v) })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {DIAS.map((dia, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Início
                      </Label>
                      <Input
                        type="time"
                        value={novoHorario.inicio}
                        onChange={(e) =>
                          setNovoHorario({
                            ...novoHorario,
                            inicio: e.target.value,
                          })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Fim
                      </Label>
                      <Input
                        type="time"
                        value={novoHorario.fim}
                        onChange={(e) =>
                          setNovoHorario({
                            ...novoHorario,
                            fim: e.target.value,
                          })
                        }
                        className="h-10"
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
                  {horarios.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Horários adicionados ({horarios.length})
                      </Label>
                      <div className="space-y-2">
                        {horarios.map((h, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm hover:bg-muted/50 transition-colors"
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
          )}
        </div>

        <DialogFooter className="flex-row justify-between items-center gap-4 p-4 border-t bg-muted/20">
          <div>
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
          <div>
            {step < 2 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={!nome.trim() || horasSemana <= 0}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={salvar}>Adicionar Disciplina</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

