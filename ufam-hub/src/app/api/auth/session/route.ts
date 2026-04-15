import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Verifica sessão no servidor sem devolver 401 (evita ruído no console na página de login
 * e em checks “soft”). Rotas protegidas continuam a usar /api/profile e 401 quando aplicável.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({ authenticated: true, userId: user.id });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
