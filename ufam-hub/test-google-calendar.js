#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
console.log("🔍 Verificando integração Google Calendar...\n");
console.log("📦 Verificando dependências...");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const hasGoogleapis =
    packageJson.dependencies && packageJson.dependencies.googleapis;
  const hasGoogleAuth =
    packageJson.dependencies && packageJson.dependencies["google-auth-library"];
  if (hasGoogleapis && hasGoogleAuth) {
    console.log("✅ Dependências googleapis e google-auth-library instaladas");
  } else {
    console.log(
      "❌ Dependências não encontradas. Execute: npm install googleapis google-auth-library"
    );
    process.exit(1);
  }
} catch (error) {
  console.log("❌ Erro ao ler package.json:", error.message);
  process.exit(1);
}
console.log("\n📁 Verificando arquivos de configuração...");
const requiredFiles = [
  "src/lib/google-calendar/config.ts",
  "src/lib/google-calendar/service.ts",
  "src/hooks/useGoogleCalendar.ts",
  "src/components/GoogleCalendarIntegration.tsx",
  "src/app/api/calendar/auth/route.ts",
  "src/app/api/calendar/auth/callback/route.ts",
  "src/app/api/calendar/events/route.ts",
  "src/app/api/calendar/events/[eventId]/route.ts",
  "src/app/calendar/page.tsx",
];
let allFilesExist = true;
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Arquivo não encontrado`);
    allFilesExist = false;
  }
});
if (!allFilesExist) {
  console.log(
    "\n❌ Alguns arquivos estão faltando. Verifique a implementação."
  );
  process.exit(1);
}
console.log("\n🔧 Verificando variáveis de ambiente...");
const envFile = ".env.local";
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf8");
  const hasGoogleClientId = envContent.includes("GOOGLE_CLIENT_ID=");
  const hasGoogleClientSecret = envContent.includes("GOOGLE_CLIENT_SECRET=");
  const hasGoogleRedirectUri = envContent.includes("GOOGLE_REDIRECT_URI=");
  if (hasGoogleClientId && hasGoogleClientSecret && hasGoogleRedirectUri) {
    console.log("✅ Variáveis de ambiente do Google Calendar configuradas");
  } else {
    console.log("❌ Variáveis de ambiente não configuradas corretamente");
    console.log("   Adicione ao .env.local:");
    console.log("   GOOGLE_CLIENT_ID=seu_client_id");
    console.log("   GOOGLE_CLIENT_SECRET=seu_client_secret");
    console.log(
      "   GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/auth/callback"
    );
  }
} else {
  console.log("❌ Arquivo .env.local não encontrado");
  console.log(
    "   Crie o arquivo .env.local com as variáveis do Google Calendar"
  );
}
console.log("\n🛣️ Verificando rotas da API...");
const apiRoutes = [
  "src/app/api/calendar/auth/route.ts",
  "src/app/api/calendar/auth/callback/route.ts",
  "src/app/api/calendar/events/route.ts",
  "src/app/api/calendar/events/[eventId]/route.ts",
];
apiRoutes.forEach((route) => {
  if (fs.existsSync(route)) {
    console.log(`✅ ${route}`);
  } else {
    console.log(`❌ ${route} - Rota não encontrada`);
  }
});
console.log("\n🧩 Verificando componentes...");
const components = [
  "src/components/GoogleCalendarIntegration.tsx",
  "src/hooks/useGoogleCalendar.ts",
];
components.forEach((component) => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - Componente não encontrado`);
  }
});
console.log("\n🎯 Próximos passos:");
console.log("1. Configure as credenciais no Google Cloud Console");
console.log("2. Adicione as variáveis de ambiente no .env.local");
console.log("3. Execute: npm run dev");
console.log("4. Acesse: http://localhost:3000/dashboard");
console.log('5. Teste a integração clicando em "Conectar"');
console.log("\n📚 Documentação:");
console.log("- Guia completo: INTEGRACAO_GOOGLE_CALENDAR.md");
console.log("- Configuração: GOOGLE_CALENDAR_SETUP.md");
console.log("\n✨ Integração Google Calendar verificada!");