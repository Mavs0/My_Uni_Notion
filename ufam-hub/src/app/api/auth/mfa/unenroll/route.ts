import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { factorId } = body;

    if (!factorId) {
      return NextResponse.json(
        { error: "factorId é obrigatório" },
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

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (unenrollError) {
      console.error("Erro ao desativar 2FA:", unenrollError);
      return NextResponse.json(
        {
          error: "Erro ao desativar autenticação de dois fatores",
          details: unenrollError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled: false,
    });
  } catch (error: any) {
    console.error("Erro na API de desativar 2FA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
