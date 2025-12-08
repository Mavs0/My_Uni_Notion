import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; solicitacaoId: string } }
) {
  try {
    const grupo_id = params.id;
    const solicitacao_id = params.solicitacaoId;
    const body = await request.json();
    const { aprovado } = body;

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let grupo;
    let grupoError;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("grupos_estudo")
        .select("criador_id, max_membros")
        .eq("id", grupo_id)
        .single();
      grupo = result.data;
      grupoError = result.error;
    } else {
      const result = await supabase
        .from("grupos_estudo")
        .select("criador_id, max_membros")
        .eq("id", grupo_id)
        .single();
      grupo = result.data;
      grupoError = result.error;
    }

    if (grupoError || !grupo) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }

    if (grupo.criador_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o criador pode aprovar solicitações" },
        { status: 403 }
      );
    }

    const adminClient = createSupabaseAdmin();

    if (aprovado) {
      const { data: solicitacao } = await adminClient
        .from("grupo_membros")
        .select("*")
        .eq("id", solicitacao_id)
        .eq("grupo_id", grupo_id)
        .eq("status", "pendente")
        .single();

      if (!solicitacao) {
        return NextResponse.json(
          { error: "Solicitação não encontrada" },
          { status: 404 }
        );
      }

      const { count } = await adminClient
        .from("grupo_membros")
        .select("*", { count: "exact", head: true })
        .eq("grupo_id", grupo_id)
        .eq("status", "ativo");

      if (count && count >= grupo.max_membros) {
        return NextResponse.json(
          { error: "Grupo atingiu o limite de membros" },
          { status: 400 }
        );
      }

      const { error: updateError } = await adminClient
        .from("grupo_membros")
        .update({ status: "ativo" })
        .eq("id", solicitacao_id);

      if (updateError) {
        console.error("Erro ao aprovar solicitação:", updateError);
        return NextResponse.json(
          { error: "Erro ao aprovar solicitação" },
          { status: 500 }
        );
      }
    } else {
      const { error: deleteError } = await adminClient
        .from("grupo_membros")
        .delete()
        .eq("id", solicitacao_id)
        .eq("grupo_id", grupo_id)
        .eq("status", "pendente");

      if (deleteError) {
        console.error("Erro ao recusar solicitação:", deleteError);
        return NextResponse.json(
          { error: "Erro ao recusar solicitação" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de aprovação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
