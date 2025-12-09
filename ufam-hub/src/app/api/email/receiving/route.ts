import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resend } from "@/lib/email/config";

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

    if (!resend) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }

    // Obter parâmetros de query opcionais
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    const params: any = {};
    if (limit) {
      params.limit = parseInt(limit, 10);
    }
    if (cursor) {
      params.cursor = cursor;
    }

    const { data, error } = await resend.emails.receiving.list(params);

    if (error) {
      console.error("Erro ao listar emails recebidos:", error);
      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).message || String(error)
          : String(error);

      const isRestrictedKey =
        errorMessage.includes("restricted") ||
        errorMessage.includes("permission") ||
        (typeof error === "object" &&
          error !== null &&
          (error as any).name === "restricted_api_key");

      if (isRestrictedKey) {
        return NextResponse.json(
          {
            error: "API key restrita",
            message:
              "Sua chave da API não tem permissão para acessar emails recebidos. Você precisa criar uma nova API key com permissões completas no painel do Resend.",
            restricted: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao listar emails recebidos",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails: data?.data || [], data });
  } catch (error) {
    console.error("Erro na API de emails recebidos:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar requisição";
    return NextResponse.json(
      {
        error: "Erro ao listar emails recebidos",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
