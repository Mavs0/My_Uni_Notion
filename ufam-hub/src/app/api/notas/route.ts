import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { adicionarXP, verificarConquistasEspecificas } from "@/lib/gamificacao";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get("disciplina_id");
    if (!disciplinaId) {
      return NextResponse.json(
        { error: "disciplina_id é obrigatório" },
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
    const { data, error } = await supabase
      .from("notas")
      .select("content_md, id")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplinaId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar notas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar notas" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      content_md: data?.content_md || "",
      id: data?.id || null,
    });
  } catch (error: any) {
    console.error("Erro na API de notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplina_id, content_md } = body;
    if (!disciplina_id) {
      return NextResponse.json(
        { error: "disciplina_id é obrigatório" },
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
    const { data: existing } = await supabase
      .from("notas")
      .select("id")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplina_id)
      .limit(1)
      .single();
    if (existing) {
      const { error } = await supabase
        .from("notas")
        .update({
          content_md: content_md || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", user.id);
      if (error) {
        console.error("Erro ao atualizar nota:", error);
        return NextResponse.json(
          { error: "Erro ao salvar nota" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, id: existing.id });
    } else {
      const { data, error } = await supabase
        .from("notas")
        .insert({
          user_id: user.id,
          disciplina_id,
          content_md: content_md || "",
        })
        .select("id")
        .single();
      if (error) {
        console.error("Erro ao criar nota:", error);
        return NextResponse.json(
          { error: "Erro ao salvar nota" },
          { status: 500 }
        );
      }
      let conquistasDesbloqueadas: any[] = [];
      try {
        const { count: totalAnotacoes } = await supabase
          .from("notas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        const resultadoXP = await adicionarXP(
          user.id,
          3,
          "anotacao",
          `Anotação criada`,
          data.id
        );
        if (resultadoXP.success && resultadoXP.conquistasDesbloqueadas) {
          conquistasDesbloqueadas.push(...resultadoXP.conquistasDesbloqueadas);
        }
      } catch (gamError) {
        console.error("Erro ao processar gamificação:", gamError);
      }
      return NextResponse.json({
        success: true,
        id: data.id,
        conquistasDesbloqueadas,
      });
    }
  } catch (error: any) {
    console.error("Erro na API de notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}