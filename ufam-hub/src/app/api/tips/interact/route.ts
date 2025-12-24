import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { tip_id, acao, contexto } = body;

    if (!tip_id || !acao) {
      return NextResponse.json(
        { error: "tip_id e acao são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_tip_interactions")
      .insert({
        user_id: user.id,
        tip_id,
        acao,
        contexto: contexto || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao registrar interação:", error);
      return NextResponse.json(
        { error: "Erro ao registrar interação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, interaction: data });
  } catch (error: any) {
    console.error("Erro na API de interação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
