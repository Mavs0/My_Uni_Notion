import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Dados de subscription inválidos" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
      .single();
    if (existing) {
      const { error: updateError } = await supabase
        .from("push_subscriptions")
        .update({
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (updateError) {
        console.error("Erro ao atualizar subscription:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar subscription" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } else {
      const { error: insertError } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          endpoint,
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
        });
      if (insertError) {
        console.error("Erro ao criar subscription:", insertError);
        return NextResponse.json(
          { error: "Erro ao salvar subscription" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("Erro na API de subscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}