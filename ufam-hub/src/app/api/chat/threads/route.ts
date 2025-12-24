import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

// GET - Listar threads do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const arquivado = searchParams.get("arquivado") === "true";
    const favorito = searchParams.get("favorito") === "true";
    const disciplinaId = searchParams.get("disciplina_id");
    const modo = searchParams.get("modo");

    let query = supabase
      .from("chat_threads")
      .select(
        `
        *,
        disciplina:disciplinas(id, nome),
        mensagens:chat_mensagens(count)
      `
      )
      .eq("user_id", user.id)
      .eq("arquivado", arquivado)
      .order("updated_at", { ascending: false });

    if (favorito) {
      query = query.eq("favorito", true);
    }

    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }

    if (modo) {
      query = query.eq("modo", modo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar threads:", error);
      return NextResponse.json(
        { error: "Erro ao buscar conversas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ threads: data });
  } catch (error: any) {
    console.error("Erro na API de threads:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar nova thread
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
    const { titulo, disciplina_id, modo = "chat" } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("chat_threads")
      .insert({
        user_id: user.id,
        disciplina_id: disciplina_id || null,
        titulo,
        modo,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar thread:", error);
      return NextResponse.json(
        { error: "Erro ao criar conversa" },
        { status: 500 }
      );
    }

    return NextResponse.json({ thread: data }, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de threads:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
