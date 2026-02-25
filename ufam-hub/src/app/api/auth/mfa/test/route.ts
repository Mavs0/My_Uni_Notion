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
      return NextResponse.json(
        { 
          error: "Não autorizado",
          message: "Você precisa estar logado para testar MFA",
        },
        { status: 401 }
      );
    }

    const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();

    const testResults = {
      user: {
        id: user.id,
        email: user.email,
      },
      mfaAvailable: !listError,
      listFactorsError: listError ? {
        message: listError.message,
        status: listError.status,
        name: listError.name,
      } : null,
      existingFactors: factorsData ? {
        totp: factorsData.totp || [],
        all: factorsData.all || [],
      } : null,
      recommendations: [] as string[],
    };

    if (listError) {
      if (listError.message.includes("not enabled") || listError.message.includes("not available")) {
        testResults.recommendations.push(
          "MFA pode não estar disponível no seu projeto Supabase. Verifique se você está usando uma versão recente do Supabase."
        );
      } else if (listError.message.includes("permission") || listError.message.includes("unauthorized")) {
        testResults.recommendations.push(
          "Problema de permissões. Verifique se as variáveis de ambiente estão corretas."
        );
      } else {
        testResults.recommendations.push(
          `Erro ao verificar MFA: ${listError.message}. Verifique os logs do Supabase para mais detalhes.`
        );
      }
    } else {
      testResults.recommendations.push("MFA está disponível e funcionando!");
      if (factorsData?.totp && factorsData.totp.length > 0) {
        testResults.recommendations.push(
          `Você já possui ${factorsData.totp.length} fator(es) MFA configurado(s).`
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...testResults,
    });
  } catch (error: any) {
    console.error("Erro no teste de MFA:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao testar MFA",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
