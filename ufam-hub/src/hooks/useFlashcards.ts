"use client";
import { useState, useEffect, useCallback } from "react";
export interface Flashcard {
  id: string;
  user_id: string;
  disciplina_id: string | null;
  frente: string;
  verso: string;
  tags: string[];
  dificuldade: number;
  gerado_por_ia: boolean;
  created_at: string;
  updated_at: string;
  disciplinas?: {
    id: string;
    nome: string;
  } | null;
  revisao?: {
    flashcard_id: string;
    proxima_revisao: string;
    qualidade: number;
    intervalo_dias: number;
    fator_ease: number;
    repeticoes: number;
  } | null;
}
export interface FlashcardFilters {
  disciplinaId?: string;
  paraRevisar?: boolean;
  tag?: string;
}
export function useFlashcards(filters?: FlashcardFilters) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchFlashcards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.disciplinaId) {
        params.append("disciplina_id", filters.disciplinaId);
      }
      if (filters?.paraRevisar) {
        params.append("para_revisar", "true");
      }
      if (filters?.tag) {
        params.append("tag", filters.tag);
      }
      const response = await fetch(
        `/api/flashcards${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        let errorMessage = "Erro ao buscar flashcards";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      setFlashcards(result.flashcards || []);
    } catch (err) {
      console.error("Erro ao buscar flashcards:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.disciplinaId, filters?.paraRevisar, filters?.tag]);
  const createFlashcard = useCallback(
    async (
      frente: string,
      verso: string,
      disciplinaId?: string,
      tags?: string[],
      dificuldade?: number
    ) => {
      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frente,
            verso,
            disciplinaId,
            tags: tags || [],
            dificuldade: dificuldade || 0,
            geradoPorIA: false,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao criar flashcard");
        }
        const result = await response.json();
        await fetchFlashcards();
        return result.flashcard;
      } catch (err) {
        console.error("Erro ao criar flashcard:", err);
        throw err;
      }
    },
    [fetchFlashcards]
  );
  const updateFlashcard = useCallback(
    async (
      id: string,
      data: {
        frente?: string;
        verso?: string;
        tags?: string[];
        dificuldade?: number;
      }
    ) => {
      try {
        const response = await fetch("/api/flashcards", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...data }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao atualizar flashcard");
        }
        const result = await response.json();
        await fetchFlashcards();
        return result.flashcard;
      } catch (err) {
        console.error("Erro ao atualizar flashcard:", err);
        throw err;
      }
    },
    [fetchFlashcards]
  );
  const deleteFlashcard = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/flashcards?id=${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao deletar flashcard");
        }
        await fetchFlashcards();
        return true;
      } catch (err) {
        console.error("Erro ao deletar flashcard:", err);
        throw err;
      }
    },
    [fetchFlashcards]
  );
  const revisarFlashcard = useCallback(
    async (flashcardId: string, qualidade: number) => {
      try {
        const response = await fetch("/api/flashcards/revisar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashcardId,
            qualidade,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao revisar flashcard");
        }
        const result = await response.json();
        await fetchFlashcards();
        return result;
      } catch (err) {
        console.error("Erro ao revisar flashcard:", err);
        throw err;
      }
    },
    [fetchFlashcards]
  );
  const gerarFlashcards = useCallback(
    async (disciplinaId: string, quantidade: number = 5) => {
      try {
        const response = await fetch("/api/flashcards/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disciplinaId,
            quantidade,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao gerar flashcards");
        }
        const result = await response.json();
        await fetchFlashcards();
        return result.flashcards;
      } catch (err) {
        console.error("Erro ao gerar flashcards:", err);
        throw err;
      }
    },
    [fetchFlashcards]
  );
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);
  return {
    flashcards,
    loading,
    error,
    refetch: fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    revisarFlashcard,
    gerarFlashcards,
  };
}