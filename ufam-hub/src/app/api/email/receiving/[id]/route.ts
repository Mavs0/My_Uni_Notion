import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resend } from "@/lib/email/config";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do email não fornecido" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.receiving.get(id);

    if (error) {
      console.error("Erro ao recuperar email recebido:", error);
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

      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        return NextResponse.json(
          { error: "Email não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao recuperar email recebido",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ email: data });
  } catch (error) {
    console.error("Erro na API de email recebido:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar requisição";
    return NextResponse.json(
      {
        error: "Erro ao recuperar email recebido",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
