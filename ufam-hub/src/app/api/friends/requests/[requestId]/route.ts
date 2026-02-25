import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { requestId } = params;
    const body = await request.json();
    const { action } = body; // "accept" | "reject"

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Ação inválida. Use 'accept' ou 'reject'" },
        { status: 400 }
      );
    }

    const { data: friendRequest, error: fetchError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", user.id) // Apenas o receptor pode aceitar/rejeitar
      .eq("status", "pending")
      .single();

    if (fetchError || !friendRequest) {
      return NextResponse.json(
        { error: "Solicitação não encontrada ou já processada" },
        { status: 404 }
      );
    }

    if (action === "accept") {
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Erro ao aceitar solicitação:", updateError);
        return NextResponse.json(
          { error: "Erro ao aceitar solicitação" },
          { status: 500 }
        );
      }

      const [follow1, follow2] = await Promise.all([
        supabase.from("followers").insert({
          follower_id: friendRequest.requester_id,
          following_id: friendRequest.receiver_id,
        }),
        supabase.from("followers").insert({
          follower_id: friendRequest.receiver_id,
          following_id: friendRequest.requester_id,
        }),
      ]);

      if (follow1.error || follow2.error) {
        console.error("Erro ao criar relação de amizade:", follow1.error || follow2.error);
      }

      try {
        await supabase.from("notification_history").insert({
          user_id: friendRequest.requester_id,
          tipo: "amizade_aceita",
          titulo: "Solicitação de amizade aceita",
          descricao: `${user.user_metadata?.nome || user.email} aceitou sua solicitação de amizade`,
          referencia_id: friendRequest.id,
          referencia_tipo: "friend_request",
          metadata: {
            receiver_id: user.id,
            receiver_name: user.user_metadata?.nome || user.email,
          },
        });
      } catch (notifError) {
        console.warn("Erro ao enviar notificação:", notifError);
      }

      return NextResponse.json({
        success: true,
        message: "Solicitação aceita com sucesso",
      });
    } else {
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Erro ao rejeitar solicitação:", updateError);
        return NextResponse.json(
          { error: "Erro ao rejeitar solicitação" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Solicitação rejeitada",
      });
    }
  } catch (error: any) {
    console.error("Erro na API de solicitação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { requestId } = params;

    const { data: friendRequest, error: fetchError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("requester_id", user.id) // Apenas quem enviou pode cancelar
      .eq("status", "pending")
      .single();

    if (fetchError || !friendRequest) {
      return NextResponse.json(
        { error: "Solicitação não encontrada ou não pode ser cancelada" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    if (deleteError) {
      console.error("Erro ao cancelar solicitação:", deleteError);
      return NextResponse.json(
        { error: "Erro ao cancelar solicitação" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Solicitação cancelada",
    });
  } catch (error: any) {
    console.error("Erro na API de cancelar solicitação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
