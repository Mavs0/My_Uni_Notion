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
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }
    const { id } = params;
    const { data, error } = await resend.domains.get(id);
    if (error) {
      console.error("Erro ao obter domínio:", error);
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
          error: "Erro ao obter domínio",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ domain: data });
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
export async function PUT(
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
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }
    const { id } = params;
    const body = await request.json();
    const { openTracking, clickTracking } = body;
    const { data, error } = await resend.domains.update({
      id,
      openTracking,
      clickTracking,
    });
    if (error) {
      console.error("Erro ao atualizar domínio:", error);
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
          error: "Erro ao atualizar domínio",
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
export async function POST(
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
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }
    const { id } = params;
    const { data, error } = await resend.domains.verify(id);
    if (error) {
      console.error("Erro ao verificar domínio:", error);
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
          error: "Erro ao verificar domínio",
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
export async function DELETE(
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
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada" },
        { status: 400 }
      );
    }
    const { id } = params;
    const { data, error } = await resend.domains.remove(id);
    if (error) {
      console.error("Erro ao deletar domínio:", error);
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
          error: "Erro ao deletar domínio",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
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