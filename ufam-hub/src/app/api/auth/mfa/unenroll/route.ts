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
    const { factorId } = body;

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
