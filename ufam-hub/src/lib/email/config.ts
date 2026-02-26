import Mailjet from "node-mailjet";
import { Resend } from "resend";

const apiKey = process.env.MAILJET_API_KEY || "1ff0d1691057b8a714e38b519ca721ab";
const apiSecret = process.env.MAILJET_API_SECRET || "";
const resendApiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️ MAILJET_API_KEY não configurada. Notificações por email não funcionarão."
  );
}

export const mailjet = apiKey
  ? new Mailjet({
      apiKey: apiKey,
      apiSecret: apiSecret || undefined,
    })
  : null;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "UFAM Hub <noreply@ufamhub.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "",
  fromEmail: process.env.EMAIL_FROM_EMAIL || "noreply@ufamhub.com",
  fromName: process.env.EMAIL_FROM_NAME || "UFAM Hub",
};
