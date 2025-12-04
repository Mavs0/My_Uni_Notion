import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      descricao,
      tipo,
      grupo_id,
      referencia_id,
      arquivo_url,
      arquivo_tipo,
      arquivo_tamanho,
      tags,
      categoria,
      visibilidade,
    } = body;
    if (!titulo || !tipo) {
      return NextResponse.json(
        { error: "titulo e tipo são obrigatórios" },
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
    if (grupo_id) {
      const { data: membro } = await supabase
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      if (!membro) {
        return NextResponse.json(
          { error: "Você não é membro deste grupo" },
          { status: 403 }
        );
      }
    }
    const { data: material, error: materialError } = await supabase
      .from("biblioteca_materiais")
      .insert({
        titulo,
        descricao: descricao || null,
        tipo,
        user_id: user.id,
        grupo_id: grupo_id || null,
        referencia_id: referencia_id || null,
        arquivo_url: arquivo_url || null,
        arquivo_tipo: arquivo_tipo || null,
        arquivo_tamanho: arquivo_tamanho || null,
        tags: tags || [],
        categoria: categoria || null,
        visibilidade: visibilidade || "publico",
      })
      .select()
      .single();
    if (materialError) {
      console.error("Erro ao adicionar material:", materialError);
      return NextResponse.json(
        { error: "Erro ao adicionar material" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error("Erro na API de biblioteca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const categoria = searchParams.get("categoria");
    const grupo_id = searchParams.get("grupo_id");
    const busca = searchParams.get("busca");
    const tags = searchParams.get("tags");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let query = supabase
      .from("biblioteca_materiais")
      .select(
        `
        *,
        usuario:auth.users!biblioteca_materiais_user_id_fkey(id, raw_user_meta_data),
        grupo:grupos_estudo(id, nome)
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (tipo) {
      query = query.eq("tipo", tipo);
    }
    if (categoria) {
      query = query.eq("categoria", categoria);
    }
    if (grupo_id) {
      query = query.eq("grupo_id", grupo_id);
    }
    if (busca) {
      query = query.or(`titulo.ilike.%${busca}%,descricao.ilike.%${busca}%`);
    }
    if (tags) {
      const tagsArray = tags.split(",");
      query = query.contains("tags", tagsArray);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar materiais:", error);
      return NextResponse.json(
        { error: "Erro ao buscar materiais" },
        { status: 500 }
      );
    }
    return NextResponse.json({ materiais: data || [] });
  } catch (error: any) {
    console.error("Erro na API de biblioteca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}