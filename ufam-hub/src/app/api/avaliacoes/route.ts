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
    const tipo = searchParams.get("tipo");
    let query = supabase
      .from("avaliacoes")
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
      .order("data_iso", { ascending: true });
    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }
    if (tipo && ["prova", "trabalho", "seminario"].includes(tipo)) {
      query = query.eq("tipo", tipo);
    }
    const { data: avaliacoes, error } = await query;
    if (error) {
      console.error("Erro ao buscar avaliações:", error);
      return NextResponse.json(
        { error: "Erro ao buscar avaliações" },
        { status: 500 }
      );
    }
    const formatted = (avaliacoes || []).map(
      (av: {
        id: string;
        disciplina_id: string;
        tipo: string;
        data_iso: string;
        descricao?: string;
        resumo_assuntos?: string;
        gerado_por_ia?: boolean;
        horario?: string;
        nota?: number | null;
        peso?: number | null;
        created_at?: string;
        updated_at?: string;
        disciplinas?: { id: string; nome: string } | null;
      }) => ({
        id: av.id,
        disciplinaId: av.disciplina_id,
        disciplina: av.disciplinas?.nome,
        tipo: av.tipo,
        dataISO: av.data_iso,
        descricao: av.descricao,
        resumo_assuntos: av.resumo_assuntos,
        gerado_por_ia: av.gerado_por_ia || false,
        horario: av.horario,
        nota: av.nota ?? undefined,
        peso: av.peso ?? undefined,
        created_at: av.created_at,
        updated_at: av.updated_at,
      })
    );
    return NextResponse.json({ avaliacoes: formatted });
  } catch (error) {
    console.error("Erro na API de avaliações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      disciplinaId,
      tipo,
      dataISO,
      descricao,
      resumo_assuntos,
      horario,
      nota,
      peso,
    } = body;
    if (!disciplinaId || !tipo || !dataISO) {
      return NextResponse.json(
        { error: "Disciplina, tipo e data são obrigatórios" },
        { status: 400 }
      );
    }
    if (!["prova", "trabalho", "seminario"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo inválido. Use: prova, trabalho ou seminario" },
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
    const { data: avaliacao, error: avError } = await supabase
      .from("avaliacoes")
      .insert({
        user_id: user.id,
        disciplina_id: disciplinaId,
        tipo,
        data_iso: dataISO,
        descricao: descricao || null,
        resumo_assuntos: resumo_assuntos || null,
        gerado_por_ia: !!resumo_assuntos,
        horario: horario || null,
        nota: nota !== undefined && nota !== null ? Number(nota) : null,
        peso: peso !== undefined && peso !== null ? Number(peso) : null,
      })
      .select("id")
      .single();
    if (avError) {
      console.error("Erro ao criar avaliação:", avError);
      return NextResponse.json(
        { error: "Erro ao criar avaliação" },
        { status: 500 }
      );
    }
    let conquistasDesbloqueadas: any[] = [];
    try {
      const { count: totalAvaliacoes } = await supabase
        .from("avaliacoes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const resultadoXP = await adicionarXP(
        user.id,
        15,
        "avaliacao",
        `Avaliação criada: ${tipo}`,
        avaliacao.id
      );
      if (resultadoXP.success && resultadoXP.conquistasDesbloqueadas) {
        conquistasDesbloqueadas.push(...resultadoXP.conquistasDesbloqueadas);
      }
      const resultadoConquista = await verificarConquistasEspecificas(
        user.id,
        "primeira_avaliacao",
        {
          totalAvaliacoes: (totalAvaliacoes || 0) + 1,
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
      avaliacao: { id: avaliacao.id },
      conquistasDesbloqueadas,
    });
  } catch (error) {
    console.error("Erro na API de avaliações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      disciplinaId,
      tipo,
      dataISO,
      descricao,
      resumo_assuntos,
      horario,
      nota,
      peso,
    } = body;
    if (!id) {
      return NextResponse.json(
        { error: "ID da avaliação é obrigatório" },
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
      .from("avaliacoes")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }
    const updateData: {
      disciplina_id?: string;
      tipo?: string;
      data_iso?: string;
      descricao?: string | null;
      resumo_assuntos?: string | null;
      horario?: string | null;
      gerado_por_ia?: boolean;
      nota?: number | null;
      peso?: number | null;
    } = {};
    if (disciplinaId) updateData.disciplina_id = disciplinaId;
    if (tipo) updateData.tipo = tipo;
    if (dataISO) updateData.data_iso = dataISO;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (resumo_assuntos !== undefined)
      updateData.resumo_assuntos = resumo_assuntos;
    if (horario !== undefined) updateData.horario = horario;
    if (resumo_assuntos !== undefined)
      updateData.gerado_por_ia = !!resumo_assuntos;
    if (nota !== undefined)
      updateData.nota = nota !== null ? Number(nota) : null;
    if (peso !== undefined)
      updateData.peso = peso !== null ? Number(peso) : null;
    const { error: updateError } = await supabase
      .from("avaliacoes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) {
      console.error("Erro ao atualizar avaliação:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar avaliação" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de avaliações:", error);
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
        { error: "ID da avaliação é obrigatório" },
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
      .from("avaliacoes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) {
      console.error("Erro ao deletar avaliação:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar avaliação" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de avaliações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}