import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

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
    const limit = parseInt(searchParams.get("limit") || "5");

    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(proximos7Dias.getDate() + 7);

    const { data: avaliacoes, error: avalError } = await supabase
      .from("avaliacoes")
      .select("id, disciplina_id, tipo, data_iso, titulo")
      .eq("user_id", user.id)
      .gte("data_iso", hoje.toISOString().split("T")[0])
      .lte("data_iso", proximos7Dias.toISOString().split("T")[0])
      .order("data_iso", { ascending: true })
      .limit(limit);

    if (avalError) {
      console.error("Erro ao buscar avaliações:", avalError);
    }

    const { data: tarefas, error: tarefasError } = await supabase
      .from("tarefas")
      .select("id, disciplina_id, titulo, data_vencimento, concluida")
      .eq("user_id", user.id)
      .eq("concluida", false)
      .not("data_vencimento", "is", null)
      .lte("data_vencimento", proximos7Dias.toISOString().split("T")[0])
      .order("data_vencimento", { ascending: true })
      .limit(limit);

    if (tarefasError) {
      console.error("Erro ao buscar tarefas:", tarefasError);
    }

    const notificacoes: Array<{
      id: string;
      tipo: "avaliacao" | "tarefa";
      titulo: string;
      data: string;
      disciplina_id?: string;
      urgente: boolean;
    }> = [];

    (avaliacoes || []).forEach((aval) => {
      const dias = Math.ceil(
        (new Date(aval.data_iso).getTime() - hoje.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      notificacoes.push({
        id: `aval-${aval.id}`,
        tipo: "avaliacao",
        titulo: aval.titulo || `${aval.tipo} - ${aval.disciplina_id}`,
        data: aval.data_iso,
        disciplina_id: aval.disciplina_id,
        urgente: dias <= 3,
      });
    });

    (tarefas || []).forEach((tarefa) => {
      if (!tarefa.data_vencimento) return;
      const dias = Math.ceil(
        (new Date(tarefa.data_vencimento).getTime() - hoje.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      notificacoes.push({
        id: `tarefa-${tarefa.id}`,
        tipo: "tarefa",
        titulo: tarefa.titulo,
        data: tarefa.data_vencimento,
        disciplina_id: tarefa.disciplina_id,
        urgente: dias <= 1,
      });
    });

    notificacoes.sort((a, b) => {
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      if (a.urgente && !b.urgente) return -1;
      if (!a.urgente && b.urgente) return 1;
      return dataA - dataB;
    });

    return NextResponse.json({
      notificacoes: notificacoes.slice(0, limit),
    });
  } catch (error: any) {
    console.error("Erro na API de notificações recentes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
