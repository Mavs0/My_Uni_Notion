import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push/notifications";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = await createSupabaseServer(request);

    const { data: reminders, error } = await supabase.rpc(
      "processar_lembretes"
    );

    if (error) {
      console.error("Erro ao processar lembretes:", error);
      return NextResponse.json(
        { error: "Erro ao processar lembretes" },
        { status: 500 }
      );
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ processed: 0, reminders: [] });
    }

    const results = await Promise.allSettled(
      reminders.map(async (reminder: any) => {
        try {
          await sendPushNotification(reminder.user_id, {
            title: reminder.titulo,
            body: reminder.descricao || "",
            tag: `reminder-${reminder.tipo}`,
            data: {
              tipo: reminder.tipo,
              referencia_id: reminder.referencia_id,
              referencia_tipo: reminder.referencia_tipo,
            },
          });

          await supabase.from("notification_history").insert({
            user_id: reminder.user_id,
            tipo: reminder.tipo,
            titulo: reminder.titulo,
            descricao: reminder.descricao,
            referencia_id: reminder.referencia_id,
            referencia_tipo: reminder.referencia_tipo,
          });

          return { success: true, reminder_id: reminder.reminder_id };
        } catch (error) {
          console.error(
            `Erro ao processar lembrete ${reminder.reminder_id}:`,
            error
          );
          return { success: false, reminder_id: reminder.reminder_id, error };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      processed: reminders.length,
      successful,
      failed,
      reminders: reminders.map((r: any) => ({
        id: r.reminder_id,
        titulo: r.titulo,
        tipo: r.tipo,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao processar lembretes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
