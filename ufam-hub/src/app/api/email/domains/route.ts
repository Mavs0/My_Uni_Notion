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
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }
    const { data, error } = await resend.domains.list();
    if (error) {
      console.error("Erro ao listar domínios:", error);
      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).message || String(error)
          : String(error);
      const isRestrictedKey =
        errorMessage.includes("restricted") ||
        errorMessage.includes("only send emails") ||
        (typeof error === "object" &&
          error !== null &&
          (error as any).name === "restricted_api_key");
      if (isRestrictedKey) {
        return NextResponse.json(
          {
            error: "API key restrita",
            message:
              "Sua chave da API está restrita apenas para enviar emails. Para gerenciar domínios, você precisa criar uma nova API key com permissões completas no painel do Resend.",
            restricted: true,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: "Erro ao listar domínios",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ domains: data?.data || [] });
  } catch (error) {
    console.error("Erro na API de domínios:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao processar requisição",
      },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nome do domínio é obrigatório" },
        { status: 400 }
      );
    }
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(name)) {
      return NextResponse.json(
        { error: "Formato de domínio inválido" },
        { status: 400 }
      );
    }
    const { data, error } = await resend.domains.create({ name });
    if (error) {
      console.error("Erro ao criar domínio:", error);
      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).message || String(error)
          : String(error);
      const isRestrictedKey =
        errorMessage.includes("restricted") ||
        errorMessage.includes("only send emails") ||
        (typeof error === "object" &&
          error !== null &&
          (error as any).name === "restricted_api_key");
      if (isRestrictedKey) {
        return NextResponse.json(
          {
            error: "API key restrita",
            message:
              "Sua chave da API está restrita apenas para enviar emails. Para gerenciar domínios, você precisa criar uma nova API key com permissões completas no painel do Resend.",
            restricted: true,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: "Erro ao criar domínio",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, domain: data });
  } catch (error) {
    console.error("Erro na API de domínios:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao processar requisição",
      },
      { status: 500 }
    );
  }
}