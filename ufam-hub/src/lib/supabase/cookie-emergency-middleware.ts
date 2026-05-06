import { NextResponse, type NextRequest } from "next/server";

/** Vercel: ~16KB no total dos cabeçalhos do pedido (middleware / edge). */
function approximateRequestHeadersByteSize(headers: Headers): number {
  let n = 0;
  headers.forEach((value, name) => {
    n += name.length + value.length + 4;
  });
  return n;
}

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
   * Produção: abaixo de ~16KB **no total** dos cabeçalhos (limite Vercel) — margem para
   * Host, User-Agent, etc.; senão o edge devolve 494 antes de conseguirmos limpar cookies.
   */
  const isDev = process.env.NODE_ENV === "development";
  const maxTotalHeader =
    Number(process.env.COOKIE_EMERGENCY_TOTAL_HEADER_BYTES) ||
    (isDev ? 96 * 1024 : 14 * 1024);
  const maxHeader =
    Number(process.env.COOKIE_EMERGENCY_HEADER_BYTES) ||
    (isDev ? 96 * 1024 : 12 * 1024);
  const maxSbChunks =
    Number(process.env.COOKIE_EMERGENCY_SB_CHUNKS) || (isDev ? 40 : 18);
  const maxSbBytes =
    Number(process.env.COOKIE_EMERGENCY_SB_BYTES) ||
    (isDev ? 128 * 1024 : 36 * 1024);

  const totalHeaders = approximateRequestHeadersByteSize(request.headers);
  const tooLargeTotal = totalHeaders > maxTotalHeader;
  const tooLargeCookieHeader = raw.length > maxHeader;
  const tooManyChunks = sb.length >= maxSbChunks;
  const tooFatSb = sbBytes > maxSbBytes;

  if (
    !tooLargeTotal &&
    !tooLargeCookieHeader &&
    !tooManyChunks &&
    !tooFatSb
  ) {
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
