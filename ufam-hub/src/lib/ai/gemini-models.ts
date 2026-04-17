/**
 * IDs estáveis para fallback quando ListModels falha ou retorna vazio.
 * Evite nomes "curtos" depreciados (ex.: gemini-1.5-pro sem sufixo) — costumam dar 404 na v1beta.
 */
export const GEMINI_MODEL_FALLBACK_CHAIN: string[] = [
  "gemini-2.0-flash-001",
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro-002",
];

/**
 * Lista modelos Gemini que expõem generateContent (via API REST do Google AI).
 */
export async function listGeminiContentModelIds(
  apiKey: string,
): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>;
    };
    const ids: string[] = [];
    for (const m of data.models || []) {
      const methods = m.supportedGenerationMethods || [];
      if (!methods.includes("generateContent")) continue;
      const raw = m.name || "";
      const id = raw.replace(/^models\//, "");
      if (id.includes("gemini")) ids.push(id);
    }
    ids.sort((a, b) => {
      const flash = (s: string) => (s.includes("flash") ? 0 : 1);
      const d = flash(a) - flash(b);
      if (d !== 0) return d;
      return a.localeCompare(b);
    });
    return ids;
  } catch {
    return [];
  }
}

export function mergeUniqueModelOrder(
  fromApi: string[],
  fallbacks: string[],
): string[] {
  return [...new Set([...fromApi, ...fallbacks])];
}
