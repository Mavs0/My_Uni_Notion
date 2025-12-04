
import webpush from "web-push";
import { createSupabaseServer } from "@/lib/supabase/server";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@ufamhub.com";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error("Chaves VAPID não configuradas");
  }
  const supabase = await createSupabaseServer();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    console.error("Erro ao buscar subscriptions:", error);
    throw new Error("Erro ao buscar subscriptions");
  }
  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    tag: payload.tag || "default",
    data: payload.data || {},
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [],
  });
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };
      await webpush.sendNotification(subscription, notificationPayload);
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
  return { sent: successful, failed };
}

export async function sendAvaliacaoPushNotification(
  userId: string,
  data: {
    disciplina: string;
    tipo: string;
    data: string;
    diasRestantes: number;
  }
): Promise<{ sent: number; failed: number }> {
  const diasText =
    data.diasRestantes === 0
      ? "Hoje"
      : data.diasRestantes === 1
      ? "Amanhã"
      : `Em ${data.diasRestantes} dias`;
  return sendPushNotification(userId, {
    title: `${data.tipo.charAt(0).toUpperCase() + data.tipo.slice(1)}: ${
      data.disciplina
    }`,
    body: `Sua ${data.tipo} está marcada para ${diasText}!`,
    tag: `avaliacao-${data.data}`,
    data: {
      url: "/avaliacoes",
      type: "avaliacao",
    },
    requireInteraction: data.diasRestantes <= 1,
  });
}

export async function sendTarefaPushNotification(
  userId: string,
  data: {
    titulo: string;
    disciplina?: string;
    dataVencimento: string;
    diasRestantes: number;
  }
): Promise<{ sent: number; failed: number }> {
  const diasText =
    data.diasRestantes === 0
      ? "Hoje"
      : data.diasRestantes === 1
      ? "Amanhã"
      : `Em ${data.diasRestantes} dias`;
  return sendPushNotification(userId, {
    title: data.disciplina ? `${data.disciplina}: ${data.titulo}` : data.titulo,
    body: `Tarefa vence ${diasText}`,
    tag: `tarefa-${data.dataVencimento}`,
    data: {
      url: "/disciplinas",
      type: "tarefa",
    },
    requireInteraction: data.diasRestantes <= 1,
  });
}