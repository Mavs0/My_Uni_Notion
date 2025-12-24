import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// POST - Verificar e criar lembrete de streak
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

    // Verificar e criar lembrete de streak se necessário
    const { error } = await supabase.rpc("verificar_lembrete_streak", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Erro ao verificar lembrete de streak:", error);
      return NextResponse.json(
        { error: "Erro ao verificar streak" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de streak:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
