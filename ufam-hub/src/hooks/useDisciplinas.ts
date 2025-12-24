"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Disciplina {
  id: string;
  nome: string;
  tipo: "obrigatoria" | "eletiva" | "optativa";
  horasSemana: number;
  professor?: string;
  local?: string;
  ativo?: boolean;
  cor?: string;
  favorito?: boolean;
  ordem?: number;
  horarios?: Array<{
    id: string;
    dia: number;
    inicio: string;
    fim: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

// Cores predefinidas para disciplinas
export const CORES_DISCIPLINAS = [
  { nome: "Índigo", valor: "#6366f1" },
  { nome: "Violeta", valor: "#8b5cf6" },
  { nome: "Rosa", valor: "#ec4899" },
  { nome: "Vermelho", valor: "#ef4444" },
  { nome: "Laranja", valor: "#f97316" },
  { nome: "Âmbar", valor: "#f59e0b" },
  { nome: "Verde", valor: "#22c55e" },
  { nome: "Esmeralda", valor: "#10b981" },
  { nome: "Ciano", valor: "#06b6d4" },
  { nome: "Azul", valor: "#3b82f6" },
  { nome: "Azul Escuro", valor: "#1e40af" },
  { nome: "Cinza", valor: "#6b7280" },
];
export function useDisciplinas() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchDisciplinas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/disciplinas");
      if (!response.ok) {
        let errorMessage = "Erro ao buscar disciplinas";
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
      const { disciplinas: data } = await response.json();
      setDisciplinas(data || []);
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao carregar disciplinas";
      setError(errorMessage);
      console.error("Erro ao buscar disciplinas:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDisciplinas();
  }, [fetchDisciplinas]);
  const createDisciplina = useCallback(
    async (
      disciplina: Omit<Disciplina, "id" | "created_at" | "updated_at">
    ) => {
      try {
        const response = await fetch("/api/disciplinas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: disciplina.nome,
            tipo: disciplina.tipo,
            horasSemana: disciplina.horasSemana,
            professor: disciplina.professor,
            local: disciplina.local,
            horarios: disciplina.horarios?.map((h) => ({
              dia: h.dia,
              inicio: h.inicio,
              fim: h.fim,
            })),
          }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao criar disciplina");
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
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao criar disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );
  const updateDisciplina = useCallback(
    async (
      id: string,
      disciplina: Partial<Omit<Disciplina, "id" | "created_at" | "updated_at">>
    ) => {
      try {
        const response = await fetch("/api/disciplinas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            nome: disciplina.nome,
            tipo: disciplina.tipo,
            horasSemana: disciplina.horasSemana,
            professor: disciplina.professor,
            local: disciplina.local,
            horarios: disciplina.horarios?.map((h) => ({
              dia: h.dia,
              inicio: h.inicio,
              fim: h.fim,
            })),
          }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao atualizar disciplina");
        }
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao atualizar disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );
  const deleteDisciplina = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/disciplinas?id=${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao deletar disciplina");
        }
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao deletar disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );

  const toggleAtivo = useCallback(
    async (id: string, ativo: boolean) => {
      try {
        const response = await fetch(`/api/disciplinas/${id}/toggle-ativo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao alterar status da disciplina");
        }
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao alterar status da disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );

  const toggleFavorito = useCallback(
    async (id: string, favorito: boolean) => {
      try {
        const response = await fetch(`/api/disciplinas/${id}/favorito`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorito }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao alterar favorito");
        }
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao alterar favorito:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );

  const updateCor = useCallback(
    async (id: string, cor: string) => {
      try {
        const response = await fetch(`/api/disciplinas/${id}/cor`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cor }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao alterar cor");
        }
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao alterar cor:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );

  const reordenarDisciplinas = useCallback(
    async (novaOrdem: { id: string; ordem: number }[]) => {
      try {
        const response = await fetch("/api/disciplinas/reordenar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disciplinas: novaOrdem }),
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Erro ao reordenar");
        }
        await fetchDisciplinas();
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao reordenar:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchDisciplinas]
  );

  return {
    disciplinas,
    loading,
    error,
    refetch: fetchDisciplinas,
    createDisciplina,
    updateDisciplina,
    deleteDisciplina,
    toggleAtivo,
    toggleFavorito,
    updateCor,
    reordenarDisciplinas,
  };
}
