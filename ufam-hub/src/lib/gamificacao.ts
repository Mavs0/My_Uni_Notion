import { createSupabaseServer } from "@/lib/supabase/server";

export async function adicionarXP(
  userId: string,
  xp: number,
  tipoAtividade: string,
  descricao?: string,
  referenciaId?: string
) {
  try {
    const supabase = await createSupabaseServer();
    let { data: gamificacao, error: gamError } = await supabase
      .from("gamificacao_usuario")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (gamError && gamError.code === "PGRST116") {
      const { data: novaGamificacao, error: createError } = await supabase
        .from("gamificacao_usuario")
        .insert({
          user_id: userId,
          xp_total: 0,
          nivel: 1,
          streak_atual: 0,
          streak_maximo: 0,
        })
        .select()
        .single();
      if (createError) {
        console.error("Erro ao criar gamificação:", createError);
        return { success: false, error: "Erro ao criar gamificação" };
      }
      gamificacao = novaGamificacao;
    } else if (gamError) {
      console.error("Erro ao buscar gamificação:", gamError);
      return { success: false, error: "Erro ao buscar gamificação" };
    }
    const novoXPTotal = (gamificacao?.xp_total || 0) + xp;
    let novoNivel = gamificacao?.nivel || 1;
    while (calcularXPNecessario(novoNivel + 1) <= novoXPTotal) {
      novoNivel++;
    }
    await supabase.from("xp_historico").insert({
      user_id: userId,
      xp,
      tipo_atividade: tipoAtividade,
      descricao: descricao || "",
      referencia_id: referenciaId || null,
    });
    const { data: gamificacaoAtualizada, error: updateError } = await supabase
      .from("gamificacao_usuario")
      .update({
        xp_total: novoXPTotal,
        nivel: novoNivel,
      })
      .eq("user_id", userId)
      .select()
      .single();
    if (updateError) {
      console.error("Erro ao atualizar gamificação:", updateError);
      return { success: false, error: "Erro ao atualizar gamificação" };
    }
    const subiuNivel = novoNivel > (gamificacao?.nivel || 1);
    const conquistasGerais = await verificarConquistasGerais(
      supabase,
      userId,
      gamificacaoAtualizada
    );
    return {
      success: true,
      gamificacao: gamificacaoAtualizada,
      subiuNivel,
      conquistasDesbloqueadas: conquistasGerais,
    };
  } catch (error: any) {
    console.error("Erro ao adicionar XP:", error);
    return { success: false, error: error.message };
  }
}

export async function verificarConquistasEspecificas(
  userId: string,
  tipoAcao:
    | "primeira_disciplina"
    | "primeira_avaliacao"
    | "primeira_tarefa"
    | "tarefa_concluida"
    | "anotacao_criada",
  contexto?: {
    totalDisciplinas?: number;
    totalAvaliacoes?: number;
    totalTarefas?: number;
    totalTarefasConcluidas?: number;
    totalAnotacoes?: number;
  }
) {
  try {
    const supabase = await createSupabaseServer();
    const conquistasDesbloqueadas: any[] = [];
    const { data: conquista, error: conquistaError } = await supabase
      .from("conquistas")
      .select("*")
      .eq("codigo", tipoAcao)
      .single();
    if (conquistaError || !conquista) {
      return { conquistasDesbloqueadas: [] };
    }
    const { data: jaDesbloqueada } = await supabase
      .from("usuario_conquistas")
      .select("id")
      .eq("user_id", userId)
      .eq("conquista_id", conquista.id)
      .single();
    if (jaDesbloqueada) {
      return { conquistasDesbloqueadas: [] };
    }
    let deveDesbloquear = false;
    switch (tipoAcao) {
      case "primeira_disciplina":
        deveDesbloquear = (contexto?.totalDisciplinas || 0) === 1;
        break;
      case "primeira_avaliacao":
        deveDesbloquear = (contexto?.totalAvaliacoes || 0) === 1;
        break;
      case "primeira_tarefa":
        deveDesbloquear = (contexto?.totalTarefas || 0) === 1;
        break;
      case "tarefa_concluida":
        const totalConcluidas = contexto?.totalTarefasConcluidas || 0;
        if (totalConcluidas === 10) {
          const { data: conquista10 } = await supabase
            .from("conquistas")
            .select("*")
            .eq("codigo", "tarefas_10")
            .single();
          if (conquista10) {
            const { error } = await supabase.from("usuario_conquistas").insert({
              user_id: userId,
              conquista_id: conquista10.id,
            });
            if (!error) {
              conquistasDesbloqueadas.push(conquista10);
            }
          }
        }
        if (totalConcluidas === 50) {
          const { data: conquista50 } = await supabase
            .from("conquistas")
            .select("*")
            .eq("codigo", "tarefas_50")
            .single();
          if (conquista50) {
            const { error } = await supabase.from("usuario_conquistas").insert({
              user_id: userId,
              conquista_id: conquista50.id,
            });
            if (!error) {
              conquistasDesbloqueadas.push(conquista50);
            }
          }
        }
        return { conquistasDesbloqueadas };
      case "anotacao_criada":
        deveDesbloquear = false;
        break;
    }
    if (deveDesbloquear) {
      const { error } = await supabase.from("usuario_conquistas").insert({
        user_id: userId,
        conquista_id: conquista.id,
      });
      if (!error) {
        conquistasDesbloqueadas.push(conquista);
        if (conquista.xp_recompensa > 0) {
          await adicionarXP(
            userId,
            conquista.xp_recompensa,
            "conquista",
            `Conquista: ${conquista.nome}`,
            conquista.id
          );
        }
      }
    }
    return { conquistasDesbloqueadas };
  } catch (error: any) {
    console.error("Erro ao verificar conquistas:", error);
    return { conquistasDesbloqueadas: [] };
  }
}
function calcularXPNecessario(nivel: number): number {
  return (100 * nivel * (nivel + 1)) / 2;
}

async function verificarConquistasGerais(
  supabase: any,
  userId: string,
  gamificacao: any
): Promise<any[]> {
  const conquistasDesbloqueadas: any[] = [];
  const { data: todasConquistas } = await supabase
    .from("conquistas")
    .select("*");
  if (!todasConquistas) return conquistasDesbloqueadas;
  const { data: desbloqueadas } = await supabase
    .from("usuario_conquistas")
    .select("conquista_id")
    .eq("user_id", userId);
  const idsDesbloqueadas = new Set(
    (desbloqueadas || []).map((d: any) => d.conquista_id)
  );
  for (const conquista of todasConquistas) {
    if (idsDesbloqueadas.has(conquista.id)) continue;
    let deveDesbloquear = false;
    switch (conquista.codigo) {
      case "nivel_5":
        deveDesbloquear = gamificacao.nivel >= 5;
        break;
      case "nivel_10":
        deveDesbloquear = gamificacao.nivel >= 10;
        break;
      case "nivel_20":
        deveDesbloquear = gamificacao.nivel >= 20;
        break;
      case "streak_3":
        deveDesbloquear = gamificacao.streak_atual >= 3;
        break;
      case "streak_7":
        deveDesbloquear = gamificacao.streak_atual >= 7;
        break;
      case "streak_14":
        deveDesbloquear = gamificacao.streak_atual >= 14;
        break;
      case "streak_30":
        deveDesbloquear = gamificacao.streak_atual >= 30;
        break;
      default:
        continue;
    }
    if (deveDesbloquear) {
      const { error } = await supabase.from("usuario_conquistas").insert({
        user_id: userId,
        conquista_id: conquista.id,
      });
      if (!error) {
        conquistasDesbloqueadas.push(conquista);
      }
    }
  }
  return conquistasDesbloqueadas;
}