import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// GET - Buscar thread com mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: thread, error: threadError } = await supabase
      .from("chat_threads")
      .select(
        `
        *,
        disciplina:disciplinas(id, nome),
        mensagens:chat_mensagens(*)
      `
      )
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    // Ordenar mensagens por data
    if (thread.mensagens) {
      thread.mensagens.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return NextResponse.json({ thread });
  } catch (error: any) {
    console.error("Erro na API de thread:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar thread (favorito, arquivado, título)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { titulo, favorito, arquivado } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (titulo !== undefined) updateData.titulo = titulo;
    if (favorito !== undefined) updateData.favorito = favorito;
    if (arquivado !== undefined) updateData.arquivado = arquivado;

    const { data, error } = await supabase
      .from("chat_threads")
      .update(updateData)
      .eq("id", threadId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar thread:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar conversa" },
        { status: 500 }
      );
    }

    return NextResponse.json({ thread: data });
  } catch (error: any) {
    console.error("Erro na API de thread:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir thread
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { error } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", threadId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir thread:", error);
      return NextResponse.json(
        { error: "Erro ao excluir conversa" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de thread:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
