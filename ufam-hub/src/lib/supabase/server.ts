import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AuthSessionMissingError } from "@supabase/auth-js";

function sanitizeCookieOptions(
  options: CookieOptions | undefined,
): CookieOptions | undefined {
  if (!options) return undefined;
  const o = { ...options };
  delete (o as { name?: string }).name;
  return o;
}

/**
 * Todas as rotas usam `getUser()` para autorização. O `getUser()` original chama
 * `GET auth/v1/user` com o JWT inteiro — com metadata enorme isso falha (401 / reset).
 * Aqui só usamos a sessão já nos cookies (SSR), sem pedido extra ao Auth — o middleware
 * já corre `getSession` e refresh. Não fazemos fallback para o `getUser()` original.
 */
function applySessionOnlyGetUser(client: SupabaseClient): void {
  const auth = client.auth;
  auth.getUser = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await auth.getSession();
    if (sessionError) {
      return { data: { user: null }, error: sessionError };
    }
    if (session?.user) {
      return { data: { user: session.user }, error: null };
    }
    return { data: { user: null }, error: new AuthSessionMissingError() };
  };
}

/**
 * Cliente Supabase em Route Handlers / Server Actions — doc @supabase/ssr.
 */
export async function createSupabaseServer(_incoming?: Request | NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.",
    );
  }
  const cookieStore = await cookies();

  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            const opts = sanitizeCookieOptions(options);
            if (!value) {
              cookieStore.delete(name);
            } else {
              cookieStore.set(name, value, opts ?? {});
            }
          }
        } catch {
          /* Server Component / contexto sem mutação de cookies */
        }
      },
    },
  });

  applySessionOnlyGetUser(client);
  return client;
}

export function createSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
