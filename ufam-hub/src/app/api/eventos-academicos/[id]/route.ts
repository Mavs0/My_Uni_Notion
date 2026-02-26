import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventoId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: evento, error } = await supabase
      .from("eventos_academicos")
      .select("*")
      .eq("id", eventoId)
      .single();

    if (error || !evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    if (!evento.publico && evento.criado_por !== user.id) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    const { data: interesse } = await supabase
      .from("eventos_interesse")
      .select("status")
      .eq("evento_id", eventoId)
      .eq("usuario_id", user.id)
      .single();

    const { count } = await supabase
      .from("eventos_interesse")
      .select("*", { count: "exact", head: true })
      .eq("evento_id", eventoId);

    return NextResponse.json({
      ...evento,
      curso_nome: null, // TODO: Buscar nome do curso se necessário
      disciplina_nome: null, // TODO: Buscar nome da disciplina se necessário
      interessado: interesse?.status === "interessado",
      vou_participar: interesse?.status === "vou_participar",
      total_interessados: count || 0,
    });
  } catch (error: any) {
    console.error("Erro na API de eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventoId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: evento } = await supabase
      .from("eventos_academicos")
      .select("criado_por")
      .eq("id", eventoId)
      .single();

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    if (evento.criado_por !== user.id) {
      return NextResponse.json(
        { error: "Apenas o criador pode editar este evento" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      titulo,
      descricao,
      categoria,
      data_inicio,
      data_fim,
      local,
      link_externo,
      imagem_url,
      curso_id,
      disciplina_id,
      publico,
      recorrente,
      tipo_recorrencia,
    } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (data_inicio !== undefined) updateData.data_inicio = data_inicio;
    if (data_fim !== undefined) updateData.data_fim = data_fim;
    if (local !== undefined) updateData.local = local;
    if (link_externo !== undefined) updateData.link_externo = link_externo;
    if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
    if (curso_id !== undefined) updateData.curso_id = curso_id;
    if (disciplina_id !== undefined) updateData.disciplina_id = disciplina_id;
    if (publico !== undefined) updateData.publico = publico;
    if (recorrente !== undefined) updateData.recorrente = recorrente;
    if (tipo_recorrencia !== undefined)
      updateData.tipo_recorrencia = tipo_recorrencia;

    const { data: eventoAtualizado, error } = await supabase
      .from("eventos_academicos")
      .update(updateData)
      .eq("id", eventoId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar evento:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar evento", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ evento: eventoAtualizado });
  } catch (error: any) {
    console.error("Erro na API de eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventoId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: evento } = await supabase
      .from("eventos_academicos")
      .select("criado_por")
      .eq("id", eventoId)
      .single();

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    if (evento.criado_por !== user.id) {
      return NextResponse.json(
        { error: "Apenas o criador pode deletar este evento" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("eventos_academicos")
      .delete()
      .eq("id", eventoId);

    if (error) {
      console.error("Erro ao deletar evento:", error);
      return NextResponse.json(
        { error: "Erro ao deletar evento", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
