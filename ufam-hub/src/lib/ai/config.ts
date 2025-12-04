import { google } from "@ai-sdk/google";


export function getAIModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY não configurada. Configure no .env.local"
    );
  }
  return google("gemini-pro");
}

export function isProviderConfigured(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}