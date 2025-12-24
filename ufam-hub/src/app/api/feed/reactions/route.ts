import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// GET - Listar reações de uma atividade
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
    const activityId = searchParams.get("activity_id");

    if (!activityId) {
      return NextResponse.json(
        { error: "activity_id é obrigatório" },
        { status: 400 }
      );
    }

    const { data: reactions, error } = await supabase
      .from("activity_reactions")
      .select("*")
      .eq("activity_id", activityId);

    if (error) {
      // Se a tabela não existir, retornar estrutura vazia
      if (error.code === "42P01") {
        return NextResponse.json({
          reactions: { like: 0, util: 0, inspirador: 0 },
          user_reactions: [],
        });
      }
      console.error("Erro ao buscar reações:", error);
      return NextResponse.json(
        { error: "Erro ao buscar reações" },
        { status: 500 }
      );
    }

    // Contar reações por tipo
    const reactionsCount = {
      like: 0,
      util: 0,
      inspirador: 0,
    };

    const userReactions: string[] = [];

    if (reactions) {
      reactions.forEach((reaction: any) => {
        if (reaction.tipo in reactionsCount) {
          reactionsCount[reaction.tipo as keyof typeof reactionsCount]++;
        }
        if (reaction.user_id === user.id) {
          userReactions.push(reaction.tipo);
        }
      });
    }

    return NextResponse.json({
      reactions: reactionsCount,
      user_reactions: userReactions,
    });
  } catch (error: any) {
    console.error("Erro na API de reações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Adicionar/remover reação
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
    const { activity_id, tipo, action } = body;

    if (!activity_id || !tipo) {
      return NextResponse.json(
        { error: "activity_id e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["like", "util", "inspirador"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de reação inválido" },
        { status: 400 }
      );
    }

    if (action === "remove") {
      // Remover reação
      const { error: deleteError } = await supabase
        .from("activity_reactions")
        .delete()
        .eq("activity_id", activity_id)
        .eq("user_id", user.id)
        .eq("tipo", tipo);

      if (deleteError) {
        console.error("Erro ao remover reação:", deleteError);
        if (deleteError.code === "42P01") {
          return NextResponse.json(
            {
              error:
                "Tabela 'activity_reactions' não encontrada. Execute o SQL de criação no Supabase.",
            },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "Erro ao remover reação" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "removed" });
    } else {
      // Adicionar reação (usar upsert para evitar duplicatas)
      const { error: insertError } = await supabase
        .from("activity_reactions")
        .upsert(
          {
            activity_id,
            user_id: user.id,
            tipo,
          },
          {
            onConflict: "activity_id,user_id,tipo",
          }
        );

      if (insertError) {
        console.error("Erro ao adicionar reação:", insertError);
        if (insertError.code === "42P01") {
          return NextResponse.json(
            {
              error:
                "Tabela 'activity_reactions' não encontrada. Execute o SQL de criação no Supabase.",
            },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "Erro ao adicionar reação" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "added" });
    }
  } catch (error: any) {
    console.error("Erro na API de reações (POST):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
