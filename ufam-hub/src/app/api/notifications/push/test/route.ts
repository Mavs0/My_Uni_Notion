import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import webpush from "web-push";
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
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id);
    if (subError) {
      console.error("Erro ao buscar subscriptions:", subError);
      return NextResponse.json(
        { error: "Erro ao buscar subscriptions" },
        { status: 500 }
      );
    }
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhuma subscription encontrada. Ative as notificações push primeiro.",
        },
        { status: 400 }
      );
    }
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@ufamhub.com";
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "Chaves VAPID não configuradas" },
        { status: 500 }
      );
    }
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };
        const payload = JSON.stringify({
          title: "UFAM Hub - Notificação de Teste",
          body: "Esta é uma notificação de teste! Se você recebeu isso, as notificações push estão funcionando.",
          icon: "/favicon.ico",
          tag: "test",
          data: {
            url: "/dashboard",
          },
        });
        await webpush.sendNotification(subscription, payload);
      })
    );
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const failedSubscriptions = subscriptions.filter(
      (_, index) => results[index].status === "rejected"
    );
    if (failedSubscriptions.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in(
          "id",
          failedSubscriptions.map((s) => s.id)
        );
    }
    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      message: `Notificação enviada para ${successful} dispositivo(s)`,
    });
  } catch (error: any) {
    console.error("Erro ao enviar notificação de teste:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao enviar notificação" },
      { status: 500 }
    );
  }
}