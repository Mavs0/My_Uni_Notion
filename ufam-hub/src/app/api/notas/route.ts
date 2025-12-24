import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { adicionarXP, verificarConquistasEspecificas } from "@/lib/gamificacao";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get("disciplina_id");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Se disciplina_id fornecido, buscar apenas notas dessa disciplina
    // Caso contrário, buscar todas as notas do usuário
    let query = supabase
      .from("notas")
      .select("id, disciplina_id, titulo, content_md, created_at, updated_at")
      .eq("user_id", user.id);

    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }

    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      console.error("Erro ao buscar notas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar notas" },
        { status: 500 }
      );
    }

    // Formatar dados para o formato esperado pelo hook
    const notas = (data || []).map((nota) => ({
      id: nota.id,
      disciplinaId: nota.disciplina_id,
      titulo: nota.titulo || "Sem título",
      content_md: nota.content_md || "",
      created_at: nota.created_at,
      updated_at: nota.updated_at,
    }));

    return NextResponse.json({ notas });
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
    const { disciplina_id, titulo, content_md } = body;

    console.log("📝 Criando nota:", {
      disciplina_id,
      titulo: titulo?.substring(0, 50),
    });
    if (!disciplina_id) {
      return NextResponse.json(
        { error: "disciplina_id é obrigatório" },
        { status: 400 }
      );
    }
    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: "título é obrigatório" },
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
      .insert({
        user_id: user.id,
        disciplina_id,
        titulo: titulo.trim(),
        content_md: content_md || "",
      })
      .select("id, disciplina_id, titulo, content_md, created_at, updated_at")
      .single();

    if (error) {
      console.error("Erro ao criar nota:", error);
      console.error("Detalhes do erro:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // Se o erro for relacionado ao campo titulo não existir
      if (
        error.message?.includes("titulo") ||
        error.message?.includes("column") ||
        error.code === "42703" ||
        error.details?.includes("titulo")
      ) {
        return NextResponse.json(
          {
            error:
              "Campo 'titulo' não encontrado na tabela. Execute a migração SQL para adicionar o campo.",
            details: error.message,
            hint: "Execute o arquivo supabase/migrations/add_titulo_to_notas.sql no Supabase SQL Editor",
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao criar nota",
          details: error.message || "Erro desconhecido",
          code: error.code,
        },
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
        `Anotação criada: ${titulo}`,
        data.id
      );
      if (resultadoXP.success && resultadoXP.conquistasDesbloqueadas) {
        conquistasDesbloqueadas.push(...resultadoXP.conquistasDesbloqueadas);
      }
    } catch (gamError) {
      console.error("Erro ao processar gamificação:", gamError);
    }

    const nota = {
      id: data.id,
      disciplinaId: data.disciplina_id,
      titulo: data.titulo,
      content_md: data.content_md || "",
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      nota,
      conquistasDesbloqueadas,
    });
  } catch (error: any) {
    console.error("Erro na API de notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
