import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error("Erro ao listar fatores MFA:", factorsError);
      return NextResponse.json(
        {
          error: "Erro ao verificar status do 2FA",
          details: factorsError.message,
        },
        { status: 500 }
      );
    }

    const totpFactor = factors?.totp?.[0];
    const isEnabled = !!totpFactor;

    return NextResponse.json({
      enabled: isEnabled,
      factor: totpFactor
        ? {
            id: totpFactor.id,
            friendly_name: totpFactor.friendly_name,
            status: totpFactor.status,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Erro na API de status 2FA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
