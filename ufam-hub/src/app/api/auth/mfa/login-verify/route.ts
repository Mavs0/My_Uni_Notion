import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const body = await request.json();
    const { factorId, challengeId, code } = body;

    if (!factorId || !challengeId || !code) {
      return NextResponse.json(
        { error: "factorId, challengeId e code são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error("Erro ao verificar MFA no login:", error);
      return NextResponse.json(
        { error: "Código inválido ou expirado. Tente novamente.", details: error.message },
        { status: 400 }
      );
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("Erro ao obter sessão após MFA:", sessionError);
      return NextResponse.json(
        { error: "Erro ao criar sessão após verificação" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
        user: session.user,
      },
    });
  } catch (error: any) {
    console.error("Erro na API de login MFA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
