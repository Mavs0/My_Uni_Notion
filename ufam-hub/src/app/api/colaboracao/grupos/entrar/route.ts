import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const link = searchParams.get("link");
    const codigo = searchParams.get("codigo");

    if (!link && !codigo) {
      return NextResponse.json(
        { error: "Link ou código é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let grupo = null;
    let grupoError = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();

      if (link) {
        const result = await adminClient
          .from("grupos_estudo")
          .select("*")
          .eq("link_convite", link)
          .single();
        grupo = result.data;
        grupoError = result.error;
      } else if (codigo) {
        const result = await adminClient
          .from("grupos_estudo")
          .select("*")
          .eq("codigo_acesso", codigo)
          .single();
        grupo = result.data;
        grupoError = result.error;
      }
    } else {
      if (link) {
        const result = await supabase
          .from("grupos_estudo")
          .select("*")
          .eq("link_convite", link)
          .single();
        grupo = result.data;
        grupoError = result.error;
      } else if (codigo) {
        const result = await supabase
          .from("grupos_estudo")
          .select("*")
          .eq("codigo_acesso", codigo)
          .single();
        grupo = result.data;
        grupoError = result.error;
      }
    }

    if (grupoError || !grupo) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }

    if (grupo.visibilidade === "privado") {
      if (!codigo || codigo !== grupo.codigo_acesso) {
        return NextResponse.json(
          { error: "Código de acesso inválido" },
          { status: 403 }
        );
      }
    }

    const adminClient = createSupabaseAdmin();
    const membroExistente = await adminClient
      .from("grupo_membros")
      .select("id")
      .eq("grupo_id", grupo.id)
      .eq("user_id", user.id)
      .single();

    if (membroExistente.data) {
      return NextResponse.json(
        { error: "Você já é membro deste grupo" },
        { status: 400 }
      );
    }

    const { count } = await adminClient
      .from("grupo_membros")
      .select("*", { count: "exact", head: true })
      .eq("grupo_id", grupo.id)
      .eq("status", "ativo");

    if (count && count >= grupo.max_membros) {
      return NextResponse.json(
        { error: "Grupo atingiu o limite de membros" },
        { status: 400 }
      );
    }

    const statusInicial =
      grupo.requer_aprovacao && grupo.visibilidade === "privado"
        ? "pendente"
        : "ativo";

    const { data: novoMembro, error: membroError } = await adminClient
      .from("grupo_membros")
      .insert({
        grupo_id: grupo.id,
        user_id: user.id,
        role: "membro",
        status: statusInicial,
      })
      .select()
      .single();

    if (membroError) {
      console.error("Erro ao adicionar membro:", membroError);
      return NextResponse.json(
        { error: "Erro ao entrar no grupo" },
        { status: 500 }
      );
    }

    if (statusInicial === "pendente") {
      return NextResponse.json({
        success: true,
        pendente: true,
        mensagem: "Solicitação enviada. Aguarde aprovação do administrador.",
        grupo: {
          id: grupo.id,
          nome: grupo.nome,
        },
      });
    }

    return NextResponse.json({
      success: true,
      grupo: {
        id: grupo.id,
        nome: grupo.nome,
      },
      membro: novoMembro,
    });
  } catch (error: any) {
    console.error("Erro na API de entrar em grupo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
