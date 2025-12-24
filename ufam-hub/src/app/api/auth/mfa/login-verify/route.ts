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

    // Verificar código MFA durante login
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error("Erro ao verificar MFA no login:", error);
      return NextResponse.json(
        { error: "Código inválido", details: error.message },
        { status: 400 }
      );
    }

    // A sessão é automaticamente atualizada pelo Supabase
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Erro na API de login MFA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
