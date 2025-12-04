"use client";
import { useState, useCallback } from "react";
export interface NotaSearchResult {
  id: string;
  disciplinaId: string;
  disciplinaNome: string;
  content_md: string;
  created_at: string;
  updated_at: string;
  snippet: string;
}
export function useNotasSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NotaSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/notas/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar anotações");
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar anotações");
      setResults([]);
      console.error("Erro ao buscar anotações:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);
  return {
    loading,
    results,
    error,
    search,
    clearResults,
  };
}