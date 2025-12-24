import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Listar fatores MFA do usuário
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      console.error("Erro ao listar fatores MFA:", error);
      return NextResponse.json(
        { error: "Erro ao listar fatores MFA", details: error.message },
        { status: 500 }
      );
    }

    const totpFactors = data.totp || [];
    const enabled = totpFactors.length > 0;

    return NextResponse.json({
      enabled,
      factor: enabled ? totpFactors[0] : null,
      factors: totpFactors,
    });
  } catch (error: any) {
    console.error("Erro na API de status MFA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
