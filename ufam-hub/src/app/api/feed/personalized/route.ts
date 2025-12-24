import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

// GET - Feed personalizado baseado em interesses
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

    // 1. Buscar disciplinas que o usuário segue/está inscrito
    const { data: userDisciplinas } = await supabase
      .from("disciplinas")
      .select("id")
      .eq("user_id", user.id);

    const userDisciplinaIds = userDisciplinas?.map((d) => d.id) || [];

    // 2. Buscar usuários que o usuário segue
    const { data: followingData } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = followingData?.map((f) => f.following_id) || [];

    // 3. Buscar atividades com priorização:
    //    - Atividades de usuários seguidos
    //    - Atividades relacionadas às disciplinas do usuário
    //    - Atividades públicas recentes

    let query = supabase
      .from("user_activities")
      .select("*")
      .eq("visibilidade", "public")
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Buscar mais para poder ordenar

    const { data: allActivities, error } = await query;

    if (error) {
      console.error("Erro ao buscar atividades:", error);
      if (error.code === "42P01") {
        return NextResponse.json({ activities: [] });
      }
      return NextResponse.json(
        { error: "Erro ao buscar feed personalizado" },
        { status: 500 }
      );
    }

    if (!allActivities || allActivities.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // 4. Calcular score de relevância para cada atividade
    const activitiesWithScore = allActivities.map((activity: any) => {
      let score = 0;

      // Priorizar atividades de usuários seguidos
      if (followingIds.includes(activity.user_id)) {
        score += 100;
      }

      // Priorizar atividades relacionadas às disciplinas do usuário
      if (
        activity.referencia_tipo === "disciplina" &&
        userDisciplinaIds.includes(activity.referencia_id)
      ) {
        score += 50;
      }

      // Priorizar tipos de atividade mais relevantes
      const tipoScores: Record<string, number> = {
        nota_criada: 30,
        avaliacao_adicionada: 25,
        pomodoro_completo: 20,
        disciplina_criada: 15,
        post_personalizado: 10,
      };
      score += tipoScores[activity.tipo] || 5;

      // Priorizar atividades mais recentes (decai com o tempo)
      const daysSince = Math.floor(
        (Date.now() - new Date(activity.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      score += Math.max(0, 20 - daysSince * 2);

      return { ...activity, score };
    });

    // 5. Ordenar por score e pegar apenas o limite necessário
    const sortedActivities = activitiesWithScore
      .sort((a, b) => b.score - a.score)
      .slice(offset, offset + limit);

    // 6. Buscar dados dos usuários
    const adminClient = createSupabaseAdmin();
    const userIds = [...new Set(sortedActivities.map((a: any) => a.user_id))];
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

    // 7. Buscar informações de disciplinas
    const disciplinaIds = [
      ...new Set(
        sortedActivities
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

    // 8. Formatar atividades
    const formattedActivities = sortedActivities.map((activity: any) => {
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
        score: activity.score, // Incluir score para debug (opcional)
        user: userDataMap[activity.user_id] || {
          id: activity.user_id,
          nome: "Usuário",
          avatar_url: "",
        },
      };
    });

    return NextResponse.json({
      activities: formattedActivities,
      has_more: sortedActivities.length === limit,
    });
  } catch (error: any) {
    console.error("Erro na API de feed personalizado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
