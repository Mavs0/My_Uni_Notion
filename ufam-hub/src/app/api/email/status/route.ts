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
    const hasApiKey = !!process.env.RESEND_API_KEY;
    if (!hasApiKey) {
      return NextResponse.json({
        configured: false,
        status: "error",
        message: "Chave da API não configurada",
      });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const isValidFormat =
      apiKey && apiKey.startsWith("re_") && apiKey.length > 10;
    if (!isValidFormat) {
      return NextResponse.json({
        configured: true,
        status: "error",
        message: "Formato da chave da API inválido",
      });
    }
    return NextResponse.json({
      configured: true,
      status: "ok",
      message: "API configurada e pronta para uso",
      emailFrom: process.env.EMAIL_FROM || "UFAM Hub <onboarding@resend.dev>",
    });
  } catch (error) {
    console.error("Erro ao verificar status do email:", error);
    return NextResponse.json(
      {
        configured: false,
        status: "error",
        message: "Erro ao verificar configuração",
      },
      { status: 500 }
    );
  }
}