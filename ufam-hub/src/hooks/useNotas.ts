"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Nota {
  id: string;
  disciplinaId: string;
  titulo: string;
  content_md: string;
  created_at?: string;
  updated_at?: string;
}

export function useNotas(filters?: { disciplinaId?: string }) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.disciplinaId) {
        params.append("disciplina_id", filters.disciplinaId);
      }
      const response = await fetch(
        `/api/notas${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        let errorMessage = "Erro ao buscar notas";
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
      const { notas: data } = await response.json();
      setNotas(data || []);
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao carregar notas";
      setError(errorMessage);
      console.error("Erro ao buscar notas:", err);
    } finally {
      setLoading(false);
    }
  }, [filters?.disciplinaId]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const createNota = useCallback(
    async (nota: Omit<Nota, "id" | "created_at" | "updated_at">) => {
      try {
        const response = await fetch("/api/notas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disciplina_id: nota.disciplinaId,
            titulo: nota.titulo,
            content_md: nota.content_md,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao criar nota");
        }
        const { nota: newNota, conquistasDesbloqueadas } =
          await response.json();
        if (conquistasDesbloqueadas && conquistasDesbloqueadas.length > 0) {
          conquistasDesbloqueadas.forEach((conquista: any) => {
            toast.success(`🏆 Conquista desbloqueada: ${conquista.nome}`, {
              description: conquista.descricao,
              duration: 5000,
            });
          });
        }
        await fetchNotas();
        toast.success("Nota criada com sucesso!");
        return { success: true, nota: newNota };
      } catch (err: any) {
        const errorMessage = err.message || "Erro ao criar nota";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [fetchNotas]
  );

  const updateNota = useCallback(
    async (
      id: string,
      nota: Partial<Omit<Nota, "id" | "created_at" | "updated_at">>
    ) => {
      try {
        const response = await fetch(`/api/notas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: nota.titulo,
            content_md: nota.content_md,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao atualizar nota");
        }
        await fetchNotas();
        toast.success("Nota atualizada com sucesso!");
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Erro ao atualizar nota";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [fetchNotas]
  );

  const deleteNota = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/notas/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao excluir nota");
        }
        await fetchNotas();
        toast.success("Nota excluída com sucesso!");
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Erro ao excluir nota";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [fetchNotas]
  );

  return {
    notas,
    loading,
    error,
    refetch: fetchNotas,
    createNota,
    updateNota,
    deleteNota,
  };
}
