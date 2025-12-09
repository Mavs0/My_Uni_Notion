import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

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

    const { data: factor, error: enrollError } = await supabase.auth.mfa.enroll(
      {
        factorType: "totp",
        friendlyName: "UFAM Hub Authenticator",
      }
    );

    if (enrollError) {
      console.error("Erro ao ativar 2FA:", enrollError);
      return NextResponse.json(
        {
          error: "Erro ao ativar autenticação de dois fatores",
          details: enrollError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qr_code: factor.totp.qr_code,
      secret: factor.totp.secret,
      id: factor.id,
    });
  } catch (error: any) {
    console.error("Erro na API de 2FA enroll:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
