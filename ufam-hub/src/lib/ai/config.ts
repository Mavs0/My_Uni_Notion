import { google } from "@ai-sdk/google";

/** Modelo padrão (AI SDK). Sobrescreva com GOOGLE_GENERATIVE_AI_MODEL se a cota de um modelo específico acabar. */
const DEFAULT_GEMINI_MODEL =
  process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || "gemini-1.5-flash";

export function getAIModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada.");
  }

  return google(DEFAULT_GEMINI_MODEL);
}

export function getDefaultGeminiModelId(): string {
  return DEFAULT_GEMINI_MODEL;
}

export function isProviderConfigured(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
