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
    const { data: disciplinas, error: discError } = await supabase
      .from("disciplinas")
      .select(
        `
        *,
        horarios (
          id,
          dia_semana,
          hora_inicio,
          hora_fim
        )
      `
      )
      .eq("user_id", user.id)
      .order("nome", { ascending: true });
    if (discError) {
      console.error("Erro ao buscar disciplinas:", discError);
      return NextResponse.json(
        { error: "Erro ao buscar disciplinas" },
        { status: 500 }
      );
    }
    const formatted = (disciplinas || []).map(
      (disc: {
        id: string;
        nome: string;
        tipo: string;
        horas_semana: number;
        professor?: string | null;
        local?: string | null;
        ativo?: boolean;
        created_at?: string;
        updated_at?: string;
        horarios?: Array<{
          id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fim: string;
        }>;
      }) => ({
        id: disc.id,
        nome: disc.nome,
        tipo: disc.tipo,
        horasSemana: disc.horas_semana,
        professor: disc.professor || undefined,
        local: disc.local || undefined,
        ativo: disc.ativo !== false, // Default para true se não existir
        horarios: (disc.horarios || []).map((h) => ({
          id: h.id,
          dia: h.dia_semana,
          inicio: h.hora_inicio,
          fim: h.hora_fim,
        })),
        created_at: disc.created_at,
        updated_at: disc.updated_at,
      })
    );
    return NextResponse.json({ disciplinas: formatted });
  } catch (error) {
    console.error("Erro na API de disciplinas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, tipo, horasSemana, professor, local, horarios } = body;
    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
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
      .insert({
        user_id: user.id,
        nome,
        tipo,
        horas_semana: horasSemana || 0,
        professor: professor || null,
        local: local || null,
      })
      .select("id")
      .single();
    if (discError) {
      console.error("Erro ao criar disciplina:", discError);
      return NextResponse.json(
        { error: "Erro ao criar disciplina" },
        { status: 500 }
      );
    }
    if (horarios && Array.isArray(horarios) && horarios.length > 0) {
      const horariosData = horarios.map(
        (h: { dia: number; inicio: string; fim: string }) => ({
          disciplina_id: disciplina.id,
          dia_semana: h.dia,
          hora_inicio: h.inicio,
          hora_fim: h.fim,
        })
      );
      const { error: horError } = await supabase
        .from("horarios")
        .insert(horariosData);
      if (horError) {
        console.error("Erro ao criar horários:", horError);
      }
    }
    let conquistasDesbloqueadas: any[] = [];
    try {
      const { count: totalDisciplinas } = await supabase
        .from("disciplinas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const resultadoXP = await adicionarXP(
        user.id,
        10,
        "disciplina",
        `Disciplina criada: ${nome}`,
        disciplina.id
      );
      if (resultadoXP.success && resultadoXP.conquistasDesbloqueadas) {
        conquistasDesbloqueadas.push(...resultadoXP.conquistasDesbloqueadas);
      }
      const resultadoConquista = await verificarConquistasEspecificas(
        user.id,
        "primeira_disciplina",
        {
          totalDisciplinas: (totalDisciplinas || 0) + 1,
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
      disciplina: { id: disciplina.id },
      conquistasDesbloqueadas,
    });
  } catch (error) {
    console.error("Erro na API de disciplinas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, tipo, horasSemana, professor, local, horarios } = body;
    if (!id) {
      return NextResponse.json(
        { error: "ID da disciplina é obrigatório" },
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
      .from("disciplinas")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }
    const updateData: {
      nome?: string;
      tipo?: string;
      horas_semana?: number;
      professor?: string | null;
      local?: string | null;
    } = {};
    if (nome) updateData.nome = nome;
    if (tipo) updateData.tipo = tipo;
    if (horasSemana !== undefined) updateData.horas_semana = horasSemana;
    if (professor !== undefined) updateData.professor = professor;
    if (local !== undefined) updateData.local = local;
    const { error: updateError } = await supabase
      .from("disciplinas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) {
      console.error("Erro ao atualizar disciplina:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar disciplina" },
        { status: 500 }
      );
    }
    if (horarios && Array.isArray(horarios)) {
      await supabase.from("horarios").delete().eq("disciplina_id", id);
      if (horarios.length > 0) {
        const horariosData = horarios.map(
          (h: { dia: number; inicio: string; fim: string }) => ({
            disciplina_id: id,
            dia_semana: h.dia,
            hora_inicio: h.inicio,
            hora_fim: h.fim,
          })
        );
        await supabase.from("horarios").insert(horariosData);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de disciplinas:", error);
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
        { error: "ID da disciplina é obrigatório" },
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
      .from("disciplinas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) {
      console.error("Erro ao deletar disciplina:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar disciplina" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de disciplinas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
