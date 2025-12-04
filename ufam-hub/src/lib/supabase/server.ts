import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest } from "next/server";

export async function createSupabaseServer(request?: NextRequest) {
  const cookieStore = await cookies();
  const requestCookies = request?.headers.get("cookie") || "";
  const canModifyCookies = !!request;
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              cookieStore.set({ name, value, ...options });
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