/**
 * fetch com timeout via AbortController. Evita que a UI fique presa quando o
 * backend (ex.: Supabase pausado) não responde — em vez de pendurar ~44s,
 * falha rápido e deixa a tela renderizar com estados vazios/aviso.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Tempo de resposta esgotado. O serviço pode estar temporariamente indisponível.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
