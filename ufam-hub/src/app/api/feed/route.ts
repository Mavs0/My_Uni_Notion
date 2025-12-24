import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type") || "all"; // 'all', 'following', 'public'

    let query = supabase
      .from("user_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type === "following") {
      // Apenas atividades de usuários que o usuário segue
      const { data: followingData } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map((f) => f.following_id);
        query = query.in("user_id", followingIds);
      } else {
        // Não segue ninguém, retornar array vazio
        return NextResponse.json({ activities: [] });
      }
    } else if (type === "public") {
      // Apenas atividades públicas
      query = query.eq("visibilidade", "public");
    }
    // 'all' mostra tudo que o usuário tem permissão para ver (via RLS)

    const { data: activities, error } = await query;

    if (error) {
      console.error("Erro ao buscar feed:", error);
      // Se a tabela não existir, retornar array vazio ao invés de erro
      if (error.code === "42P01") {
        return NextResponse.json({ activities: [] });
      }
      return NextResponse.json(
        { error: "Erro ao buscar feed" },
        { status: 500 }
      );
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // Buscar dados dos usuários usando admin client
    const adminClient = createSupabaseAdmin();
    const userIds = [...new Set(activities.map((a: any) => a.user_id))];
    const userDataMap: Record<string, any> = {};

    // Buscar dados de cada usuário
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

    // Buscar informações de disciplinas quando houver referencia_id
    const disciplinaIds = [
      ...new Set(
        activities
          .filter(
            (a: any) => a.referencia_tipo === "disciplina" && a.referencia_id
          )
          .map((a: any) => a.referencia_id)
      ),
    ];
    const disciplinaMap: Record<string, any> = {};

    if (disciplinaIds.length > 0) {
      const { data: disciplinasData } = await supabase
        .from("disciplinas")
        .select("id, nome, cor")
        .in("id", disciplinaIds);

      if (disciplinasData) {
        disciplinasData.forEach((disc: any) => {
          disciplinaMap[disc.id] = {
            nome: disc.nome,
            cor: disc.cor || "#6366f1",
          };
        });
      }
    }

    // Formatar atividades
    const formattedActivities = activities.map((activity: any) => {
      const disciplinaInfo =
        activity.referencia_tipo === "disciplina" && activity.referencia_id
          ? disciplinaMap[activity.referencia_id]
          : null;

      return {
        id: activity.id,
        tipo: activity.tipo,
        titulo: activity.titulo,
        descricao: activity.descricao,
        referencia_id: activity.referencia_id,
        referencia_tipo: activity.referencia_tipo,
        created_at: activity.created_at,
        disciplina_id: activity.disciplina_id || activity.referencia_id,
        disciplina_nome: disciplinaInfo?.nome,
        disciplina_cor: disciplinaInfo?.cor,
        user: userDataMap[activity.user_id] || {
          id: activity.user_id,
          nome: "Usuário",
          avatar_url: "",
        },
      };
    });

    return NextResponse.json({ activities: formattedActivities });
  } catch (error: any) {
    console.error("Erro na API de feed:", error);
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
      tipo,
      visibilidade,
      referencia_id,
      referencia_tipo,
      imagem_url,
      link_url,
    } = body;

    // Validação
    if (!titulo || titulo.trim().length === 0) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (titulo.length > 200) {
      return NextResponse.json(
        { error: "Título deve ter no máximo 200 caracteres" },
        { status: 400 }
      );
    }

    if (descricao && descricao.length > 1000) {
      return NextResponse.json(
        { error: "Descrição deve ter no máximo 1000 caracteres" },
        { status: 400 }
      );
    }

    // Validar URL do link se fornecido
    if (link_url && link_url.trim()) {
      try {
        const url = new URL(link_url.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return NextResponse.json(
            { error: "URL inválida. Use http:// ou https://" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json({ error: "URL inválida" }, { status: 400 });
      }
    }

    // Verificar se a tabela existe primeiro
    const { error: tableCheckError } = await supabase
      .from("user_activities")
      .select("id")
      .limit(1);

    if (tableCheckError && tableCheckError.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "Tabela 'user_activities' não encontrada. Execute o SQL de criação da tabela no Supabase.",
          details:
            "Execute o arquivo sql/create_user_activities.sql no SQL Editor do Supabase para criar a tabela.",
        },
        { status: 500 }
      );
    }

    // Inserir atividade
    const { data: activity, error: insertError } = await supabase
      .from("user_activities")
      .insert({
        user_id: user.id,
        tipo: tipo || "post_personalizado",
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        visibilidade: visibilidade || "public",
        referencia_id: referencia_id || null,
        referencia_tipo: referencia_tipo || null,
        imagem_url: imagem_url?.trim() || null,
        link_url: link_url?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao criar atividade:", insertError);
      console.error("Detalhes do erro:", JSON.stringify(insertError, null, 2));

      // Se a tabela não existir, retornar erro informativo
      if (insertError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Tabela de atividades não encontrada. Execute as migrações do banco de dados.",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      // Erro de permissão (RLS)
      if (
        insertError.code === "42501" ||
        insertError.message?.includes("permission")
      ) {
        return NextResponse.json(
          {
            error:
              "Você não tem permissão para criar atividades. Verifique as políticas RLS.",
            details: insertError.message,
          },
          { status: 403 }
        );
      }

      // Erro de coluna não encontrada ou tipo incorreto
      if (insertError.code === "42703" || insertError.code === "42804") {
        return NextResponse.json(
          {
            error:
              "Erro na estrutura da tabela. Verifique se todas as colunas existem.",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      // Erro de constraint (valores inválidos)
      if (insertError.code === "23514" || insertError.code === "23505") {
        let errorMessage = "Dados inválidos. Verifique os valores informados.";

        // Se for erro de constraint do tipo, dar mensagem mais específica
        if (insertError.message?.includes("tipo_check")) {
          errorMessage =
            "Tipo de atividade inválido. Execute o SQL sql/fix_user_activities_tipo.sql no Supabase para atualizar a constraint.";
        }

        return NextResponse.json(
          {
            error: errorMessage,
            details: insertError.message,
            code: insertError.code,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao criar atividade",
          details: insertError.message || JSON.stringify(insertError),
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de feed (POST):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Editar atividade
export async function PUT(request: NextRequest) {
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
    const { id, titulo, descricao, visibilidade } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id da atividade é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a atividade pertence ao usuário
    const { data: activity, error: fetchError } = await supabase
      .from("user_activities")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    if (activity.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar esta atividade" },
        { status: 403 }
      );
    }

    // Validação
    const updateData: any = { updated_at: new Date().toISOString() };

    if (titulo !== undefined) {
      if (!titulo || titulo.trim().length === 0) {
        return NextResponse.json(
          { error: "Título não pode ser vazio" },
          { status: 400 }
        );
      }
      if (titulo.length > 200) {
        return NextResponse.json(
          { error: "Título deve ter no máximo 200 caracteres" },
          { status: 400 }
        );
      }
      updateData.titulo = titulo.trim();
    }

    if (descricao !== undefined) {
      if (descricao && descricao.length > 1000) {
        return NextResponse.json(
          { error: "Descrição deve ter no máximo 1000 caracteres" },
          { status: 400 }
        );
      }
      updateData.descricao = descricao?.trim() || null;
    }

    if (visibilidade !== undefined) {
      if (!["public", "private"].includes(visibilidade)) {
        return NextResponse.json(
          { error: "Visibilidade deve ser 'public' ou 'private'" },
          { status: 400 }
        );
      }
      updateData.visibilidade = visibilidade;
    }

    const { data: updatedActivity, error: updateError } = await supabase
      .from("user_activities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao atualizar atividade:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar atividade", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity: updatedActivity });
  } catch (error: any) {
    console.error("Erro na API de feed (PUT):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar atividade
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
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json(
        { error: "id da atividade é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a atividade pertence ao usuário
    const { data: activity, error: fetchError } = await supabase
      .from("user_activities")
      .select("user_id")
      .eq("id", activityId)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    if (activity.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar esta atividade" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("user_activities")
      .delete()
      .eq("id", activityId);

    if (deleteError) {
      console.error("Erro ao deletar atividade:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar atividade" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de feed (DELETE):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
