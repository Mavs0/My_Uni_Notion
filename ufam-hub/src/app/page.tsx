import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
export default async function HomePage() {
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