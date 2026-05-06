import { type NextRequest, NextResponse } from "next/server";
import { emergencyCookieResponseIfNeeded } from "@/lib/supabase/cookie-emergency-middleware";
import { updateSession } from "@/lib/supabase/middleware";

/** Evita URL acidental igual ao título da app (marcador / Arc / link relativo partido). */
function redirectIfBogusAppTitlePath(request: NextRequest) {
  const raw = request.nextUrl.pathname;
  const decoded = decodeURIComponent(raw).replace(/\/+$/, "") || "/";
  if (decoded === "/UFAM Hub") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return null;
}

export async function middleware(request: NextRequest) {
  try {
    const bogus = redirectIfBogusAppTitlePath(request);
    if (bogus) return bogus;
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
