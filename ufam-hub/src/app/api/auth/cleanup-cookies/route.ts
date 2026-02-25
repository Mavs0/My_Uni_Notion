import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabaseCookieNames = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "sb-auth-token",
    ];

    const clearedCookies: string[] = [];
    
    for (const cookieName of supabaseCookieNames) {
      try {
        const cookie = cookieStore.get(cookieName);
        if (cookie) {
          const cookieSize = cookie.value.length;
          
          if (cookieSize > 4096) {
            cookieStore.delete(cookieName);
            clearedCookies.push(cookieName);
          }
        }
      } catch (error) {
        console.warn(`Erro ao processar cookie ${cookieName}:`, error);
      }
    }

    const allCookies = cookieStore.getAll();
    const cookieSizes: Array<{ name: string; size: number }> = [];
    
    for (const cookie of allCookies) {
      cookieSizes.push({ name: cookie.name, size: cookie.value.length });
      
      if (
        (cookie.name.startsWith("sb-") && cookie.value.length > 3072) ||
        (cookie.name.includes("auth") && cookie.value.length > 3072) ||
        (cookie.name.startsWith("supabase") && cookie.value.length > 3072)
      ) {
        try {
          cookieStore.delete(cookie.name);
          if (!clearedCookies.includes(cookie.name)) {
            clearedCookies.push(cookie.name);
          }
        } catch (error) {
          console.warn(`Erro ao deletar cookie ${cookie.name}:`, error);
        }
      }
    }

    const totalSize = cookieSizes.reduce((acc, c) => acc + c.size, 0);
    if (totalSize > 12288) {
      const sortedCookies = cookieSizes
        .filter((c) => c.name.startsWith("sb-") || c.name.includes("auth") || c.name.startsWith("supabase"))
        .sort((a, b) => b.size - a.size);
      
      for (const cookieInfo of sortedCookies.slice(0, 5)) {
        try {
          cookieStore.delete(cookieInfo.name);
          if (!clearedCookies.includes(cookieInfo.name)) {
            clearedCookies.push(cookieInfo.name);
          }
        } catch (error) {
          console.warn(`Erro ao deletar cookie ${cookieInfo.name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      clearedCookies,
      message: clearedCookies.length > 0 
        ? `${clearedCookies.length} cookie(s) grande(s) foram limpos`
        : "Nenhum cookie grande encontrado",
    });
  } catch (error: any) {
    console.error("Erro ao limpar cookies:", error);
    return NextResponse.json(
      { error: "Erro ao limpar cookies", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error("Erro ao verificar cookies:", error);
    return NextResponse.json(
      { error: "Erro ao verificar cookies", details: error.message },
      { status: 500 }
    );
  }
}
