import type { NextRequest } from "next/server";
import { combineChunks, stringFromBase64URL } from "@supabase/ssr";

const BASE64_PREFIX = "base64-";

/** Mesma chave que o @supabase/ssr usa para `storageKey` por defeito. */
export function getSupabaseAuthCookieKey(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const ref = host.split(".")[0];
    if (!ref) return null;
    return `sb-${ref}-auth-token`;
  } catch {
    return null;
  }
}

function isPlausibleSession(o: unknown): o is Record<string, unknown> {
  return (
    o !== null &&
    typeof o === "object" &&
    typeof (o as Record<string, unknown>).access_token === "string" &&
    typeof (o as Record<string, unknown>).refresh_token === "string"
  );
}

function parseSessionCombinedString(combined: string): unknown | null {
  let decoded = combined;
  if (decoded.startsWith(BASE64_PREFIX)) {
    try {
      decoded = stringFromBase64URL(decoded.slice(BASE64_PREFIX.length));
    } catch {
      return null;
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    return null;
  }

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  return isPlausibleSession(parsed) ? parsed : null;
}

/**
 * `combineChunks` do @supabase/ssr devolve primeiro o cookie singular `key` e ignora
 * `key.0`, `key.1`, … Se o singular for lixo antigo/truncado e os chunks tiverem a
 * sessão válida (JWT grande), o parse falha e apagávamos **todos** os sb-* → 401 em massa.
 */
function combineChunkedOnly(
  key: string,
  all: { name: string; value: string }[],
): string | null {
  const parts: string[] = [];
  for (let i = 0; ; i++) {
    const name = `${key}.${i}`;
    const c = all.find((x) => x.name === name);
    if (!c?.value) break;
    parts.push(c.value);
  }
  if (parts.length === 0) return null;
  return parts.join("");
}

/**
 * Se o cookie da sessão existir mas não for JSON válido (ou não for objeto de sessão),
 * o @supabase/auth-js faz `session.user = ...` sobre uma **string** →
 * TypeError: Cannot create property 'user' on string.
 * Isto acontece com JWT/metadata gigantes truncados ou chunks mal juntados.
 *
 * Remove cookies `sb-*` do pedido e devolve os nomes para limpar também na resposta.
 */
export async function stripCorruptSupabaseSessionCookies(
  request: NextRequest,
): Promise<string[]> {
  const key = getSupabaseAuthCookieKey();
  if (!key) return [];

  const all = request.cookies.getAll();
  const authRelated = all.some(
    (c) => c.name === key || c.name.startsWith(`${key}.`),
  );
  if (!authRelated) return [];

  let combined: string | null = null;
  try {
    combined = await combineChunks(key, async (chunkName) => {
      const c = all.find((x) => x.name === chunkName);
      return c?.value ?? null;
    });
  } catch {
    return wipeSbCookies(request);
  }

  const fromStandard = combined ? parseSessionCombinedString(combined) : null;
  if (fromStandard) {
    return [];
  }

  const chunkedOnly = combineChunkedOnly(key, all);
  if (chunkedOnly) {
    const fromChunks = parseSessionCombinedString(chunkedOnly);
    if (fromChunks) {
      /* Sessão válida nos chunks mas o singular era inválido: o @supabase/ssr lê o
       * singular primeiro. Tiramos `key` do pedido e pedimos ao browser para apagar o cookie. */
      const hasSingle = all.some((c) => c.name === key);
      if (hasSingle && combined && !fromStandard) {
        request.cookies.delete(key);
        return [key];
      }
      return [];
    }
  }

  if (!combined && !chunkedOnly) {
    return wipeSbCookies(request);
  }

  return wipeSbCookies(request);
}

function wipeSbCookies(request: NextRequest): string[] {
  const cleared: string[] = [];
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-")) {
      request.cookies.delete(c.name);
      cleared.push(c.name);
    }
  }
  return cleared;
}
