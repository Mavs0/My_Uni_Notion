"use client";
import * as React from "react";
import { Command as CmdkCommand } from "cmdk";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./command";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  MessageSquare,
  Plus,
  FileText,
  Search,
  BarChart3,
  Brain,
  Users,
  Library,
  X,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Hash,
  Settings,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useNotasSearch } from "@/hooks/useNotasSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CommandPaletteContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = ctx?.open ?? localOpen;
  const setOpen = ctx?.setOpen ?? setLocalOpen;
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v: boolean) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
  return { open, setOpen };
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v: boolean) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteOpen(): (open: boolean) => void {
  const ctx = React.useContext(CommandPaletteContext);
  return React.useCallback(
    (open: boolean) => {
      ctx?.setOpen(open);
    },
    [ctx?.setOpen]
  );
}
type FilterSort = "relevance" | "recent";
type FilterType = "all" | "pages" | "disciplines" | "notes" | "people" | "library";

interface RecentDisciplina {
  id: string;
  nome: string;
  updated_at?: string;
}

interface RecentMaterial {
  id: string;
  titulo: string;
  descricao?: string | null;
  created_at?: string;
}

interface DiscoverUser {
  id: string;
  nome: string;
  curso?: string;
  avatar_url?: string;
}

export function CommandPalette({
  open,
  setOpenAction,
}: {
  open: boolean;
  setOpenAction: (v: boolean) => void;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterSort, setFilterSort] = React.useState<FilterSort>("relevance");
  const [filterType, setFilterType] = React.useState<FilterType>("all");
  const [recentDisciplinas, setRecentDisciplinas] = React.useState<RecentDisciplina[]>([]);
  const [recentMaterials, setRecentMaterials] = React.useState<RecentMaterial[]>([]);
  const [people, setPeople] = React.useState<DiscoverUser[]>([]);
  const [peopleLoading, setPeopleLoading] = React.useState(false);

  const { search, results, loading: notasLoading } = useNotasSearch();

  React.useEffect(() => {
    if (searchQuery.trim().length > 2) {
      search(searchQuery);
    }
  }, [searchQuery, search]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [discRes, libRes] = await Promise.all([
          fetch("/api/disciplinas"),
          fetch("/api/colaboracao/biblioteca?ordenar=recentes&limit=5&offset=0"),
        ]);
        if (cancelled) return;
        if (discRes.ok) {
          const d = await discRes.json();
          const list = (d.disciplinas || []).map((x: { id: string; nome: string; updated_at?: string }) => ({
            id: x.id,
            nome: x.nome,
            updated_at: x.updated_at,
          }));
          setRecentDisciplinas(
            [...list].sort((a, b) => {
              const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
              return tb - ta;
            }).slice(0, 5)
          );
        }
        if (libRes.ok) {
          const lib = await libRes.json();
          setRecentMaterials((lib.materiais || []).slice(0, 5).map((m: { id: string; titulo: string; descricao?: string; created_at?: string }) => ({
            id: m.id,
            titulo: m.titulo,
            descricao: m.descricao,
            created_at: m.created_at,
          })));
        }
      } catch (e) {
        if (!cancelled) {
          setRecentDisciplinas([]);
          setRecentMaterials([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPeopleLoading(true);
    const q = searchQuery.trim().length >= 2 ? searchQuery : "";
    fetch(`/api/users/discover?limit=${q ? 10 : 6}${q ? `&search=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.ok ? r.json() : { users: [] })
      .then((data) => {
        if (!cancelled) setPeople(data.users || []);
      })
      .catch(() => { if (!cancelled) setPeople([]); })
      .finally(() => { if (!cancelled) setPeopleLoading(false); });
    return () => { cancelled = true; };
  }, [open, searchQuery]);

  const go = (href: string, action?: string) => {
    setOpenAction(false);
    if (action) {
      router.push(`${href}?action=${action}`);
    } else {
      router.push(href);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Hoje";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Ontem";
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) return `Há ${diff} dias`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: null, shortcut: "⌘H" },
    {
      label: "Disciplinas",
      href: "/disciplinas",
      icon: BookOpen,
      shortcut: "⌘⇧D",
    },
    {
      label: "Avaliações",
      href: "/avaliacoes",
      icon: GraduationCap,
      shortcut: "⌘⇧A",
    },
    { label: "Revisão", href: "/revisao", icon: Brain, shortcut: "⌘⇧R" },
    { label: "Calendário", href: "/calendar", icon: Calendar },
    { label: "Chat IA", href: "/chat", icon: MessageSquare },
    { label: "Grupos de Estudo", href: "/grupos", icon: Users },
    { label: "Biblioteca", href: "/biblioteca", icon: Library },
    { label: "Estatísticas", href: "/estatisticas", icon: BarChart3 },
  ];

  const actionItems = [
    {
      label: "Nova disciplina",
      href: "/disciplinas",
      action: "new",
      icon: BookOpen,
      shortcut: "⌘N",
    },
    {
      label: "Nova avaliação",
      href: "/avaliacoes",
      action: "new",
      icon: GraduationCap,
      shortcut: "⌘⇧N",
    },
    {
      label: "Novo evento",
      href: "/calendar",
      action: "new",
      icon: Plus,
    },
    {
      label: "Criar grupo de estudo",
      href: "/grupos",
      action: "new",
      icon: Users,
    },
  ];
  const filteredNavigation = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredActions = actionItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showNav = filterType === "all" || filterType === "pages";
  const showPeople = filterType === "all" || filterType === "people";
  const showRecentDisc = filterType === "all" || filterType === "disciplines";
  const showRecentLib = filterType === "all" || filterType === "library";
  const showNotas = (filterType === "all" || filterType === "notes") && searchQuery.trim().length > 2;

  return (
    <CommandDialog open={open} onOpenChange={setOpenAction} className="max-w-2xl">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <CmdkCommand.Input
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Buscar páginas, disciplinas, avaliações..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="rounded-full p-1 hover:bg-muted"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Select value={filterSort} onValueChange={(v) => setFilterSort(v as FilterSort)}>
          <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent shadow-none focus:ring-0 [&>svg]:ml-0">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevância</SelectItem>
            <SelectItem value="recent">Recentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
          <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent shadow-none focus:ring-0 [&>svg]:ml-0">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pages">Páginas</SelectItem>
            <SelectItem value="disciplines">Disciplinas</SelectItem>
            <SelectItem value="notes">Anotações</SelectItem>
            <SelectItem value="people">Pessoas</SelectItem>
            <SelectItem value="library">Biblioteca</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CommandList className="max-h-[320px]">
        <CommandEmpty>
          {searchQuery
            ? `Nenhum resultado para "${searchQuery}"`
            : "Digite para buscar..."}
        </CommandEmpty>

        {filteredActions.length > 0 && (
          <CommandGroup heading="">
            <CommandItem
              onSelect={() => go("/disciplinas", "new")}
              className="flex items-center justify-between gap-2 py-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span>Criar nova disciplina</span>
              </div>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Ação rápida
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CommandItem>
          </CommandGroup>
        )}

        {showNav && filteredNavigation.length > 0 && (
          <CommandGroup heading="Navegação">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => go(item.href)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </div>
                  {item.shortcut && (
                    <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {showPeople && (people.length > 0 || peopleLoading) && (
          <CommandGroup heading="Pessoas">
            {peopleLoading ? (
              <CommandItem disabled>
                <Search className="h-4 w-4 animate-pulse" />
                Buscando...
              </CommandItem>
            ) : (
              people.slice(0, 6).map((u) => (
                <CommandItem
                  key={u.id}
                  onSelect={() => {
                    setOpenAction(false);
                    router.push(`/perfil/${u.id}`);
                  }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      (u.nome || "?").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-medium">{u.nome}</div>
                    {u.curso ? (
                      <div className="text-xs text-muted-foreground truncate">{u.curso}</div>
                    ) : null}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CommandItem>
              ))
            )}
          </CommandGroup>
        )}

        {showRecentDisc && recentDisciplinas.length > 0 && !searchQuery && (
          <CommandGroup heading="Disciplinas recentes">
            {recentDisciplinas.map((d) => (
              <CommandItem
                key={d.id}
                onSelect={() => go(`/disciplinas/${d.id}`)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{d.nome}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showRecentLib && recentMaterials.length > 0 && !searchQuery && (
          <CommandGroup heading="Arquivos e materiais recentes">
            {recentMaterials.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={() => {
                  setOpenAction(false);
                  router.push(`/biblioteca/${m.id}`);
                }}
                className="flex flex-col items-start gap-1 py-2.5"
              >
                <div className="flex w-full items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="font-medium truncate flex-1">{m.titulo}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                {m.descricao ? (
                  <div className="text-xs text-muted-foreground ml-6 line-clamp-2 w-full">
                    {m.descricao}
                  </div>
                ) : null}
                <div className="text-[10px] text-muted-foreground ml-6">
                  Última alteração {formatDate(m.created_at)}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showNotas && (
          <CommandGroup heading="Anotações">
            {notasLoading ? (
              <CommandItem disabled>
                <Search className="h-4 w-4 mr-2 animate-pulse" />
                Buscando...
              </CommandItem>
            ) : results.length > 0 ? (
              results.map((nota) => (
                <CommandItem
                  key={nota.id}
                  onSelect={() => {
                    setOpenAction(false);
                    router.push(`/disciplinas/${nota.disciplinaId}`);
                  }}
                  className="flex flex-col items-start gap-1 py-2.5"
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{nota.disciplinaNome}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 ml-auto text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground ml-6 line-clamp-2">
                    {nota.snippet.replace(/\*\*/g, "")}
                  </div>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <FileText className="h-4 w-4 mr-2" />
                Nenhuma anotação encontrada
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>

      <footer className="flex items-center justify-between gap-4 border-t px-3 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            Abrir
          </span>
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            Nova busca
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpenAction(false);
            router.push("/configuracoes");
          }}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <Settings className="h-3 w-3" />
          Configurações
        </button>
      </footer>
    </CommandDialog>
  );
}
