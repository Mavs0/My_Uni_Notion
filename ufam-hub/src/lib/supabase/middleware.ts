import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { stripCorruptSupabaseSessionCookies } from "./session-cookie-guard";

/**
 * Atualiza a sessão Supabase em cada pedido (doc oficial).
 * Sem isto, tokens podem expirar sem refresh e as Route Handlers devolvem 401.
 */
export async function updateSession(request: NextRequest) {
  /** Evita TypeError ao ler sessão como string (JSON truncado / JWT gigante). */
  let cookieNamesToClearOnClient: string[] = [];
  try {
    cookieNamesToClearOnClient =
      await stripCorruptSupabaseSessionCookies(request);
  } catch {
    cookieNamesToClearOnClient = [];
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    await supabase.auth.getSession();
  } catch {
    /* sessão inválida — continua sem utilizador */
  }

  /**
   * Não duplicar o JWT em cabeçalhos: `createSupabaseServer` usa só `cookies()` —
   * `Authorization` + `x-sb-access-token` somavam ~2× o tamanho do token ao pedido
   * interno e rebentavam o limite ~16KB do Vercel (494 REQUEST_HEADER_TOO_LARGE).
   */
  const withAuth = NextResponse.next({
    request,
  });

  const setCookies = supabaseResponse.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    for (const line of setCookies) {
      withAuth.headers.append("Set-Cookie", line);
    }
  } else {
    for (const c of supabaseResponse.cookies.getAll()) {
      withAuth.cookies.set(c);
    }
  }

  for (const name of cookieNamesToClearOnClient) {
    withAuth.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax" });
  }

  return withAuth;
}
