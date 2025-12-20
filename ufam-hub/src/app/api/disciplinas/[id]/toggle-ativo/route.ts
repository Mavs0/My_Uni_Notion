import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disciplinaId = params.id;
    const body = await request.json();
    const { ativo } = body;

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se a disciplina pertence ao usuário
    const { data: disciplina, error: discError } = await supabase
      .from("disciplinas")
      .select("id, user_id")
      .eq("id", disciplinaId)
      .single();

    if (discError || !disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    if (disciplina.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para alterar esta disciplina" },
        { status: 403 }
      );
    }

    // Atualizar o status ativo/arquivado
    const { data: updated, error: updateError } = await supabase
      .from("disciplinas")
      .update({ ativo: ativo !== false })
      .eq("id", disciplinaId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao atualizar status da disciplina:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar status da disciplina" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      disciplina: updated,
    });
  } catch (error: any) {
    console.error("Erro na API de toggle ativo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
