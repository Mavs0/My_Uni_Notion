import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { flashcardId, qualidade } = body;
    if (!flashcardId || qualidade === undefined) {
      return NextResponse.json(
        { error: "flashcardId e qualidade são obrigatórios" },
        { status: 400 }
      );
    }
    if (qualidade < 0 || qualidade > 5) {
      return NextResponse.json(
        { error: "Qualidade deve ser entre 0 e 5" },
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
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", flashcardId)
      .eq("user_id", user.id)
      .single();
    if (flashcardError || !flashcard) {
      return NextResponse.json(
        { error: "Flashcard não encontrado" },
        { status: 404 }
      );
    }
    const { data: ultimaRevisao, error: revisaoError } = await supabase
      .from("flashcard_revisoes")
      .select("*")
      .eq("flashcard_id", flashcardId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    let intervaloAtual = 1;
    let fatorEase = 2.5;
    let repeticoes = 0;
    if (ultimaRevisao && !revisaoError) {
      intervaloAtual = ultimaRevisao.intervalo_dias || 1;
      fatorEase = parseFloat(ultimaRevisao.fator_ease) || 2.5;
      repeticoes = ultimaRevisao.repeticoes || 0;
    }
    let novoIntervalo: number;
    let novoFator: number;
    let novasRepeticoes: number;
    if (qualidade < 3) {
      novoIntervalo = 1;
      novasRepeticoes = 0;
      novoFator = Math.max(1.3, fatorEase - 0.2);
    } else {
      if (repeticoes === 0) {
        novoIntervalo = 1;
      } else if (repeticoes === 1) {
        novoIntervalo = 6;
      } else {
        novoIntervalo = Math.round(intervaloAtual * fatorEase);
      }
      novoFator =
        fatorEase + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02));
      novoFator = Math.max(1.3, novoFator);
      novasRepeticoes = repeticoes + 1;
    }
    const proximaRevisao = new Date();
    proximaRevisao.setDate(proximaRevisao.getDate() + novoIntervalo);
    const { data: novaRevisao, error: createError } = await supabase
      .from("flashcard_revisoes")
      .insert({
        flashcard_id: flashcardId,
        user_id: user.id,
        qualidade,
        proxima_revisao: proximaRevisao.toISOString(),
        intervalo_dias: novoIntervalo,
        fator_ease: novoFator,
        repeticoes: novasRepeticoes,
      })
      .select()
      .single();
    if (createError) {
      console.error("Erro ao criar revisão:", createError);
      return NextResponse.json(
        { error: "Erro ao criar revisão" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      revisao: novaRevisao,
      proximaRevisao: proximaRevisao.toISOString(),
      intervalo: novoIntervalo,
    });
  } catch (error: any) {
    console.error("Erro na API de revisão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}