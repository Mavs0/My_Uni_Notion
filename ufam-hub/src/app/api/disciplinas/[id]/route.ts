import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: disciplinaId } = await params;

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: disc, error } = await supabase
      .from("disciplinas")
      .select("id, user_id, ativo")
      .eq("id", disciplinaId)
      .eq("user_id", user.id)
      .single();

    if (error || !disc) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 },
      );
    }

    if (disc.ativo === false) {
      return NextResponse.json(
        {
          error: "Disciplina arquivada. Desarquive para acessar.",
          codigo: "DISCIPLINA_ARQUIVADA",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Erro na API de disciplina [id]:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
