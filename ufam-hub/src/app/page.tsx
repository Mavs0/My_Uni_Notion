import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function HomePage() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    redirect("/config-error");
  }
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}