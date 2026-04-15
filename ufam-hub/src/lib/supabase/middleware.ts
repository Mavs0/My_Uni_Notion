import { createServerClient } from "@supabase/ssr";
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
      setAll(cookiesToSet) {
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

  let session: import("@supabase/supabase-js").Session | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session ?? null;
  } catch {
    session = null;
  }

  const requestHeaders = new Headers(request.headers);
  if (session?.access_token) {
    requestHeaders.set("Authorization", `Bearer ${session.access_token}`);
    /* Fallback se o Next não reencaminhar Authorization ao Route Handler (comum em dev). */
    requestHeaders.set("x-sb-access-token", session.access_token);
  }

  const withAuth = NextResponse.next({
    request: { headers: requestHeaders },
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
