import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disciplinaId = params.id;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { data: disciplina, error: discError } = await supabase
      .from("disciplinas")
      .select("id")
      .eq("id", disciplinaId)
      .eq("user_id", user.id)
      .single();
    if (discError || !disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }
    const { data: avaliacoes, error } = await supabase
      .from("avaliacoes")
      .select("nota, peso, tipo")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplinaId)
      .not("nota", "is", null);
    if (error) {
      console.error("Erro ao buscar avaliações:", error);
      return NextResponse.json(
        { error: "Erro ao buscar avaliações" },
        { status: 500 }
      );
    }
    if (!avaliacoes || avaliacoes.length === 0) {
      return NextResponse.json({
        media: null,
        mediaAritmetica: null,
        mediaPonderada: null,
        totalAvaliacoes: 0,
        avaliacoesComNota: [],
      });
    }
    const somaNotas = avaliacoes.reduce((acc, av) => acc + (av.nota || 0), 0);
    const mediaAritmetica = somaNotas / avaliacoes.length;
    let somaPonderada = 0;
    let somaPesos = 0;
    avaliacoes.forEach((av) => {
      const peso = av.peso || 1;
      somaPonderada += (av.nota || 0) * peso;
      somaPesos += peso;
    });
    const mediaPonderada = somaPesos > 0 ? somaPonderada / somaPesos : null;
    const media = mediaPonderada !== null ? mediaPonderada : mediaAritmetica;
    let status: "aprovado" | "reprovado" | "recuperacao" | "indefinido" =
      "indefinido";
    if (media !== null) {
      if (media >= 7) {
        status = "aprovado";
      } else if (media >= 5) {
        status = "recuperacao";
      } else {
        status = "reprovado";
      }
    }
    return NextResponse.json({
      media: media !== null ? Number(media.toFixed(2)) : null,
      mediaAritmetica:
        mediaAritmetica !== null ? Number(mediaAritmetica.toFixed(2)) : null,
      mediaPonderada:
        mediaPonderada !== null ? Number(mediaPonderada.toFixed(2)) : null,
      totalAvaliacoes: avaliacoes.length,
      status,
      avaliacoesComNota: avaliacoes.map((av) => ({
        nota: av.nota,
        peso: av.peso || 1,
        tipo: av.tipo,
      })),
    });
  } catch (error: any) {
    console.error("Erro na API de média:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}