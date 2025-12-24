"use client";
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
  Trophy,
  Brain,
  Users,
  Library,
} from "lucide-react";
import { useNotasSearch } from "@/hooks/useNotasSearch";
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return { open, setOpen };
}
export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { search, results, loading: notasLoading } = useNotasSearch();
  React.useEffect(() => {
    if (searchQuery.trim().length > 2) {
      search(searchQuery);
    }
  }, [searchQuery, search]);
  const go = (href: string, action?: string) => {
    setOpen(false);
    if (action) {
      router.push(`${href}?action=${action}`);
    } else {
      router.push(href);
    }
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
    {
      label: "Gamificação",
      href: "/gamificacao",
      icon: Trophy,
      shortcut: "⌘⇧G",
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
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar páginas, disciplinas, avaliações..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searchQuery
            ? `Nenhum resultado para "${searchQuery}"`
            : "Digite para buscar..."}
        </CommandEmpty>
        {filteredNavigation.length > 0 && (
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
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground hidden sm:flex">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {filteredActions.length > 0 && (
          <CommandGroup heading="Ações Rápidas">
            {filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={`${item.href}-${item.action}`}
                  onSelect={() => go(item.href, item.action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </div>
                  {item.shortcut && (
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground hidden sm:flex">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {searchQuery.trim().length > 2 && (
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
                    setOpen(false);
                    router.push(`/disciplinas/${nota.disciplinaId}`);
                  }}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{nota.disciplinaNome}</span>
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
    </CommandDialog>
  );
}
