import { NextRequest, NextResponse } from "next/server";
import { sendConfirmacaoEmail } from "@/lib/email/service";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nome, confirmationLink } = body;
    if (!email || !confirmationLink) {
      return NextResponse.json(
        { error: "Email e link de confirmação são obrigatórios" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const result = await sendConfirmacaoEmail({
      to: email,
      nome: nome || undefined,
      confirmationLink,
    });
    if (!result.success) {
      console.error("Erro ao enviar email de confirmação:", result.error);
      return NextResponse.json(
        { error: result.error || "Erro ao enviar email de confirmação" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de confirmação:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar requisição";
    return NextResponse.json(
      {
        error: "Não foi possível enviar o email de confirmação.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}