"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  FileText,
  Loader2,
  ArrowRight,
  BookOpen,
  ChevronRight,
  FolderOpen,
  Brain,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotasSearch, type NotaSearchResult } from "@/hooks/useNotasSearch";
import { useNotas } from "@/hooks/useNotas";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { cn } from "@/lib/utils";

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function formatAtualizado(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Preview sem markdown para cartões recentes */
function plainPreview(md: string, max = 90) {
  const t = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/#+\s+/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t || "Sem conteúdo ainda";
  return `${t.slice(0, max).trim()}…`;
}

function formatRelativePt(iso: string) {
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return "agora";
  if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `há ${Math.floor(diffSec / 3600)} h`;
  const d = Math.floor(diffSec / 86400);
  if (diffSec < 604800) return d === 1 ? "há 1 dia" : `há ${d} dias`;
  return formatAtualizado(iso);
}

function notaEditorPath(nota: { disciplinaId: string; id: string }) {
  return `/disciplinas/${nota.disciplinaId}/notas/${nota.id}`;
}

function initialsFromProfile(nome: string, email: string) {
  if (nome?.trim()) {
    const parts = nome.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "??";
}

export default function BuscaAnotacoesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const {
    search,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useNotasSearch();
  const {
    notas: allNotas,
    loading: allNotasLoading,
    error: allNotasError,
  } = useNotas();
  const { disciplinas } = useDisciplinas();

  const [profile, setProfile] = useState<{
    nome: string;
    email: string;
    avatar_url: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok || cancelled) return;
        const { profile: p } = await res.json();
        if (cancelled || !p) return;
        setProfile({
          nome: p.nome || p.email?.split("@")[0] || "",
          email: p.email || "",
          avatar_url: p.avatar_url || "",
        });
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const disciplinasMap = useMemo(() => {
    return new Map(disciplinas.map((d) => [d.id, d.nome]));
  }, [disciplinas]);

  const hasSearch = debouncedQuery.trim().length > 0;

  const allNotasFormatted = useMemo(() => {
    return allNotas.map((nota) => ({
      id: nota.id,
      disciplinaId: nota.disciplinaId,
      disciplinaNome:
        disciplinasMap.get(nota.disciplinaId) || "Disciplina desconhecida",
      titulo: nota.titulo,
      content_md: nota.content_md,
      created_at: nota.created_at || "",
      updated_at: nota.updated_at || "",
      snippet:
        nota.content_md.length > 200
          ? `${nota.content_md.substring(0, 200)}...`
          : nota.content_md,
    }));
  }, [allNotas, disciplinasMap]);

  const results = hasSearch ? searchResults : allNotasFormatted;
  const loading = hasSearch ? searchLoading : allNotasLoading;
  const error = hasSearch ? searchError : allNotasError;

  const recentNotas = useMemo(() => {
    return [...allNotasFormatted]
      .sort((a, b) => {
        const ta = new Date(a.updated_at || a.created_at).getTime();
        const tb = new Date(b.updated_at || b.created_at).getTime();
        return tb - ta;
      })
      .slice(0, 6);
  }, [allNotasFormatted]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  const handleResultClick = (
    nota: NotaSearchResult | (typeof allNotasFormatted)[0],
  ) => {
    router.push(notaEditorPath(nota));
  };

  const renderSnippet = (nota: { snippet: string }) => (
    <div className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      {hasSearch
        ? nota.snippet.split("**").map((part: string, i: number) => {
            if (i % 2 === 1) {
              return (
                <mark
                  key={i}
                  className="rounded bg-amber-100 px-0.5 font-medium text-amber-950 dark:bg-yellow-500/25 dark:text-amber-100"
                >
                  {part}
                </mark>
              );
            }
            return <span key={i}>{part}</span>;
          })
        : nota.snippet}
    </div>
  );

  return (
    <main
      className={cn(
        "mx-auto min-h-[calc(100dvh-6rem)] w-full max-w-6xl",
        "bg-[#F8F9FB] px-4 py-8 sm:px-6 lg:px-8",
        "dark:bg-transparent",
      )}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Cabeçalho estilo dashboard claro */}
        <header className="space-y-1">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 shadow-sm dark:bg-blue-950/40 dark:shadow-none">
              <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Anotações
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
                Encontre suas anotações em todas as disciplinas
              </p>
            </div>
          </div>
        </header>

        {/* Busca — cartão branco elevado */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Digite para buscar nas anotações…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "h-14 rounded-2xl border-zinc-200/90 bg-white pl-12 pr-4 text-base shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
              "placeholder:text-zinc-400",
              "focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500/20",
              "dark:border-border dark:bg-zinc-900/80 dark:shadow-none",
            )}
            autoFocus
          />
        </div>

        {/* Ações rápidas (referência anexo 03) — entre busca e anotações recentes */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Link
            href="/disciplinas"
            className={cn(
              "group flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all",
              "hover:border-blue-200 hover:shadow-md",
              "dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-blue-900/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                Disciplinas
              </p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                Organize matérias e notas
              </p>
            </div>
          </Link>
          <Link
            href="/disciplinas"
            className={cn(
              "group flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all",
              "hover:border-emerald-200 hover:shadow-md",
              "dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-emerald-900/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30",
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                Nova anotação
              </p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                Criar a partir de uma disciplina
              </p>
            </div>
          </Link>
          <Link
            href="/revisao"
            className={cn(
              "group flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all",
              "hover:border-amber-200 hover:shadow-md",
              "dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-amber-900/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30",
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
              <Brain className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                Revisão
              </p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                Flashcards e estudo ativo
              </p>
            </div>
          </Link>
          <Link
            href="/chat"
            className={cn(
              "group flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all",
              "hover:border-violet-200 hover:shadow-md",
              "dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-violet-900/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30",
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                Chat IA
              </p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                Tire dúvidas com o assistente
              </p>
            </div>
          </Link>
        </section>

        {/* Carrossel estilo Inkwise — só quando não há filtro de busca */}
        {!allNotasLoading &&
          !allNotasError &&
          !hasSearch &&
          recentNotas.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Anotações recentes
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
                {recentNotas.map((nota) => {
                  const title =
                    nota.titulo?.trim() || nota.disciplinaNome || "Sem título";
                  const accessName =
                    profile?.nome?.trim() ||
                    profile?.email?.split("@")[0] ||
                    "Você";
                  const accessInitials = profile
                    ? initialsFromProfile(profile.nome, profile.email)
                    : "…";
                  return (
                    <button
                      key={nota.id}
                      type="button"
                      onClick={() => handleResultClick(nota)}
                      className={cn(
                        "group flex min-w-[220px] max-w-[260px] shrink-0 flex-col rounded-2xl border border-zinc-200/90 bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all",
                        "hover:border-blue-200 hover:shadow-md",
                        "dark:border-border dark:bg-zinc-900/90 dark:hover:border-blue-900/60",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                      )}
                    >
                      <span className="mb-2 inline-flex w-fit max-w-full truncate rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {nota.disciplinaNome}
                      </span>
                      <div className="mb-3 h-14 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50/80 px-2 py-1.5 text-[11px] leading-snug text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                        {plainPreview(nota.content_md || "", 120)}
                      </div>
                      <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {title}
                      </p>
                      <div className="mt-1.5 flex min-w-0 items-center gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0 border border-zinc-200/90 ring-1 ring-zinc-100 dark:border-zinc-600 dark:ring-zinc-800">
                          <AvatarImage
                            src={profile?.avatar_url || undefined}
                            alt=""
                          />
                          <AvatarFallback className="bg-zinc-100 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {accessInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                            Último acesso
                          </p>
                          <p className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            {accessName}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {nota.updated_at
                          ? formatRelativePt(nota.updated_at)
                          : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

        {loading && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/80 py-16 dark:border-zinc-800 dark:bg-zinc-900/40">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Buscando anotações…
            </p>
          </div>
        )}

        {error && (
          <Card className="border-red-200/80 bg-red-50/90 shadow-sm dark:border-red-500/40 dark:bg-red-950/30">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          !error &&
          query.trim().length === 0 &&
          results.length === 0 && (
            <Card className="rounded-2xl border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card dark:shadow-none">
              <CardContent className="py-14 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  Nenhuma anotação encontrada
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Crie anotações nas suas disciplinas para vê-las aqui
                </p>
              </CardContent>
            </Card>
          )}

        {!loading &&
          !error &&
          query.trim().length > 0 &&
          results.length === 0 && (
            <Card className="rounded-2xl border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card dark:shadow-none">
              <CardContent className="py-14 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  Nenhuma anotação encontrada
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Tente outros termos ou verifique se você tem anotações salvas
                </p>
              </CardContent>
            </Card>
          )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {!hasSearch && (
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Todas as anotações
              </h2>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {hasSearch ? (
                  <>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {results.length}
                    </span>{" "}
                    {results.length === 1 ? "resultado" : "resultados"}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {results.length}
                    </span>{" "}
                    {results.length === 1 ? "anotação" : "anotações"} em{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {
                        new Set(
                          results.map(
                            (
                              r:
                                | NotaSearchResult
                                | (typeof allNotasFormatted)[0],
                            ) => r.disciplinaId,
                          ),
                        ).size
                      }
                    </span>{" "}
                    {new Set(
                      results.map(
                        (r: NotaSearchResult | (typeof allNotasFormatted)[0]) =>
                          r.disciplinaId,
                      ),
                    ).size === 1
                      ? "disciplina"
                      : "disciplinas"}
                  </>
                )}
              </p>
              {!hasSearch && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Digite na busca para filtrar
                </p>
              )}
            </div>

            {/* Desktop: tabela estilo lista de documentos */}
            <div
              className={cn(
                "hidden overflow-hidden rounded-2xl border border-zinc-200/90 bg-white",
                "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
                "dark:border-border dark:bg-card dark:shadow-none",
                "md:block",
              )}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_128px] gap-4 border-b border-zinc-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span>Anotação</span>
                <span className="hidden lg:inline">Disciplina</span>
                <span className="lg:hidden">Disc.</span>
                <span>Atualizado</span>
                <span className="text-right" />
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(results as NotaSearchResult[]).map((nota) => (
                  <li key={nota.id}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(nota)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_140px_140px_128px] gap-4 px-5 py-4 text-left transition-colors",
                        "hover:bg-zinc-50/90 dark:hover:bg-zinc-800/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                            {(nota as NotaSearchResult & { titulo?: string })
                              .titulo || nota.disciplinaNome}
                          </p>
                          {(nota as NotaSearchResult & { titulo?: string })
                            .titulo && (
                            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                              {nota.disciplinaNome}
                            </p>
                          )}
                          <div className="mt-1.5 hidden lg:block">
                            {renderSnippet(nota)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start pt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="line-clamp-2">
                          {nota.disciplinaNome}
                        </span>
                      </div>
                      <div className="flex items-start pt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {nota.updated_at
                          ? formatAtualizado(nota.updated_at)
                          : "—"}
                      </div>
                      <div className="flex items-center justify-end pt-1">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 sm:text-sm dark:text-blue-400"
                          title="Abrir no editor"
                        >
                          <span className="hidden min-[900px]:inline">
                            Abrir anotação
                          </span>
                          <span className="min-[900px]:hidden">Abrir</span>
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile: cartões */}
            <div className="space-y-3 md:hidden">
              {(results as NotaSearchResult[]).map((nota) => (
                <button
                  key={nota.id}
                  type="button"
                  onClick={() => handleResultClick(nota)}
                  className={cn(
                    "w-full rounded-2xl border border-zinc-200/90 bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all",
                    "hover:border-zinc-300 hover:shadow-md",
                    "dark:border-border dark:bg-zinc-900/80 dark:shadow-none dark:hover:border-zinc-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {(nota as NotaSearchResult & { titulo?: string })
                            .titulo || nota.disciplinaNome}
                        </p>
                        {(nota as NotaSearchResult & { titulo?: string })
                          .titulo && (
                          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                            {nota.disciplinaNome}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400"
                      title="Abrir no editor"
                    >
                      Abrir anotação
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </span>
                  </div>
                  <div className="mt-3 pl-[3.25rem]">{renderSnippet(nota)}</div>
                  {nota.updated_at && (
                    <p className="mt-3 pl-[3.25rem] text-xs text-zinc-500">
                      Atualizado em {formatAtualizado(nota.updated_at)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
