import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get("disciplina_id");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let query = supabase
      .from("progresso_horas")
      .select("*")
      .eq("user_id", user.id);
    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }
    const { data: progresso, error } = await query;
    if (error) {
      console.error("Erro ao buscar progresso:", error);
      return NextResponse.json(
        { error: "Erro ao buscar progresso" },
        { status: 500 }
      );
    }
    return NextResponse.json({ progresso: progresso || [] });
  } catch (error: any) {
    console.error("Erro na API de progresso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplinaId, blocosAssistidos, horasPorBloco } = body;
    if (!disciplinaId) {
      return NextResponse.json(
        { error: "ID da disciplina é obrigatório" },
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
    const hoje = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("progresso_horas")
      .select("id")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplinaId)
      .eq("data_registro", hoje)
      .single();
    if (existing) {
      const { error: updateError } = await supabase
        .from("progresso_horas")
        .update({
          blocos_assistidos: blocosAssistidos || 0,
          horas_por_bloco: horasPorBloco || 2,
        })
        .eq("id", existing.id);
      if (updateError) {
        console.error("Erro ao atualizar progresso:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar progresso" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("progresso_horas")
        .insert({
          user_id: user.id,
          disciplina_id: disciplinaId,
          blocos_assistidos: blocosAssistidos || 0,
          horas_por_bloco: horasPorBloco || 2,
          data_registro: hoje,
        });
      if (insertError) {
        console.error("Erro ao criar progresso:", insertError);
        return NextResponse.json(
          { error: "Erro ao criar progresso" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de progresso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}