import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "Você não pode seguir a si mesmo" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Você já está seguindo este usuário" },
        { status: 400 }
      );
    }

    try {
      const adminClient = createSupabaseAdmin();
      const { data: targetUser } = await adminClient.auth.admin.getUserById(
        userId
      );

      if (!targetUser?.user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return NextResponse.json(
        { error: "Erro ao verificar usuário" },
        { status: 500 }
      );
    }

    const { error: followError } = await supabase.from("followers").insert({
      follower_id: user.id,
      following_id: userId,
    });

    if (followError) {
      console.error("Erro ao seguir usuário:", followError);
      return NextResponse.json(
        { error: "Erro ao seguir usuário" },
        { status: 500 }
      );
    }

    const followerNome =
      user.user_metadata?.nome || user.user_metadata?.full_name || user.email || "Alguém";
    try {
      await supabase.from("notification_history").insert({
        user_id: userId,
        tipo: "novo_seguidor",
        titulo: `${followerNome} começou a seguir você!`,
        descricao: "Veja o perfil de quem está seguindo você.",
        referencia_id: user.id,
        referencia_tipo: "perfil",
        metadata: {
          follower_id: user.id,
          follower_nome: followerNome,
        },
      });
    } catch (notifErr) {
      console.warn("Erro ao criar notificação de novo seguidor:", notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de seguir:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const { error: unfollowError } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", userId);

    if (unfollowError) {
      console.error("Erro ao deixar de seguir:", unfollowError);
      return NextResponse.json(
        { error: "Erro ao deixar de seguir" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de deixar de seguir:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

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
    const userId = searchParams.get("userId") || user.id;
    const type = searchParams.get("type") || "following"; // 'following' ou 'followers'

    let query;
    if (type === "followers") {
      query = supabase
        .from("followers")
        .select(
          "follower_id, created_at, follower:auth.users!followers_follower_id_fkey(id, email, user_metadata)"
        )
        .eq("following_id", userId);
    } else {
      query = supabase
        .from("followers")
        .select(
          "following_id, created_at, following:auth.users!followers_following_id_fkey(id, email, user_metadata)"
        )
        .eq("follower_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar seguidores:", error);
      return NextResponse.json(
        { error: "Erro ao buscar seguidores" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("Erro na API de seguidores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
