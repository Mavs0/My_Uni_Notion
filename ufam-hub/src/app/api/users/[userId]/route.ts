import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar dados do usuário
    let user;
    try {
      const adminClient = createSupabaseAdmin();
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(userId);

      if (userError || !userData?.user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      user = userData.user;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return NextResponse.json(
        { error: "Erro ao buscar usuário" },
        { status: 500 }
      );
    }
    const perfilPublico = user.user_metadata?.perfil_publico || false;

    // Se não for público e não for o próprio usuário, retornar erro
    if (!perfilPublico && (!currentUser || currentUser.id !== userId)) {
      return NextResponse.json({ error: "Perfil privado" }, { status: 403 });
    }

    // Buscar estatísticas públicas
    const [disciplinasResult, followersResult, followingResult] =
      await Promise.all([
        supabase
          .from("disciplinas")
          .select("id", { count: "exact" })
          .eq("user_id", userId),
        supabase
          .from("followers")
          .select("id", { count: "exact" })
          .eq("following_id", userId),
        supabase
          .from("followers")
          .select("id", { count: "exact" })
          .eq("follower_id", userId),
      ]);

    // Verificar se o usuário atual está seguindo este usuário
    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
      const { data: followCheck } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId)
        .single();
      isFollowing = !!followCheck;
    }

    const profile = {
      id: user.id,
      email: perfilPublico ? user.email : undefined,
      nome: user.user_metadata?.nome || user.user_metadata?.full_name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      bio: user.user_metadata?.bio || "",
      curso: user.user_metadata?.curso || "",
      periodo: user.user_metadata?.periodo || "",
      perfil_publico: perfilPublico,
      created_at: user.created_at,
      stats: {
        totalDisciplinas: disciplinasResult.count || 0,
        totalSeguidores: followersResult.count || 0,
        totalSeguindo: followingResult.count || 0,
      },
      isFollowing,
      isOwnProfile: currentUser?.id === userId,
    };

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Erro ao buscar perfil público:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
