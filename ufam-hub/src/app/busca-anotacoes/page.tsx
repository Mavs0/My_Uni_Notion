"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotasSearch, type NotaSearchResult } from "@/hooks/useNotasSearch";
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
export default function BuscaAnotacoesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { search, results, loading, error } = useNotasSearch();
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);
  const handleResultClick = (nota: NotaSearchResult) => {
    router.push(`/disciplinas/${nota.disciplinaId}`);
  };
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Search className="h-8 w-8" />
          Anotações
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Encontre suas anotações em todas as disciplinas
        </p>
      </header>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <Input
          type="text"
          placeholder="Digite para buscar nas anotações..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
          autoFocus
        />
      </div>
      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <FileText className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Buscando anotações...</p>
          </div>
        </div>
      )}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}
      {!loading && !error && query.trim().length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-zinc-500">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Digite algo para começar a buscar</p>
            <p className="text-sm mt-2">
              A busca procura em todas as suas anotações de todas as disciplinas
            </p>
          </CardContent>
        </Card>
      )}
      {!loading &&
        !error &&
        query.trim().length > 0 &&
        results.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma anotação encontrada</p>
              <p className="text-sm mt-2">
                Tente usar termos diferentes ou verifique se você tem anotações
                salvas
              </p>
            </CardContent>
          </Card>
        )}
      {!loading && !error && results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-zinc-500">
            {results.length} {results.length === 1 ? "resultado" : "resultados"}{" "}
            encontrado
            {results.length === 1 ? "" : "s"}
          </div>
          {results.map((nota) => (
            <Card
              key={nota.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleResultClick(nota)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {nota.disciplinaNome}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResultClick(nota);
                    }}
                  >
                    Abrir
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-zinc-400 line-clamp-3">
                    {nota.snippet.split("**").map((part, i) => {
                      if (i % 2 === 1) {
                        return (
                          <mark
                            key={i}
                            className="bg-yellow-500/20 text-yellow-300 dark:bg-yellow-500/30 dark:text-yellow-400 px-1 rounded"
                          >
                            {part}
                          </mark>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Atualizado em{" "}
                    {new Date(nota.updated_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}