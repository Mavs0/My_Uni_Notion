"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

async function fetchAvaliacoes(filters?: {
  disciplinaId?: string;
  tipo?: "prova" | "trabalho" | "seminario";
}): Promise<Avaliacao[]> {
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
  return data || [];
}

export function useAvaliacoes(filters?: {
  disciplinaId?: string;
  tipo?: "prova" | "trabalho" | "seminario";
}) {
  const queryClient = useQueryClient();

  const {
    data: avaliacoes = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["avaliacoes", filters],
    queryFn: () => fetchAvaliacoes(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: async (
      avaliacao: Omit<Avaliacao, "id" | "created_at" | "updated_at">
    ) => {
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
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      avaliacao,
    }: {
      id: string;
      avaliacao: Partial<Omit<Avaliacao, "id">>;
    }) => {
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
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/avaliacoes?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao deletar avaliação");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
    },
  });

  return {
    avaliacoes,
    loading,
    error: error ? (error as Error).message : null,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["avaliacoes"] }),
    createAvaliacao: async (
      avaliacao: Omit<Avaliacao, "id" | "created_at" | "updated_at">
    ) => {
      try {
        await createMutation.mutateAsync(avaliacao);
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao criar avaliação:", err);
        return { success: false, error: err.message };
      }
    },
    updateAvaliacao: async (
      id: string,
      avaliacao: Partial<Omit<Avaliacao, "id">>
    ) => {
      try {
        await updateMutation.mutateAsync({ id, avaliacao });
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao atualizar avaliação:", err);
        return { success: false, error: err.message };
      }
    },
    deleteAvaliacao: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao deletar avaliação:", err);
        return { success: false, error: err.message };
      }
    },
  };
}
