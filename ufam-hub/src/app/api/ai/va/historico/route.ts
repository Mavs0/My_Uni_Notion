import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// GET - Carregar histórico do VirtualAssistant
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar histórico mais recente do VA (últimas 50 mensagens)
    const { data: historico, error } = await supabase
      .from("va_historico")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return NextResponse.json({ historico: [] }, { status: 200 });
    }

    return NextResponse.json({ historico: historico || [] });
  } catch (error: any) {
    console.error("Erro na API de histórico:", error);
    return NextResponse.json({ historico: [] }, { status: 200 });
  }
}

// POST - Salvar mensagens do VirtualAssistant
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { mensagens } = await req.json();

    if (!Array.isArray(mensagens)) {
      return NextResponse.json(
        { error: "Mensagens devem ser um array" },
        { status: 400 }
      );
    }

    // Limpar histórico antigo antes de salvar novo
    await supabase.from("va_historico").delete().eq("user_id", user.id);

    // Inserir novas mensagens
    const mensagensParaSalvar = mensagens.map((msg: any) => ({
      user_id: user.id,
      role: msg.role,
      conteudo: msg.text,
      metadata: { id: msg.id, timestamp: msg.timestamp },
    }));

    const { error: insertError } = await supabase
      .from("va_historico")
      .insert(mensagensParaSalvar);

    if (insertError) {
      console.error("Erro ao salvar histórico:", insertError);
      return NextResponse.json(
        { error: "Erro ao salvar histórico" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Limpar histórico
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { error } = await supabase
      .from("va_historico")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao limpar histórico:", error);
      return NextResponse.json(
        { error: "Erro ao limpar histórico" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
