import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

// GET - Listar comentários de uma atividade
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

    const { data: comments, error } = await supabase
      .from("activity_comments")
      .select("*")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true });

    if (error) {
      // Se a tabela não existir, retornar array vazio
      if (error.code === "42P01") {
        return NextResponse.json({ comments: [] });
      }
      console.error("Erro ao buscar comentários:", error);
      return NextResponse.json(
        { error: "Erro ao buscar comentários" },
        { status: 500 }
      );
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ comments: [] });
    }

    // Buscar dados dos usuários
    const adminClient = createSupabaseAdmin();
    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    const userDataMap: Record<string, any> = {};

    await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            userId
          );
          if (userData?.user) {
            userDataMap[userId] = {
              id: userData.user.id,
              nome:
                userData.user.user_metadata?.nome ||
                userData.user.user_metadata?.full_name ||
                "Usuário",
              avatar_url: userData.user.user_metadata?.avatar_url || "",
            };
          }
        } catch (err) {
          console.error(`Erro ao buscar usuário ${userId}:`, err);
          userDataMap[userId] = {
            id: userId,
            nome: "Usuário",
            avatar_url: "",
          };
        }
      })
    );

    // Formatar comentários
    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      activity_id: comment.activity_id,
      comentario: comment.comentario,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: userDataMap[comment.user_id] || {
        id: comment.user_id,
        nome: "Usuário",
        avatar_url: "",
      },
      is_owner: comment.user_id === user.id,
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error: any) {
    console.error("Erro na API de comentários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar comentário
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
    const { activity_id, comentario } = body;

    if (!activity_id || !comentario || comentario.trim().length === 0) {
      return NextResponse.json(
        { error: "activity_id e comentario são obrigatórios" },
        { status: 400 }
      );
    }

    if (comentario.length > 1000) {
      return NextResponse.json(
        { error: "Comentário deve ter no máximo 1000 caracteres" },
        { status: 400 }
      );
    }

    const { data: comment, error: insertError } = await supabase
      .from("activity_comments")
      .insert({
        activity_id,
        user_id: user.id,
        comentario: comentario.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao criar comentário:", insertError);

      if (insertError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Tabela 'activity_comments' não encontrada. Execute o SQL de criação no Supabase.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Erro ao criar comentário", details: insertError.message },
        { status: 500 }
      );
    }

    // Buscar dados do usuário
    const adminClient = createSupabaseAdmin();
    let userData = {
      id: user.id,
      nome:
        user.user_metadata?.nome || user.user_metadata?.full_name || "Usuário",
      avatar_url: user.user_metadata?.avatar_url || "",
    };

    try {
      const { data: userDataResult } = await adminClient.auth.admin.getUserById(
        user.id
      );
      if (userDataResult?.user) {
        userData = {
          id: userDataResult.user.id,
          nome:
            userDataResult.user.user_metadata?.nome ||
            userDataResult.user.user_metadata?.full_name ||
            "Usuário",
          avatar_url: userDataResult.user.user_metadata?.avatar_url || "",
        };
      }
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        user: userData,
        is_owner: true,
      },
    });
  } catch (error: any) {
    console.error("Erro na API de comentários (POST):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar comentário
export async function DELETE(request: NextRequest) {
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
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json(
        { error: "id do comentário é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o comentário pertence ao usuário
    const { data: comment, error: fetchError } = await supabase
      .from("activity_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar este comentário" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("activity_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Erro ao deletar comentário:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar comentário" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de comentários (DELETE):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
