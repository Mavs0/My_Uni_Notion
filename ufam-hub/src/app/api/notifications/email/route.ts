import { NextRequest, NextResponse } from "next/server";
import {
  sendAvaliacaoNotification,
  sendEventoNotification,
} from "@/lib/email/service";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!data.to || !data.to.includes("@")) {
      return NextResponse.json(
        { error: "Email destinatário inválido ou não fornecido" },
        { status: 400 }
      );
    }
    console.log("Enviando notificação para:", data.to);
    if (type === "avaliacao") {
      const result = await sendAvaliacaoNotification({
        to: data.to,
        disciplina: data.disciplina,
        tipo: data.tipo,
        data: data.data,
        horario: data.horario,
        descricao: data.descricao,
        diasRestantes: data.diasRestantes,
      });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Erro ao enviar email" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }
    if (type === "evento") {
      const result = await sendEventoNotification({
        to: data.to,
        titulo: data.titulo,
        tipo: data.tipo,
        data: data.data,
        horario: data.horario,
        local: data.local,
        diasRestantes: data.diasRestantes,
      });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Erro ao enviar email" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: "Tipo de notificação inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro na API de notificações:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar requisição";
    return NextResponse.json(
      {
        error:
          "Não foi possível enviar o email. Verifique se a chave da API de email está configurada corretamente.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}