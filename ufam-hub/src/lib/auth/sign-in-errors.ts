/** Erros de rede / DNS ao falar com o Supabase Auth (projeto inexistente, offline, etc.). */
export function isSupabaseNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("getaddrinfo") ||
    lower.includes("nxdomain")
  );
}

export function getSignInHttpError(error: { message?: string }): {
  status: number;
  error: string;
} {
  const msg = error.message || "Falha no login";
  const lower = msg.toLowerCase();

  if (isSupabaseNetworkError(msg)) {
    return {
      status: 503,
      error:
        "Não foi possível contactar o Supabase. Verifica a ligação à internet e se NEXT_PUBLIC_SUPABASE_URL no .env.local aponta para um projeto ativo (Dashboard → Settings → API).",
    };
  }

  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials")
  ) {
    return {
      status: 401,
      error:
        "Não foi possível fazer login com esses dados. Confira o e-mail e a senha e tente novamente.",
    };
  }

  if (lower.includes("email not confirmed")) {
    return {
      status: 401,
      error: "E-mail não confirmado. Verifique sua caixa de entrada.",
    };
  }

  if (lower.includes("too many requests")) {
    return {
      status: 429,
      error: "Muitas tentativas. Aguarde alguns minutos.",
    };
  }

  return { status: 401, error: msg };
}

export function getSignInCatchHttpError(e: unknown): {
  status: number;
  error: string;
} {
  const msg =
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : "Erro interno";
  const cause =
    e instanceof Error && e.cause instanceof Error ? e.cause.message : "";
  const combined = `${msg} ${cause}`.trim();

  if (isSupabaseNetworkError(combined)) {
    return {
      status: 503,
      error:
        "Não foi possível contactar o Supabase (DNS/rede). O projeto em NEXT_PUBLIC_SUPABASE_URL pode estar pausado, apagado ou com URL errada — confere no painel Supabase.",
    };
  }

  return { status: 500, error: "Erro interno" };
}
