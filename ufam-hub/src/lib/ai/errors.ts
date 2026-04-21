/**
 * Normaliza erros do AI SDK / Gemini para HTTP e mensagens em português.
 */
export function getAiHttpError(error: unknown): {
  status: number;
  message: string;
} {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("quota") ||
    lower.includes("exceeded") ||
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    raw.includes("429") ||
    lower.includes("limite")
  ) {
    return {
      status: 429,
      message:
        "Cota ou limite de uso da API Google (Gemini) foi atingido. Agarde alguns minutos, verifique o plano em Google AI Studio ou use outra chave. Documentação: https://ai.google.dev/gemini-api/docs/rate-limits",
    };
  }

  if (
    lower.includes("google_generative_ai_api_key") ||
    (lower.includes("api key") && lower.includes("não configurada"))
  ) {
    return {
      status: 503,
      message:
        "API de IA não configurada. Defina GOOGLE_GENERATIVE_AI_API_KEY no ambiente.",
    };
  }

  if (lower.includes("não autorizado") || lower.includes("401")) {
    return { status: 401, message: "Não autorizado." };
  }

  return {
    status: 500,
    message: raw.length > 500 ? raw.slice(0, 500) + "…" : raw,
  };
}

/** Se o erro deve acionar o fallback (@google/generative-ai com outros modelos). */
export function shouldTryGeminiModelFallback(modelError: unknown): boolean {
  const msg =
    modelError && typeof modelError === "object" && "message" in modelError
      ? String((modelError as { message?: string }).message)
      : String(modelError);
  const lower = msg.toLowerCase();
  const reason =
    modelError && typeof modelError === "object" && "reason" in modelError
      ? String((modelError as { reason?: string }).reason)
      : "";

  return (
    msg.includes("not found") ||
    msg.includes("404") ||
    lower.includes("quota") ||
    lower.includes("exceeded") ||
    lower.includes("resource_exhausted") ||
    msg.includes("429") ||
    reason === "maxRetriesExceeded"
  );
}
