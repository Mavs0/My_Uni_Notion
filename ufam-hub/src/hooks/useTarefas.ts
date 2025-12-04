"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
export interface Tarefa {
  id: string;
  disciplinaId?: string;
  disciplina?: string;
  titulo: string;
  descricao?: string;
  dataVencimento?: string;
  concluida: boolean;
  prioridade: "baixa" | "media" | "alta";
  created_at?: string;
  updated_at?: string;
}
export function useTarefas(filters?: {
  disciplinaId?: string;
  concluida?: boolean;
}) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTarefas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.disciplinaId) {
        params.append("disciplina_id", filters.disciplinaId);
      }
      if (filters?.concluida !== undefined) {
        params.append("concluida", filters.concluida.toString());
      }
      const response = await fetch(
        `/api/tarefas${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        let errorMessage = "Erro ao buscar tarefas";
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
      const { tarefas: data } = await response.json();
      setTarefas(data || []);
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao carregar tarefas";
      setError(errorMessage);
      console.error("Erro ao buscar tarefas:", err);
    } finally {
      setLoading(false);
    }
  }, [filters?.disciplinaId, filters?.concluida]);
  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);
  const createTarefa = useCallback(
    async (tarefa: Omit<Tarefa, "id" | "created_at" | "updated_at">) => {
      try {
        const response = await fetch("/api/tarefas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disciplinaId: tarefa.disciplinaId,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            dataVencimento: tarefa.dataVencimento,
            prioridade: tarefa.prioridade,
          }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao criar tarefa");
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
        await fetchTarefas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao criar tarefa:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchTarefas]
  );
  const updateTarefa = useCallback(
    async (id: string, tarefa: Partial<Omit<Tarefa, "id">>) => {
      try {
        const response = await fetch("/api/tarefas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            dataVencimento: tarefa.dataVencimento,
            concluida: tarefa.concluida,
            prioridade: tarefa.prioridade,
          }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao atualizar tarefa");
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
        await fetchTarefas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao atualizar tarefa:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchTarefas]
  );
  const deleteTarefa = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/tarefas?id=${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao deletar tarefa");
        }
        await fetchTarefas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao deletar tarefa:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchTarefas]
  );
  const toggleConcluida = useCallback(
    async (id: string, concluida: boolean) => {
      return updateTarefa(id, { concluida });
    },
    [updateTarefa]
  );
  return {
    tarefas,
    loading,
    error,
    refetch: fetchTarefas,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    toggleConcluida,
  };
}