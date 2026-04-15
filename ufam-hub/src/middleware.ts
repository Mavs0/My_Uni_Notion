import { type NextRequest, NextResponse } from "next/server";
import { emergencyCookieResponseIfNeeded } from "@/lib/supabase/cookie-emergency-middleware";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const emergency = emergencyCookieResponseIfNeeded(request);
    if (emergency) return emergency;
    return await updateSession(request);
  } catch (e) {
    console.error("[middleware]", e);
    return NextResponse.next({ request });
  }
}

/**
 * Excluir **todo** `/_next/*` (static, webpack, HMR, etc.). Um matcher demasiado
 * estreito pode fazer passar pedidos a chunks pelo Supabase — sessão/cookies
 * gigantes rebentam ou dão 500 em ficheiros estáticos.
 */
export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
