import Mailjet from "node-mailjet";

const apiKey = process.env.MAILJET_API_KEY || "1ff0d1691057b8a714e38b519ca721ab";
const apiSecret = process.env.MAILJET_API_SECRET || "";

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

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "UFAM Hub <noreply@ufamhub.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "",
  fromEmail: process.env.EMAIL_FROM_EMAIL || "noreply@ufamhub.com",
  fromName: process.env.EMAIL_FROM_NAME || "UFAM Hub",
};
