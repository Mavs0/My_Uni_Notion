import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resend } from "@/lib/email/config";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
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

    const { id, attachmentId } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do email não fornecido" },
        { status: 400 }
      );
    }

    if (!attachmentId) {
      return NextResponse.json(
        { error: "ID do anexo não fornecido" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.attachments.receiving.get({
      id: attachmentId,
      emailId: id,
    });

    if (error) {
      console.error("Erro ao recuperar anexo:", error);
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
              "Sua chave da API não tem permissão para acessar anexos. Você precisa criar uma nova API key com permissões completas no painel do Resend.",
            restricted: true,
          },
          { status: 403 }
        );
      }

      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        return NextResponse.json(
          { error: "Anexo não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao recuperar anexo",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // Se o anexo tiver dados binários, retornar como blob
    if (data && "content" in data) {
      // Retornar o anexo com os metadados
      return NextResponse.json({ attachment: data });
    }

    return NextResponse.json({ attachment: data });
  } catch (error) {
    console.error("Erro na API de anexo:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar requisição";
    return NextResponse.json(
      {
        error: "Erro ao recuperar anexo",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
