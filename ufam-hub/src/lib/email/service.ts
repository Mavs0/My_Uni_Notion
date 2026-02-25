import { mailjet, EMAIL_CONFIG } from "./config";
import {
  createAvaliacaoProximaEmail,
  createEventoProximoEmail,
  createConfirmacaoEmail,
  createTarefaEmail,
  createLembreteEmail,
  createConquistaEmail,
  EmailTemplate,
} from "./templates";

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
}

export async function sendEmail({ to, template }: SendEmailOptions) {
  try {
    if (!mailjet) {
      console.error("MAILJET_API_KEY não configurada");
      return {
        success: false,
        error:
          "API key não configurada. Adicione MAILJET_API_KEY no arquivo .env.local",
      };
    }

    if (!to || !to.includes("@")) {
      console.error("Email destinatário inválido:", to);
      return { success: false, error: "Email destinatário inválido" };
    }

    console.log("Enviando email via Mailjet para:", to);

    const fromMatch = EMAIL_CONFIG.from.match(/^(.+?)\s*<(.+?)>$/);
    const fromEmail = fromMatch ? fromMatch[2] : EMAIL_CONFIG.fromEmail;
    const fromName = fromMatch ? fromMatch[1] : EMAIL_CONFIG.fromName;

    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName,
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: template.subject,
          HTMLPart: template.html,
          TextPart: template.text || template.html.replace(/<[^>]*>/g, ""),
          ...(EMAIL_CONFIG.replyTo && {
            ReplyTo: {
              Email: EMAIL_CONFIG.replyTo,
            },
          }),
        },
      ],
    });

    console.log("Email enviado com sucesso via Mailjet:", result.body);

    return { success: true, data: result.body };
  } catch (error: any) {
    console.error("Erro ao enviar email via Mailjet:", error);

    let errorMessage = "Erro desconhecido ao enviar email";
    let errorDetails: any = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error;
    } else if (error && typeof error === "object") {
      errorDetails = error;
      if ("ErrorMessage" in error) {
        errorMessage = String(error.ErrorMessage);
      } else if ("message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      } else if ("error" in error && typeof error.error === "string") {
        errorMessage = error.error;
      } else {
        errorMessage = JSON.stringify(error);
      }
    }

    const errorLower = errorMessage.toLowerCase();

    if (
      errorLower.includes("api key") ||
      errorLower.includes("unauthorized") ||
      errorLower.includes("invalid api key") ||
      errorLower.includes("authentication")
    ) {
      return {
        success: false,
        error:
          "Chave da API de email inválida ou não configurada. Verifique as configurações.",
      };
    }

    if (
      errorLower.includes("domain") ||
      errorLower.includes("verification") ||
      errorLower.includes("not verified") ||
      errorLower.includes("sender")
    ) {
      return {
        success: false,
        error:
          "Domínio de email não verificado. Configure um domínio válido no Mailjet.",
      };
    }

    return {
      success: false,
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? errorDetails : undefined,
    };
  }
}

export async function sendAvaliacaoNotification(data: {
  to: string;
  disciplina: string;
  tipo: string;
  data: string;
  horario?: string;
  descricao?: string;
  diasRestantes: number;
}) {
  const template = createAvaliacaoProximaEmail(data);
  return sendEmail({ to: data.to, template });
}

export async function sendEventoNotification(data: {
  to: string;
  titulo: string;
  tipo: "aula" | "evento";
  data: string;
  horario?: string;
  local?: string;
  diasRestantes: number;
}) {
  const template = createEventoProximoEmail(data);
  return sendEmail({ to: data.to, template });
}

export async function sendConfirmacaoEmail(data: {
  to: string;
  nome?: string;
  confirmationLink: string;
}) {
  const template = createConfirmacaoEmail({
    nome: data.nome,
    email: data.to,
    confirmationLink: data.confirmationLink,
  });
  return sendEmail({ to: data.to, template });
}

export async function sendTarefaNotification(data: {
  to: string;
  titulo: string;
  disciplina?: string;
  prazo: string;
  prioridade?: "baixa" | "media" | "alta";
  diasRestantes: number;
}) {
  const template = createTarefaEmail(data);
  return sendEmail({ to: data.to, template });
}

export async function sendLembreteNotification(data: {
  to: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  dataAgendada: string;
}) {
  const template = createLembreteEmail(data);
  return sendEmail({ to: data.to, template });
}

export async function sendConquistaNotification(data: {
  to: string;
  nome: string;
  descricao: string;
  icone?: string;
}) {
  const template = createConquistaEmail(data);
  return sendEmail({ to: data.to, template });
}
