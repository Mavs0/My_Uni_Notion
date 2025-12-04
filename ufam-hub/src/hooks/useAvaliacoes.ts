"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
export interface Avaliacao {
  id: string;
  disciplinaId: string;
  disciplina?: string;
  tipo: "prova" | "trabalho" | "seminario";
  dataISO: string;
  descricao?: string;
  resumo_assuntos?: string;
  gerado_por_ia?: boolean;
  horario?: string;
  nota?: number;
  peso?: number;
  created_at?: string;
  updated_at?: string;
}
export function useAvaliacoes(filters?: {
  disciplinaId?: string;
  tipo?: "prova" | "trabalho" | "seminario";
}) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAvaliacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.disciplinaId) {
        params.append("disciplina_id", filters.disciplinaId);
      }
      if (filters?.tipo) {
        params.append("tipo", filters.tipo);
      }
      const response = await fetch(
        `/api/avaliacoes${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        let errorMessage = "Erro ao buscar avaliações";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          if (response.status === 401) {
            errorMessage = "Não autorizado. Faça login novamente.";
          } else if (response.status === 500) {
            errorMessage =
              "Erro interno do servidor. Verifique se o banco de dados está configurado.";
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }
      const { avaliacoes: data } = await response.json();
      setAvaliacoes(data || []);
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao carregar avaliações";
      setError(errorMessage);
      console.error("Erro ao buscar avaliações:", err);
    } finally {
      setLoading(false);
    }
  }, [filters?.disciplinaId, filters?.tipo]);
  useEffect(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);
  const createAvaliacao = useCallback(
    async (avaliacao: Omit<Avaliacao, "id" | "created_at" | "updated_at">) => {
      try {
        const response = await fetch("/api/avaliacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disciplinaId: avaliacao.disciplinaId,
            tipo: avaliacao.tipo,
            dataISO: avaliacao.dataISO,
            descricao: avaliacao.descricao,
            resumo_assuntos: avaliacao.resumo_assuntos,
            horario: avaliacao.horario,
            nota: avaliacao.nota,
            peso: avaliacao.peso,
          }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao criar avaliação");
        }
        const result = await response.json();
        if (
          result.conquistasDesbloqueadas &&
          result.conquistasDesbloqueadas.length > 0
        ) {
          result.conquistasDesbloqueadas.forEach((conquista: any) => {
            toast.success(`🏆 Conquista desbloqueada: ${conquista.nome}`, {
              description: conquista.descricao,
              duration: 5000,
            });
          });
        }
        await fetchAvaliacoes();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao criar avaliação:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchAvaliacoes]
  );
  const updateAvaliacao = useCallback(
    async (id: string, avaliacao: Partial<Omit<Avaliacao, "id">>) => {
      try {
        const response = await fetch("/api/avaliacoes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            disciplinaId: avaliacao.disciplinaId,
            tipo: avaliacao.tipo,
            dataISO: avaliacao.dataISO,
            descricao: avaliacao.descricao,
            resumo_assuntos: avaliacao.resumo_assuntos,
            horario: avaliacao.horario,
            nota: avaliacao.nota,
            peso: avaliacao.peso,
          }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao atualizar avaliação");
        }
        await fetchAvaliacoes();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao atualizar avaliação:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchAvaliacoes]
  );
  const deleteAvaliacao = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/avaliacoes?id=${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao deletar avaliação");
        }
        await fetchAvaliacoes();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao deletar avaliação:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchAvaliacoes]
  );
  return {
    avaliacoes,
    loading,
    error,
    refetch: fetchAvaliacoes,
    createAvaliacao,
    updateAvaliacao,
    deleteAvaliacao,
  };
}