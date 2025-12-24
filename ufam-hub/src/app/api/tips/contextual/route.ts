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

    const { searchParams } = new URL(request.url);
    const pagina = searchParams.get("pagina") || "";
    const limite = parseInt(searchParams.get("limite") || "3");

    // Buscar todas as dicas ativas
    const { data: allTips, error: tipsError } = await supabase
      .from("contextual_tips")
      .select("*")
      .eq("ativo", true)
      .order("prioridade", { ascending: false });

    if (tipsError) {
      console.error("Erro ao buscar dicas:", tipsError);
      return NextResponse.json(
        { error: "Erro ao buscar dicas" },
        { status: 500 }
      );
    }

    // Buscar interações do usuário (últimas 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentInteractions } = await supabase
      .from("user_tip_interactions")
      .select("tip_id, acao, created_at")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo.toISOString());

    const dismissedTips = new Set(
      recentInteractions
        ?.filter((i) => i.acao === "dismissed")
        .map((i) => i.tip_id) || []
    );

    // Buscar padrões de comportamento do usuário
    const { data: behaviorPatterns } = await supabase
      .from("user_behavior_patterns")
      .select("*")
      .eq("user_id", user.id);

    // Filtrar e priorizar dicas
    const eligibleTips = allTips
      ?.filter((tip) => {
        // Não mostrar dicas já descartadas recentemente
        if (dismissedTips.has(tip.id)) return false;

        // Verificar condições básicas
        const condicoes = tip.condicoes || [];
        if (condicoes.length === 0) return true;

        // Verificar condições (implementação simplificada)
        return checkConditions(tip, pagina, behaviorPatterns || []);
      })
      .map((tip) => ({
        ...tip,
        score: calculateTipScore(
          tip,
          recentInteractions || [],
          behaviorPatterns || []
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limite);

    return NextResponse.json({ tips: eligibleTips || [] });
  } catch (error: any) {
    console.error("Erro na API de dicas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function checkConditions(
  tip: any,
  pagina: string,
  behaviorPatterns: any[]
): boolean {
  const condicoes = tip.condicoes || [];
  if (condicoes.length === 0) return true;

  // Implementação simplificada - verificar condições básicas
  for (const condicao of condicoes) {
    switch (condicao.tipo) {
      case "page":
        if (pagina && condicao.valor && !pagina.includes(condicao.valor)) {
          return false;
        }
        break;
      // Adicionar mais verificações conforme necessário
    }
  }

  return true;
}

function calculateTipScore(
  tip: any,
  interactions: any[],
  behaviorPatterns: any[]
): number {
  let score = tip.prioridade * 10;

  // Reduzir score se já foi mostrada muitas vezes
  const timesShown = interactions.filter(
    (i) => i.tip_id === tip.id && i.acao === "shown"
  ).length;
  score -= timesShown * 5;

  // Reduzir score se sempre é descartada
  const dismissCount = interactions.filter(
    (i) => i.tip_id === tip.id && i.acao === "dismissed"
  ).length;
  if (dismissCount > 0) {
    score -= dismissCount * 10;
  }

  return Math.max(0, Math.min(100, score));
}
