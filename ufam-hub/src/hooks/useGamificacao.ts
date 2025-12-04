"use client";
import { useState, useEffect, useCallback } from "react";
export interface GamificacaoData {
  gamificacao: {
    id: string;
    user_id: string;
    xp_total: number;
    nivel: number;
    streak_atual: number;
    streak_maximo: number;
    ultimo_dia_estudo: string | null;
    xpNecessarioProximoNivel: number;
    xpNoNivelAtual: number;
    xpRestante: number;
    progressoNivel: number;
  };
  conquistasDesbloqueadas: Array<{
    codigo: string;
    nome: string;
    descricao: string;
    icone: string;
    cor: string;
    xp_recompensa: number;
    desbloqueada_em: string;
  }>;
  todasConquistas: Array<{
    id: string;
    codigo: string;
    nome: string;
    descricao: string;
    icone: string;
    cor: string;
    xp_recompensa: number;
  }>;
  historicoXP: Array<{
    id: string;
    xp: number;
    tipo_atividade: string;
    descricao: string;
    created_at: string;
  }>;
}
export function useGamificacao() {
  const [data, setData] = useState<GamificacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGamificacao = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/gamificacao");
      if (!response.ok) {
        throw new Error("Erro ao carregar gamificação");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar gamificação:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);
  const adicionarXP = useCallback(
    async (
      xp: number,
      tipoAtividade: string,
      descricao?: string,
      referenciaId?: string
    ) => {
      try {
        const response = await fetch("/api/gamificacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            xp,
            tipoAtividade,
            descricao,
            referenciaId,
          }),
        });
        if (!response.ok) {
          throw new Error("Erro ao adicionar XP");
        }
        const result = await response.json();
        if (result.gamificacao) {
          await fetchGamificacao();
        }
        return result;
      } catch (err) {
        console.error("Erro ao adicionar XP:", err);
        throw err;
      }
    },
    [fetchGamificacao]
  );
  useEffect(() => {
    fetchGamificacao();
  }, [fetchGamificacao]);
  return {
    data,
    loading,
    error,
    refetch: fetchGamificacao,
    adicionarXP,
  };
}