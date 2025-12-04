#!/usr/bin/env node

const webpush = require("web-push");
console.log("🔑 Gerando chaves VAPID para notificações push...\n");
const vapidKeys = webpush.generateVAPIDKeys();
console.log("✅ Chaves geradas com sucesso!\n");
console.log("Adicione estas variáveis ao seu arquivo .env.local:\n");
console.log("=".repeat(60));
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
console.log("VAPID_EMAIL=mailto:seu@email.com");
console.log("=".repeat(60));
console.log("\n📝 Notas:");
console.log("- NEXT_PUBLIC_VAPID_PUBLIC_KEY: Chave pública (pode ser exposta)");
console.log("- VAPID_PRIVATE_KEY: Chave privada (NUNCA exponha)");
console.log(
  "- VAPID_EMAIL: Email de contato (formato: mailto:email@exemplo.com)"
);
console.log("\n⚠️  Importante:");
console.log("- Guarde a chave privada com segurança");
console.log("- Use as mesmas chaves em desenvolvimento e produção");
console.log("- Não compartilhe a chave privada publicamente");