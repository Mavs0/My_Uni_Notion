import { NextRequest, NextResponse } from "next/server";

/**
 * Um GET limpa **todos** os cookies deste origin (Supabase usa httpOnly — não dá para
 * apagar só com document.cookie). Usa Clear-Site-Data + expiração dos sb-* conhecidos.
 * Liga a partir da página de login quando há 494/431 ou login “não faz nada”.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("cleared", "1");
  const nextRedirect =
    request.nextUrl.searchParams.get("redirect") ??
    request.nextUrl.searchParams.get("next");
  if (
    nextRedirect &&
    nextRedirect.startsWith("/") &&
    !nextRedirect.startsWith("//")
  ) {
    url.searchParams.set("redirect", nextRedirect);
  }

  const res = NextResponse.redirect(url);
  res.headers.set("Clear-Site-Data", '"cookies"');

  const isProd = process.env.NODE_ENV === "production";
  for (const c of request.cookies.getAll()) {
    if (!c.name.startsWith("sb-")) continue;
    res.cookies.set(c.name, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: isProd,
    });
  }

  return res;
}
