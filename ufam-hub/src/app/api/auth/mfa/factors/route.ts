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

    return NextResponse.json({
      factors: data.all || [],
      totp: data.totp || [],
    });
  } catch (error: any) {
    console.error("Erro na API de fatores MFA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const factorId = searchParams.get("factorId");

    if (!factorId) {
      return NextResponse.json(
        { error: "factorId é obrigatório" },
        { status: 400 }
      );
    }

    // Remover fator MFA
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      console.error("Erro ao remover fator MFA:", error);
      return NextResponse.json(
        { error: "Erro ao remover fator MFA", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de remover fator MFA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
