import { google } from "@ai-sdk/google";

export function getAIModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada.");
  }

  // Tentar usar modelos disponíveis na API v1 (não v1beta)
  // Se não funcionar, os arquivos terão fallback para @google/generative-ai direto
  return google("gemini-1.5-flash");
}

export function isProviderConfigured(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
