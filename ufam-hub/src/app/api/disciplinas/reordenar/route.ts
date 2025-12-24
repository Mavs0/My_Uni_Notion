import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplinas } = body;

    if (!disciplinas || !Array.isArray(disciplinas)) {
      return NextResponse.json(
        { error: "Lista de disciplinas é obrigatória" },
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

    // Atualizar ordem de cada disciplina
    const updates = disciplinas.map((d: { id: string; ordem: number }) =>
      supabase
        .from("disciplinas")
        .update({ ordem: d.ordem })
        .eq("id", d.id)
        .eq("user_id", user.id)
    );

    const results = await Promise.all(updates);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("Erros ao reordenar:", errors);
      return NextResponse.json(
        { error: "Erro ao reordenar algumas disciplinas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de reordenar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
