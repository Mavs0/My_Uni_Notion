import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { adicionarXP, verificarConquistasEspecificas } from "@/lib/gamificacao";

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
    const disciplinaId = searchParams.get("disciplina_id");
    const concluida = searchParams.get("concluida");
    let query = supabase
      .from("tarefas")
      .select(
        `
        *,
        disciplinas (
          id,
          nome
        )
      `
      )
      .eq("user_id", user.id)
      .order("data_vencimento", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }
    if (concluida !== null) {
      query = query.eq("concluida", concluida === "true");
    }
    const { data: tarefas, error } = await query;
    if (error) {
      console.error("Erro ao buscar tarefas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar tarefas" },
        { status: 500 }
      );
    }
    const formatted = (tarefas || []).map(
      (t: {
        id: string;
        disciplina_id: string | null;
        titulo: string;
        descricao?: string | null;
        data_vencimento?: string | null;
        concluida: boolean;
        prioridade?: string | null;
        created_at?: string;
        updated_at?: string;
        disciplinas?: { id: string; nome: string } | null;
      }) => ({
        id: t.id,
        disciplinaId: t.disciplina_id,
        disciplina: t.disciplinas?.nome,
        titulo: t.titulo,
        descricao: t.descricao || undefined,
        dataVencimento: t.data_vencimento || undefined,
        concluida: t.concluida,
        prioridade: (t.prioridade as "baixa" | "media" | "alta") || "media",
        created_at: t.created_at,
        updated_at: t.updated_at,
      })
    );
    return NextResponse.json({ tarefas: formatted });
  } catch (error) {
    console.error("Erro na API de tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplinaId, titulo, descricao, dataVencimento, prioridade } =
      body;
    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
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
    if (disciplinaId) {
      const { data: disciplina, error: discError } = await supabase
        .from("disciplinas")
        .select("id")
        .eq("id", disciplinaId)
        .eq("user_id", user.id)
        .single();
      if (discError || !disciplina) {
        return NextResponse.json(
          { error: "Disciplina não encontrada" },
          { status: 404 }
        );
      }
    }
    const prioridadeValida = ["baixa", "media", "alta"].includes(
      prioridade || "media"
    )
      ? prioridade || "media"
      : "media";
    const { data: tarefa, error: tarefaError } = await supabase
      .from("tarefas")
      .insert({
        user_id: user.id,
        disciplina_id: disciplinaId || null,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        data_vencimento: dataVencimento || null,
        prioridade: prioridadeValida,
        concluida: false,
      })
      .select("id")
      .single();
    if (tarefaError) {
      console.error("Erro ao criar tarefa:", tarefaError);
      return NextResponse.json(
        { error: "Erro ao criar tarefa" },
        { status: 500 }
      );
    }
    let conquistasDesbloqueadas: any[] = [];
    try {
      const { count: totalTarefas } = await supabase
        .from("tarefas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const resultadoXP = await adicionarXP(
        user.id,
        5,
        "tarefa",
        `Tarefa criada: ${titulo.trim()}`,
        tarefa.id
      );
      if (resultadoXP.success && resultadoXP.conquistasDesbloqueadas) {
        conquistasDesbloqueadas.push(...resultadoXP.conquistasDesbloqueadas);
      }
      const resultadoConquista = await verificarConquistasEspecificas(
        user.id,
        "primeira_tarefa",
        {
          totalTarefas: (totalTarefas || 0) + 1,
        }
      );
      if (resultadoConquista.conquistasDesbloqueadas) {
        conquistasDesbloqueadas.push(
          ...resultadoConquista.conquistasDesbloqueadas
        );
      }
    } catch (gamError) {
      console.error("Erro ao processar gamificação:", gamError);
    }
    return NextResponse.json({
      success: true,
      tarefa: { id: tarefa.id },
      conquistasDesbloqueadas,
    });
  } catch (error) {
    console.error("Erro na API de tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, titulo, descricao, dataVencimento, concluida, prioridade } =
      body;
    if (!id) {
      return NextResponse.json(
        { error: "ID da tarefa é obrigatório" },
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
    const { data: existing, error: checkError } = await supabase
      .from("tarefas")
      .select("id, concluida")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      );
    }
    const estavaConcluidaAntes = existing.concluida || false;
    const updateData: {
      titulo?: string;
      descricao?: string | null;
      data_vencimento?: string | null;
      concluida?: boolean;
      prioridade?: string;
    } = {};
    if (titulo !== undefined) updateData.titulo = titulo.trim();
    if (descricao !== undefined) updateData.descricao = descricao || null;
    if (dataVencimento !== undefined)
      updateData.data_vencimento = dataVencimento || null;
    if (concluida !== undefined) updateData.concluida = concluida;
    if (prioridade !== undefined) {
      updateData.prioridade = ["baixa", "media", "alta"].includes(prioridade)
        ? prioridade
        : "media";
    }
    const { error: updateError } = await supabase
      .from("tarefas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) {
      console.error("Erro ao atualizar tarefa:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar tarefa" },
        { status: 500 }
      );
    }
    let conquistasDesbloqueadas: any[] = [];
    if (concluida === true && !estavaConcluidaAntes) {
      try {
        const { count: totalTarefasConcluidas } = await supabase
          .from("tarefas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("concluida", true);
        const resultadoXP = await adicionarXP(
          user.id,
          10,
          "tarefa_concluida",
          `Tarefa concluída`,
          id
        );
        if (resultadoXP.success && resultadoXP.conquistasDesbloqueadas) {
          conquistasDesbloqueadas.push(...resultadoXP.conquistasDesbloqueadas);
        }
        const resultadoConquista = await verificarConquistasEspecificas(
          user.id,
          "tarefa_concluida",
          {
            totalTarefasConcluidas: totalTarefasConcluidas || 0,
          }
        );
        if (resultadoConquista.conquistasDesbloqueadas) {
          conquistasDesbloqueadas.push(
            ...resultadoConquista.conquistasDesbloqueadas
          );
        }
      } catch (gamError) {
        console.error("Erro ao processar gamificação:", gamError);
      }
    }
    return NextResponse.json({
      success: true,
      conquistasDesbloqueadas,
    });
  } catch (error) {
    console.error("Erro na API de tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID da tarefa é obrigatório" },
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
    const { error: deleteError } = await supabase
      .from("tarefas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) {
      console.error("Erro ao deletar tarefa:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar tarefa" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}