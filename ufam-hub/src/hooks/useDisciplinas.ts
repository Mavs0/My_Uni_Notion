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
  horarios?: Array<{
    id: string;
    dia: number;
    inicio: string;
    fim: string;
  }>;
  created_at?: string;
  updated_at?: string;
}
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
  return {
    disciplinas,
    loading,
    error,
    refetch: fetchDisciplinas,
    createDisciplina,
    updateDisciplina,
    deleteDisciplina,
  };
}
