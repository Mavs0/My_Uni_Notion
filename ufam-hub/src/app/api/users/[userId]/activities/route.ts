import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: profileUserId } = await params;

    const supabase = await createSupabaseServer(request);
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!profileUserId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "30"),
      50
    );

    const items: Array<{
      tipo: "activity" | "comment" | "reaction";
      id: string;
      created_at: string;
      data: Record<string, unknown>;
    }> = [];

    const isOwnProfile = currentUser.id === profileUserId;

    let activitiesQuery = supabase
      .from("user_activities")
      .select("id, tipo, titulo, descricao, created_at, imagem_url, link_url, referencia_id, referencia_tipo, disciplina_id")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!isOwnProfile) {
      activitiesQuery = activitiesQuery.eq("visibilidade", "public");
    }

    const { data: activities, error: activitiesError } = await activitiesQuery;

    if (!activitiesError && activities) {
      const adminClient = createSupabaseAdmin();
      const { data: profileUser } = await adminClient.auth.admin.getUserById(
        profileUserId
      );
      const userInfo = profileUser?.user
        ? {
            id: profileUser.user.id,
            nome:
              profileUser.user.user_metadata?.nome ||
              profileUser.user.user_metadata?.full_name ||
              "Usuário",
            avatar_url:
              profileUser.user.user_metadata?.avatar_url || "",
          }
        : { id: profileUserId, nome: "Usuário", avatar_url: "" };

      const disciplinaIds = [
        ...new Set(
          activities
            .filter(
              (a: any) =>
                (a.referencia_tipo === "disciplina" && a.referencia_id) ||
                a.disciplina_id
            )
            .map((a: any) => a.referencia_id || a.disciplina_id)
        ),
      ].filter(Boolean);

      let disciplinaMap: Record<string, { nome: string; cor?: string }> = {};
      if (disciplinaIds.length > 0) {
        const { data: disciplinas } = await supabase
          .from("disciplinas")
          .select("id, nome, cor")
          .in("id", disciplinaIds);
        disciplinas?.forEach((d: any) => {
          disciplinaMap[d.id] = { nome: d.nome, cor: d.cor };
        });
      }

      activities.forEach((a: any) => {
        const disc =
          (a.referencia_id || a.disciplina_id) &&
          disciplinaMap[a.referencia_id || a.disciplina_id];
        items.push({
          tipo: "activity",
          id: a.id,
          created_at: a.created_at,
          data: {
            ...a,
            user: userInfo,
            disciplina_nome: disc?.nome,
            disciplina_cor: disc?.cor,
          },
        });
      });
    }

    const { data: comments, error: commentsError } = await supabase
      .from("activity_comments")
      .select("id, activity_id, comentario, created_at")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!commentsError && comments && comments.length > 0) {
      const activityIds = [...new Set(comments.map((c: any) => c.activity_id))];
      const { data: activitiesData } = await supabase
        .from("user_activities")
        .select("id, titulo, user_id")
        .in("id", activityIds);

      const activityMap: Record<string, any> = {};
      activitiesData?.forEach((a: any) => {
        activityMap[a.id] = a;
      });

      const ownerIds = [...new Set((activitiesData || []).map((a: any) => a.user_id))];
      const adminClient = createSupabaseAdmin();
      const ownerMap: Record<string, any> = {};
      await Promise.all(
        ownerIds.map(async (uid: string) => {
          try {
            const { data } = await adminClient.auth.admin.getUserById(uid);
            if (data?.user) {
              ownerMap[uid] = {
                id: data.user.id,
                nome:
                  data.user.user_metadata?.nome ||
                  data.user.user_metadata?.full_name ||
                  "Usuário",
              };
            }
          } catch {
            ownerMap[uid] = { id: uid, nome: "Usuário" };
          }
        })
      );

      const { data: profileUser } = await adminClient.auth.admin.getUserById(
        profileUserId
      );
      const commenterInfo = profileUser?.user
        ? {
            id: profileUser.user.id,
            nome:
              profileUser.user.user_metadata?.nome ||
              profileUser.user.user_metadata?.full_name ||
              "Usuário",
            avatar_url:
              profileUser.user.user_metadata?.avatar_url || "",
          }
        : { id: profileUserId, nome: "Usuário", avatar_url: "" };

      comments.forEach((c: any) => {
        const act = activityMap[c.activity_id];
        if (act && act.user_id !== profileUserId) {
          items.push({
            tipo: "comment",
            id: `comment-${c.id}`,
            created_at: c.created_at,
            data: {
              comment_id: c.id,
              activity_id: c.activity_id,
              comentario: c.comentario,
              activity_titulo: act.titulo,
              activity_owner: ownerMap[act.user_id] || { id: act.user_id, nome: "Usuário" },
              user: commenterInfo,
            },
          });
        }
      });
    }

    const { data: reactions, error: reactionsError } = await supabase
      .from("activity_reactions")
      .select("id, activity_id, tipo, created_at")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!reactionsError && reactions && reactions.length > 0) {
      const activityIds = [...new Set(reactions.map((r: any) => r.activity_id))];
      const { data: activitiesData } = await supabase
        .from("user_activities")
        .select("id, titulo, user_id")
        .in("id", activityIds);

      const activityMap: Record<string, any> = {};
      activitiesData?.forEach((a: any) => {
        activityMap[a.id] = a;
      });

      const ownerIds = [...new Set((activitiesData || []).map((a: any) => a.user_id))];
      const adminClient = createSupabaseAdmin();
      const ownerMap: Record<string, any> = {};
      await Promise.all(
        ownerIds.map(async (uid: string) => {
          try {
            const { data } = await adminClient.auth.admin.getUserById(uid);
            if (data?.user) {
              ownerMap[uid] = {
                id: data.user.id,
                nome:
                  data.user.user_metadata?.nome ||
                  data.user.user_metadata?.full_name ||
                  "Usuário",
              };
            }
          } catch {
            ownerMap[uid] = { id: uid, nome: "Usuário" };
          }
        })
      );

      const { data: profileUser } = await adminClient.auth.admin.getUserById(
        profileUserId
      );
      const reactorInfo = profileUser?.user
        ? {
            id: profileUser.user.id,
            nome:
              profileUser.user.user_metadata?.nome ||
              profileUser.user.user_metadata?.full_name ||
              "Usuário",
            avatar_url:
              profileUser.user.user_metadata?.avatar_url || "",
          }
        : { id: profileUserId, nome: "Usuário", avatar_url: "" };

      const tipoLabel: Record<string, string> = {
        like: "curtiu",
        util: "achou útil",
        inspirador: "achou inspirador",
      };

      reactions.forEach((r: any) => {
        const act = activityMap[r.activity_id];
        if (act && act.user_id !== profileUserId) {
          items.push({
            tipo: "reaction",
            id: `reaction-${r.id}`,
            created_at: r.created_at,
            data: {
              reaction_id: r.id,
              activity_id: r.activity_id,
              reaction_tipo: r.tipo,
              reaction_label: tipoLabel[r.tipo] || r.tipo,
              activity_titulo: act.titulo,
              activity_owner: ownerMap[act.user_id] || { id: act.user_id, nome: "Usuário" },
              user: reactorInfo,
            },
          });
        }
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const paginated = items.slice(0, limit);

    return NextResponse.json({ items: paginated });
  } catch (error: any) {
    console.error("Erro ao buscar atividades do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
