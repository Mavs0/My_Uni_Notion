import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 50);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
    const search = searchParams.get("search") || "";
    const curso = searchParams.get("curso") || "";
    const periodo = searchParams.get("periodo") || "";
    const tipoPerfil = (searchParams.get("tipo_perfil") || "").trim();
    const campus = (searchParams.get("campus") || "").trim();
    const sort = searchParams.get("sort") || "seguidores"; // seguidores | nome | recent

    const allUserIds = new Set<string>();

    const { data: activities, error: activitiesError } = await supabase
      .from("user_activities")
      .select("user_id")
      .neq("user_id", user.id)
      .limit(500);

    if (!activitiesError && activities) {
      activities.forEach((activity) => {
        if (activity.user_id) allUserIds.add(activity.user_id);
      });
    }

    const { data: followers, error: followersError } = await supabase
      .from("followers")
      .select("following_id, follower_id")
      .limit(500);

    if (!followersError && followers) {
      followers.forEach((f) => {
        if (f.following_id && f.following_id !== user.id) {
          allUserIds.add(f.following_id);
        }
        if (f.follower_id && f.follower_id !== user.id) {
          allUserIds.add(f.follower_id);
        }
      });
    }

    const { data: disciplinas } = await supabase
      .from("disciplinas")
      .select("user_id")
      .neq("user_id", user.id)
      .limit(200);

    if (disciplinas) {
      disciplinas.forEach((d: { user_id?: string }) => {
        if (d.user_id) allUserIds.add(d.user_id);
      });
    }

    let userIdsToProcess = Array.from(allUserIds).slice(0, limit + 50);

    let adminClient;
    try {
      adminClient = createSupabaseAdmin();
    } catch (adminErr: any) {
      console.error("createSupabaseAdmin falhou:", adminErr?.message || adminErr);
      return NextResponse.json(
        {
          error:
            adminErr?.message?.includes("SERVICE_ROLE")
              ? "Serviço não configurado. Configure SUPABASE_SERVICE_ROLE_KEY."
              : "Erro ao conectar ao banco.",
        },
        { status: 503 }
      );
    }

    if (userIdsToProcess.length === 0) {
      const { data: listData } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });
      const others = (listData?.users || []).filter((u) => u.id !== user.id);
      userIdsToProcess = others.map((u) => u.id).slice(0, limit + 50);
    }

    if (userIdsToProcess.length === 0) {
      return NextResponse.json({ users: [], total: 0 });
    }

    const usersArray: any[] = [];

    for (const userId of userIdsToProcess.slice(0, limit + 20)) {
      try {
        const { data: userData, error: userError } =
          await adminClient.auth.admin.getUserById(userId);

        if (userError || !userData?.user) continue;

        const userMetadata = userData.user.user_metadata || {};

        const nome =
          userMetadata.nome ||
          userMetadata.full_name ||
          userData.user.email?.split("@")[0] ||
          "Usuário";

        const emailLocal = userData.user.email?.split("@")[0] || "";
        const username =
          (typeof userMetadata.username === "string" &&
            userMetadata.username.trim()) ||
          emailLocal.replace(/[^a-zA-Z0-9_.]/g, "") ||
          "usuario";

        const metaTipo = String(userMetadata.tipo_perfil || "").toLowerCase();
        const metaCampus = String(userMetadata.campus || "").toLowerCase();

        if (tipoPerfil) {
          const f = tipoPerfil.toLowerCase();
          if (f === "outro") {
            if (["estudante", "professor", "servidor"].includes(metaTipo)) {
              continue;
            }
          } else if (metaTipo !== f) {
            continue;
          }
        }

        if (
          campus &&
          !metaCampus.includes(campus.toLowerCase())
        ) {
          continue;
        }

        const searchL = search.toLowerCase();
        if (
          search &&
          !nome.toLowerCase().includes(searchL) &&
          !username.toLowerCase().includes(searchL) &&
          !String(userMetadata.curso || "")
            .toLowerCase()
            .includes(searchL) &&
          !String(userMetadata.bio || "")
            .toLowerCase()
            .includes(searchL) &&
          !emailLocal.toLowerCase().includes(searchL)
        ) {
          continue;
        }

        if (
          curso &&
          !String(userMetadata.curso || "")
            .toLowerCase()
            .includes(curso.toLowerCase())
        ) {
          continue;
        }

        if (
          periodo &&
          String(userMetadata.periodo ?? "").toString() !== periodo.toString()
        ) {
          continue;
        }

        let tags: string[] = [];
        if (Array.isArray(userMetadata.interesses)) {
          tags = userMetadata.interesses
            .map((x: unknown) => String(x).trim())
            .filter(Boolean)
            .slice(0, 6);
        } else if (typeof userMetadata.interesses === "string") {
          tags = userMetadata.interesses
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 6);
        }

        usersArray.push({
          id: userData.user.id,
          email: userData.user.email,
          nome: nome,
          username,
          avatar_url: userMetadata.avatar_url || "",
          bio: userMetadata.bio || "",
          curso: userMetadata.curso || "",
          periodo: userMetadata.periodo || "",
          tipo_perfil: userMetadata.tipo_perfil || "",
          campus: userMetadata.campus || "",
          tags,
          created_at: userData.user.created_at || "",
        });

        if (usersArray.length >= 200) break;
      } catch (error) {
        console.error(`Erro ao buscar usuário ${userId}:`, error);
        continue;
      }
    }

    for (const userProfile of usersArray) {
      const [followersResult, followingResult, isFollowingResult] =
        await Promise.all([
          supabase
            .from("followers")
            .select("id", { count: "exact" })
            .eq("following_id", userProfile.id),
          supabase
            .from("followers")
            .select("id", { count: "exact" })
            .eq("follower_id", userProfile.id),
          supabase
            .from("followers")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", userProfile.id)
            .single(),
        ]);

      userProfile.stats = {
        totalSeguidores: followersResult.count || 0,
        totalSeguindo: followingResult.count || 0,
      };
      userProfile.isFollowing = !!isFollowingResult.data;
    }

    const total = usersArray.length;
    if (sort === "nome") {
      usersArray.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR")
      );
    } else if (sort === "recent") {
      usersArray.reverse();
    } else {
      usersArray.sort(
        (a, b) =>
          (b.stats?.totalSeguidores || 0) - (a.stats?.totalSeguidores || 0)
      );
    }

    const paginatedUsers = usersArray.slice(offset, offset + limit);

    return NextResponse.json({
      users: paginatedUsers,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error);
    const message =
      error?.message || error?.error_description || "Erro interno do servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
