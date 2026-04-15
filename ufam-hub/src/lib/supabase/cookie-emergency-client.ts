const SWEEP_COUNT_KEY = "ufam-sb-sweep-n";

/** Reseta o contador após login bem-sucedido (nova sessão válida). */
export function clearSupabaseCookieSweepCounter(): void {
  try {
    sessionStorage.removeItem(SWEEP_COUNT_KEY);
  } catch {
    /* ignore */
  }
}

function collectSbCookieNames(): Set<string> {
  const names = new Set<string>();
  if (typeof document === "undefined" || !document.cookie) return names;
  for (const segment of document.cookie.split(";")) {
    const t = segment.trim();
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const name = t.slice(0, eq).trim();
    if (name.startsWith("sb-")) names.add(name);
  }
  return names;
}

/** Remove todos os cookies `sb-*` visíveis em document.cookie (sem servidor). */
export function sweepAllSupabaseCookiesFromDocument(): void {
  for (const name of collectSbCookieNames()) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

/**
 * Se a sessão Supabase fragmentou em demasiados chunks, o browser envia um
 * `Cookie:` gigante → 431 antes de chegar ao Next. Limpeza via API nem corre.
 * Esta função apaga só `sb-*` no cliente e recarrega (máx. 3 tentativas).
 */
export function runClientSupabaseCookieSweepIfNeeded(): void {
  if (typeof window === "undefined") return;

  const n = parseInt(sessionStorage.getItem(SWEEP_COUNT_KEY) || "0", 10);
  if (n >= 3) return;

  const raw = document.cookie;
  if (!raw) return;

  const names = collectSbCookieNames();
  // Sessões válidas com JWT grande podem ter muitos chunks; limites conservadores
  // mas evitam limpar sessão boa (antes: 10 / 4500 cortava cedo demais).
  const tooMany = names.size >= 16;
  const tooFat = raw.length >= 8000;

  if (!tooMany && !tooFat) return;

  sessionStorage.setItem(SWEEP_COUNT_KEY, String(n + 1));
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
  window.location.reload();
}
