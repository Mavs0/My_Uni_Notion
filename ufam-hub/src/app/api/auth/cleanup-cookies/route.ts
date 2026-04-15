import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Limite total (todos os cookies) para limpeza automática **sem** `?reset=1`.
 * Sessões Supabase SSR normais: dezenas–centenas de KB — não apagar por chunk.
 */
/** Acima disto ou demasiados chunks sb-* → limpar sessão (evita 431/494 na Vercel). */
const COOKIE_TOTAL_EMERGENCY_BYTES = 48 * 1024;
/** Sessões válidas podem ter ~12–18 chunks com JWT grande; só agir acima disto. */
const COOKIE_COUNT_EMERGENCY = 22;

function clearAllSbCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  cleared: string[],
) {
  for (const c of cookieStore.getAll()) {
    if (!c.name.startsWith("sb-")) continue;
    try {
      cookieStore.delete(c.name);
      if (!cleared.includes(c.name)) cleared.push(c.name);
    } catch {
      /* ignore */
    }
  }
}

/**
 * GET: métricas (para o cliente decidir).
 * POST: só remove sessão de forma agressiva com `?reset=1` / `?full=1` **ou**
 * quando o total de bytes excede o limite de emergência (duplicação real).
 *
 * Nunca apagar cookies `sb-*` só porque um chunk tem >3–4 KB — isso é normal.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const clearedCookies: string[] = [];

    const allInitial = cookieStore.getAll();
    const totalSize = allInitial.reduce((acc, c) => acc + c.value.length, 0);
    const forceReset =
      request.nextUrl.searchParams.get("reset") === "1" ||
      request.nextUrl.searchParams.get("full") === "1";

    if (!forceReset && totalSize <= COOKIE_TOTAL_EMERGENCY_BYTES) {
      return NextResponse.json({
        success: true,
        clearedCookies: [],
        message:
          "Nenhuma limpeza agressiva: cookies dentro do limite seguro. " +
          "Use POST ?reset=1 para terminar a sessão (logout total de cookies sb-*).",
        totalSizeKB: (totalSize / 1024).toFixed(2),
      });
    }

    const tooManyNames =
      allInitial.filter((c) => c.name.startsWith("sb-")).length >=
      COOKIE_COUNT_EMERGENCY;

    if (forceReset || totalSize > COOKIE_TOTAL_EMERGENCY_BYTES || tooManyNames) {
      clearAllSbCookies(cookieStore, clearedCookies);
    }

    const legacyFlat = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "sb-auth-token",
    ];
    for (const name of legacyFlat) {
      try {
        const c = cookieStore.get(name);
        if (c && c.value.length > 16384) {
          cookieStore.delete(name);
          if (!clearedCookies.includes(name)) clearedCookies.push(name);
        }
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      success: true,
      clearedCookies,
      message:
        clearedCookies.length > 0
          ? `${clearedCookies.length} cookie(s) ajustados`
          : "Nada a limpar",
      totalSizeKB: (totalSize / 1024).toFixed(2),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao limpar cookies:", error);
    return NextResponse.json(
      { error: "Erro ao limpar cookies", details: msg },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const cookieSizes = allCookies.map((cookie) => ({
      name: cookie.name,
      size: cookie.value.length,
      sizeKB: (cookie.value.length / 1024).toFixed(2),
      isLarge: cookie.value.length > 4096,
    }));

    const totalSize = allCookies.reduce((acc, cookie) => acc + cookie.value.length, 0);
    const largeCookies = cookieSizes.filter((c) => c.isLarge);

    return NextResponse.json({
      totalCookies: allCookies.length,
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      largeCookies: largeCookies.length,
      cookies: cookieSizes,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao verificar cookies:", error);
    return NextResponse.json(
      { error: "Erro ao verificar cookies", details: msg },
      { status: 500 },
    );
  }
}
