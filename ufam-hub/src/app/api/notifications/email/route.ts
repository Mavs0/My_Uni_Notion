import { NextRequest, NextResponse } from "next/server";
import {
  sendAvaliacaoNotification,
  sendEventoNotification,
  sendTarefaNotification,
  sendLembreteNotification,
  sendConquistaNotification,
} from "@/lib/email/service";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      return NextResponse.json(
        { error: "Corpo da requisição inválido. JSON esperado." },
        { status: 400 }
      );
    }

    const { type, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Tipo de notificação não fornecido" },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Dados da notificação não fornecidos" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Erro de autenticação:", authError);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!data.to || !data.to.includes("@")) {
      return NextResponse.json(
        { error: "Email destinatário inválido ou não fornecido" },
        { status: 400 }
      );
    }

    console.log("Enviando notificação para:", data.to, "Tipo:", type);

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
        console.error("Erro ao enviar notificação de avaliação:", result.error);
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
        console.error("Erro ao enviar notificação de evento:", result.error);
        return NextResponse.json(
          { error: result.error || "Erro ao enviar email" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (type === "tarefa") {
      const result = await sendTarefaNotification({
        to: data.to,
        titulo: data.titulo,
        disciplina: data.disciplina,
        prazo: data.prazo,
        prioridade: data.prioridade,
        diasRestantes: data.diasRestantes,
      });
      if (!result.success) {
        console.error("Erro ao enviar notificação de tarefa:", result.error);
        return NextResponse.json(
          { error: result.error || "Erro ao enviar email" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (type === "lembrete") {
      const result = await sendLembreteNotification({
        to: data.to,
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        dataAgendada: data.dataAgendada,
      });
      if (!result.success) {
        console.error("Erro ao enviar notificação de lembrete:", result.error);
        return NextResponse.json(
          { error: result.error || "Erro ao enviar email" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (type === "conquista") {
      const result = await sendConquistaNotification({
        to: data.to,
        nome: data.nome,
        descricao: data.descricao,
        icone: data.icone,
      });
      if (!result.success) {
        console.error("Erro ao enviar notificação de conquista:", result.error);
        return NextResponse.json(
          { error: result.error || "Erro ao enviar email" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Tipo de notificação inválido. Tipos suportados: avaliacao, evento, tarefa, lembrete, conquista" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro na API de notificações:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar requisição";
    const errorStack =
      error instanceof Error && process.env.NODE_ENV === "development"
        ? error.stack
        : undefined;
    return NextResponse.json(
      {
        error:
          "Não foi possível enviar o email. Verifique se a chave da API de email está configurada corretamente.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
