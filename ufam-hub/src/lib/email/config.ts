import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY);
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "UFAM Hub <noreply@ufamhub.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "manuelavieira732@gmail.com",
};