import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { factorId, code } = body;

    if (!factorId || !code) {
      return NextResponse.json(
        { error: "factorId e code são obrigatórios" },
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

    const { data, error: verifyError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (verifyError || !data) {
      console.error("Erro ao criar challenge:", verifyError);
      return NextResponse.json(
        {
          error: "Erro ao criar challenge de verificação",
          details: verifyError?.message,
        },
        { status: 500 }
      );
    }

    const { data: verifyData, error: verifyCodeError } =
      await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code,
      });

    if (verifyCodeError) {
      console.error("Erro ao verificar código 2FA:", verifyCodeError);
      return NextResponse.json(
        {
          error: "Código inválido",
          details: verifyCodeError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled: true,
    });
  } catch (error: any) {
    console.error("Erro na API de verificação 2FA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
