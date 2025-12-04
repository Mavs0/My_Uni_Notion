import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let { data: gamificacao, error: gamError } = await supabase
      .from("gamificacao_usuario")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (gamError && gamError.code === "PGRST116") {
      const { data: novaGamificacao, error: createError } = await supabase
        .from("gamificacao_usuario")
        .insert({
          user_id: user.id,
          xp_total: 0,
          nivel: 1,
          streak_atual: 0,
          streak_maximo: 0,
        })
        .select()
        .single();
      if (createError) {
        console.error("Erro ao criar gamificação:", createError);
        return NextResponse.json(
          { error: "Erro ao criar gamificação" },
          { status: 500 }
        );
      }
      gamificacao = novaGamificacao;
    } else if (gamError) {
      console.error("Erro ao buscar gamificação:", gamError);
      return NextResponse.json(
        { error: "Erro ao buscar gamificação" },
        { status: 500 }
      );
    }
    const { data: conquistasDesbloqueadas, error: conquistasError } =
      await supabase
        .from("usuario_conquistas")
        .select(
          `
          conquista_id,
          desbloqueada_em,
          conquistas (
            codigo,
            nome,
            descricao,
            icone,
            cor,
            xp_recompensa
          )
        `
        )
        .eq("user_id", user.id)
        .order("desbloqueada_em", { ascending: false });
    if (conquistasError) {
      console.error("Erro ao buscar conquistas:", conquistasError);
    }
    const { data: todasConquistas, error: todasError } = await supabase
      .from("conquistas")
      .select("*")
      .order("xp_recompensa", { ascending: true });
    if (todasError) {
      console.error("Erro ao buscar todas as conquistas:", todasError);
    }
    const { data: historicoXP, error: historicoError } = await supabase
      .from("xp_historico")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (historicoError) {
      console.error("Erro ao buscar histórico de XP:", historicoError);
    }
    const nivelAtual = gamificacao?.nivel || 1;
    const xpNecessarioProximoNivel = calcularXPNecessario(nivelAtual + 1);
    const xpNecessarioNivelAtual = calcularXPNecessario(nivelAtual);
    const xpNoNivelAtual =
      (gamificacao?.xp_total || 0) - xpNecessarioNivelAtual;
    const xpRestante = xpNecessarioProximoNivel - (gamificacao?.xp_total || 0);
    return NextResponse.json({
      gamificacao: {
        ...gamificacao,
        xpNecessarioProximoNivel,
        xpNoNivelAtual,
        xpRestante,
        progressoNivel:
          nivelAtual === 1
            ? (gamificacao?.xp_total || 0) / xpNecessarioProximoNivel
            : xpNoNivelAtual /
              (xpNecessarioProximoNivel - xpNecessarioNivelAtual),
      },
      conquistasDesbloqueadas: (conquistasDesbloqueadas || []).map((uc) => ({
        ...uc.conquistas,
        desbloqueada_em: uc.desbloqueada_em,
      })),
      todasConquistas: todasConquistas || [],
      historicoXP: historicoXP || [],
    });
  } catch (error: any) {
    console.error("Erro na API de gamificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { xp, tipoAtividade, descricao, referenciaId } = body;
    if (!xp || xp <= 0) {
      return NextResponse.json(
        { error: "XP deve ser maior que zero" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let { data: gamificacao, error: gamError } = await supabase
      .from("gamificacao_usuario")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (gamError && gamError.code === "PGRST116") {
      const { data: novaGamificacao, error: createError } = await supabase
        .from("gamificacao_usuario")
        .insert({
          user_id: user.id,
          xp_total: 0,
          nivel: 1,
          streak_atual: 0,
          streak_maximo: 0,
        })
        .select()
        .single();
      if (createError) {
        console.error("Erro ao criar gamificação:", createError);
        return NextResponse.json(
          { error: "Erro ao criar gamificação" },
          { status: 500 }
        );
      }
      gamificacao = novaGamificacao;
    } else if (gamError) {
      console.error("Erro ao buscar gamificação:", gamError);
      return NextResponse.json(
        { error: "Erro ao buscar gamificação" },
        { status: 500 }
      );
    }
    const novoXPTotal = (gamificacao?.xp_total || 0) + xp;
    let novoNivel = gamificacao?.nivel || 1;
    while (calcularXPNecessario(novoNivel + 1) <= novoXPTotal) {
      novoNivel++;
    }
    const { error: historicoError } = await supabase
      .from("xp_historico")
      .insert({
        user_id: user.id,
        xp,
        tipo_atividade: tipoAtividade || "outro",
        descricao: descricao || "",
        referencia_id: referenciaId || null,
      });
    if (historicoError) {
      console.error("Erro ao registrar histórico de XP:", historicoError);
    }
    const { data: gamificacaoAtualizada, error: updateError } = await supabase
      .from("gamificacao_usuario")
      .update({
        xp_total: novoXPTotal,
        nivel: novoNivel,
      })
      .eq("user_id", user.id)
      .select()
      .single();
    if (updateError) {
      console.error("Erro ao atualizar gamificação:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar gamificação" },
        { status: 500 }
      );
    }
    const subiuNivel = novoNivel > (gamificacao?.nivel || 1);
    const conquistasDesbloqueadas = await verificarConquistas(
      supabase,
      user.id,
      gamificacaoAtualizada
    );
    return NextResponse.json({
      success: true,
      gamificacao: gamificacaoAtualizada,
      subiuNivel,
      conquistasDesbloqueadas,
    });
  } catch (error: any) {
    console.error("Erro na API de gamificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
function calcularXPNecessario(nivel: number): number {
  return (100 * nivel * (nivel + 1)) / 2;
}
async function verificarConquistas(
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
        if (conquista.xp_recompensa > 0) {
          await supabase.from("xp_historico").insert({
            user_id: userId,
            xp: conquista.xp_recompensa,
            tipo_atividade: "conquista",
            descricao: `Conquista: ${conquista.nome}`,
            referencia_id: conquista.id,
          });
          await supabase
            .from("gamificacao_usuario")
            .update({
              xp_total: gamificacao.xp_total + conquista.xp_recompensa,
            })
            .eq("user_id", userId);
        }
      }
    }
  }
  return conquistasDesbloqueadas;
}