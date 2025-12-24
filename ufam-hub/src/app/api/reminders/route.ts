import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push/notifications";

// GET - Listar lembretes do usuário
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
    const enviado = searchParams.get("enviado");
    const tipo = searchParams.get("tipo");

    let query = supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("agendado_para", { ascending: true });

    if (enviado !== null) {
      query = query.eq("enviado", enviado === "true");
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error("Erro ao buscar lembretes:", error);
      return NextResponse.json(
        { error: "Erro ao buscar lembretes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reminders: reminders || [] });
  } catch (error: any) {
    console.error("Erro na API de lembretes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar lembrete personalizado
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
    const {
      tipo,
      titulo,
      descricao,
      referencia_id,
      referencia_tipo,
      agendado_para,
      metadata,
    } = body;

    if (!tipo || !titulo || !agendado_para) {
      return NextResponse.json(
        { error: "Campos obrigatórios: tipo, titulo, agendado_para" },
        { status: 400 }
      );
    }

    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        tipo,
        titulo,
        descricao,
        referencia_id,
        referencia_tipo,
        agendado_para: new Date(agendado_para),
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar lembrete:", error);
      return NextResponse.json(
        { error: "Erro ao criar lembrete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reminder });
  } catch (error: any) {
    console.error("Erro na API de lembretes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar lembrete
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do lembrete é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar lembrete:", error);
      return NextResponse.json(
        { error: "Erro ao deletar lembrete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de lembretes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
