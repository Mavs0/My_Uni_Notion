import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

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
    const { factorId, code, challengeId } = body;

    if (!factorId || !code) {
      return NextResponse.json(
        { error: "factorId e code são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar código MFA
    let verifyData;
    if (challengeId) {
      // Verificar challenge existente
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        console.error("Erro ao verificar MFA:", error);
        return NextResponse.json(
          { error: "Código inválido", details: error.message },
          { status: 400 }
        );
      }

      verifyData = data;
    } else {
      // Criar challenge e verificar
      const challengeResult = await supabase.auth.mfa.challenge({ factorId });

      if (challengeResult.error) {
        console.error("Erro ao criar challenge:", challengeResult.error);
        return NextResponse.json(
          {
            error: "Erro ao criar challenge",
            details: challengeResult.error.message,
          },
          { status: 500 }
        );
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeResult.data.id,
        code,
      });

      if (error) {
        console.error("Erro ao verificar MFA:", error);
        return NextResponse.json(
          { error: "Código inválido", details: error.message },
          { status: 400 }
        );
      }

      verifyData = data;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Erro na API de MFA verify:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
