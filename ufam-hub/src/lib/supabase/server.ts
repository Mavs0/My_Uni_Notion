import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "./session-security";

export async function createSupabaseServer(request?: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias. " +
        "Configure em Vercel → Settings → Environment Variables e faça um novo deploy."
    );
  }
  const cookieStore = await cookies();
  const requestCookies = request?.headers.get("cookie") || "";
  const canModifyCookies = !!request;
  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          const cookieValue = cookieStore.get(name)?.value;
          if (cookieValue) {
            return cookieValue;
          }
          if (requestCookies) {
            const cookies = requestCookies.split(";").map((c) => c.trim());
            for (const cookie of cookies) {
              const [key, value] = cookie.split("=");
              if (key === name) {
                return decodeURIComponent(value);
              }
            }
          }
          return undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          if (canModifyCookies) {
            try {
              const MAX_COOKIE_SIZE = 4096;
              if (value.length > MAX_COOKIE_SIZE) {
                console.warn(
                  `Cookie ${name} muito grande (${value.length} bytes). Tentando truncar ou limpar cookies antigos.`
                );
                try {
                  const allCookies = cookieStore.getAll();
                  for (const cookie of allCookies) {
                    if (
                      cookie.name.startsWith(name.split("-")[0]) &&
                      cookie.name !== name &&
                      cookie.value.length > 1024
                    ) {
                      cookieStore.delete(cookie.name);
                    }
                  }
                } catch (cleanupError) {
                  console.warn("Erro ao limpar cookies antigos:", cleanupError);
                }
              }

              const secureOptions: CookieOptions =
                name.includes("auth-token") || name.includes("session")
                  ? { ...SESSION_COOKIE_OPTIONS, ...options }
                  : options;
              cookieStore.set({ name, value, ...secureOptions });
            } catch (error) {
              console.warn(`Não foi possível definir cookie ${name}:`, error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          if (canModifyCookies) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              console.warn(`Não foi possível remover cookie ${name}:`, error);
            }
          }
        },
      },
    }
  );
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
    }
  );
}
