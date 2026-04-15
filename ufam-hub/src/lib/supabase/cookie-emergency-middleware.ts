import { NextResponse, type NextRequest } from "next/server";

/**
 * Vercel devolve 494 REQUEST_HEADER_TOO_LARGE quando o pedido (incl. Cookie)
 * excede o limite da edge. Sessões Supabase com JWT/metadata gigantes fragmentam
 * em dezenas de cookies sb-* — o browser envia todos de uma vez.
 *
 * Este handler corre **no início** do middleware: se ainda couber no edge,
 * respondemos com Clear-Site-Data + expiração de sb-* para o próximo pedido ser pequeno.
 */
export function emergencyCookieResponseIfNeeded(
  request: NextRequest,
): NextResponse | null {
  /* Deixa o handler fazer redirect + Clear-Site-Data; não devolver 431 JSON. */
  if (request.nextUrl.pathname === "/api/auth/force-clear-session") {
    return null;
  }
  /* Login no servidor substitui sessão/cookies — precisa de correr mesmo com Cookie gigante. */
  if (
    request.nextUrl.pathname === "/api/auth/sign-in" &&
    request.method === "POST"
  ) {
    return null;
  }

  const raw = request.headers.get("cookie") ?? "";
  const sb = request.cookies.getAll().filter((c) => c.name.startsWith("sb-"));
  const sbBytes = sb.reduce((a, c) => a + c.name.length + c.value.length + 2, 0);

  /**
   * Limites para sessão anómala (JWT/metadata gigante → muitos cookies sb-*).
   * Em **development** o teto é mais alto: senão o primeiro GET a /dashboard após
   * login ainda com JWT grande disparava Clear-Site-Data e mandava para login?reason=cookie.
   * Produção: mantém valores mais conservadores (edge Vercel ~8KB–32KB conforme plano).
   */
  const isDev = process.env.NODE_ENV === "development";
  const maxHeader =
    Number(process.env.COOKIE_EMERGENCY_HEADER_BYTES) ||
    (isDev ? 96 * 1024 : 30_720);
  const maxSbChunks =
    Number(process.env.COOKIE_EMERGENCY_SB_CHUNKS) || (isDev ? 40 : 24);
  const maxSbBytes =
    Number(process.env.COOKIE_EMERGENCY_SB_BYTES) ||
    (isDev ? 128 * 1024 : 48 * 1024);

  const tooLargeHeader = raw.length > maxHeader;
  const tooManyChunks = sb.length >= maxSbChunks;
  const tooFatSb = sbBytes > maxSbBytes;

  if (!tooLargeHeader && !tooManyChunks && !tooFatSb) {
    return null;
  }

  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  const applyClears = (res: NextResponse) => {
    res.headers.set("Clear-Site-Data", '"cookies"');
    const isProd = process.env.NODE_ENV === "production";
    for (const c of sb) {
      /* Não forçar httpOnly — o atributo tem de coincidir com o Set-Cookie original. */
      res.cookies.set(c.name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: isProd,
      });
    }
    return res;
  };

  if (isApi) {
    return applyClears(
      NextResponse.json(
        {
          error:
            "Cabeçalho Cookie demasiado grande. A sessão foi limpa; volta a fazer login.",
          code: "COOKIE_HEADER_TOO_LARGE",
        },
        { status: 431 },
      ),
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("reason", "cookie_limit");
  url.searchParams.set(
    "notice",
    "Sessão demasiado grande (cookies). Volta a entrar.",
  );
  return applyClears(NextResponse.redirect(url));
}
