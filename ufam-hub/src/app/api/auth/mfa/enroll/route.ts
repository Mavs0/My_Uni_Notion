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
    const { factorType = "totp" } = body;

    // Criar novo fator MFA
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: factorType as "totp",
      friendlyName: `${user.email} - TOTP`,
    });

    if (error) {
      console.error("Erro ao criar fator MFA:", error);
      return NextResponse.json(
        { error: "Erro ao criar fator MFA", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      secret: data.totp?.secret || "",
      qr_code: data.totp?.qr_code || "",
      uri: data.totp?.uri || "",
    });
  } catch (error: any) {
    console.error("Erro na API de MFA enroll:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
