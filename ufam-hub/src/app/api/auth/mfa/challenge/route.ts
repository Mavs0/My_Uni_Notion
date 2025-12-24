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

    // Criar challenge MFA
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });

    if (error) {
      console.error("Erro ao criar challenge MFA:", error);
      return NextResponse.json(
        { error: "Erro ao criar challenge", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      expiresAt: data.expires_at,
    });
  } catch (error: any) {
    console.error("Erro na API de MFA challenge:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
