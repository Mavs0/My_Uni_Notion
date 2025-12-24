import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// POST - Criar lembretes automáticos para avaliações e tarefas
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
    const { tipo, referencia_id } = body;

    if (!tipo || !referencia_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: tipo, referencia_id" },
        { status: 400 }
      );
    }

    let result;

    if (tipo === "avaliacao") {
      // Criar lembretes para avaliação (3 dias, 1 dia, 1 hora antes)
      const { error } = await supabase.rpc("criar_lembrete_avaliacao", {
        p_user_id: user.id,
        p_avaliacao_id: referencia_id,
        p_dias_antes: [3, 1],
      });

      if (error) {
        console.error("Erro ao criar lembretes de avaliação:", error);
        return NextResponse.json(
          { error: "Erro ao criar lembretes" },
          { status: 500 }
        );
      }

      result = { success: true, tipo: "avaliacao", lembretes_criados: 2 };
    } else if (tipo === "tarefa") {
      // Criar lembretes para tarefa (24h, 12h, 1h antes)
      const { error } = await supabase.rpc("criar_lembrete_tarefa", {
        p_user_id: user.id,
        p_tarefa_id: referencia_id,
        p_horas_antes: [24, 12, 1],
      });

      if (error) {
        console.error("Erro ao criar lembretes de tarefa:", error);
        return NextResponse.json(
          { error: "Erro ao criar lembretes" },
          { status: 500 }
        );
      }

      result = { success: true, tipo: "tarefa", lembretes_criados: 3 };
    } else {
      return NextResponse.json(
        { error: "Tipo inválido. Use 'avaliacao' ou 'tarefa'" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro na API de lembretes automáticos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
