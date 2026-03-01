import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://my-uni-notion.vercel.app";
    const redirectTo = `${appUrl.replace(/\/$/, "")}/auth/confirm`;

    const admin = createSupabaseAdmin();
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

    if (inviteError) {
      const raw = (inviteError.message ?? "").toLowerCase();
      let msg: string;
      if (raw.includes("already") || raw.includes("already been")) {
        msg = "Este e-mail já está cadastrado ou já recebeu um convite.";
      } else if (raw.includes("rate limit") || raw.includes("rate_limit")) {
        msg =
          "Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.";
        return NextResponse.json(
          { error: msg, errorCode: "rate_limit" },
          { status: 429 }
        );
      } else {
        msg = inviteError.message || "Erro ao enviar convite.";
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Convite enviado com sucesso.",
    });
  } catch (error: unknown) {
    console.error("Erro ao convidar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar convite." },
      { status: 500 }
    );
  }
}
