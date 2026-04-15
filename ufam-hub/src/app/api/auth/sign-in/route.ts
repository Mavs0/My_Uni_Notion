import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";
import {
  isInlineDataAvatar,
  MAX_AVATAR_URL_LENGTH,
} from "@/lib/profile/avatar-metadata";
import type { User } from "@supabase/supabase-js";

function safeRedirect(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

/**
 * Remove avatar pesado do user_metadata. Preferimos Admin API: `auth.updateUser`
 * no browser/SSR manda `Authorization: Bearer <JWT gigante>` e alguns proxies
 * respondem com HTML → "Unexpected token '<'..." ao fazer parse JSON.
 */
async function stripHeavyAvatarUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  user: User,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasServiceRole) {
    try {
      const admin = createSupabaseAdmin();
      const meta = {
        ...(typeof user.user_metadata === "object" && user.user_metadata !== null
          ? user.user_metadata
          : {}),
        avatar_url: "",
      } as Record<string, unknown>;
      const { error: aerr } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: meta,
      });
      if (!aerr) {
        return { ok: true };
      }
      console.error("[sign-in] admin strip avatar:", aerr.message);
    } catch (e) {
      console.error("[sign-in] admin strip avatar catch:", e);
    }
  }

  const { error: uerr } = await supabase.auth.updateUser({
    data: { avatar_url: "" },
  });
  if (!uerr) {
    return { ok: true };
  }
  return { ok: false, message: uerr.message || "Falha ao atualizar perfil" };
}

/**
 * Login no servidor: após `signInWithPassword`, se o JWT viria enorme (ex.: avatar
 * em base64 no user_metadata), fazemos `updateUser` + `refreshSession` **antes** de
 * o utilizador navegar com cookies já substituídos — evita loop 431/cookie_limit.
 *
 * Utilizadores com MFA / sem sessão completa: devolvem `needsClientFallback` para o
 * fluxo existente no cliente (challenge TOTP, etc.).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; redirect?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const redirect = safeRedirect(body.redirect);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServer(request);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message || "Falha no login";
      const lower = msg.toLowerCase();
      if (
        lower.includes("invalid login") ||
        lower.includes("invalid credentials")
      ) {
        return NextResponse.json(
          { error: "Email ou senha incorretos." },
          { status: 401 },
        );
      }
      if (lower.includes("email not confirmed")) {
        return NextResponse.json(
          { error: "Email não confirmado. Verifique a caixa de entrada." },
          { status: 401 },
        );
      }
      if (lower.includes("too many requests")) {
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde alguns minutos." },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({
        ok: false,
        needsClientFallback: true,
      });
    }

    const user = data.session.user;
    const raw = user.user_metadata?.avatar_url;
    const needsStrip =
      typeof raw === "string" &&
      (isInlineDataAvatar(raw) || raw.length > MAX_AVATAR_URL_LENGTH);

    if (needsStrip) {
      const strip = await stripHeavyAvatarUrl(supabase, user);
      if (!strip.ok) {
        console.error("[sign-in] strip avatar metadata:", strip.message);
        return NextResponse.json(
          {
            error: process.env.SUPABASE_SERVICE_ROLE_KEY
              ? "Não foi possível corrigir o perfil automaticamente. Tenta «Limpar sessão» ou remove a foto em base64 no painel Supabase (Authentication → Users)."
              : "Configura SUPABASE_SERVICE_ROLE_KEY no servidor para corrigir perfis com JWT grande, ou remove a foto em base64 no painel Supabase.",
          },
          { status: 500 },
        );
      }
      const { error: refrErr } = await supabase.auth.refreshSession();
      if (refrErr) {
        console.error("[sign-in] refreshSession após strip:", refrErr.message);
      }
    }

    return NextResponse.json({ ok: true, redirect });
  } catch (e) {
    console.error("[sign-in]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
