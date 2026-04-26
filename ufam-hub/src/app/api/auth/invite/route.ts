import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";
import { randomBytes } from "crypto";

/** Gera senha que atende às regras: min 6, número, maiúscula, caractere especial */
function gerarSenhaTemporaria(): string {
  const minusculas = "abcdefghjkmnpqrstuvwxyz";
  const maiusculas = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const especiais = "!@#$%&*";
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[randomBytes(1)[0] % s.length]).join("");
  const parte =
    pick(minusculas, 2) +
    pick(maiusculas, 2) +
    pick(numeros, 2) +
    pick(especiais, 2);
  return Array.from(parte)
    .sort(() => (randomBytes(1)[0] % 2 ? 1 : -1))
    .join("");
}

/**
 * Convite 100% pelo Supabase: o e-mail é enviado pelo próprio Supabase Auth.
 *
 * Template HTML (dark, mensagem opcional, convite por código): copiar
 * `src/lib/email/supabase-invite-user.html` para Authentication → Email Templates → Invite user.
 * O template usa {{ .Token }} + link só para {{ .RedirectTo }} (sem token longo na URL); o fluxo
 * em /cadastro-convidado chama verifyOtp({ type: 'invite' }).
 *
 * Metadados disponíveis no template (Go template / `.Data`):
 * - {{ .Data.senha_temporaria }}, {{ .Data.nome }}, {{ .Data.mensagem_convite }} (só se preenchida),
 *   {{ .Data.convidador_nome }}, {{ .Data.convidador_email }}, {{ .Data.app_public_url }} (URL público da app)
 * - {{ .ConfirmationURL }} — link de aceitação
 *
 * Depois do invite, a senha temporária é definida na conta (útil como fallback).
 * O utilizador é redirecionado para /cadastro-convidado para definir senha definitiva e depois /login.
 * Em Supabase → Authentication → URL Configuration, inclua .../cadastro-convidado em Redirect URLs.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const mensagem =
      typeof body.mensagem === "string"
        ? body.mensagem.trim().slice(0, 200)
        : "";

    if (!nome || nome.length < 2) {
      return NextResponse.json(
        { error: "Informe o nome do convidado (mín. 2 caracteres)." },
        { status: 400 },
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Informe um e-mail válido." },
        { status: 400 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://my-uni-notion.vercel.app";
    const appPublicUrl = appUrl.replace(/\/$/, "");
    /** Link do e-mail do Supabase → cadastro do convidado → depois login */
    const cadastroConvidadoUrl = `${appPublicUrl}/cadastro-convidado`;

    const admin = createSupabaseAdmin();
    const senhaTemporaria = gerarSenhaTemporaria();

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const convidadorNomeRaw =
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta?.nome === "string" && meta.nome.trim()) ||
      "";
    const emailLocal = user.email?.split("@")[0]?.trim() ?? "";
    const convidadorNome = convidadorNomeRaw || emailLocal || "Alguém";

    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: nome,
          nome,
          senha_temporaria: senhaTemporaria,
          convidador_nome: convidadorNome,
          convidador_email: user.email ?? "",
          /** Base pública da app (sem / final), ex.: links absolutos no template de e-mail */
          app_public_url: appPublicUrl,
          ...(mensagem ? { mensagem_convite: mensagem } : {}),
        },
        redirectTo: cadastroConvidadoUrl,
      });

    if (inviteError) {
      const raw = (inviteError.message ?? "").toLowerCase();
      let msg: string;
      if (
        raw.includes("already") ||
        raw.includes("already been") ||
        raw.includes("already exists") ||
        raw.includes("already registered")
      ) {
        msg = "Este e-mail já está cadastrado.";
      } else if (raw.includes("rate limit") || raw.includes("rate_limit")) {
        msg =
          "Limite de envio atingido. Aguarde alguns minutos e tente novamente.";
        return NextResponse.json(
          { error: msg, errorCode: "rate_limit" },
          { status: 429 },
        );
      } else {
        msg = inviteError.message || "Erro ao enviar convite.";
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const invitedUser = inviteData?.user;
    if (invitedUser?.id) {
      await admin.auth.admin.updateUserById(invitedUser.id, {
        password: senhaTemporaria,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Convite enviado com sucesso. A senha temporária foi incluída no e-mail do Supabase.",
    });
  } catch (error: unknown) {
    console.error("Erro ao convidar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar convite." },
      { status: 500 },
    );
  }
}
