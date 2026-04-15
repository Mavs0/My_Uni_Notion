import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

function getDbClient(supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  try {
    return createSupabaseAdmin();
  } catch {
    return supabase;
  }
}

function normalizeNotification(n: Record<string, unknown>) {
  const meta = n.metadata;
  return {
    ...n,
    metadata:
      typeof meta === "string" ? (() => { try { return JSON.parse(meta); } catch { return meta; } })() : meta,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const db = getDbClient(supabase);
    const { searchParams } = new URL(request.url);
    const lidaParam = searchParams.get("lida");
    const tipo = searchParams.get("tipo");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    let query = db
      .from("notification_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (lidaParam === "true" || lidaParam === "false") {
      query = query.eq("lida", lidaParam === "true");
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data: rawNotifications, error } = await query;

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({
          notifications: [],
          total_nao_lidas: 0,
        });
      }
      return NextResponse.json(
        { error: "Erro ao buscar histórico", details: error.message },
        { status: 500 }
      );
    }

    const notifications = (rawNotifications || []).map(normalizeNotification);

    const { count, error: countError } = await db
      .from("notification_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("lida", false);

    const totalNaoLidas = countError ? 0 : (count ?? 0);

    return NextResponse.json({
      notifications,
      total_nao_lidas: totalNaoLidas,
    });
  } catch (err: unknown) {
    console.error("Erro na API de histórico:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, marcar_todas } = body;

    const db = getDbClient(supabase);

    if (marcar_todas) {
      const { error } = await db
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

    const { error } = await db
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
  } catch (err: unknown) {
    console.error("Erro na API de histórico:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
