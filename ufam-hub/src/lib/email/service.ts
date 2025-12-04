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
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada");
      return { success: false, error: "API key não configurada" };
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
      replyTo: EMAIL_CONFIG.replyTo,
    });
    if (error) {
      console.error("Erro ao enviar email:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "Erro desconhecido ao enviar email";
      return {
        success: false,
        error:
          errorMessage.includes("API key") ||
          errorMessage.includes("unauthorized")
            ? "Chave da API de email inválida ou não configurada. Verifique as configurações."
            : errorMessage.includes("domain") ||
              errorMessage.includes("verification")
            ? "Domínio de email não verificado. Configure um domínio válido no Resend."
            : errorMessage,
      };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao enviar email";
    return {
      success: false,
      error:
        errorMessage.includes("API key") || errorMessage.includes("RESEND")
          ? "Chave da API de email não configurada. Adicione RESEND_API_KEY no arquivo .env.local"
          : errorMessage,
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