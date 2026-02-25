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
      console.error("Erro de autenticação no enroll:", authError);
      return NextResponse.json(
        { error: "Não autorizado", details: authError?.message },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { factorType = "totp" } = body;

    console.log(`Tentando criar fator MFA para usuário: ${user.email}`);

    const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors();
    
    if (listError) {
      console.error("Erro ao listar fatores MFA (pode indicar que MFA não está disponível):", listError);
    }
    
    if (!listError && existingFactors?.totp && existingFactors.totp.length > 0) {
      console.log("Já existe um fator MFA ativo:", existingFactors.totp);
      return NextResponse.json(
        { 
          error: "Você já possui um fator MFA ativo",
          details: "Remova o fator existente antes de criar um novo",
          existingFactorId: existingFactors.totp[0].id,
        },
        { status: 400 }
      );
    }

    console.log("Chamando supabase.auth.mfa.enroll...");
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: factorType as "totp",
      friendlyName: `${user.email} - TOTP`,
    });

    if (error) {
      console.error("Erro ao criar fator MFA:", error);
      console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
      
      let errorMessage = "Erro ao criar fator MFA";
      if (error.message.includes("MFA is not enabled")) {
        errorMessage = "MFA não está habilitado no projeto Supabase. Verifique as configurações do Supabase.";
      } else if (error.message.includes("already enrolled")) {
        errorMessage = "Você já possui um fator MFA ativo. Remova o existente antes de criar um novo.";
      } else if (error.message.includes("permission")) {
        errorMessage = "Sem permissão para criar fator MFA. Verifique as configurações de segurança.";
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: error.message,
          code: error.status || error.code,
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.error("Resposta do enroll sem dados");
      return NextResponse.json(
        { error: "Resposta inválida do servidor MFA" },
        { status: 500 }
      );
    }

    console.log("Fator MFA criado com sucesso:", data.id);

    return NextResponse.json({
      id: data.id,
      secret: data.totp?.secret || "",
      qr_code: data.totp?.qr_code || "",
      uri: data.totp?.uri || "",
    });
  } catch (error: any) {
    console.error("Erro na API de MFA enroll:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
