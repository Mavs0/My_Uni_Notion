import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
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

    const { data: behaviorPatterns } = await supabase
      .from("user_behavior_patterns")
      .select("*")
      .eq("user_id", user.id);

    const eligibleTips = allTips
      ?.filter((tip) => {
        if (dismissedTips.has(tip.id)) return false;

        const condicoes = tip.condicoes || [];
        if (condicoes.length === 0) return true;

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

  for (const condicao of condicoes) {
    switch (condicao.tipo) {
      case "page":
        if (pagina && condicao.valor && !pagina.includes(condicao.valor)) {
          return false;
        }
        break;
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

  const timesShown = interactions.filter(
    (i) => i.tip_id === tip.id && i.acao === "shown"
  ).length;
  score -= timesShown * 5;

  const dismissCount = interactions.filter(
    (i) => i.tip_id === tip.id && i.acao === "dismissed"
  ).length;
  if (dismissCount > 0) {
    score -= dismissCount * 10;
  }

  return Math.max(0, Math.min(100, score));
}
