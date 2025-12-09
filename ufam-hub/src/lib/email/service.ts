import { resend, EMAIL_CONFIG } from "./config";
import {
  createAvaliacaoProximaEmail,
  createEventoProximoEmail,
  createConfirmacaoEmail,
  EmailTemplate,
} from "./templates";
export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
}
export async function sendEmail({ to, template }: SendEmailOptions) {
  try {
    if (!resend) {
      console.error("RESEND_API_KEY não configurada");
      return {
        success: false,
        error:
          "API key não configurada. Adicione RESEND_API_KEY no arquivo .env.local",
      };
    }
    if (!to || !to.includes("@")) {
      console.error("Email destinatário inválido:", to);
      return { success: false, error: "Email destinatário inválido" };
    }
    console.log("Enviando email para:", to);
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: EMAIL_CONFIG.replyTo || undefined,
    });
    if (error) {
      console.error("Erro ao enviar email:", JSON.stringify(error, null, 2));

      // Extrair mensagem de erro de diferentes formatos do Resend
      let errorMessage = "Erro desconhecido ao enviar email";
      let errorDetails: any = null;

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Resend pode retornar erro como objeto com message
        errorDetails = error;
        if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        } else if ("error" in error && typeof error.error === "string") {
          errorMessage = error.error;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      // Verificar tipos específicos de erro do Resend
      const errorLower = errorMessage.toLowerCase();

      if (
        errorLower.includes("api key") ||
        errorLower.includes("unauthorized") ||
        errorLower.includes("invalid api key")
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
        errorLower.includes("not verified")
      ) {
        return {
          success: false,
          error:
            "Domínio de email não verificado. Configure um domínio válido no Resend.",
        };
      }

      // Erro específico sobre email não verificado (comum no plano gratuito do Resend)
      if (
        errorLower.includes("not verified") ||
        errorLower.includes("unverified") ||
        errorLower.includes("recipient") ||
        errorLower.includes("email address") ||
        (errorDetails &&
          (errorDetails.statusCode === 403 || errorDetails.statusCode === 422))
      ) {
        return {
          success: false,
          error: `Não é possível enviar para este email. No plano gratuito do Resend, você só pode enviar para emails verificados. Verifique o email ${to} no painel do Resend ou faça upgrade do plano.`,
        };
      }

      // Retornar mensagem de erro genérica com detalhes em desenvolvimento
      return {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao enviar email (catch):", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Erro desconhecido ao enviar email";

    const errorLower = errorMessage.toLowerCase();

    return {
      success: false,
      error:
        errorLower.includes("api key") ||
        errorLower.includes("resend") ||
        errorLower.includes("unauthorized")
          ? "Chave da API de email não configurada. Adicione RESEND_API_KEY no arquivo .env.local"
          : errorLower.includes("not verified") ||
            errorLower.includes("unverified") ||
            errorLower.includes("recipient")
          ? `Não é possível enviar para este email. No plano gratuito do Resend, você só pode enviar para emails verificados. Verifique o email no painel do Resend ou faça upgrade do plano.`
          : errorMessage,
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
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
