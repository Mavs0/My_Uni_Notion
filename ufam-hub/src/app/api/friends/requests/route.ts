import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

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
        { error: "Você não pode enviar solicitação para si mesmo" },
        { status: 400 }
      );
    }

    let targetUser;
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

      targetUser = userData.user;
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return NextResponse.json(
        { error: "Erro ao verificar usuário" },
        { status: 500 }
      );
    }

    const { data: existingRequest } = await supabase
      .from("friend_requests")
      .select("id, status")
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .in("status", ["pending", "accepted"])
      .single();

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "Já existe uma solicitação pendente" },
          { status: 400 }
        );
      }
      if (existingRequest.status === "accepted") {
        return NextResponse.json(
          { error: "Vocês já são amigos" },
          { status: 400 }
        );
      }
    }

    const { data: existingFollow } = await supabase
      .from("followers")
      .select("id")
      .or(
        `and(follower_id.eq.${user.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${user.id})`
      )
      .single();

    if (existingFollow) {
      return NextResponse.json(
        { error: "Vocês já estão conectados" },
        { status: 400 }
      );
    }

    const { data: request, error: insertError } = await supabase
      .from("friend_requests")
      .insert({
        requester_id: user.id,
        receiver_id: userId,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao criar solicitação:", insertError);
      
      if (insertError.code === "42P01") {
        return NextResponse.json(
          {
            error: "Tabela de solicitações não existe",
            details: "Execute a migração SQL para criar a tabela friend_requests",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Erro ao criar solicitação de amizade" },
        { status: 500 }
      );
    }

    try {
      await supabase.from("notification_history").insert({
        user_id: userId,
        tipo: "solicitacao_amizade",
        titulo: "Nova solicitação de amizade",
        descricao: `${user.user_metadata?.nome || user.email} quer ser seu amigo`,
        referencia_id: request.id,
        referencia_tipo: "friend_request",
        metadata: {
          requester_id: user.id,
          requester_name: user.user_metadata?.nome || user.email,
        },
      });
    } catch (notifError) {
      console.warn("Erro ao enviar notificação:", notifError);
    }

    return NextResponse.json({
      success: true,
      request,
      message: "Solicitação de amizade enviada com sucesso",
    });
  } catch (error: any) {
    console.error("Erro na API de solicitação de amizade:", error);
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
    const type = searchParams.get("type") || "received"; // "received" | "sent" | "all"

    let query = supabase
      .from("friend_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (type === "received") {
      query = query.eq("receiver_id", user.id).eq("status", "pending");
    } else if (type === "sent") {
      query = query.eq("requester_id", user.id).eq("status", "pending");
    } else {
      query = query.or(
        `requester_id.eq.${user.id},receiver_id.eq.${user.id}`
      );
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Erro ao buscar solicitações:", error);
      
      if (error.code === "42P01") {
        return NextResponse.json({ requests: [] });
      }

      return NextResponse.json(
        { error: "Erro ao buscar solicitações" },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseAdmin();
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req: any) => {
        const userIdToFetch =
          req.requester_id === user.id ? req.receiver_id : req.requester_id;

        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            userIdToFetch
          );
          return {
            ...req,
            user: userData?.user
              ? {
                  id: userData.user.id,
                  nome:
                    userData.user.user_metadata?.nome ||
                    userData.user.user_metadata?.full_name ||
                    "",
                  email: userData.user.email,
                  avatar_url: userData.user.user_metadata?.avatar_url || "",
                }
              : null,
            isRequester: req.requester_id === user.id,
          };
        } catch {
          return {
            ...req,
            user: null,
            isRequester: req.requester_id === user.id,
          };
        }
      })
    );

    return NextResponse.json({ requests: enrichedRequests });
  } catch (error: any) {
    console.error("Erro na API de solicitações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
