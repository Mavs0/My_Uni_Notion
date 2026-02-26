import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
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
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role, conteudo, metadata = {} } = body;

    if (!role || !conteudo) {
      return NextResponse.json(
        { error: "Role e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: mensagem, error: msgError } = await supabase
      .from("chat_mensagens")
      .insert({
        thread_id: threadId,
        role,
        conteudo,
        metadata,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Erro ao inserir mensagem:", msgError);
      return NextResponse.json(
        { error: "Erro ao salvar mensagem" },
        { status: 500 }
      );
    }

    await supabase
      .from("chat_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);

    return NextResponse.json({ mensagem }, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
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
  try {
    const { id: threadId } = await params;
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
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("chat_mensagens")
      .delete()
      .eq("thread_id", threadId);

    if (error) {
      console.error("Erro ao limpar mensagens:", error);
      return NextResponse.json(
        { error: "Erro ao limpar mensagens" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
