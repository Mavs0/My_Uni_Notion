import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get("disciplina_id");
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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
      console.error(
        "Detalhes completos do erro:",
        JSON.stringify(error, null, 2)
      );

      if (error.code === "42P01") {
        return NextResponse.json(
          {
            error: "Tabela 'notas' não encontrada",
            details:
              "Execute o SQL de criação da tabela no Supabase SQL Editor",
            code: error.code,
          },
          { status: 500 }
        );
      }

      if (error.code === "42703" || error.message?.includes("column")) {
        return NextResponse.json(
          {
            error: "Campo não encontrado na tabela 'notas'",
            details: error.message,
            hint: "Verifique se a tabela tem os campos: id, disciplina_id, titulo, content_md, created_at, updated_at, user_id",
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao buscar notas",
          details: error.message || "Erro desconhecido",
          code: error.code,
        },
        { status: 500 }
      );
    }

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
    console.error("Erro na API de notas (GET):", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message || "Erro desconhecido",
        type: error.name || "Error",
      },
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
    const supabase = await createSupabaseServer(request);
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

      if (error.code === "23505" || error.message?.includes("duplicate key")) {
        return NextResponse.json(
          {
            error: "Erro ao criar nota: constraint única violada",
            details: error.message,
            hint: "Existe uma constraint única no banco que impede múltiplas notas por disciplina. Execute o arquivo sql/fix_notas_unique_constraint.sql no Supabase SQL Editor para remover essa constraint.",
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
    });
  } catch (error: any) {
    console.error("Erro na API de notas (POST):", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message || "Erro desconhecido",
        type: error.name || "Error",
      },
      { status: 500 }
    );
  }
}
