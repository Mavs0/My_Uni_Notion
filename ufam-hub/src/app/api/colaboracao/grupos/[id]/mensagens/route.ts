import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo_id = params.id;
    const body = await request.json();
    const { mensagem, tipo, referencia_id } = body;
    if (!mensagem) {
      return NextResponse.json(
        { error: "mensagem é obrigatória" },
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
    const { data: membro } = await supabase
      .from("grupo_membros")
      .select("id")
      .eq("grupo_id", grupo_id)
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .single();
    if (!membro) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }
    const { data: mensagemData, error: mensagemError } = await supabase
      .from("grupo_mensagens")
      .insert({
        grupo_id,
        user_id: user.id,
        mensagem,
        tipo: tipo || "texto",
        referencia_id: referencia_id || null,
      })
      .select(
        `
        *,
        usuario:auth.users!grupo_mensagens_user_id_fkey(id, raw_user_meta_data)
      `
      )
      .single();
    if (mensagemError) {
      console.error("Erro ao enviar mensagem:", mensagemError);
      return NextResponse.json(
        { error: "Erro ao enviar mensagem" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, mensagem: mensagemData });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo_id = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { data: membro } = await supabase
      .from("grupo_membros")
      .select("id")
      .eq("grupo_id", grupo_id)
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .single();
    if (!membro) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }
    const { data: mensagens, error } = await supabase
      .from("grupo_mensagens")
      .select(
        `
        *,
        usuario:auth.users!grupo_mensagens_user_id_fkey(id, raw_user_meta_data)
      `
      )
      .eq("grupo_id", grupo_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      console.error("Erro ao buscar mensagens:", error);
      return NextResponse.json(
        { error: "Erro ao buscar mensagens" },
        { status: 500 }
      );
    }
    return NextResponse.json({ mensagens: mensagens || [] });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}