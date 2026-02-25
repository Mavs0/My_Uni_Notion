import { useQuery } from "@tanstack/react-query";

export type RecommendationType =
  | "disciplina_estudar"
  | "anotacao_revisar"
  | "flashcard_revisar"
  | "material_biblioteca"
  | "grupo_estudo"
  | "usuario_seguir"
  | "tarefa_prioritaria"
  | "avaliacao_preparar";

export interface Recommendation {
  id: string;
  tipo: RecommendationType;
  titulo: string;
  descricao: string;
  prioridade: number;
  acao_url?: string;
  acao_label?: string;
  metadata?: Record<string, any>;
  baseado_em: string;
}

interface UseRecommendationsOptions {
  tipo?: RecommendationType;
  limit?: number;
  enabled?: boolean;
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { tipo, limit = 10, enabled = true } = options;

  return useQuery({
    queryKey: ["recommendations", tipo, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tipo) params.append("tipo", tipo);
      params.append("limit", limit.toString());

      const res = await fetch(`/api/recommendations?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erro ao buscar recomendações");
      }
      const data = await res.json();
      return data as { recommendations: Recommendation[]; total: number };
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}
