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
    const categoria = searchParams.get("categoria");
    const cursoId = searchParams.get("curso_id");
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");
    const publico = searchParams.get("publico");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("eventos_academicos")
      .select("*", { count: "exact" })
      .order("data_inicio", { ascending: true })
      .range(offset, offset + limit - 1);

    if (categoria) {
      query = query.eq("categoria", categoria);
    }
    if (cursoId) {
      query = query.eq("curso_id", cursoId);
    }
    if (dataInicio) {
      query = query.gte("data_inicio", dataInicio);
    }
    if (dataFim) {
      query = query.lte("data_fim", dataFim);
    }
    if (publico === "true") {
      query = query.eq("publico", true);
    }

    const { data: eventos, error, count } = await query;

    if (error) {
      console.error("Erro ao buscar eventos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar eventos" },
        { status: 500 }
      );
    }

    const { data: interesses } = await supabase
      .from("eventos_interesse")
      .select("evento_id, status")
      .eq("usuario_id", user.id);

    const interessesMap = new Map(
      interesses?.map((i) => [i.evento_id, i.status]) || []
    );

    const eventoIds = eventos?.map((e) => e.id) || [];
    const { data: contagens } = await supabase
      .from("eventos_interesse")
      .select("evento_id")
      .in("evento_id", eventoIds);

    const contagensMap = new Map<string, number>();
    contagens?.forEach((c) => {
      contagensMap.set(c.evento_id, (contagensMap.get(c.evento_id) || 0) + 1);
    });

    const eventosFormatados = eventos?.map((evento: any) => ({
      id: evento.id,
      titulo: evento.titulo,
      descricao: evento.descricao || "",
      categoria: evento.categoria,
      data_inicio: evento.data_inicio,
      data_fim: evento.data_fim,
      local: evento.local,
      link_externo: evento.link_externo,
      imagem_url: evento.imagem_url,
      curso_id: evento.curso_id,
      curso_nome: null, // TODO: Buscar nome do curso se necessário
      disciplina_id: evento.disciplina_id,
      disciplina_nome: null, // TODO: Buscar nome da disciplina se necessário
      publico: evento.publico ?? true,
      recorrente: evento.recorrente ?? false,
      tipo_recorrencia: evento.tipo_recorrencia,
      criado_por: evento.criado_por,
      created_at: evento.created_at,
      updated_at: evento.updated_at,
      interessado: interessesMap.get(evento.id) === "interessado",
      vou_participar: interessesMap.get(evento.id) === "vou_participar",
      total_interessados: contagensMap.get(evento.id) || 0,
    }));

    return NextResponse.json({
      eventos: eventosFormatados || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Erro na API de eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

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
      publico = true,
      recorrente = false,
      tipo_recorrencia,
    } = body;

    if (!titulo || !categoria || !data_inicio) {
      return NextResponse.json(
        { error: "Título, categoria e data de início são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: evento, error } = await supabase
      .from("eventos_academicos")
      .insert({
        titulo,
        descricao: descricao || null,
        categoria,
        data_inicio,
        data_fim: data_fim || null,
        local: local || null,
        link_externo: link_externo || null,
        imagem_url: imagem_url || null,
        curso_id: curso_id || null,
        disciplina_id: disciplina_id || null,
        publico,
        recorrente,
        tipo_recorrencia: tipo_recorrencia || null,
        criado_por: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar evento:", error);
      return NextResponse.json(
        { error: "Erro ao criar evento", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ evento }, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
