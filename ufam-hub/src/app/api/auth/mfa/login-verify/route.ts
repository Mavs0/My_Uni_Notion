import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { factorId, challengeId, code } = body;

    if (!factorId || !challengeId || !code) {
      return NextResponse.json(
        { error: "factorId, challengeId e code são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: verifyData, error: verifyCodeError } =
      await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

    if (verifyCodeError) {
      console.error("Erro ao verificar código 2FA no login:", verifyCodeError);
      return NextResponse.json(
        {
          error: "Código inválido",
          details: verifyCodeError.message,
        },
        { status: 400 }
      );
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("Erro na API de verificação 2FA no login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
