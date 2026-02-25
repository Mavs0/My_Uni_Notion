import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const { status = "interessado", notificacoes_ativas = true } = body;

    if (!["interessado", "vou_participar"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    const { data: interesseExistente } = await supabase
      .from("eventos_interesse")
      .select("*")
      .eq("evento_id", params.id)
      .eq("usuario_id", user.id)
      .single();

    if (interesseExistente) {
      const { data, error } = await supabase
        .from("eventos_interesse")
        .update({
          status,
          notificacoes_ativas,
        })
        .eq("evento_id", params.id)
        .eq("usuario_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar interesse:", error);
        return NextResponse.json(
          { error: "Erro ao atualizar interesse" },
          { status: 500 }
        );
      }

      return NextResponse.json({ interesse: data });
    } else {
      const { data, error } = await supabase
        .from("eventos_interesse")
        .insert({
          evento_id: params.id,
          usuario_id: user.id,
          status,
          notificacoes_ativas,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar interesse:", error);
        return NextResponse.json(
          { error: "Erro ao criar interesse" },
          { status: 500 }
        );
      }

      return NextResponse.json({ interesse: data }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Erro na API de interesse:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { error } = await supabase
      .from("eventos_interesse")
      .delete()
      .eq("evento_id", params.id)
      .eq("usuario_id", user.id);

    if (error) {
      console.error("Erro ao remover interesse:", error);
      return NextResponse.json(
        { error: "Erro ao remover interesse" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de interesse:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
