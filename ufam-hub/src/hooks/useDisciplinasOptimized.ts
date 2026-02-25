"use client";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

async function fetchDisciplinas(): Promise<Disciplina[]> {
  const response = await fetch("/api/disciplinas");
  if (!response.ok) {
    let errorMessage = "Erro ao buscar disciplinas";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        if (response.status === 401) {
          errorMessage = "Não autorizado. Faça login novamente.";
        } else if (response.status === 500) {
          errorMessage =
            "Erro interno do servidor. Verifique se o banco de dados está configurado.";
        } else {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
      }
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
  return data || [];
}

export function useDisciplinas() {
  const queryClient = useQueryClient();

  const {
    data: disciplinas = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["disciplinas"],
    queryFn: fetchDisciplinas,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: async (
      disciplina: Omit<Disciplina, "id" | "created_at" | "updated_at">
    ) => {
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
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      disciplina,
    }: {
      id: string;
      disciplina: Partial<Omit<Disciplina, "id" | "created_at" | "updated_at">>;
    }) => {
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
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/disciplinas?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao deletar disciplina");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const response = await fetch(`/api/disciplinas/${id}/toggle-ativo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao alterar status da disciplina");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const toggleFavoritoMutation = useMutation({
    mutationFn: async ({ id, favorito }: { id: string; favorito: boolean }) => {
      const response = await fetch(`/api/disciplinas/${id}/favorito`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorito }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao alterar favorito");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const updateCorMutation = useMutation({
    mutationFn: async ({ id, cor }: { id: string; cor: string }) => {
      const response = await fetch(`/api/disciplinas/${id}/cor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cor }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao alterar cor");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const reordenarMutation = useMutation({
    mutationFn: async (novaOrdem: { id: string; ordem: number }[]) => {
      const response = await fetch("/api/disciplinas/reordenar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplinas: novaOrdem }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro ao reordenar");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
    },
  });

  const disciplinasAtivas = useMemo(
    () => disciplinas.filter((d) => d.ativo !== false),
    [disciplinas]
  );

  return {
    disciplinas,
    disciplinasAtivas,
    loading,
    error: error ? (error as Error).message : null,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["disciplinas"] }),
    createDisciplina: async (
      disciplina: Omit<Disciplina, "id" | "created_at" | "updated_at">
    ) => {
      try {
        await createMutation.mutateAsync(disciplina);
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao criar disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    updateDisciplina: async (
      id: string,
      disciplina: Partial<Omit<Disciplina, "id" | "created_at" | "updated_at">>
    ) => {
      try {
        await updateMutation.mutateAsync({ id, disciplina });
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao atualizar disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    deleteDisciplina: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao deletar disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    toggleAtivo: async (id: string, ativo: boolean) => {
      try {
        await toggleAtivoMutation.mutateAsync({ id, ativo });
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao alterar status da disciplina:", err);
        return { success: false, error: err.message };
      }
    },
    toggleFavorito: async (id: string, favorito: boolean) => {
      try {
        await toggleFavoritoMutation.mutateAsync({ id, favorito });
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao alterar favorito:", err);
        return { success: false, error: err.message };
      }
    },
    updateCor: async (id: string, cor: string) => {
      try {
        await updateCorMutation.mutateAsync({ id, cor });
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao alterar cor:", err);
        return { success: false, error: err.message };
      }
    },
    reordenarDisciplinas: async (
      novaOrdem: { id: string; ordem: number }[]
    ) => {
      try {
        await reordenarMutation.mutateAsync(novaOrdem);
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao reordenar:", err);
        return { success: false, error: err.message };
      }
    },
  };
}
