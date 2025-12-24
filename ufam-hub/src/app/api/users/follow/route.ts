import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

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

    // Verificar se já está seguindo
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

    // Verificar se o usuário existe e tem perfil público
    let perfilPublico = false;
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

      perfilPublico = targetUser.user.user_metadata?.perfil_publico || false;
      if (!perfilPublico) {
        return NextResponse.json(
          { error: "Este usuário não tem perfil público" },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return NextResponse.json(
        { error: "Erro ao verificar usuário" },
        { status: 500 }
      );
    }

    // Seguir usuário
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
    const supabase = await createSupabaseServer();
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

    // Deixar de seguir
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
    const supabase = await createSupabaseServer();
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
      // Quem segue este usuário
      query = supabase
        .from("followers")
        .select(
          "follower_id, created_at, follower:auth.users!followers_follower_id_fkey(id, email, user_metadata)"
        )
        .eq("following_id", userId);
    } else {
      // Quem este usuário segue
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
