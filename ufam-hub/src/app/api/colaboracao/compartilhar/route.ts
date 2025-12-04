import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nota_id,
      disciplina_id,
      titulo,
      descricao,
      visibilidade,
      permite_comentarios,
      permite_download,
    } = body;
    if (!nota_id || !titulo) {
      return NextResponse.json(
        { error: "nota_id e titulo são obrigatórios" },
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
    const { data: nota, error: notaError } = await supabase
      .from("notas")
      .select("id, user_id")
      .eq("id", nota_id)
      .eq("user_id", user.id)
      .single();
    if (notaError || !nota) {
      return NextResponse.json(
        { error: "Anotação não encontrada ou não autorizada" },
        { status: 404 }
      );
    }
    const link_compartilhamento = `share_${Buffer.from(
      `${user.id}-${Date.now()}`
    )
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 20)}`;
    const { data: compartilhada, error: shareError } = await supabase
      .from("notas_compartilhadas")
      .insert({
        nota_id,
        disciplina_id: disciplina_id || null,
        user_id: user.id,
        titulo,
        descricao: descricao || null,
        visibilidade: visibilidade || "publico",
        link_compartilhamento,
        permite_comentarios: permite_comentarios !== false,
        permite_download: permite_download !== false,
      })
      .select()
      .single();
    if (shareError) {
      console.error("Erro ao compartilhar anotação:", shareError);
      return NextResponse.json(
        { error: "Erro ao compartilhar anotação" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      compartilhada,
      link: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/compartilhado/${link_compartilhamento}`,
    });
  } catch (error: any) {
    console.error("Erro na API de compartilhamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const link = searchParams.get("link");
    const disciplina_id = searchParams.get("disciplina_id");
    const visibilidade = searchParams.get("visibilidade");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer();
    if (link) {
      const { data: compartilhada, error: compartilhadaError } = await supabase
        .from("notas_compartilhadas")
        .select("*")
        .eq("link_compartilhamento", link)
        .single();
      if (compartilhadaError || !compartilhada) {
        return NextResponse.json(
          { error: "Anotação não encontrada" },
          { status: 404 }
        );
      }
      const { data: nota, error: notaError } = await supabase
        .from("notas")
        .select("content_md")
        .eq("id", compartilhada.nota_id)
        .single();
      const { data: usuario } = await supabase.auth.admin.getUserById(
        compartilhada.user_id
      );
      await supabase
        .from("notas_compartilhadas")
        .update({ visualizacoes: (compartilhada.visualizacoes || 0) + 1 })
        .eq("id", compartilhada.id);
      return NextResponse.json({
        ...compartilhada,
        content_md: nota?.content_md || "",
        usuario: usuario?.user
          ? {
              id: usuario.user.id,
              raw_user_meta_data: usuario.user.user_metadata,
            }
          : null,
      });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let query = supabase
      .from("notas_compartilhadas")
      .select(
        `
        *,
        disciplina:disciplinas(id, nome),
        usuario:auth.users!notas_compartilhadas_user_id_fkey(id, raw_user_meta_data)
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (disciplina_id) {
      query = query.eq("disciplina_id", disciplina_id);
    }
    if (visibilidade) {
      query = query.eq("visibilidade", visibilidade);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar anotações compartilhadas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar anotações compartilhadas" },
        { status: 500 }
      );
    }
    return NextResponse.json({ compartilhadas: data || [] });
  } catch (error: any) {
    console.error("Erro na API de compartilhamento:", error);
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
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { error } = await supabase
      .from("notas_compartilhadas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      console.error("Erro ao descompartilhar:", error);
      return NextResponse.json(
        { error: "Erro ao descompartilhar anotação" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de compartilhamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}