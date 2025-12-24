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

    // Buscar total de disciplinas
    const { data: disciplinas, count: totalDisciplinas } = await supabase
      .from("disciplinas")
      .select("id", { count: "exact" })
      .eq("user_id", user.id);

    // Buscar próximas avaliações (próximos 7 dias)
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);

    const { data: proximasAvaliacoes, count: totalProximas } = await supabase
      .from("avaliacoes")
      .select("id, tipo, data_iso, disciplina_id, disciplinas(nome)", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .gte("data_iso", hoje.toISOString())
      .lte("data_iso", em7Dias.toISOString())
      .order("data_iso", { ascending: true })
      .limit(5);

    // Calcular progresso geral (média das disciplinas com avaliações)
    const { data: avaliacoes } = await supabase
      .from("avaliacoes")
      .select("nota, peso")
      .eq("user_id", user.id)
      .not("nota", "is", null);

    let progressoGeral = null;
    if (avaliacoes && avaliacoes.length > 0) {
      let somaPonderada = 0;
      let somaPesos = 0;
      avaliacoes.forEach((av) => {
        const peso = av.peso || 1;
        somaPonderada += (av.nota || 0) * peso;
        somaPesos += peso;
      });
      progressoGeral =
        somaPesos > 0 ? Number((somaPonderada / somaPesos).toFixed(2)) : null;
    }

    return NextResponse.json({
      totalDisciplinas: totalDisciplinas || 0,
      proximasAvaliacoes: proximasAvaliacoes || [],
      totalProximas: totalProximas || 0,
      progressoGeral,
    });
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas do perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
