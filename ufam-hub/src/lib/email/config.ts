import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️ RESEND_API_KEY não configurada. Notificações por email não funcionarão."
  );
}

export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "UFAM Hub <noreply@ufamhub.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "",
};
