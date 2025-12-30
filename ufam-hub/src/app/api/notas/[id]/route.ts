import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notaId } = await params;
  try {
    const body = await request.json();
    const { titulo, content_md } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: "título é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("notas")
      .update({
        titulo: titulo.trim(),
        content_md: content_md || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", notaId)
      .eq("user_id", user.id)
      .select("id, disciplina_id, titulo, content_md, created_at, updated_at")
      .single();

    if (error) {
      console.error("Erro ao atualizar nota:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar nota" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Nota não encontrada" },
        { status: 404 }
      );
    }

    const nota = {
      id: data.id,
      disciplinaId: data.disciplina_id,
      titulo: data.titulo,
      content_md: data.content_md || "",
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ success: true, nota });
  } catch (error: any) {
    console.error("Erro na API de notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notaId } = await params;
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { error } = await supabase
      .from("notas")
      .delete()
      .eq("id", notaId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir nota:", error);
      return NextResponse.json(
        { error: "Erro ao excluir nota" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
