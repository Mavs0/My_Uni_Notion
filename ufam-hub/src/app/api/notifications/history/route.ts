import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// GET - Buscar histórico de notificações
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
    const lida = searchParams.get("lida");
    const tipo = searchParams.get("tipo");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("notification_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (lida !== null) {
      query = query.eq("lida", lida === "true");
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return NextResponse.json(
        { error: "Erro ao buscar histórico" },
        { status: 500 }
      );
    }

    // Contar total de não lidas
    const { count } = await supabase
      .from("notification_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("lida", false);

    return NextResponse.json({
      notifications: notifications || [],
      total_nao_lidas: count || 0,
    });
  } catch (error: any) {
    console.error("Erro na API de histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Marcar notificação como lida
export async function PATCH(request: NextRequest) {
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
    const { id, marcar_todas } = body;

    if (marcar_todas) {
      // Marcar todas como lidas
      const { error } = await supabase
        .from("notification_history")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("lida", false);

      if (error) {
        console.error("Erro ao marcar todas como lidas:", error);
        return NextResponse.json(
          { error: "Erro ao atualizar notificações" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID da notificação é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notification_history")
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao marcar como lida:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar notificação" },
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
