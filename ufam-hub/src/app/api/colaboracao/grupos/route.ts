import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao, foto_url, visibilidade, max_membros, tags } = body;
    if (!nome) {
      return NextResponse.json(
        { error: "nome é obrigatório" },
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
    const link_convite = `group_${Buffer.from(`${user.id}-${Date.now()}`)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 20)}`;
    const { data: grupo, error: grupoError } = await supabase
      .from("grupos_estudo")
      .insert({
        nome,
        descricao: descricao || null,
        criador_id: user.id,
        foto_url: foto_url || null,
        visibilidade: visibilidade || "publico",
        link_convite,
        max_membros: max_membros || 50,
        tags: tags || [],
      })
      .select()
      .single();
    if (grupoError) {
      console.error("Erro ao criar grupo:", grupoError);
      return NextResponse.json(
        { error: "Erro ao criar grupo" },
        { status: 500 }
      );
    }
    const { error: membroError } = await supabase.from("grupo_membros").insert({
      grupo_id: grupo.id,
      user_id: user.id,
      role: "admin",
      status: "ativo",
    });
    if (membroError) {
      console.error("Erro ao adicionar criador como membro:", membroError);
    }
    return NextResponse.json({
      success: true,
      grupo,
      link_convite: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/grupos/convite/${link_convite}`,
    });
  } catch (error: any) {
    console.error("Erro na API de grupos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibilidade = searchParams.get("visibilidade");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const meus_grupos = searchParams.get("meus_grupos") === "true";
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let data, error;
    if (meus_grupos) {
      const { data: membros, error: membrosError } = await supabase
        .from("grupo_membros")
        .select("grupo_id")
        .eq("user_id", user.id)
        .eq("status", "ativo");
      if (membrosError) {
        return NextResponse.json(
          { error: "Erro ao buscar grupos" },
          { status: 500 }
        );
      }
      const grupoIds = membros?.map((m) => m.grupo_id) || [];
      if (grupoIds.length === 0) {
        return NextResponse.json({ grupos: [] });
      }
      let query = supabase
        .from("grupos_estudo")
        .select(
          `
          *,
          criador:auth.users!grupos_estudo_criador_id_fkey(id, raw_user_meta_data)
        `
        )
        .in("id", grupoIds)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      const result = await query;
      data = result.data;
      error = result.error;
    } else {
      let query = supabase
        .from("grupos_estudo")
        .select(
          `
          *,
          criador:auth.users!grupos_estudo_criador_id_fkey(id, raw_user_meta_data)
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (visibilidade) {
        query = query.eq("visibilidade", visibilidade);
      }
      const result = await query;
      data = result.data;
      error = result.error;
    }
    if (error) {
      console.error("Erro ao buscar grupos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar grupos" },
        { status: 500 }
      );
    }
    return NextResponse.json({ grupos: data || [] });
  } catch (error: any) {
    console.error("Erro na API de grupos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}