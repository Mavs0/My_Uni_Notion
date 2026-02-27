import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias. " +
        "Configure em Vercel → Settings → Environment Variables e faça um novo deploy. " +
        "Valores em: https://supabase.com/dashboard/project/_/settings/api"
    );
  }
  return createBrowserClient(url, key);
}